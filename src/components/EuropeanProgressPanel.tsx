// src/components/EuropeanProgressPanel.tsx
//
// European Progress UI (v0.24.2b) + European Knockouts (v0.24.3a).
// Panel consultivo del estado completo del torneo europeo: fase, progreso,
// puntos, balance, calendario, resultados y lectura clara de semifinal/final.
// Desde v0.24.3b los títulos europeos sí se suman al palmarés, al cerrar la
// temporada (ver src/career/europeanTrophies.ts).

import { getEuropeanCompetitionLabel } from "../europe/europeanQualification";
import {
  getEuropeanTournamentPhaseLabel,
  getEuropeanTournamentSummary,
} from "../europe/europeanTournament";
import type { EuropeanTournamentMatch, EuropeanTournamentState } from "../europe/europeanTypes";

import "./EuropeanProgressPanel.css";

interface EuropeanProgressPanelProps {
  tournament: EuropeanTournamentState;
  currentMatchId?: string | null;
}

function getMatchScore(match: EuropeanTournamentMatch): string {
  if (match.status !== "played") return "Pendiente";

  const userGoals = match.userGoals ?? 0;
  const opponentGoals = match.opponentGoals ?? 0;

  return match.isHome
    ? `${userGoals}-${opponentGoals}`
    : `${opponentGoals}-${userGoals}`;
}

function getMatchOutcomeLabel(match: EuropeanTournamentMatch): string {
  if (match.status !== "played") return "Por jugar";
  const suffix = match.decidedBy === "extra_time" ? " (prórroga)" : match.decidedBy === "penalties" && match.penaltyShootout ? ` (p. ${match.penaltyShootout.userScored}-${match.penaltyShootout.opponentScored})` : "";
  if (match.result === "win") return `Victoria${suffix}`;
  if (match.result === "draw") return "Empate";
  return `Derrota${suffix}`;
}

function getMatchClass(match: EuropeanTournamentMatch, currentMatchId?: string | null): string {
  const classes = ["european-progress-match"];

  if (match.status === "played") classes.push("european-progress-match-played");
  if (match.status === "scheduled") classes.push("european-progress-match-scheduled");
  if (match.phase === "semifinal") classes.push("european-progress-match-semifinal");
  if (match.phase === "final") classes.push("european-progress-match-final");
  if (match.id === currentMatchId && match.status === "scheduled") classes.push("european-progress-match-current");
  if (match.result) classes.push(`european-progress-match-${match.result}`);

  return classes.join(" ");
}

function getVenueLabel(match: EuropeanTournamentMatch): string {
  return match.isHome ? "San Mamés" : "Fuera";
}

function getProgressPercent(tournament: EuropeanTournamentState): number {
  const played = tournament.matches.filter((match) => match.status === "played").length;
  const total = Math.max(tournament.matches.length, 1);

  return Math.min(100, Math.round((played / total) * 100));
}

function getNextMatch(tournament: EuropeanTournamentState): EuropeanTournamentMatch | undefined {
  return tournament.matches.find((match) => match.status === "scheduled");
}

function getCompetitionModifierClass(tournament: EuropeanTournamentState): string {
  if (tournament.competition === "champions_league") return " european-progress-panel-champions";
  if (tournament.competition === "europa_league") return " european-progress-panel-europa";
  return " european-progress-panel-conference";
}

function getPhaseObjectiveText(tournament: EuropeanTournamentState): string {
  if (tournament.eliminated) return "Objetivo cerrado: el Athletic está eliminado de Europa.";
  if (tournament.completed && tournament.champion) {
    return "Objetivo logrado: campeón europeo, se suma al palmarés al cerrar la temporada.";
  }
  if (tournament.completed) return "Objetivo cerrado: final europea disputada.";
  if (tournament.phase === "league_phase") return "Objetivo fase inicial: alcanzar 10 puntos para entrar en semifinales.";
  if (tournament.phase === "semifinal") return "Objetivo semifinal: ganar para alcanzar la final europea; perder significa eliminación.";
  if (tournament.phase === "final") return "Objetivo final: ganar para levantar el título europeo, que se sumará al palmarés al cerrar la temporada.";
  return "Objetivo europeo pendiente de comenzar.";
}

export function EuropeanProgressPanel({ tournament, currentMatchId }: EuropeanProgressPanelProps) {
  const summary = getEuropeanTournamentSummary(tournament);
  const progressPercent = getProgressPercent(tournament);
  const nextMatch = getNextMatch(tournament);

  return (
    <section className={`european-progress-panel${getCompetitionModifierClass(tournament)}`} aria-label="Progreso del torneo europeo">
      <div className="european-progress-header">
        <div>
          <p className="european-progress-eyebrow">Panel europeo</p>
          <h3>{getEuropeanCompetitionLabel(tournament.competition)}</h3>
          <span>{getEuropeanTournamentPhaseLabel(tournament.phase)}</span>
        </div>
        <strong>{summary.statusText}</strong>
      </div>

      <div className="european-progress-bar" aria-hidden="true">
        <div style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="european-progress-kpis" aria-label="Métricas europeas">
        <article>
          <span>Partidos</span>
          <strong>{summary.matchesPlayed}/{summary.totalMatches}</strong>
        </article>
        <article>
          <span>Puntos</span>
          <strong>{summary.points}</strong>
        </article>
        <article>
          <span>Balance</span>
          <strong>{summary.wins}V {summary.draws}E {summary.losses}D</strong>
        </article>
        <article>
          <span>Goles</span>
          <strong>{summary.goalsFor}-{summary.goalsAgainst}</strong>
        </article>
      </div>

      <p className="european-progress-objective">{getPhaseObjectiveText(tournament)}</p>

      <article className="european-progress-knockout-state" aria-label="Estado de eliminatorias europeas">
        <span>Estado eliminatoria</span>
        <strong>{summary.knockoutStageText}</strong>
        <small>{summary.stakesText}</small>
      </article>

      {nextMatch && (
        <article className="european-progress-next-match">
          <span>Próxima noche europea</span>
          <strong>{nextMatch.opponent.name}</strong>
          <small>
            {getEuropeanTournamentPhaseLabel(nextMatch.phase)} · J{nextMatch.matchday} · {getVenueLabel(nextMatch)} · Rating {nextMatch.opponent.rating}
          </small>
        </article>
      )}

      <div className="european-progress-calendar" aria-label="Calendario europeo">
        {tournament.matches.map((match) => (
          <article key={match.id} className={getMatchClass(match, currentMatchId)}>
            <div>
              <span>{getEuropeanTournamentPhaseLabel(match.phase)}</span>
              <strong>{match.opponent.name}</strong>
              <small>
                J{match.matchday} · {getVenueLabel(match)} · {match.opponent.country}
              </small>
            </div>
            <div className="european-progress-score">
              <strong>{getMatchScore(match)}</strong>
              <span>{getMatchOutcomeLabel(match)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default EuropeanProgressPanel;
