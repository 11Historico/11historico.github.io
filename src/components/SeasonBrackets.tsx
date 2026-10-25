// src/components/SeasonBrackets.tsx
//
// Cuadros de fin de temporada (v0.25.11): Copa del Rey y torneo europeo en columnas
// por ronda. La lógica de qué mostrar está en src/career/seasonBrackets.ts.

import {
  getCupMatchWinner,
  isUserTeamName,
  type BracketStatus,
  type CupBracketRow,
  type EuropeanBracketColumns,
  type EuropeanBracketSlot,
} from "../career/seasonBrackets";
import { getEuropeanMatchDecisionText } from "../europe/europeanTournament";
import type { EuropeanTournamentMatch } from "../europe/europeanTypes";
import type { MatchResult } from "../types/game";

import "./SeasonBrackets.css";

const STATUS_LABEL: Record<BracketStatus, string> = {
  played: "Jugado",
  simulated: "Simulado",
  pending: "Sin jugar",
};

function TeamLine({ name, goals, won }: { name: string; goals: number; won: boolean }) {
  const classes = ["season-bracket-team"];
  if (won) classes.push("season-bracket-team-won");
  if (isUserTeamName(name)) classes.push("season-bracket-team-user");

  return (
    <div className={classes.join(" ")}>
      <span>{name}</span>
      <strong>{goals}</strong>
    </div>
  );
}

function CupMatchCard({ result }: { result: MatchResult }) {
  const winner = getCupMatchWinner(result);

  return (
    <div className="season-bracket-match">
      <TeamLine name={result.homeTeamName} goals={result.homeGoals} won={winner === "home"} />
      <TeamLine name={result.awayTeamName} goals={result.awayGoals} won={winner === "away"} />
    </div>
  );
}

export function CupBracket({ rows }: { rows: CupBracketRow[] }) {
  return (
    <div className="season-bracket" aria-label="Cuadro de la Copa del Rey">
      {rows.map((row) => (
        <section key={row.roundName} className={`season-bracket-column season-bracket-${row.status}`} aria-label={row.roundName}>
          <header>
            <strong>{row.roundName}</strong>
            <span className="season-bracket-status">{STATUS_LABEL[row.status]}</span>
          </header>
          {row.result ? <CupMatchCard result={row.result} /> : <p className="season-bracket-empty">Sin datos de esta ronda.</p>}
        </section>
      ))}
    </div>
  );
}

function EuropeanMatchCard({ match }: { match: EuropeanTournamentMatch }) {
  const userGoals = match.userGoals ?? 0;
  const opponentGoals = match.opponentGoals ?? 0;
  const score = match.isHome ? `${userGoals} - ${opponentGoals}` : `${opponentGoals} - ${userGoals}`;
  const outcome = match.result === "win" ? "Victoria" : match.result === "draw" ? "Empate" : match.result === "loss" ? "Derrota" : undefined;
  const decision = getEuropeanMatchDecisionText(match);

  return (
    <div className="season-bracket-match">
      <p className="season-bracket-versus">
        {match.isHome ? "Local" : "Visitante"} · vs {match.opponent.name}
      </p>
      {match.status === "played" ? (
        <>
          <strong className="season-bracket-score">{score}</strong>
          {outcome && <span className="season-bracket-outcome">{outcome}</span>}
          {decision && <small className="season-bracket-decision">{decision}</small>}
        </>
      ) : (
        <span className="season-bracket-empty">Sin jugar</span>
      )}
    </div>
  );
}

function EuropeanKnockoutColumn({ title, slot, emptyText }: { title: string; slot: EuropeanBracketSlot; emptyText: string }) {
  return (
    <section className={`season-bracket-column season-bracket-${slot.status}`} aria-label={title}>
      <header>
        <strong>{title}</strong>
        <span className="season-bracket-status">{STATUS_LABEL[slot.status]}</span>
      </header>
      {slot.match ? <EuropeanMatchCard match={slot.match} /> : <p className="season-bracket-empty">{emptyText}</p>}
    </section>
  );
}

export function EuropeanBracket({ columns }: { columns: EuropeanBracketColumns }) {
  const played = columns.leagueMatches.filter((match) => match.status === "played").length;

  return (
    <div className="season-bracket" aria-label="Cuadro del torneo europeo">
      <section className="season-bracket-column" aria-label="Fase inicial">
        <header>
          <strong>Fase inicial</strong>
          <span className="season-bracket-status">
            {played}/{columns.leagueMatches.length}
          </span>
        </header>
        {columns.leagueMatches.map((match) => (
          <EuropeanMatchCard key={match.id} match={match} />
        ))}
      </section>
      <EuropeanKnockoutColumn title="Semifinal" slot={columns.semifinal} emptyText="No llegó a semifinal." />
      <EuropeanKnockoutColumn title="Final" slot={columns.final} emptyText="No llegó a la final." />
    </div>
  );
}
