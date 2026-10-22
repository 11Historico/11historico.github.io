import { useState } from "react";
import type { FinalGameSummary, SelectedPlayer, TeamRating } from "../types/game";
import type { CareerAchievement } from "../career/shareRetention";
import type { CareerLocalRankingEntry, CareerObjectiveResult, CareerSeasonResult, CareerTrophyCounts } from "../types/career";
import type { EuropeanCareerState, EuropeanQualificationResult, EuropeanTournamentState } from "../europe/europeanTypes";
import { calculateCareerArcadeScore, getFinalCareerTrophyCounts } from "../career/careerRanking";
import { buildChallengeLink, getChallengeSummary } from "../career/challengeLink";
import {
  buildCareerShareText,
  getCareerAchievements,
  getCareerRankingPosition,
  isNewCareerPersonalRecord,
} from "../career/shareRetention";
import { loadCareerLocalRanking } from "../storage/careerLocalRankingStorage";

import CareerGlobalSubmitPanel from "./CareerGlobalSubmitPanel";
import PalmaresTrophyCase from "./PalmaresTrophyCase";
import EuropeanQualificationCard from "./EuropeanQualificationCard";

import "./CareerSeasonOutcome.css";

interface CareerSeasonOutcomeProps {
  summary: FinalGameSummary;
  seasonResult: CareerSeasonResult;
  objectiveResult: CareerObjectiveResult;
  onViewFullSummary: () => void;
  onRestart?: () => void;
  onContinueCareer?: () => void;
  onViewLocalRanking?: () => void;
  onViewGlobalRanking?: () => void;
  rankingEntry?: CareerLocalRankingEntry;
  selectedPlayers?: SelectedPlayer[];
  teamRating?: TeamRating;
  completedSeasons?: number;
  trophyCounts?: CareerTrophyCounts;
  europeanQualification?: EuropeanQualificationResult;
  europeanCareerState?: EuropeanCareerState;
  /** Torneo europeo de la temporada que acaba de cerrarse (para integrar un título pendiente en el palmarés mostrado aquí). */
  europeanTournament?: EuropeanTournamentState | null;
}

function getSelectedPlayersAverage(selectedPlayers: SelectedPlayer[] = []): number | undefined {
  if (selectedPlayers.length === 0) return undefined;

  return Math.round(
    selectedPlayers.reduce((sum, selected) => sum + selected.playerSeason.overall, 0) /
      selectedPlayers.length
  );
}

function getCareerOutcomeNote(seasonResult: CareerSeasonResult, objectiveResult: CareerObjectiveResult): string {
  if (seasonResult.isRelegated) {
    return "Carrera terminada por descenso. Ni la Copa ni la Supercopa evitan este Game Over.";
  }

  if (!objectiveResult.survives) {
    return "Carrera terminada: te quedaste fuera de Europa y no ganaste la Copa del Rey.";
  }

  if (seasonResult.wonLeague) {
    return "Temporada histórica: campeón de Liga. Premio especial desbloqueado.";
  }

  if (seasonResult.wonCopa) {
    return "Temporada salvada por Copa. Premio especial desbloqueado.";
  }

  if (seasonResult.wonSupercopa && objectiveResult.qualifiedForEurope) {
    return "Temporada salvada por Europa y Supercopa ganada. Premio especial desbloqueado.";
  }

  return "Temporada salvada por Europa. Elige cambiar 1 jugador o cambiar entrenador antes de seguir.";
}

function CareerGameOverArcadeSummary({
  seasonResult,
  objectiveResult,
  completedSeasons = 0,
  trophyCounts,
  europeanTournament,
}: {
  seasonResult: CareerSeasonResult;
  objectiveResult: CareerObjectiveResult;
  completedSeasons?: number;
  trophyCounts?: CareerTrophyCounts;
  europeanTournament?: EuropeanTournamentState | null;
}) {
  const finalTrophies = getFinalCareerTrophyCounts(trophyCounts, seasonResult, europeanTournament);
  const { arcadeScore, palmaresScore, survivalScore } = calculateCareerArcadeScore({
    completedSeasons,
    trophyCounts: finalTrophies,
  });
  const mainCause = seasonResult.isRelegated
    ? "Descenso"
    : objectiveResult.qualifiedForEurope
      ? "Objetivo fallido por Copa/descenso"
      : "Sin plaza europea ni Copa";

  return (
    <section className="career-arcade-summary" aria-label="Resumen arcade de carrera">
      <div className="career-arcade-summary-header">
        <span>Resumen de carrera</span>
        <strong>{arcadeScore}</strong>
        <small>puntos arcade</small>
      </div>

      <div className="career-arcade-grid">
        <article>
          <span>Temporadas superadas</span>
          <strong>{completedSeasons}</strong>
          <small>+{survivalScore} pts</small>
        </article>
        <article>
          <span>Última Liga</span>
          <strong>{seasonResult.leaguePosition}.º</strong>
          <small>{mainCause}</small>
        </article>
        <article>
          <span>Palmarés</span>
          <strong>{palmaresScore}</strong>
          <small>pts por títulos</small>
        </article>
      </div>

      <div className="career-arcade-trophy-row">
        <span>Ligas {finalTrophies.liga}</span>
        <span>Copas {finalTrophies.copa}</span>
        <span>Supercopas {finalTrophies.supercopa}</span>
        <span>Europa {finalTrophies.europaLeague + finalTrophies.conference + finalTrophies.champions}</span>
      </div>
    </section>
  );
}

