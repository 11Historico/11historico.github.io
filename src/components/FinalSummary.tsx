// src/components/FinalSummary.tsx

import { useState, type ReactNode } from "react";

import type {
  FinalGameSummary,
  Formation,
  GameDifficulty,
  LeagueTableRow,
  SelectedCoach,
  SelectedPlayer,
  TeamRating,
} from "../types/game";
import type { CareerTrophyCounts } from "../types/career";
import { getFinalTableEuropeanSpot, type FinalTableEuropeanSpot } from "../europe/europeanQualification";
import type { EuropeanQualificationResult } from "../europe/europeanTypes";

import SelectedTeamBoard from "./SelectedTeamBoard";
import PalmaresTrophyCase from "./PalmaresTrophyCase";
import EuropeanQualificationCard from "./EuropeanQualificationCard";
import { CupBracket, EuropeanBracket } from "./SeasonBrackets";
import { buildCupBracketRows, buildEuropeanBracketColumns } from "../career/seasonBrackets";
import type { EuropeanTournamentState } from "../europe/europeanTypes";

import {
  buildHistoryEntry,
  getBestGameHistoryEntry,
  upsertGameHistoryEntry,
  type GameHistoryEntry,
} from "../storage/gameHistoryStorage";

import "./FinalSummary.css";
import SupportButton from "./SupportButton";

interface FinalSummaryProps {
  summary: FinalGameSummary;
  europeanTournament?: EuropeanTournamentState | null;
  difficulty?: GameDifficulty;
  formation: Formation;
  selectedPlayers: SelectedPlayer[];
  selectedCoach: SelectedCoach;
  teamRating: TeamRating;
  careerTrophyCounts?: CareerTrophyCounts;
  europeanQualification?: EuropeanQualificationResult;
  onRestart?: () => void;
  onReturnToCareer?: () => void;
  onShare?: (shareText: string) => void;
}

function isUserTeam(row: LeagueTableRow): boolean {
  const normalizedName = row.teamName.toLowerCase();

  return (
    row.teamId === "athletic_historico" ||
    row.teamId === "athletic_club_historico" ||
    normalizedName.includes("histórico") ||
    normalizedName.includes("historico") ||
    normalizedName.includes("zurigorri")
  );
}

function getDisplayTeamName(row: LeagueTableRow): string {
  if (isUserTeam(row)) {
    return "Athletic Club Histórico";
  }

  return row.teamName;
}

type LeagueQualificationZone =
  | "champion"
  | "champions"
  | "europa"
  | "conference"
  | "relegation"
  | "middle";

interface LeagueQualificationInfo {
  zone: LeagueQualificationZone;
  label?: string;
  detail?: string;
}

function getRowKey(row: LeagueTableRow, index: number): string {
  return `${row.teamId}_${index}`;
}

function getCupWinnerLeaguePosition(table: LeagueTableRow[], summary: FinalGameSummary): number | null {
  if (!summary.cupChampionTeamId && !summary.cupChampionTeamName) return null;

  const index = table.findIndex(
    (row) =>
      row.teamId === summary.cupChampionTeamId ||
      row.teamName === summary.cupChampionTeamName ||
      (isUserTeam(row) && summary.cupChampionTeamId === "athletic_historico"),
  );

  return index >= 0 ? index + 1 : null;
}

function getEuropeanMarkerInfo(spot: FinalTableEuropeanSpot, position: number): LeagueQualificationInfo {
  if (spot.competition === "champions_league") {
    return position === 1
      ? { zone: "champion", label: "Campeón + Champions" }
      : { zone: "champions", label: "Champions" };
  }

  if (spot.competition === "europa_league") {
    return {
      zone: "europa",
      label: "Europa League",
      detail: spot.viaCopa ? "Campeón de Copa" : spot.reallocated ? "Plaza Copa heredada" : "Vía Liga",
    };
  }

  return {
    zone: "conference",
    label: "Conference",
    detail: spot.reallocated ? "Plaza heredada" : undefined,
  };
}

