// src/storage/localGameStorage.ts

import type {
  FinalGameSummary,
  Formation,
  EasyModeSeasonRangeId,
  GameDifficulty,
  GamePhase,
  SelectedCoach,
  SelectedPlayer,
  SeasonId,
  TeamRating,
  RivalTeam,
} from "../types/game";

import type { CareerLocalRankingEntry, CareerObjectiveResult, CareerPromotionTransition, CareerRewardFlow, CareerRewardSnapshot, CareerSeasonResult, CareerSupercopaQualification, CareerSupercopaResult, CareerTrophyCounts } from "../types/career";
import type { UserLeagueSimulationContext } from "../simulation/leagueSimulator";
import type { EuropeanCareerState } from "../europe/europeanTypes";
import type { SeasonLuckWheelOffer } from "../career/seasonLuckWheel";
import type { EuropeanPrestigeReward } from "../career/europeanPrestige";

const STORAGE_KEY = "once_historico_zurigorri_saved_game_v1";

export interface SavedGameState {
  gameId: string;
  phase: GamePhase;
  difficulty: GameDifficulty;
  easyModeSeasonRangeId?: EasyModeSeasonRangeId;

  selectedFormation?: Formation;
  playerRoundSeasons: SeasonId[];
  currentRoundIndex: number;

  selectedPlayers: SelectedPlayer[];
  selectedCoach?: SelectedCoach;
  teamRating?: TeamRating;

  leagueContext?: UserLeagueSimulationContext;
  // Oferta de ruleta de temporada pendiente de resolver. Sin persistirla,
  // recargar la página con el modal abierto (o justo tras cruzar el
  // disparador de mitad de temporada) pierde la ruleta el resto de la
  // temporada, porque el disparador es un evento puntual que no se repite.
  pendingSeasonLuckWheelOffer?: SeasonLuckWheelOffer;
  finalSummary?: FinalGameSummary;
  isCareerMode?: boolean;
  careerSeasonResult?: CareerSeasonResult;
  careerObjectiveResult?: CareerObjectiveResult;
  careerCompletedSeasons?: number;
  careerBestLeaguePosition?: number;
  careerSeasonLabel?: string;
  careerTrophyCounts?: CareerTrophyCounts;
  careerLeagueRivals?: RivalTeam[];
  careerSecondDivisionPool?: RivalTeam[];
  careerPromotionTransition?: CareerPromotionTransition;
  careerPendingSupercopa?: CareerSupercopaQualification;
  careerCurrentSupercopaResult?: CareerSupercopaResult;
  careerRewardFlow?: CareerRewardFlow;
  careerSeasonRatingBonus?: number;
  careerRewardSnapshot?: CareerRewardSnapshot;
  // Flujo de recompensas en curso (v0.25.39): para retomar el cambio de entrenador o de jugador tras recargar.
  coachBeforeReward?: SelectedCoach;
  replacementDraftSeason?: SeasonId;
  replacementRemovedPlayer?: SelectedPlayer;
  replacementOriginalFormation?: Formation;
  careerCurrentRankingEntry?: CareerLocalRankingEntry;
  europeanCareer?: EuropeanCareerState;
  // Recompensa de prestigio europeo (v0.24.4a) recién otorgada en la última
  // transición de temporada, mostrada una única vez en la pantalla de
  // recompensa entre temporadas. Sin persistirla, recargar la página en esa
  // pantalla perdería el texto narrativo (el bonus de rating en sí ya vive
  // en careerSeasonRatingBonus y no depende de esto).
  careerEuropeanPrestigeReward?: EuropeanPrestigeReward;

  savedAt: string;
}

export function saveGameState(state: Omit<SavedGameState, "savedAt">): void {
  try {
    const payload: SavedGameState = {
      ...state,
      savedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("No se pudo guardar la partida localmente.", error);
  }
}

export function loadGameState(): SavedGameState | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as Partial<SavedGameState>;

    return {
      ...parsed,
      gameId: parsed.gameId ?? "",
      phase: parsed.phase ?? "formation_selection",
      difficulty: parsed.difficulty ?? "dificil",
      easyModeSeasonRangeId: parsed.easyModeSeasonRangeId ?? "all",
      playerRoundSeasons: parsed.playerRoundSeasons ?? [],
      currentRoundIndex: parsed.currentRoundIndex ?? 0,
      selectedPlayers: parsed.selectedPlayers ?? [],
      isCareerMode: parsed.isCareerMode ?? false,
      careerCompletedSeasons: parsed.careerCompletedSeasons ?? 0,
      careerBestLeaguePosition: parsed.careerBestLeaguePosition,
      savedAt: parsed.savedAt ?? new Date().toISOString(),
    } as SavedGameState;
  } catch (error) {
    console.warn("No se pudo cargar la partida local.", error);
    return undefined;
  }
}

export function clearSavedGameState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("No se pudo borrar la partida local.", error);
  }
}

export function hasSavedGameState(): boolean {
  try {
    return Boolean(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}