function CareerShareRetentionPanel({
  shareText,
  challengeLink,
  achievements,
  rankingPosition,
  isNewRecord,
  rankingSaved,
}: {
  shareText: string;
  challengeLink?: string;
  achievements: CareerAchievement[];
  rankingPosition?: number;
  isNewRecord: boolean;
  rankingSaved: boolean;
}) {
  const [shareStatus, setShareStatus] = useState("");
  const [challengeStatus, setChallengeStatus] = useState("");
  async function handleCopyChallenge() {
    if (!challengeLink) return;

    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(challengeLink);
      setChallengeStatus("Enlace de reto copiado.");
    } catch {
      setChallengeStatus("No se pudo copiar el enlace. Revisa la barra de direcciones.");
    }
  }

  async function handleShareCareer() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(shareText);
      setShareStatus("Texto copiado. Ya puedes compartirlo.");
    } catch {
      setShareStatus("No se pudo copiar automáticamente. Selecciona y copia el texto de arriba.");
    }
  }

  return (
    <section className="career-share-retention-card" aria-label="Compartir carrera">
      <div className="career-share-retention-header">
        <div>
          <span>Share & retention</span>
          <h2>Compartir mi carrera</h2>
        </div>
        {rankingPosition && <strong>Top #{rankingPosition}</strong>}
      </div>

      {isNewRecord && (
        <p className="career-new-record-badge">
          ⭐ Nuevo récord personal en este navegador
        </p>
      )}

      {!rankingSaved && (
        <p role="alert" className="career-save-warning">
          Esta carrera no figura en el ranking local: puede haber fallado el guardado o haber quedado fuera del Top 100. Copia el resultado antes de salir.
        </p>
      )}

      {achievements.length > 0 && (
        <div className="career-achievements-list" aria-label="Logros desbloqueados">
          {achievements.map((achievement) => (
            <article key={achievement.id}>
              <strong>{achievement.label}</strong>
              <small>{achievement.description}</small>
            </article>
          ))}
        </div>
      )}

      <textarea className="career-share-preview" aria-label="Texto para compartir" readOnly value={shareText} rows={9} />

      <button type="button" className="primary-home-button" onClick={handleShareCareer}>
        Compartir mi carrera
      </button>
      {challengeLink && (
        <>
          <button type="button" className="secondary-home-button" onClick={handleCopyChallenge}>
            Copiar enlace de reto
          </button>
          <p role="status" aria-live="polite">{challengeStatus}</p>
        </>
      )}
      <p role="status" aria-live="polite">{shareStatus}</p>
    </section>
  );
}

function getEuropeanLabel(result: CareerSeasonResult): string {
  if (result.europeanQualification === "champions") return "Champions League";
  if (result.europeanQualification === "europa_league") return "Europa League";
  if (result.europeanQualification === "conference") return "Conference League";
  return "Sin plaza europea";
}