function buildLeagueQualificationMap(
  table: LeagueTableRow[],
  summary: FinalGameSummary
): Map<string, LeagueQualificationInfo> {
  const qualificationMap = new Map<string, LeagueQualificationInfo>();
  const cupWinnerLeaguePosition = getCupWinnerLeaguePosition(table, summary);

  table.forEach((row, index) => {
    const position = index + 1;
    const key = getRowKey(row, index);
    const europeanSpot = getFinalTableEuropeanSpot(position, cupWinnerLeaguePosition);

    if (europeanSpot) {
      qualificationMap.set(key, getEuropeanMarkerInfo(europeanSpot, position));
      return;
    }

    if (position > table.length - 3) {
      qualificationMap.set(key, { zone: "relegation", label: "Descenso" });
      return;
    }

    qualificationMap.set(key, { zone: "middle" });
  });

  return qualificationMap;
}

function getLeagueZoneClass(info: LeagueQualificationInfo): string {
  if (info.zone === "champion") return "final-zone-champion";
  if (info.zone === "champions") return "final-zone-champions";
  if (info.zone === "europa") return "final-zone-europe";
  if (info.zone === "conference") return "final-zone-conference";
  if (info.zone === "relegation") return "final-zone-relegation";

  return "final-zone-middle";
}

function getCupSummaryText(summary: FinalGameSummary): string {
  if (summary.cupTrophyWon) return "Campeón de Copa";

  if (summary.cupStatus === "eliminated") {
    const baseLabel = summary.cupUserEliminatedRoundName
      ? `Eliminado en ${summary.cupUserEliminatedRoundName}`
      : summary.cupRoundReached ?? "Eliminado en Copa";

    return summary.cupChampionTeamName
      ? `${baseLabel} · Campeón: ${summary.cupChampionTeamName}`
      : baseLabel;
  }

  return summary.cupRoundReached ?? "Copa no finalizada";
}

function getCoachBaseBonus(coach: SelectedCoach["coachSeason"]): number {
  if (coach.overall <= 80) return 1;
  if (coach.overall <= 85) return 2;
  return 3;
}

function getCoachCompetitionBonus(coach: SelectedCoach["coachSeason"], competition: "league" | "cup" | "europe"): number {
  const skill =
    competition === "league"
      ? coach.skills.management
      : competition === "cup"
        ? coach.skills.cup
        : coach.skills.europe;

  return typeof skill === "number" && skill >= 86 ? 1 : 0;
}

function getCoachSpecialtyLabel(coach: SelectedCoach["coachSeason"]): string {
  const specialties: string[] = [];

  if (getCoachCompetitionBonus(coach, "league") > 0) specialties.push("Liga +1");
  if (getCoachCompetitionBonus(coach, "cup") > 0) specialties.push("Copa +1");
  if (getCoachCompetitionBonus(coach, "europe") > 0) specialties.push("Europa +1");

  return specialties.length > 0 ? specialties.join(" · ") : "Sin bonus específico";
}

function clampFinalRating(value: number): number {
  return Math.max(40, Math.min(99, Math.round(value)));
}

function getSelectedPlayersAverage(selectedPlayers: SelectedPlayer[]): number {
  if (selectedPlayers.length === 0) return 0;

  return Math.round(
    selectedPlayers.reduce((sum, selected) => sum + selected.playerSeason.overall, 0) /
      selectedPlayers.length
  );
}

