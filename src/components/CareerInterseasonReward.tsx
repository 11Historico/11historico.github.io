import type { Formation, SelectedCoach, SelectedPlayer } from "../types/game";
import type { CareerObjectiveResult, CareerPromotionTransition, CareerSeasonResult, CareerSupercopaQualification, CareerTrophyCounts } from "../types/career";
import { calculatePalmaresScore, canUnlockCareerFormationChange, getCareerFormationChangeUnlockReason } from "../career/careerRules";
import { getEuropeanTrophyBreakdown } from "../career/careerRanking";
import type { EuropeanPrestigeReward } from "../career/europeanPrestige";

import "./CareerInterseasonReward.css";

interface CareerInterseasonRewardProps {
  completedSeasons: number;
  nextSeasonLabel: string;
  formation: Formation;
  selectedPlayers: SelectedPlayer[];
  selectedCoach?: SelectedCoach;
  seasonResult: CareerSeasonResult;
  objectiveResult: CareerObjectiveResult;
  trophyCounts: CareerTrophyCounts;
  promotionTransition?: CareerPromotionTransition;
  pendingSupercopa?: CareerSupercopaQualification;
  europeanPrestigeReward?: EuropeanPrestigeReward;
  onChoosePlayerChange: () => void;
  onChooseCoachChange: () => void;
  onChooseFormationChange: () => void;
  onRestart: () => void;
}

function getQualificationLabel(result: CareerSeasonResult): string {
  if (result.europeanQualification === "champions") return "Champions League";
  if (result.europeanQualification === "europa_league") return "Europa League";
  if (result.europeanQualification === "conference") return "Conference League";
  return "Sin Europa";
}

interface CareerRewardProfile {
  title: string;
  label: string;
  description: string;
  playerActionLabel: string;
  coachActionLabel: string;
  extraNote: string;
  formationActionLabel?: string;
}

function getCareerRewardProfile(
  seasonResult: CareerSeasonResult,
  objectiveResult: CareerObjectiveResult,
): CareerRewardProfile {
  if (seasonResult.wonLeague) {
    return {
      title: "Premio mayor: campeón de Liga",
      label: "Recompensa superior",
      description:
        "Has ganado la Liga. Puedes elegir entre cambiar jugador + ajustar alineación, o renovar entrenador con +0.5 de media para la próxima temporada.",
      playerActionLabel: "Jugador + alineación",
      coachActionLabel: "Entrenador +0.5 media",
      formationActionLabel: "Jugador + alineación",
      extraNote: "Premio táctico desbloqueado por ganar competición grande.",
    };
  }

  if (seasonResult.wonCopa) {
    return {
      title: "Premio copero: campeón de Copa",
      label: "Recompensa especial",
      description:
        "Has ganado la Copa del Rey. Puedes elegir entre cambiar jugador + ajustar alineación, o renovar entrenador con +0.5 de media para la próxima temporada.",
      playerActionLabel: "Jugador + alineación",
      coachActionLabel: "Entrenador +0.5 media",
      formationActionLabel: "Jugador + alineación",
      extraNote: "La Copa suma palmarés, mantiene viva la carrera y desbloquea premio táctico.",
    };
  }

  if (seasonResult.wonSupercopa) {
    return {
      title: "Premio estándar + Supercopa",
      label: "Palmarés añadido",
      description:
        objectiveResult.qualifiedForEurope
          ? "Has cumplido el objetivo europeo y además has ganado la Supercopa. Puedes elegir jugador + alineación, o entrenador +0.5 de media."
          : "Has ganado la Supercopa, pero sin objetivo europeo la Supercopa no salva la temporada ni aumenta recompensa.",
      playerActionLabel: objectiveResult.qualifiedForEurope ? "Jugador + alineación" : "Cambiar 1 jugador",
      coachActionLabel: objectiveResult.qualifiedForEurope ? "Entrenador +0.5 media" : "Cambiar entrenador",
      formationActionLabel: objectiveResult.qualifiedForEurope ? "Jugador + alineación" : undefined,
      extraNote: objectiveResult.qualifiedForEurope
        ? "Supercopa + Europa desbloquea premio táctico."
        : "La Supercopa no salva la temporada: el objetivo sigue siendo Europa o Copa.",
    };
  }

  if (objectiveResult.qualifiedForEurope) {
    return {
      title: "Recompensa estándar: objetivo europeo",
      label: "Recompensa normal",
      description:
        "Has cumplido el objetivo por clasificación europea. Puedes hacer una mejora prudente antes de la siguiente temporada.",
      playerActionLabel: "Cambiar 1 jugador",
      coachActionLabel: "Cambiar entrenador",
      extraNote: "Europa mantiene viva la carrera, pero no desbloquea premio extra en esta versión.",
    };
  }

  return {
    title: "Recompensa estándar",
    label: "Continuidad",
    description:
      "La carrera continúa por objetivo cumplido. Puedes ajustar una pieza antes de seguir.",
    playerActionLabel: "Cambiar 1 jugador",
    coachActionLabel: "Cambiar entrenador",
    extraNote: "Mejora controlada para evitar que el modo carrera se rompa demasiado pronto.",
  };
}