export function CareerSeasonOutcome({
  summary,
  seasonResult,
  objectiveResult,
  onViewFullSummary,
  onContinueCareer,
  onRestart,
  onViewLocalRanking,
  onViewGlobalRanking,
  rankingEntry,
  selectedPlayers = [],
  teamRating,
  completedSeasons = 0,
  trophyCounts,
  europeanQualification,
  europeanCareerState,
  europeanTournament,
}: CareerSeasonOutcomeProps) {
  const survived = objectiveResult.survives;
  const xiAverage = getSelectedPlayersAverage(selectedPlayers);
  const finalTrophies = getFinalCareerTrophyCounts(trophyCounts, seasonResult, europeanTournament);
  const localRankingEntries = !survived && rankingEntry ? loadCareerLocalRanking() : [];
  const rankingPosition = getCareerRankingPosition(rankingEntry, localRankingEntries);
  const newPersonalRecord = isNewCareerPersonalRecord(rankingEntry, localRankingEntries);
  const achievements = getCareerAchievements({
    completedSeasons,
    trophyCounts: finalTrophies,
    qualifiedForEurope: Boolean(europeanCareerState?.totalQualifications) || objectiveResult.qualifiedForEurope,
    reachedEuropeanFinal: Boolean(europeanTournament?.matches.some((match) => match.phase === "final" && match.status === "played")),
    rankingPosition,
  });
  const careerShareText = rankingEntry ? buildCareerShareText(rankingEntry) : undefined;
  const challengeLinkUrl = rankingEntry
    ? buildChallengeLink(getChallengeSummary(rankingEntry), `${window.location.origin}${window.location.pathname}`)
    : undefined;

  return (
    <main className={`career-outcome-screen ${survived ? "career-outcome-success" : "career-outcome-game-over"}`}>
      <section className="career-outcome-card">
        <p className="eyebrow">Modo carrera Athletic · {seasonResult.seasonLabel}</p>
        <h1>{survived ? "Temporada superada" : "GAME OVER"}</h1>
        <p className="career-outcome-reason">{objectiveResult.reason}</p>

        <div className="career-outcome-grid">
          <article>
            <span>Liga</span>
            <strong>{summary.leaguePosition}.º</strong>
            <small>{summary.points} puntos</small>
          </article>
          <article>
            <span>Europa</span>
            <strong>{getEuropeanLabel(seasonResult)}</strong>
            <small>{objectiveResult.qualifiedForEurope ? "Objetivo cumplido" : "No clasificado"}</small>
          </article>
          <article>
            <span>Copa del Rey</span>
            <strong>{seasonResult.wonCopa ? "Campeón" : summary.cupRoundReached ?? "Sin título"}</strong>
            <small>{seasonResult.wonCopa ? "Objetivo cumplido" : "No salva la temporada"}</small>
          </article>
          <article>
            <span>Descenso</span>
            <strong>{seasonResult.isRelegated ? "Sí" : "No"}</strong>
            <small>{seasonResult.isRelegated ? "Condición dura de Game Over" : "Sigue vivo si cumple objetivo"}</small>
          </article>
          <article>
            <span>Supercopa</span>
            <strong>{seasonResult.wonSupercopa ? "Campeón" : "Sin título"}</strong>
            <small>{seasonResult.wonSupercopa ? "+2 palmarés" : "No salva la temporada"}</small>
          </article>
        </div>

        {europeanQualification && <EuropeanQualificationCard result={europeanQualification} />}

        {(xiAverage || teamRating) && (
          <p className="career-outcome-team-rating-note">
            {xiAverage ? <>Media XI actual: <strong>{xiAverage}</strong></> : null}
            {xiAverage && teamRating ? " · " : null}
            {teamRating ? <>Rating visible equipo: <strong>{teamRating.overall}</strong></> : null}
          </p>
        )}

        <p className="career-outcome-note">
          {getCareerOutcomeNote(seasonResult, objectiveResult)}
        </p>

        {!survived && (
          <>
            <CareerGameOverArcadeSummary
              seasonResult={seasonResult}
              objectiveResult={objectiveResult}
              completedSeasons={completedSeasons}
              trophyCounts={trophyCounts}
              europeanTournament={europeanTournament}
            />

            <section className="career-game-over-palmares-showcase" aria-label="Vitrina de palmarés de carrera">
              <PalmaresTrophyCase
                summary={summary}
                trophyCounts={finalTrophies}
                variant="career"
              />
            </section>

            {careerShareText && (
              <CareerShareRetentionPanel
                shareText={careerShareText}
                challengeLink={challengeLinkUrl}
                achievements={achievements}
                rankingPosition={rankingPosition}
                isNewRecord={newPersonalRecord}
                rankingSaved={rankingPosition !== undefined}
              />
            )}
          </>
        )}

        {!survived && rankingEntry && onViewGlobalRanking && (
          <CareerGlobalSubmitPanel
            entry={rankingEntry}
            onViewGlobalRanking={onViewGlobalRanking}
          />
        )}

        <div className="career-outcome-actions">
          {survived && onContinueCareer && (
            <button type="button" className="primary-home-button" onClick={onContinueCareer}>
              Continuar carrera
            </button>
          )}
          {!survived && onRestart && (
            <button type="button" className="primary-home-button" onClick={onRestart}>
              Nueva carrera
            </button>
          )}
          {!survived && onViewLocalRanking && (
            <button type="button" className="career-local-ranking-button" onClick={onViewLocalRanking}>
              Ver ranking local
            </button>
          )}
          {!survived && onViewGlobalRanking && (
            <button type="button" className="secondary-home-button" onClick={onViewGlobalRanking}>
              Ver ranking global
            </button>
          )}
          <button type="button" className={survived ? "secondary-home-button" : "secondary-home-button"} onClick={onViewFullSummary}>
            Ver resumen completo
          </button>
        </div>
      </section>
    </main>
  );
}

export default CareerSeasonOutcome;