function CoachRatingBreakdown({
  selectedCoach,
  selectedPlayers,
  teamRating,
}: {
  selectedCoach: SelectedCoach;
  selectedPlayers: SelectedPlayer[];
  teamRating: TeamRating;
}) {
  const coach = selectedCoach.coachSeason;
  const xiAverage = getSelectedPlayersAverage(selectedPlayers);
  const baseBonus = getCoachBaseBonus(coach);
  const leagueBonus = getCoachCompetitionBonus(coach, "league");
  const cupBonus = getCoachCompetitionBonus(coach, "cup");
  const europeBonus = getCoachCompetitionBonus(coach, "europe");

  return (
    <div className="final-coach-breakdown">
      <article>
        <span>Media XI</span>
        <strong>{xiAverage}</strong>
      </article>
      <article>
        <span>Bonus base entrenador</span>
        <strong>+{baseBonus}</strong>
      </article>
      <article>
        <span>Rating visible equipo</span>
        <strong>{teamRating.overall}</strong>
      </article>
      <article className={leagueBonus > 0 ? "final-coach-breakdown-boosted" : ""}>
        <span>Liga</span>
        <strong>{clampFinalRating(teamRating.overall + leagueBonus)}</strong>
        <small>{leagueBonus > 0 ? "+1 especialista" : "sin extra"}</small>
      </article>
      <article className={cupBonus > 0 ? "final-coach-breakdown-boosted" : ""}>
        <span>Copa</span>
        <strong>{clampFinalRating(teamRating.overall + cupBonus)}</strong>
        <small>{cupBonus > 0 ? "+1 especialista" : "sin extra"}</small>
      </article>
      <article className={europeBonus > 0 ? "final-coach-breakdown-boosted" : ""}>
        <span>Europa futura</span>
        <strong>{clampFinalRating(teamRating.overall + europeBonus)}</strong>
        <small>{europeBonus > 0 ? "+1 especialista" : "sin extra"}</small>
      </article>
      <p>
        El rating visible ya incluye formación y bonus base. El +1 de especialidad solo se aplica
        en la competición correspondiente.
      </p>
    </div>
  );
}


function getFinalOutcomeTitle(summary: FinalGameSummary, isCareerReturn: boolean): string {
  if (isCareerReturn) return "Temporada superada";
  return summary.finalLabel;
}

function getFinalOutcomeSubtitle(summary: FinalGameSummary, isCareerReturn: boolean): string {
  if (!isCareerReturn) return summary.finalCategory;

  if (summary.cupTrophyWon) return "Objetivo cumplido: Copa del Rey";
  if (summary.leaguePosition <= 4) return "Objetivo cumplido: Champions League";
  // 5º-6º Europa League, 7º Conference League: mismos umbrales que
  // getLeaguePositionCompetition en src/europe/europeanQualification.ts.
  if (summary.leaguePosition === 5 || summary.leaguePosition === 6) return "Objetivo cumplido: Europa League";
  if (summary.leaguePosition === 7) return "Objetivo cumplido: Conference League";

  return "Objetivo cumplido: clasificación europea";
}

function getCoachInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "DT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function buildShareText(summary: FinalGameSummary): string {
  const topScorer = summary.topScorer
    ? `${summary.topScorer.playerName} (${summary.topScorer.goals} goles)`
    : "Sin datos";

  const topAssister = summary.topAssister
    ? `${summary.topAssister.playerName} (${summary.topAssister.assists} asistencias)`
    : "Sin datos";

  return [
    "Once histórico Zurigorri ⚪🔴",
    "",
    `Resultado final: ${summary.finalCategory}`,
    `Liga: ${summary.leaguePosition}º con ${summary.points} puntos`,
    `Copa del Rey: ${getCupSummaryText(summary)}`,
    `Balance Liga: ${summary.wins}V / ${summary.draws}E / ${summary.losses}D`,
    `Goles: ${summary.goalsFor} a favor / ${summary.goalsAgainst} en contra`,
    `Máximo goleador: ${topScorer}`,
    `Máximo asistente: ${topAssister}`,
    `Porterías a cero: ${summary.cleanSheets}`,
    "",
    "¿Serías capaz de crear un Athletic mejor?",
  ].join("\n");
}

function getDifficultyLabel(difficulty?: GameDifficulty): string {
  if (difficulty === "normal") return "Fácil";
  if (difficulty === "leyenda") return "Leyenda";
  return "Normal";
}

function formatHistoryDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha desconocida";
  }

  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function ResultStatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <article className="final-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {helper && <small>{helper}</small>}
    </article>
  );
}

