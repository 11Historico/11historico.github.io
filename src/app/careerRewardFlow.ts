// src/app/careerRewardFlow.ts
//
// Transiciones puras del flujo de recompensas de la carrera: ruleta de temporada y cambio de
// jugador o entrenador. Cada función devuelve solo los campos del estado que cambian; App los
// aplica con applyCareerRewardFlowPatch. Así cada regla se prueba sin React ni navegador.

import type { SeasonLuckWheelOffer } from "../career/seasonLuckWheel";
import type { UserLeagueSimulationContext } from "../simulation/leagueSimulator";
import type { CareerObjectiveResult, CareerPromotionTransition, CareerRewardFlow, CareerSeasonResult } from "../types/career";
import type { FinalGameSummary, Formation, GamePhase, SeasonId, SelectedCoach, SelectedPlayer, TeamRating } from "../types/game";
import type { AppScreen } from "./appScreen";

export interface CareerRewardFlowState {
  screen: AppScreen;
  phase: GamePhase;
  leagueContext: UserLeagueSimulationContext | undefined;
  careerRewardFlow: CareerRewardFlow | undefined;
  coachBeforeReward: SelectedCoach | undefined;
  selectedCoach: SelectedCoach | undefined;
  teamRating: TeamRating | undefined;
  finalSummary: FinalGameSummary | undefined;
  careerSeasonResult: CareerSeasonResult | undefined;
  careerObjectiveResult: CareerObjectiveResult | undefined;
  careerPromotionTransition: CareerPromotionTransition | undefined;
  pendingSeasonLuckWheelOffer: SeasonLuckWheelOffer | undefined;
  replacementDraftSeason: SeasonId | undefined;
  replacementRemovedPlayer: SelectedPlayer | undefined;
  replacementOriginalFormation: Formation | undefined;
  teamValidationErrors: string[];
}

export type CareerRewardFlowPatch = Partial<CareerRewardFlowState>;

/** La ruleta de temporada cambia un jugador: se reemplaza la plantilla de la temporada revisada. */
export function startLuckWheelPlayerChange(nextContext: UserLeagueSimulationContext): CareerRewardFlowPatch {
  return {
    leagueContext: nextContext,
    careerRewardFlow: "luck_wheel_player",
    teamRating: undefined,
    finalSummary: undefined,
    careerSeasonResult: undefined,
    careerObjectiveResult: undefined,
    replacementDraftSeason: undefined,
    replacementRemovedPlayer: undefined,
    replacementOriginalFormation: undefined,
    teamValidationErrors: [],
    phase: "player_selection",
    screen: "career_player_replacement_pick",
  };
}

/** La ruleta de temporada cambia el entrenador: el anterior se guarda por si el cambio se cancela. */
export function startLuckWheelCoachChange(nextContext: UserLeagueSimulationContext, selectedCoach: SelectedCoach): CareerRewardFlowPatch {
  return {
    leagueContext: nextContext,
    careerRewardFlow: "luck_wheel_coach",
    coachBeforeReward: selectedCoach,
    selectedCoach: undefined,
    teamRating: undefined,
    finalSummary: undefined,
    careerSeasonResult: undefined,
    careerObjectiveResult: undefined,
    replacementDraftSeason: undefined,
    replacementRemovedPlayer: undefined,
    replacementOriginalFormation: undefined,
    teamValidationErrors: [],
    phase: "coach_selection",
    screen: "coach_selection",
  };
}

/** Cancelar el cambio de entrenador de la ruleta: vuelve a la liga con el entrenador anterior. */
export function cancelLuckWheelCoachChange(coachBeforeReward: SelectedCoach): CareerRewardFlowPatch {
  return {
    selectedCoach: coachBeforeReward,
    coachBeforeReward: undefined,
    careerRewardFlow: undefined,
    teamValidationErrors: [],
    phase: "league_simulation",
    screen: "league_simulation",
  };
}

/** Cambio de entrenador elegido desde la pantalla entre temporadas. */
export function startCareerCoachChange(params: {
  selectedCoach: SelectedCoach | undefined;
  specialCoachBonus: boolean;
}): CareerRewardFlowPatch {
  return {
    coachBeforeReward: params.selectedCoach,
    careerRewardFlow: params.specialCoachBonus ? "coach_bonus" : "standard_coach",
    selectedCoach: undefined,
    teamRating: undefined,
    leagueContext: undefined,
    pendingSeasonLuckWheelOffer: undefined,
    finalSummary: undefined,
    careerSeasonResult: undefined,
    careerObjectiveResult: undefined,
    careerPromotionTransition: undefined,
    replacementDraftSeason: undefined,
    replacementRemovedPlayer: undefined,
    replacementOriginalFormation: undefined,
    phase: "coach_selection",
    screen: "coach_selection",
  };
}

/** Bonus especial de entrenador: ganar Liga o Copa, o la Supercopa con plaza europea por Liga. */
export function hasSpecialCoachBonus(
  result: CareerSeasonResult | undefined,
  objective: CareerObjectiveResult | undefined,
): boolean {
  return Boolean(
    result &&
    objective &&
    (result.wonLeague || result.wonCopa || (result.wonSupercopa && objective.qualifiedForEurope)),
  );
}
