// src/components/EuropeanMatchEvent.tsx
//
// European UI Matchday View (v0.24.2a) + European Progress UI (v0.24.2b)
// + European Knockouts (v0.24.3a).
// Tarjeta visual de evento europeo: competición, fase, rival, rating,
// progreso, resultado, calendario europeo y copy narrativo. Desde v0.24.3b
// los títulos europeos sí se suman al palmarés, al cerrar la temporada
// (ver src/career/europeanTrophies.ts).

import { getEuropeanCompetitionLabel } from "../europe/europeanQualification";
import {
  EUROPEAN_KNOCKOUT_TIE_RULE_TEXT,
  getEuropeanMatchDecisionText,
  getEuropeanTournamentPhaseLabel,
  getEuropeanTournamentSummary,
  isEuropeanKnockoutPhase,
} from "../europe/europeanTournament";
import type { EuropeanCompetition, EuropeanTournamentMatch, EuropeanTournamentState } from "../europe/europeanTypes";
import EuropeanProgressPanel from "./EuropeanProgressPanel";

import "./EuropeanMatchEvent.css";

interface EuropeanMatchEventProps {
  tournament: EuropeanTournamentState;
  match: EuropeanTournamentMatch;
  userTeamRating: number;
  onSimulate: () => void;
  onContinue: () => void;
}

function getResultLabel(match: EuropeanTournamentMatch): string {
  if (match.result === "win") return "Victoria";
  if (match.result === "draw") return "Empate";
  return "Derrota";
}

function getResultClass(match: EuropeanTournamentMatch): string {
  if (match.result === "win") return "european-match-result european-match-result-win";
  if (match.result === "draw") return "european-match-result european-match-result-draw";
  return "european-match-result european-match-result-loss";
}

function getCompetitionClass(competition: EuropeanCompetition): string {
  if (competition === "champions_league") return "european-match-event-card european-match-event-card-champions";
  if (competition === "europa_league") return "european-match-event-card european-match-event-card-europa";
  return "european-match-event-card european-match-event-card-conference";
}

function getEventClass(tournament: EuropeanTournamentState, match: EuropeanTournamentMatch): string {
  const classes = [getCompetitionClass(match.competition)];

  if (isEuropeanKnockoutPhase(match.phase)) classes.push("european-match-event-card-knockout");
  if (match.phase === "semifinal") classes.push("european-match-event-card-semifinal");
  if (match.phase === "final") classes.push("european-match-event-card-final");
  if (tournament.eliminated) classes.push("european-match-event-card-eliminated");
  if (tournament.completed && tournament.champion) classes.push("european-match-event-card-champion");

  return classes.join(" ");
}

function getCompetitionBadge(competition: EuropeanCompetition): string {
  if (competition === "champions_league") return "CHAMPIONS";
  if (competition === "europa_league") return "EUROPA";
  return "CONFERENCE";
}

function getPhaseNarrative(tournament: EuropeanTournamentState, match: EuropeanTournamentMatch): string {
  if (tournament.completed && tournament.champion) {
    return "El Athletic ha conquistado Europa; el título se sumará al palmarés histórico al cerrar la temporada.";
  }
  // eliminated se comprueba antes que "completed && !champion": una
  // eliminación en fase inicial o semifinal también deja completed=true, y
  // sin este orden el texto decía "ha sido finalista europeo" para una
  // eliminación en fase de grupos que nunca llegó a la final.
  if (tournament.eliminated) return "El sueño europeo termina aquí, pero la temporada nacional continúa.";
  if (tournament.completed && !tournament.champion) {
    return "El Athletic ha sido finalista europeo; el resultado queda registrado sin sumar título al palmarés.";
  }
  if (match.phase === "final") return "Final europea a partido único: ganar significa ser campeón y sumar el título al palmarés al cerrar la temporada; perder deja al Athletic como finalista.";
  if (match.phase === "semifinal") return "Semifinal europea a partido único: ganar abre la final; perder cierra la aventura europea.";
  if (match.isHome) return "Noche grande en San Mamés: Europa vuelve a Bilbao.";
  return "Salida europea exigente: toca competir lejos de San Mamés.";
}

function getProgressPercent(tournament: EuropeanTournamentState): number {
  const played = tournament.matches.filter((candidate) => candidate.status === "played").length;
  const total = Math.max(tournament.matches.length, 1);
  return Math.min(100, Math.round((played / total) * 100));
}

function getKnockoutWinText(match: EuropeanTournamentMatch): string {
  if (match.phase === "semifinal") return "Victoria: Athletic a la final europea";
  if (match.phase === "final") return "Victoria: campeón europeo, se suma al palmarés al cerrar la temporada";
  return "Victoria: suma puntos en fase inicial";
}