export function CareerInterseasonReward({
  completedSeasons,
  nextSeasonLabel,
  formation,
  selectedPlayers,
  selectedCoach,
  seasonResult,
  objectiveResult,
  trophyCounts,
  promotionTransition,
  pendingSupercopa,
  europeanPrestigeReward,
  onChoosePlayerChange,
  onChooseCoachChange,
  onChooseFormationChange,
  onRestart,
}: CareerInterseasonRewardProps) {
  const palmaresScore = calculatePalmaresScore(trophyCounts);
  const rewardProfile = getCareerRewardProfile(seasonResult, objectiveResult);
  const canChangeFormation = canUnlockCareerFormationChange(seasonResult, objectiveResult);
  const formationUnlockReason = getCareerFormationChangeUnlockReason(seasonResult, objectiveResult);

  return (
    <main className="career-reward-screen">
      <section className="career-reward-card">
        <p className="eyebrow">Modo carrera Athletic · entre temporadas</p>
        <h1>Temporada superada. Toca decidir.</h1>
        <p className="career-reward-lead">
          {objectiveResult.reason} Preparas la temporada {nextSeasonLabel} con una mejora controlada.
        </p>

        <section className="career-reward-profile" aria-label="Tipo de recompensa obtenida">
          <div>
            <span>{rewardProfile.label}</span>
            <strong>{rewardProfile.title}</strong>
            <small>{rewardProfile.description}</small>
          </div>
          <p>{rewardProfile.extraNote}</p>
        </section>

        <div className="career-reward-grid">
          <article>
            <span>Temporadas superadas</span>
            <strong>{completedSeasons}</strong>
            <small>Siguiente: {nextSeasonLabel}</small>
          </article>
          <article>
            <span>Última Liga</span>
            <strong>{seasonResult.leaguePosition}.º</strong>
            <small>{getQualificationLabel(seasonResult)}</small>
          </article>
          <article>
            <span>Copa del Rey</span>
            <strong>{seasonResult.wonCopa ? "Campeón" : "Sin título"}</strong>
            <small>{seasonResult.wonCopa ? "+5 palmarés" : "Sin premio extra automático"}</small>
          </article>
          <article>
            <span>Palmarés</span>
            <strong>{palmaresScore} pts</strong>
            <small>Ligas {trophyCounts.liga} · Copas {trophyCounts.copa} · Supercopas {trophyCounts.supercopa} · Europa {getEuropeanTrophyBreakdown(trophyCounts).total}</small>
          </article>
        </div>

        {promotionTransition && (
          <section className="career-promotion-panel" aria-label="Ascensos y descensos de la temporada">
            <div>
              <span>Descienden a Segunda</span>
              <strong>{promotionTransition.relegated.length > 0 ? promotionTransition.relegated.map((team) => team.name).join(" · ") : "Sin datos"}</strong>
            </div>
            <div>
              <span>Ascienden a Primera</span>
              <strong>{promotionTransition.promoted.length > 0 ? promotionTransition.promoted.map((team) => team.name).join(" · ") : "Sin datos"}</strong>
            </div>
            <small>Los descendidos pasan a la bolsa de Segunda y podrán volver a subir en temporadas futuras.</small>
          </section>
        )}



        {pendingSupercopa?.userQualified && (
          <section className="career-supercopa-panel" aria-label="Clasificación para Supercopa">
            <div>
              <span>Supercopa de España</span>
              <strong>Clasificado para {pendingSupercopa.seasonLabel}</strong>
              <small>La jugarás antes de la próxima Liga. No salva la temporada, pero suma palmarés si la ganas.</small>
            </div>
            <div>
              <span>Participantes</span>
              <strong>{pendingSupercopa.participants.map((team) => team.teamName).join(" · ")}</strong>
              <small>1.º y 2.º de Liga + finalistas de Copa; duplicados se rellenan por Liga.</small>
            </div>
          </section>
        )}

        {europeanPrestigeReward && (
          <section className="career-european-prestige-panel" aria-label="Prestigio europeo">
            <div>
              <span>Prestigio europeo · {europeanPrestigeReward.competitionLabel}</span>
              <strong>
                {europeanPrestigeReward.ratingBonus > 0
                  ? `+${europeanPrestigeReward.ratingBonus.toFixed(2).replace(/\.?0+$/, "")} de forma para ${nextSeasonLabel}`
                  : "Sin bonus de forma"}
              </strong>
              <small>{europeanPrestigeReward.narrative}</small>
            </div>
          </section>
        )}

        {canChangeFormation && (
          <div className="career-reward-bonus">
            <strong>Cambio de formación desbloqueado</strong>
            <span>{formationUnlockReason} Primero eliges qué jugador sale y luego se muestran las alineaciones compatibles con el once restante.</span>
          </div>
        )}

        <div className="career-reward-current-team">
          <article>
            <span>Formación actual</span>
            <strong>{formation.name}</strong>
          </article>
          <article>
            <span>Once</span>
            <strong>{selectedPlayers.length}/11</strong>
          </article>
          <article>
            <span>Entrenador</span>
            <strong>{selectedCoach?.coachSeason.name ?? "Sin entrenador"}</strong>
          </article>
        </div>

        <div className="career-reward-actions">
          <button type="button" className="primary-home-button" onClick={canChangeFormation ? onChooseFormationChange : onChoosePlayerChange}>
            {rewardProfile.playerActionLabel}
          </button>
          <button type="button" className="secondary-home-button" onClick={onChooseCoachChange}>
            {rewardProfile.coachActionLabel}
          </button>
          <button type="button" className="secondary-home-button" onClick={onRestart}>
            Salir
          </button>
        </div>
      </section>
    </main>
  );
}

export default CareerInterseasonReward;