function LeagueTableFinal({ table, summary }: { table?: LeagueTableRow[]; summary: FinalGameSummary }) {
  if (!table || table.length === 0) {
    return (
      <section className="final-league-table-card final-league-table-empty">
        <div className="final-league-table-header">
          <div>
            <span>LaLiga 25/26</span>
            <h2>Clasificación final completa</h2>
          </div>
        </div>
        <p>
          Esta partida se generó antes de guardar la tabla completa. Empieza una nueva
          partida y simula la Liga para verla aquí.
        </p>
      </section>
    );
  }

  const qualificationMap = buildLeagueQualificationMap(table, summary);

  return (
    <section className="final-league-table-card">
      <div className="final-league-table-header">
        <div>
          <span>LaLiga 25/26</span>
          <h2>Clasificación final completa</h2>
        </div>
        <small>{table.length} equipos</small>
      </div>

      <div className="final-league-zone-legend">
        <span className="zone-dot zone-dot-champion">Campeón</span>
        <span className="zone-dot zone-dot-champions">Champions</span>
        <span className="zone-dot zone-dot-europe">Europa League</span>
        <span className="zone-dot zone-dot-conference">Conference</span>
        <span className="zone-dot zone-dot-relegation">Descenso</span>
      </div>

      <p className="final-league-europe-note">
        Copa del Rey: el campeón va a Europa League. Si ya está clasificado por Liga,
        la plaza pasa al siguiente equipo de la clasificación. Si el campeón de Copa no es
        equipo de Liga, conserva su plaza copera y la Conference queda para el siguiente
        equipo libre de la tabla.
      </p>

      <div className="final-league-table-wrap">
        <table className="final-league-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Equipo</th>
              <th>PJ</th>
              <th>V</th>
              <th>E</th>
              <th>D</th>
              <th>GF</th>
              <th>GC</th>
              <th>DG</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row, index) => {
              const highlighted = isUserTeam(row);
              const qualificationInfo =
                qualificationMap.get(getRowKey(row, index)) ?? { zone: "middle" };

              return (
                <tr
                  key={`${row.teamId}_${index}`}
                  className={`final-league-table-row ${getLeagueZoneClass(qualificationInfo)} ${
                    highlighted ? "final-league-table-user-row" : ""
                  }`}
                >
                  <td>{index + 1}</td>
                  <td className="final-league-team-cell">
                    <strong>{getDisplayTeamName(row)}</strong>
                    <div className="final-league-team-tags">
                      {qualificationInfo.label && (
                        <span className={`final-league-qualification-tag final-league-qualification-${qualificationInfo.zone}`}>
                          {qualificationInfo.label}
                        </span>
                      )}
                      {qualificationInfo.detail && (
                        <span className="final-league-qualification-detail">
                          {qualificationInfo.detail}
                        </span>
                      )}
                      {highlighted && <span>Tu equipo</span>}
                    </div>
                  </td>
                  <td>{row.played}</td>
                  <td>{row.won}</td>
                  <td>{row.drawn}</td>
                  <td>{row.lost}</td>
                  <td>{row.goalsFor}</td>
                  <td>{row.goalsAgainst}</td>
                  <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                  <td className="final-league-points-cell">{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="final-league-mobile-list" aria-label="Clasificación final resumida">
        {table.map((row, index) => {
          const highlighted = isUserTeam(row);
          const qualificationInfo = qualificationMap.get(getRowKey(row, index)) ?? { zone: "middle" };

          return (
            <article
              key={`mobile_${row.teamId}_${index}`}
              className={`final-league-mobile-row ${getLeagueZoneClass(qualificationInfo)} ${
                highlighted ? "final-league-mobile-user-row" : ""
              }`}
            >
              <div className="final-league-mobile-position">{index + 1}</div>
              <div className="final-league-mobile-team">
                <strong>{getDisplayTeamName(row)}</strong>
                <span>
                  {row.won}V · {row.drawn}E · {row.lost}D · DG {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </span>
                <div className="final-league-team-tags">
                  {qualificationInfo.label && (
                    <span className={`final-league-qualification-tag final-league-qualification-${qualificationInfo.zone}`}>
                      {qualificationInfo.label}
                    </span>
                  )}
                  {qualificationInfo.detail && (
                    <span className="final-league-qualification-detail">{qualificationInfo.detail}</span>
                  )}
                  {highlighted && <span>Tu equipo</span>}
                </div>
              </div>
              <div className="final-league-mobile-points">
                <strong>{row.points}</strong>
                <span>pts</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}


function BestGamePanel({ history }: { history: GameHistoryEntry[] }) {
  const bestGame = getBestGameHistoryEntry(history);

  if (!bestGame) {
    return null;
  }

  return (
    <section className="final-best-game-card">
      <div>
        <span>🏆 Mejor partida</span>
        <h2>
          {bestGame.points} puntos · {bestGame.leaguePosition}º
        </h2>
        <p>
          {bestGame.formationName} · {bestGame.coachName} · Dificultad{" "}
          {getDifficultyLabel(bestGame.difficulty)}
        </p>
      </div>

      <div className="final-best-game-meta">
        <strong>
          {bestGame.wins}V / {bestGame.draws}E / {bestGame.losses}D
        </strong>
        <small>
          {bestGame.topScorerName
            ? `Goleador: ${bestGame.topScorerName} (${bestGame.topScorerGoals ?? 0})`
            : "Sin goleador"}
        </small>
      </div>
    </section>
  );
}

function CupSummaryPanel({ summary }: { summary: FinalGameSummary }) {
  const cupResults = summary.cupResults ?? [];
  const cupRows = buildCupBracketRows({
    cupResults,
    simulatedResults: summary.cupSimulatedRemainingResults,
  });
  const hasAnyCupMatch = cupRows.some((row) => row.status !== "pending");

  return (
    <section className={`final-cup-card ${summary.cupTrophyWon ? "final-cup-card-won" : ""}`}>
      <div className="final-cup-header">
        <div>
          <span>Copa del Rey</span>
          <h2>{getCupSummaryText(summary)}</h2>
        </div>
        <strong>{summary.cupTrophyWon ? "🏆" : "🏟️"}</strong>
      </div>

      {(summary.cupChampionTeamName || summary.cupRunnerUpTeamName) && (
        <div className="final-cup-winner-box">
          <article>
            <span>Campeón</span>
            <strong>{summary.cupChampionTeamName ?? "Sin datos"}</strong>
          </article>
          <article>
            <span>Subcampeón</span>
            <strong>{summary.cupRunnerUpTeamName ?? "Sin datos"}</strong>
          </article>
        </div>
      )}

      {hasAnyCupMatch ? (
        <CupBracket rows={cupRows} />
      ) : (
        <p className="final-cup-empty">No hay partidos de Copa registrados.</p>
      )}
    </section>
  );
}

function EuropeanTournamentPanel({ tournament }: { tournament: EuropeanTournamentState }) {
  return <EuropeanBracket columns={buildEuropeanBracketColumns(tournament)} />;
}

function HistoryPanel({ history }: { history: GameHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <section className="final-history-card">
        <div className="final-history-header">
          <div>
            <span>Historial local</span>
            <h2>Últimas partidas</h2>
          </div>
        </div>
        <p className="final-history-empty">
          Todavía no hay partidas guardadas en este navegador.
        </p>
      </section>
    );
  }

  return (
    <section className="final-history-card">
      <div className="final-history-header">
        <div>
          <span>Historial local</span>
          <h2>Últimas partidas</h2>
        </div>
        <small>Máximo 5</small>
      </div>

      <div className="final-history-list">
        {history.map((entry, index) => (
          <article
            key={`${entry.gameId}_${entry.playedAt}`}
            className={`final-history-entry ${index === 0 ? "final-history-entry-current" : ""}`}
          >
            <div className="final-history-entry-main">
              <strong>{entry.leaguePosition}º · {entry.points} pts</strong>
              <span>
                {entry.formationName} · {entry.coachName} · {getDifficultyLabel(entry.difficulty)}
              </span>
              <small>
                {entry.wins}V / {entry.draws}E / {entry.losses}D · Rating {entry.teamOverall}
              </small>
            </div>

            <div className="final-history-entry-side">
              <span>{formatHistoryDate(entry.playedAt)}</span>
              <small>
                {entry.topScorerName
                  ? `${entry.topScorerName} (${entry.topScorerGoals ?? 0} goles)`
                  : "Sin goleador"}
              </small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}


function FinalAccordion({
  title,
  eyebrow,
  defaultOpen = true,
  children,
}: {
  title: string;
  eyebrow?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`final-accordion ${open ? "final-accordion-open" : ""}`}>
      <button
        type="button"
        className="final-accordion-header"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span>
          {eyebrow && <small>{eyebrow}</small>}
          <strong>{title}</strong>
        </span>
        <b>{open ? "▲" : "▼"}</b>
      </button>

      {open && <div className="final-accordion-content">{children}</div>}
    </section>
  );
}

export function FinalSummary({
  summary,
  difficulty = "dificil",
  formation,
  selectedPlayers,
  selectedCoach,
  teamRating,
  careerTrophyCounts,
  europeanQualification,
  europeanTournament,
  onRestart,
  onReturnToCareer,
  onShare,
}: FinalSummaryProps) {
  const shareText = buildShareText(summary);

  const [history] = useState<GameHistoryEntry[]>(() => {
    const entry = buildHistoryEntry({
      summary,
      formation,
      selectedCoach,
      teamRating,
      difficulty,
    });

    return upsertGameHistoryEntry(entry);
  });

  function handleShare() {
    if (onShare) {
      onShare(shareText);
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(shareText);
    }
  }

  const isCareerSummary = Boolean(onReturnToCareer);
  const outcomeTitle = getFinalOutcomeTitle(summary, isCareerSummary);
  const outcomeSubtitle = getFinalOutcomeSubtitle(summary, isCareerSummary);

  return (
    <section className="final-summary final-summary-polished">
      <header className="final-summary-header final-summary-header-polished">
        <p className="eyebrow">Final de temporada</p>
        <h1>{outcomeTitle}</h1>
        <p>{outcomeSubtitle}</p>

        {(onRestart || onReturnToCareer) && (
          <div className="final-primary-cta-bar" aria-label="Acciones de final de temporada">
            {onReturnToCareer && (
              <button type="button" className="final-primary-restart-button" onClick={onReturnToCareer}>
                Volver a carrera
              </button>
            )}
            {onRestart && (
              <button type="button" className="secondary-final-button" onClick={onRestart}>
                Salir
              </button>
            )}
          </div>
        )}
      </header>

      <div className="final-summary-layout final-summary-layout-polished">
        <main className="final-main-panel">
          <section className="final-hero-card final-hero-card-polished">
            <span>Clasificación final · Liga 25/26</span>
            <strong>{summary.leaguePosition}º</strong>
            <p>
              {summary.points} puntos · {summary.wins} victorias · {summary.draws} empates ·{" "}
              {summary.losses} derrotas
            </p>
          </section>

          <div className="final-stats-grid final-stats-grid-polished">
            <ResultStatCard label="Puntos" value={summary.points} />
            <ResultStatCard label="G. favor" value={summary.goalsFor} />
            <ResultStatCard label="G. contra" value={summary.goalsAgainst} />
            <ResultStatCard label="Porter. a 0" value={summary.cleanSheets} />
          </div>

          <section className="final-card final-cup-compact-card">
            <span>Copa del Rey</span>
            <strong>{getCupSummaryText(summary)}</strong>
            {summary.cupTrophyWon ? <small>🏆 Campeón</small> : summary.cupStatus === "eliminated" ? <small>Resultado copero</small> : null}
          </section>

          <BestGamePanel history={history} />

          <FinalAccordion title="Palmarés" eyebrow="Vitrina histórica" defaultOpen={false}>
            <PalmaresTrophyCase summary={summary} trophyCounts={careerTrophyCounts} variant={careerTrophyCounts ? "career" : "single-game"} />
          </FinalAccordion>

          <FinalAccordion title="Copa del Rey" eyebrow={getCupSummaryText(summary)} defaultOpen>
            <CupSummaryPanel summary={summary} />
          </FinalAccordion>

          {europeanTournament && europeanTournament.matches.length > 0 && (
            <FinalAccordion title="Torneo europeo" eyebrow="Fase inicial, semifinal y final" defaultOpen>
              <EuropeanTournamentPanel tournament={europeanTournament} />
            </FinalAccordion>
          )}

          {europeanQualification && (
            <FinalAccordion
              title="Clasificación europea"
              eyebrow={europeanQualification.qualified ? europeanQualification.shortLabel : "Sin billete europeo"}
              defaultOpen
            >
              <EuropeanQualificationCard result={europeanQualification} />
            </FinalAccordion>
          )}

          <FinalAccordion title="Clasificación final completa" eyebrow="LaLiga 25/26" defaultOpen>
            <LeagueTableFinal table={summary.table} summary={summary} />
          </FinalAccordion>

          <FinalAccordion title="Historial local" eyebrow="Últimas partidas" defaultOpen={false}>
            <HistoryPanel history={history} />
          </FinalAccordion>

          <FinalAccordion title="Tu once final" eyebrow="Plantilla" defaultOpen={false}>
            <section className="final-board-card">
              <SelectedTeamBoard
                formation={formation}
                selectedPlayers={selectedPlayers}
                title="Once final"
                compact
              />
            </section>
          </FinalAccordion>
        </main>

        <aside className="final-side-panel">
          <section className="final-card">
            <h2>Entrenador</h2>
            <div className="final-coach-card final-coach-card-polished">
              <span className="final-coach-avatar">{getCoachInitials(selectedCoach.coachSeason.name)}</span>
              <div>
                <strong>{selectedCoach.coachSeason.name}</strong>
                <span>Temporada {selectedCoach.coachSeason.season}</span>
                <small>
                  Media {selectedCoach.coachSeason.overall} · Bonus base +{getCoachBaseBonus(selectedCoach.coachSeason)}
                </small>
                <small>{getCoachSpecialtyLabel(selectedCoach.coachSeason)}</small>
              </div>
            </div>
            <CoachRatingBreakdown
              selectedCoach={selectedCoach}
              selectedPlayers={selectedPlayers}
              teamRating={teamRating}
            />
          </section>

          <section className="final-card">
            <h2>Rating del equipo</h2>
            <div className="final-rating-circle">
              <strong>{teamRating.overall}</strong>
              <span>{teamRating.profileLabel}</span>
            </div>

            <div className="final-rating-list">
              <span>Ataque {teamRating.attack}</span>
              <span>Defensa {teamRating.defense}</span>
              <span>Control {teamRating.control}</span>
              <span>Portería {teamRating.goalkeeping}</span>
            </div>
          </section>

          <section className="final-card">
            <h2>Jugadores destacados</h2>

            <div className="final-player-highlight">
              <span>Máximo goleador</span>
              <strong>{summary.topScorer?.playerName ?? "Sin datos"}</strong>
              <small>{summary.topScorer?.goals ?? 0} goles</small>
            </div>

            <div className="final-player-highlight">
              <span>Máximo asistente</span>
              <strong>{summary.topAssister?.playerName ?? "Sin datos"}</strong>
              <small>{summary.topAssister?.assists ?? 0} asistencias</small>
            </div>
          </section>

          <FinalAccordion title="Compartir resultado" eyebrow="Resumen" defaultOpen={false}>
            <section className="final-card final-card-flat">
              <pre className="share-preview">{shareText}</pre>

              <div className="final-actions">
                <button type="button" onClick={handleShare}>
                  Copiar resumen
                </button>

                {onReturnToCareer && (
                  <button type="button" className="secondary-final-button" onClick={onReturnToCareer}>
                    Volver a carrera
                  </button>
                )}

                {onRestart && (
                  <button type="button" className="secondary-final-button" onClick={onRestart}>
                    Salir
                  </button>
                )}
              </div>
            </section>
          </FinalAccordion>
        </aside>
      </div>
    
        <SupportButton variant="final" />
      </section>
  );
}

export default FinalSummary;