function getKnockoutLossText(match: EuropeanTournamentMatch): string {
  if (match.phase === "semifinal") return "Derrota: eliminación europea";
  if (match.phase === "final") return "Derrota: finalista europeo";
  return "Derrota: sin puntos en fase inicial";
}

export function EuropeanMatchEvent({
  tournament,
  match,
  userTeamRating,
  onSimulate,
  onContinue,
}: EuropeanMatchEventProps) {
  const summary = getEuropeanTournamentSummary(tournament);
  const isPlayed = match.status === "played";
  const isKnockoutMatch = match.phase === "semifinal" || match.phase === "final";
  const homeAwayText = match.isHome
    ? "El Athletic jugará como local"
    : "El Athletic jugará como visitante";
  const progressPercent = getProgressPercent(tournament);
  const phaseLabel = getEuropeanTournamentPhaseLabel(match.phase);

  return (
    <section className={getEventClass(tournament, match)} aria-label="Evento europeo">
      <div className="european-match-event-hero">
        <div>
          <p className="european-match-event-eyebrow">Noche europea</p>
          <h2>{getEuropeanCompetitionLabel(match.competition)}</h2>
          <p className="european-match-event-phase">
            {phaseLabel} · Jornada europea {match.matchday}
          </p>
        </div>
        <span className="european-match-event-badge">{getCompetitionBadge(match.competition)}</span>
      </div>

      <p className="european-match-event-narrative">{getPhaseNarrative(tournament, match)}</p>

      {isKnockoutMatch && (
        <div className="european-match-event-knockout" aria-label="Contexto de eliminatoria europea">
          <span>Partido único</span>
          <strong>{summary.knockoutStageText}</strong>
          <p>{summary.stakesText}</p>
          <p>{EUROPEAN_KNOCKOUT_TIE_RULE_TEXT}</p>
          <div className="european-match-event-knockout-outcomes">
            <small>{getKnockoutWinText(match)}</small>
            <small>{getKnockoutLossText(match)}</small>
          </div>
        </div>
      )}

      <div className="european-match-event-scoreboard" aria-label="Previa europea">
        <article className="european-match-event-team european-match-event-team-user">
          <span>Athletic Club</span>
          <strong>{Math.round(userTeamRating)}</strong>
          <small>{match.isHome ? "Local · San Mamés" : "Visitante"}</small>
        </article>
        <div className="european-match-event-versus">VS</div>
        <article className="european-match-event-team european-match-event-team-rival">
          <span>{match.opponent.name}</span>
          <strong>{match.opponent.rating}</strong>
          <small>{match.opponent.country}</small>
        </article>
      </div>

      {isPlayed && (
        <div className="european-match-event-result">
          <span className="european-match-event-result-label">Resultado europeo</span>
          <div className={getResultClass(match)}>
            <strong>
              {match.isHome ? match.userGoals : match.opponentGoals}
              {" - "}
              {match.isHome ? match.opponentGoals : match.userGoals}
            </strong>
            <span>{getResultLabel(match)}</span>
          </div>
          {getEuropeanMatchDecisionText(match) && <small>{getEuropeanMatchDecisionText(match)}</small>}
        </div>
      )}

      <div className="european-match-event-summary">
        <div className="european-match-event-summary-header">
          <span>Progreso europeo</span>
          <strong>{summary.statusText}</strong>
        </div>
        <div className="european-match-event-progress" aria-hidden="true">
          <div style={{ width: `${progressPercent}%` }} />
        </div>
        <p>
          {summary.phaseLabel} · {summary.matchesPlayed}/{summary.totalMatches} jugados · {summary.points} pts ·{" "}
          {summary.wins}V {summary.draws}E {summary.losses}D · GF {summary.goalsFor} / GC {summary.goalsAgainst}
        </p>
        <p className="european-match-event-status">{summary.statusText}</p>
      </div>

      <EuropeanProgressPanel tournament={tournament} currentMatchId={match.id} />

      <div className="european-match-event-grid">
        <article>
          <span>Rival</span>
          <strong>{match.opponent.name}</strong>
          <small>{match.opponent.country}</small>
        </article>
        <article>
          <span>Rating rival</span>
          <strong>{match.opponent.rating}</strong>
          <small>Tu rating: {Math.round(userTeamRating)}</small>
        </article>
        <article>
          <span>Sede</span>
          <strong>{match.isHome ? "San Mamés" : "Fuera de casa"}</strong>
          <small>{homeAwayText}</small>
        </article>
      </div>

      <div className="european-match-event-actions">
        {!isPlayed && (
          <button type="button" className="secondary-league-button european-match-event-button" onClick={onSimulate}>
            Simular partido europeo
          </button>
        )}

        {isPlayed && (
          <button type="button" className="secondary-league-button european-match-event-button" onClick={onContinue}>
            Continuar temporada
          </button>
        )}
      </div>
    </section>
  );
}

export default EuropeanMatchEvent;
