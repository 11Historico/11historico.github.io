// src/components/SeasonBrackets.tsx
//
// Cuadros de fin de temporada (v0.25.11): Copa del Rey y torneo europeo en columnas
// por ronda. La lógica de qué mostrar está en src/career/seasonBrackets.ts.

import type { CSSProperties } from "react";

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
import type { CupBracketRound, CupBracketTie } from "../simulation/leagueSimulator";
import type { MatchResult } from "../types/game";
import { EuropeanCrest } from "./EuropeanCrest";
import { isExtraTimeFactor } from "./matchSequenceTimeline";
// Camisetas solo en Copa: los rivales europeos llevan un escudo genérico (v0.25.102).
import { TeamKitIcon } from "./TeamKitIcon";

import "./SeasonBrackets.css";

const STATUS_LABEL: Record<BracketStatus, string> = {
  played: "Jugado",
  simulated: "Simulado",
  pending: "Sin jugar",
};

function TeamLine({ name, goals, won }: { name: string; goals?: number; won: boolean }) {
  const classes = ["season-bracket-team"];
  if (won) classes.push("season-bracket-team-won");
  if (isUserTeamName(name)) classes.push("season-bracket-team-user");

  return (
    <div className={classes.join(" ")}>
      <span className="season-bracket-team-name" title={name}>
        <TeamKitIcon teamName={name} />
        <span>{name}</span>
      </span>
      {goals !== undefined && <strong>{goals}</strong>}
    </div>
  );
}

function CupMatchCard({ result }: { result: MatchResult }) {
  const winner = getCupMatchWinner(result);

  return (
    <div className="season-bracket-match">
      <TeamLine name={result.homeTeamName} goals={result.homeGoals} won={winner === "home"} />
      <TeamLine name={result.awayTeamName} goals={result.awayGoals} won={winner === "away"} />
      {isExtraTimeFactor(result.keyFactor) && <small className="season-bracket-decision">Decidido en la prórroga</small>}
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

function CupTieCard({ tie }: { tie: CupBracketTie }) {
  if (!tie.homeTeamName || !tie.awayTeamName) {
    return <div className="season-bracket-match cup-mirror-tie cup-mirror-tie-empty">Por decidir</div>;
  }

  const winner = tie.result ? getCupMatchWinner(tie.result) : undefined;

  return (
    <div className="season-bracket-match cup-mirror-tie">
      <TeamLine name={tie.homeTeamName} goals={tie.result?.homeGoals} won={winner === "home"} />
      <TeamLine name={tie.awayTeamName} goals={tie.result?.awayGoals} won={winner === "away"} />
    </div>
  );
}

/**
 * Cuadro en espejo (v0.25.87): la primera ronda a cada lado y la final en el centro.
 * Copa: dieciseisavos a final, nueve columnas. Supercopa (v0.25.90): semifinales y final, tres.
 */
export function CupMirrorBracket({ rounds, label = "Cuadro de la Copa del Rey" }: { rounds: CupBracketRound[]; label?: string }) {
  const sideRounds = rounds.slice(0, -1);
  const final = rounds.at(-1);
  const column = (round: CupBracketRound, side: "left" | "right" | "final") => {
    const half = round.ties.length / 2;
    const ties = side === "final" ? round.ties : side === "left" ? round.ties.slice(0, half) : round.ties.slice(half);

    return (
      <section
        key={`${round.roundName}-${side}`}
        className="cup-mirror-column"
        aria-label={side === "final" ? round.roundName : `${round.roundName}, lado ${side === "left" ? "izquierdo" : "derecho"}`}
      >
        <header>{round.roundName}</header>
        <div className="cup-mirror-ties">
          {ties.map((tie, index) => (
            <CupTieCard key={index} tie={tie} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="cup-mirror" aria-label={label} style={{ "--cup-mirror-columns": rounds.length * 2 - 1 } as CSSProperties}>
      {sideRounds.map((round) => column(round, "left"))}
      {final && column(final, "final")}
      {[...sideRounds].reverse().map((round) => column(round, "right"))}
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
        <EuropeanCrest opponent={match.opponent} compact />
        <span>
          {match.isHome ? "Local" : "Visitante"} · vs {match.opponent.name}
        </span>
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
