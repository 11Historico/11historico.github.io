// src/App.tsx

import { useEffect, useMemo, useState } from "react";

import type {
  EasyModeSeasonRangeId,
  FinalGameSummary,
  Formation,
  FormationSlot,
  GameDifficulty,
  GamePhase,
  SelectedCoach,
  SelectedPlayer,
  SeasonId,
  TeamRating,
  RivalTeam,
} from "./types/game";

import type { UserLeagueSimulationContext } from "./simulation/leagueSimulator";
import type { SeasonLuckWheelOffer } from "./career/seasonLuckWheel";
import { calculateTeamRating } from "./simulation/teamRating";
import { applyCareerRatingBonus } from "./career/teamPower";
import {
  createNextCareerLeagueTransition,
  getInitialCareerLeagueRivals,
  getInitialCareerSecondDivisionPool,
} from "./simulation/leagueSimulator";
import type { CareerLocalRankingEntry, CareerObjectiveResult, CareerPromotionTransition, CareerRewardFlow, CareerRewardSnapshot, CareerSeasonResult, CareerSupercopaQualification, CareerSupercopaResult, CareerTrophyCounts } from "./types/career";
import type { EuropeanCareerState, EuropeanQualificationResult, EuropeanSeasonEntry, EuropeanTournamentState } from "./europe/europeanTypes";
import { resolveEuropeanQualification } from "./europe/europeanQualification";
import {
  appendEuropeanQualification,
  createEmptyEuropeanCareerState,
  getLatestEuropeanQualification,
  normalizeEuropeanCareerState,
  setEuropeanCurrentTournament,
} from "./europe/europeanCareerState";
import { createEuropeanTournamentForQualification } from "./europe/europeanTournament";
import { awardEuropeanTrophyToCareer } from "./career/europeanTrophies";
import { awardEuropeanPrestigeToCareer } from "./career/europeanPrestige";
import { shouldResumeInterseasonReward } from "./career/resumeScreen";
import type { EuropeanPrestigeReward } from "./career/europeanPrestige";

import { getPlayerIdentityKey, resolvePlayerSlotPlacement } from "./domain/positionRules";

import { getAvailableAthleticSeasons } from "./data/athleticSeasons";
import {
  DEFAULT_EASY_MODE_SEASON_RANGE_ID,
  getAthleticSeasonsForEasyModeRange,
} from "./data/easyModeSeasonRanges";

import GameHome from "./components/GameHome";
import PhaseProgress from "./components/PhaseProgress";
import FormationSelector from "./components/FormationSelector";
import SeasonReveal from "./components/SeasonReveal";
import PlayerRound from "./components/PlayerRound";
import CoachRound from "./components/CoachRound";
import TeamSummary from "./components/TeamSummary";
import LeagueSimulatorView from "./components/LeagueSimulatorView";
import FinalSummary from "./components/FinalSummary";
import CareerSeasonOutcome from "./components/CareerSeasonOutcome";
import CareerInterseasonReward from "./components/CareerInterseasonReward";
import CareerPlayerReplacementPicker from "./components/CareerPlayerReplacementPicker";
import CareerSupercopa from "./components/CareerSupercopa";
import CareerFormationChangePicker from "./components/CareerFormationChangePicker";
import CareerLocalRanking from "./components/CareerLocalRanking";
import CareerGlobalRanking from "./components/CareerGlobalRanking";

import {
  clearSavedGameState,
  hasSavedGameState,
  loadGameState,
  saveGameState,
} from "./storage/localGameStorage";

import {
  clearCareerLocalRanking,
  loadCareerLocalRanking,
  saveCareerLocalRankingEntry,
} from "./storage/careerLocalRankingStorage";

import {
  buildCareerLocalRankingEntry,
  getBestCareerLeaguePosition,
  getFinalCareerTrophyCounts,
  sortCareerLocalRanking,
} from "./career/careerRanking";

import {
  CAREER_INITIAL_SEASON_LABEL,
  CAREER_RELEGATION_POSITION,
  evaluateCareerObjective,
  getEuropeanQualification,
} from "./career/careerRules";

import {
  createCareerSupercopaQualification,
  simulateCareerSupercopa,
} from "./career/supercopaRules";

import "./App.css";

const TOTAL_PLAYER_ROUNDS = 11;


function createEmptyCareerTrophyCounts(): CareerTrophyCounts {
  return {
    champions: 0,
    liga: 0,
    europaLeague: 0,
    copa: 0,
    conference: 0,
    supercopa: 0,
  };
}

function getCareerSeasonLabelFromIndex(index: number): string {
  const startYear = 2025 + Math.max(0, index);
  const endYear = String((startYear + 1) % 100).padStart(2, "0");

  return `${startYear}/${endYear}`;
}

function cloneSnapshotValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneOptionalSnapshotValue<T>(value: T | undefined): T | undefined {
  return value === undefined ? undefined : cloneSnapshotValue(value);
}

function calculateMediaXi(selectedPlayers: SelectedPlayer[]): number {
  if (selectedPlayers.length === 0) return 0;

  const total = selectedPlayers.reduce((sum, selected) => sum + selected.playerSeason.overall, 0);
  return Math.round((total / selectedPlayers.length) * 10) / 10;
}

function buildCareerRewardSnapshot(params: {
  selectedFormation?: Formation;
  selectedPlayers: SelectedPlayer[];
  selectedCoach?: SelectedCoach;
  teamRating?: TeamRating;
  careerSeasonRatingBonus: number;
  careerSeasonLabel: string;
  careerCompletedSeasons: number;
  careerTrophyCounts: CareerTrophyCounts;
  careerLeagueRivals: RivalTeam[];
  careerSecondDivisionPool: RivalTeam[];
  careerPromotionTransition?: CareerPromotionTransition;
  careerPendingSupercopa?: CareerSupercopaQualification;
  careerCurrentSupercopaResult?: CareerSupercopaResult;
  playerRoundSeasons: SeasonId[];
  currentRoundIndex: number;
}): CareerRewardSnapshot {
  return {
    selectedFormation: cloneOptionalSnapshotValue(params.selectedFormation),
    selectedPlayers: cloneSnapshotValue(params.selectedPlayers),
    selectedCoach: cloneOptionalSnapshotValue(params.selectedCoach),
    teamRating: cloneOptionalSnapshotValue(params.teamRating),
    mediaXi: calculateMediaXi(params.selectedPlayers),
    careerSeasonRatingBonus: params.careerSeasonRatingBonus,
    careerSeasonLabel: params.careerSeasonLabel,
    careerCompletedSeasons: params.careerCompletedSeasons,
    careerTrophyCounts: cloneSnapshotValue(params.careerTrophyCounts),
    careerLeagueRivals: cloneSnapshotValue(params.careerLeagueRivals),
    careerSecondDivisionPool: cloneSnapshotValue(params.careerSecondDivisionPool),
    careerPromotionTransition: cloneOptionalSnapshotValue(params.careerPromotionTransition),
    careerPendingSupercopa: cloneOptionalSnapshotValue(params.careerPendingSupercopa),
    careerCurrentSupercopaResult: cloneOptionalSnapshotValue(params.careerCurrentSupercopaResult),
    playerRoundSeasons: cloneSnapshotValue(params.playerRoundSeasons),
    currentRoundIndex: params.currentRoundIndex,
    savedAt: new Date().toISOString(),
  };
}

function getSingleOpenSlotLine(params: {
  formation?: Formation;
  selectedPlayers: SelectedPlayer[];
}): FormationSlot["line"] | undefined {
  const { formation, selectedPlayers } = params;
  if (!formation) return undefined;

  const occupiedSlotIds = new Set(selectedPlayers.map((player) => player.slotId));
  const openSlots = formation.slots.filter((slot) => !occupiedSlotIds.has(slot.id));

  return openSlots.length === 1 ? openSlots[0].line : undefined;
}

type AppScreen =
  | "home"
  | "career_preview"
  | "career_season_result"
  | "career_game_over"
  | "career_local_ranking"
  | "career_global_ranking"
  | "career_interseason_reward"
  | "career_supercopa"
  | "career_player_replacement_pick"
  | "career_player_replacement_draft"
  | "career_formation_change"
  | "season_reveal"
  | GamePhase;

function getSeasonYearNumber(season: SeasonId): number {
  const [startYear] = season.split("/");
  const parsed = Number(startYear);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getSeasonDecadeBucket(season: SeasonId): number {
  const year = getSeasonYearNumber(season);

  return Math.floor(year / 10) * 10;
}

function pickRandomSeason(
  seasons: SeasonId[],
  excludedSeasons: Set<SeasonId> = new Set(),
  previousSeason?: SeasonId
): SeasonId {
  if (seasons.length === 0) {
    throw new Error("No hay temporadas disponibles en athleticSeasons.ts");
  }

  const eligibleSeasons = seasons.filter((season) => !excludedSeasons.has(season));
  const uniquePool = eligibleSeasons.length > 0 ? eligibleSeasons : seasons;

  const previousDecade = previousSeason ? getSeasonDecadeBucket(previousSeason) : undefined;
  const variedPool = previousDecade === undefined
    ? uniquePool
    : uniquePool.filter((season) => getSeasonDecadeBucket(season) !== previousDecade);

  const pool = variedPool.length > 0 ? variedPool : uniquePool;
  const index = Math.floor(Math.random() * pool.length);

  return pool[index];
}

function createRandomPlayerRoundSeasons(totalRounds: number, seasons: SeasonId[] = getAvailableAthleticSeasons()): SeasonId[] {
  const usedSeasons = new Set<SeasonId>();
  const selectedSeasons: SeasonId[] = [];

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const previousSeason = selectedSeasons[selectedSeasons.length - 1];
    const nextSeason = pickRandomSeason(seasons, usedSeasons, previousSeason);
    selectedSeasons.push(nextSeason);
    usedSeasons.add(nextSeason);
  }

  return selectedSeasons;
}

function getDraftSeasonPool(params: {
  difficulty: GameDifficulty;
  easyModeSeasonRangeId: EasyModeSeasonRangeId;
}): SeasonId[] {
  return params.difficulty === "normal"
    ? getAthleticSeasonsForEasyModeRange(params.easyModeSeasonRangeId)
    : getAvailableAthleticSeasons();
}

function createGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}


function buildCareerSeasonResult(
  summary: FinalGameSummary,
  seasonLabel = CAREER_INITIAL_SEASON_LABEL,
  wonSupercopa = false,
): CareerSeasonResult {
  const wonCopa = Boolean(summary.cupTrophyWon);

  return {
    seasonLabel,
    leaguePosition: summary.leaguePosition,
    wonLeague: summary.leaguePosition === 1,
    wonCopa,
    wonSupercopa,
    isRelegated: summary.leaguePosition >= CAREER_RELEGATION_POSITION,
    europeanQualification: getEuropeanQualification(summary.leaguePosition, wonCopa),
  };
}


interface TeamValidationResult {
  valid: boolean;
  errors: string[];
}


function validateSelectedTeam(params: {
  formation?: Formation;
  selectedPlayers: SelectedPlayer[];
  expectedPlayerCount?: number;
}): TeamValidationResult {
  const { formation, selectedPlayers, expectedPlayerCount = TOTAL_PLAYER_ROUNDS } = params;
  const errors: string[] = [];

  if (!formation) {
    errors.push("No hay formación seleccionada.");
    return { valid: false, errors };
  }

  if (selectedPlayers.length !== expectedPlayerCount) {
    errors.push(`El once debe tener ${expectedPlayerCount}/${TOTAL_PLAYER_ROUNDS} jugadores para este paso y tiene ${selectedPlayers.length}.`);
  }

  if (selectedPlayers.length > TOTAL_PLAYER_ROUNDS) {
    errors.push(`El once tiene demasiados jugadores: ${selectedPlayers.length}/${TOTAL_PLAYER_ROUNDS}.`);
  }

  const seenNames = new Map<string, string>();
  const seenSlots = new Map<string, string>();

  for (const selected of selectedPlayers) {
    const normalizedName = getPlayerIdentityKey(selected.playerSeason);
    const previousName = seenNames.get(normalizedName);

    if (previousName) {
      errors.push(`Jugador repetido: ${selected.playerSeason.name}.`);
    } else {
      seenNames.set(normalizedName, selected.playerSeason.name);
    }

    const previousSlot = seenSlots.get(selected.slotId);

    if (previousSlot) {
      errors.push(
        `Puesto ocupado dos veces: ${selected.slotId} (${previousSlot} y ${selected.playerSeason.name}).`
      );
    } else {
      seenSlots.set(selected.slotId, selected.playerSeason.name);
    }

    const slot = formation.slots.find((item) => item.id === selected.slotId);

    if (!slot) {
      errors.push(`Puesto no encontrado en la formación: ${selected.slotId}.`);
      continue;
    }

    const placement = resolvePlayerSlotPlacement(selected.playerSeason, slot);

    if (!placement.canPlace) {
      errors.push(
        placement.reason ?? `${selected.playerSeason.name} no puede ocupar ${slot.label}.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function sanitizeSelectedPlayers(params: {
  formation?: Formation;
  selectedPlayers: SelectedPlayer[];
}): SelectedPlayer[] {
  const { formation, selectedPlayers } = params;

  if (!formation) return [];

  const usedNames = new Set<string>();
  const usedSlots = new Set<string>();
  const cleaned: SelectedPlayer[] = [];

  for (const selected of selectedPlayers) {
    const normalizedName = getPlayerIdentityKey(selected.playerSeason);
    const slot = formation.slots.find((item) => item.id === selected.slotId);

    if (!slot) continue;
    if (usedNames.has(normalizedName)) continue;
    if (usedSlots.has(selected.slotId)) continue;
    if (!resolvePlayerSlotPlacement(selected.playerSeason, slot).canPlace) continue;

    usedNames.add(normalizedName);
    usedSlots.add(selected.slotId);
    cleaned.push(selected);
  }

  return cleaned;
}

export default function App() {
  const savedGame = useMemo(() => loadGameState(), []);
  const [screen, setScreen] = useState<AppScreen>("home");
  const [isCareerMode, setIsCareerMode] = useState<boolean>(() => savedGame?.isCareerMode ?? false);
  const [careerSeasonResult, setCareerSeasonResult] = useState<CareerSeasonResult | undefined>(() => savedGame?.careerSeasonResult);
  const [careerObjectiveResult, setCareerObjectiveResult] = useState<CareerObjectiveResult | undefined>(() => savedGame?.careerObjectiveResult);
  const [careerCompletedSeasons, setCareerCompletedSeasons] = useState(() => savedGame?.careerCompletedSeasons ?? 0);
  const [careerBestLeaguePosition, setCareerBestLeaguePosition] = useState<number | undefined>(() => savedGame?.careerBestLeaguePosition);
  const [careerSeasonLabel, setCareerSeasonLabel] = useState(() => savedGame?.careerSeasonLabel ?? CAREER_INITIAL_SEASON_LABEL);
  const [careerTrophyCounts, setCareerTrophyCounts] = useState<CareerTrophyCounts>(() => savedGame?.careerTrophyCounts ?? createEmptyCareerTrophyCounts());
  const [careerLeagueRivals, setCareerLeagueRivals] = useState<RivalTeam[]>(() => savedGame?.careerLeagueRivals ?? getInitialCareerLeagueRivals());
  const [careerSecondDivisionPool, setCareerSecondDivisionPool] = useState<RivalTeam[]>(() => savedGame?.careerSecondDivisionPool ?? getInitialCareerSecondDivisionPool());
  const [careerPromotionTransition, setCareerPromotionTransition] = useState<CareerPromotionTransition | undefined>(() => savedGame?.careerPromotionTransition);
  const [careerPendingSupercopa, setCareerPendingSupercopa] = useState<CareerSupercopaQualification | undefined>(() => savedGame?.careerPendingSupercopa);
  const [careerCurrentSupercopaResult, setCareerCurrentSupercopaResult] = useState<CareerSupercopaResult | undefined>(() => savedGame?.careerCurrentSupercopaResult);
  const [careerRewardFlow, setCareerRewardFlow] = useState<CareerRewardFlow | undefined>(() => savedGame?.careerRewardFlow);
  const [careerSeasonRatingBonus, setCareerSeasonRatingBonus] = useState(() => savedGame?.careerSeasonRatingBonus ?? 0);
  const [careerRewardSnapshot, setCareerRewardSnapshot] = useState<CareerRewardSnapshot | undefined>(() => savedGame?.careerRewardSnapshot);
  const [replacementDraftSeason, setReplacementDraftSeason] = useState<SeasonId | undefined>();
  const [replacementRemovedPlayer, setReplacementRemovedPlayer] = useState<SelectedPlayer | undefined>();
  const [replacementOriginalFormation, setReplacementOriginalFormation] = useState<Formation | undefined>();
  const [coachBeforeReward, setCoachBeforeReward] = useState<SelectedCoach | undefined>();
  const [careerLocalRanking, setCareerLocalRanking] = useState<CareerLocalRankingEntry[]>(() => loadCareerLocalRanking());
  const [careerCurrentRankingEntry, setCareerCurrentRankingEntry] = useState<CareerLocalRankingEntry | undefined>(() => savedGame?.careerCurrentRankingEntry);
  const [europeanCareerState, setEuropeanCareerState] = useState<EuropeanCareerState>(() =>
    normalizeEuropeanCareerState(savedGame?.europeanCareer)
  );
  const [careerEuropeanPrestigeReward, setCareerEuropeanPrestigeReward] = useState<EuropeanPrestigeReward | undefined>(
    () => savedGame?.careerEuropeanPrestigeReward
  );

  const [gameId, setGameId] = useState<string>(() => savedGame?.gameId ?? createGameId());
  const [phase, setPhase] = useState<GamePhase>(() => savedGame?.phase ?? "formation_selection");
  const [difficulty, setDifficulty] = useState<GameDifficulty>(() => savedGame?.difficulty ?? "dificil");
  const [easyModeSeasonRangeId, setEasyModeSeasonRangeId] = useState<EasyModeSeasonRangeId>(
    () => savedGame?.easyModeSeasonRangeId ?? DEFAULT_EASY_MODE_SEASON_RANGE_ID
  );

  const [selectedFormation, setSelectedFormation] = useState<Formation | undefined>(() => savedGame?.selectedFormation);
  const [playerRoundSeasons, setPlayerRoundSeasons] = useState<SeasonId[]>(() => savedGame?.playerRoundSeasons ?? []);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(() => savedGame?.currentRoundIndex ?? 0);
  const [selectedPlayers, setSelectedPlayers] = useState<SelectedPlayer[]>(() => savedGame?.selectedPlayers ?? []);
  const [selectedCoach, setSelectedCoach] = useState<SelectedCoach | undefined>(() => savedGame?.selectedCoach);
  const [teamRating, setTeamRating] = useState<TeamRating | undefined>(() => savedGame?.teamRating);
  const [leagueContext, setLeagueContext] = useState<UserLeagueSimulationContext | undefined>(() => savedGame?.leagueContext);
  const [pendingSeasonLuckWheelOffer, setPendingSeasonLuckWheelOffer] = useState<SeasonLuckWheelOffer | undefined>(
    () => savedGame?.pendingSeasonLuckWheelOffer
  );
  const [finalSummary, setFinalSummary] = useState<FinalGameSummary | undefined>(() => savedGame?.finalSummary);
  const [lastSelection, setLastSelection] = useState<SelectedPlayer | undefined>();
  const [teamValidationErrors, setTeamValidationErrors] = useState<string[]>([]);

  const currentSeason = playerRoundSeasons[currentRoundIndex];
  const currentDraftSeasonPool = useMemo(
    () => getDraftSeasonPool({ difficulty, easyModeSeasonRangeId }),
    [difficulty, easyModeSeasonRangeId]
  );

  const isPlayerSelectionReady = Boolean(
    selectedFormation && currentSeason && phase === "player_selection" && screen === "player_selection"
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    window.requestAnimationFrame(scrollToTop);
  }, [screen]);

  useEffect(() => {
    if (screen === "home" || screen === "career_preview") return;

    saveGameState({
      gameId,
      phase,
      difficulty,
      easyModeSeasonRangeId,
      selectedFormation,
      playerRoundSeasons,
      currentRoundIndex,
      selectedPlayers,
      selectedCoach,
      teamRating,
      leagueContext,
      pendingSeasonLuckWheelOffer,
      finalSummary,
      isCareerMode,
      careerSeasonResult,
      careerObjectiveResult,
      careerCompletedSeasons,
      careerBestLeaguePosition,
      careerSeasonLabel,
      careerTrophyCounts,
      careerLeagueRivals,
      careerSecondDivisionPool,
      careerPromotionTransition,
      careerPendingSupercopa,
      careerCurrentSupercopaResult,
      careerRewardFlow,
      careerSeasonRatingBonus,
      careerRewardSnapshot,
      careerCurrentRankingEntry,
      europeanCareer: europeanCareerState,
      careerEuropeanPrestigeReward,
    });
  }, [
    gameId,
    phase,
    difficulty,
    easyModeSeasonRangeId,
    screen,
    selectedFormation,
    playerRoundSeasons,
    currentRoundIndex,
    selectedPlayers,
    selectedCoach,
    teamRating,
    leagueContext,
    pendingSeasonLuckWheelOffer,
    finalSummary,
    isCareerMode,
    careerSeasonResult,
    careerObjectiveResult,
    careerCompletedSeasons,
    careerBestLeaguePosition,
    careerSeasonLabel,
    careerTrophyCounts,
    careerLeagueRivals,
    careerSecondDivisionPool,
    careerPromotionTransition,
    careerPendingSupercopa,
    careerCurrentSupercopaResult,
    careerRewardFlow,
    careerSeasonRatingBonus,
    careerRewardSnapshot,
    careerCurrentRankingEntry,
    europeanCareerState,
    careerEuropeanPrestigeReward,
  ]);

  const careerEuropeanQualification = useMemo<EuropeanQualificationResult | undefined>(() => {
    if (!careerSeasonResult) return undefined;

    return resolveEuropeanQualification({
      leaguePosition: careerSeasonResult.leaguePosition,
      userWonCopa: careerSeasonResult.wonCopa,
      seasonNumber: careerCompletedSeasons,
    });
  }, [careerSeasonResult, careerCompletedSeasons]);

  function recalculateVisibleTeamRating(params: {
    formation?: Formation;
    selectedPlayers: SelectedPlayer[];
    selectedCoach?: SelectedCoach;
  }) {
    if (!params.formation || !params.selectedCoach || params.selectedPlayers.length !== TOTAL_PLAYER_ROUNDS) {
      setTeamRating(undefined);
      return;
    }

    try {
      setTeamRating(calculateTeamRating({
        formation: params.formation,
        selectedPlayers: params.selectedPlayers,
        selectedCoach: params.selectedCoach,
      }));
    } catch (error) {
      console.warn("No se pudo recalcular la media visible del equipo.", error);
      setTeamRating(undefined);
    }
  }

  function resetGameState() {
    setGameId(createGameId());
    setPhase("formation_selection");
    setSelectedFormation(undefined);
    setPlayerRoundSeasons([]);
    setCurrentRoundIndex(0);
    setSelectedPlayers([]);
    setSelectedCoach(undefined);
    setTeamRating(undefined);
    setLeagueContext(undefined);
    setPendingSeasonLuckWheelOffer(undefined);
    setFinalSummary(undefined);
    setLastSelection(undefined);
    setTeamValidationErrors([]);
    setIsCareerMode(false);
    setCareerSeasonResult(undefined);
    setCareerObjectiveResult(undefined);
    setCareerCompletedSeasons(0);
    setCareerBestLeaguePosition(undefined);
    setCareerSeasonLabel(CAREER_INITIAL_SEASON_LABEL);
    setCareerTrophyCounts(createEmptyCareerTrophyCounts());
    setCareerLeagueRivals(getInitialCareerLeagueRivals());
    setCareerSecondDivisionPool(getInitialCareerSecondDivisionPool());
    setCareerPromotionTransition(undefined);
    setCareerPendingSupercopa(undefined);
    setCareerCurrentSupercopaResult(undefined);
    setCareerRewardFlow(undefined);
    setCareerSeasonRatingBonus(0);
    setCareerRewardSnapshot(undefined);
    setCareerCurrentRankingEntry(undefined);
    setEuropeanCareerState(createEmptyEuropeanCareerState());
    setCareerEuropeanPrestigeReward(undefined);
    setReplacementDraftSeason(undefined);
    setReplacementRemovedPlayer(undefined);
    setReplacementOriginalFormation(undefined);
    setCoachBeforeReward(undefined);
  }

  function handleNewGame() {
    clearSavedGameState();
    resetGameState();
    setScreen("formation_selection");
  }

  function handleOpenCareerPreview() {
    setScreen("career_preview");
  }

  function handleStartCareer() {
    clearSavedGameState();
    resetGameState();
    setIsCareerMode(true);
    setCareerSeasonResult(undefined);
    setCareerObjectiveResult(undefined);
    setCareerCompletedSeasons(0);
    setCareerBestLeaguePosition(undefined);
    setCareerSeasonLabel(CAREER_INITIAL_SEASON_LABEL);
    setCareerTrophyCounts(createEmptyCareerTrophyCounts());
    setCareerLeagueRivals(getInitialCareerLeagueRivals());
    setCareerSecondDivisionPool(getInitialCareerSecondDivisionPool());
    setCareerPromotionTransition(undefined);
    setCareerPendingSupercopa(undefined);
    setCareerCurrentSupercopaResult(undefined);
    setCareerRewardFlow(undefined);
    setCareerSeasonRatingBonus(0);
    setCareerRewardSnapshot(undefined);
    setCareerCurrentRankingEntry(undefined);
    setEuropeanCareerState(createEmptyEuropeanCareerState());
    setReplacementDraftSeason(undefined);
    setReplacementRemovedPlayer(undefined);
    setReplacementOriginalFormation(undefined);
    setCoachBeforeReward(undefined);
    setScreen("formation_selection");
  }


  function handleContinueGame() {
    const loadedGame = loadGameState();
    if (!loadedGame) return;

    setGameId(loadedGame.gameId);
    setPhase(loadedGame.phase);
    setDifficulty(loadedGame.difficulty ?? "dificil");
    setEasyModeSeasonRangeId(loadedGame.easyModeSeasonRangeId ?? DEFAULT_EASY_MODE_SEASON_RANGE_ID);
    setSelectedFormation(loadedGame.selectedFormation);
    setPlayerRoundSeasons(loadedGame.playerRoundSeasons);
    setCurrentRoundIndex(loadedGame.currentRoundIndex);
    const cleanedPlayers = sanitizeSelectedPlayers({
      formation: loadedGame.selectedFormation,
      selectedPlayers: loadedGame.selectedPlayers ?? [],
    });

    setSelectedPlayers(cleanedPlayers);
    setTeamValidationErrors([]);
    setSelectedCoach(loadedGame.selectedCoach);
    setTeamRating(loadedGame.teamRating);
    setLeagueContext(loadedGame.leagueContext);
    setPendingSeasonLuckWheelOffer(loadedGame.pendingSeasonLuckWheelOffer);
    setFinalSummary(loadedGame.finalSummary);
    setIsCareerMode(loadedGame.isCareerMode ?? false);
    setCareerSeasonResult(loadedGame.careerSeasonResult);
    setCareerObjectiveResult(loadedGame.careerObjectiveResult);
    setCareerCompletedSeasons(loadedGame.careerCompletedSeasons ?? 0);
    setCareerBestLeaguePosition(loadedGame.careerBestLeaguePosition);
    setCareerSeasonLabel(loadedGame.careerSeasonLabel ?? CAREER_INITIAL_SEASON_LABEL);
    setCareerTrophyCounts(loadedGame.careerTrophyCounts ?? createEmptyCareerTrophyCounts());
    setCareerLeagueRivals(loadedGame.careerLeagueRivals ?? getInitialCareerLeagueRivals());
    setCareerSecondDivisionPool(loadedGame.careerSecondDivisionPool ?? getInitialCareerSecondDivisionPool());
    setCareerPromotionTransition(loadedGame.careerPromotionTransition);
    setCareerPendingSupercopa(loadedGame.careerPendingSupercopa);
    setCareerCurrentSupercopaResult(loadedGame.careerCurrentSupercopaResult);
    setCareerRewardFlow(loadedGame.careerRewardFlow);
    setCareerSeasonRatingBonus(loadedGame.careerSeasonRatingBonus ?? 0);
    setCareerRewardSnapshot(loadedGame.careerRewardSnapshot);
    setCareerCurrentRankingEntry(loadedGame.careerCurrentRankingEntry);
    setEuropeanCareerState(normalizeEuropeanCareerState(loadedGame.europeanCareer));
    setCareerEuropeanPrestigeReward(loadedGame.careerEuropeanPrestigeReward);
    setReplacementDraftSeason(undefined);
    setReplacementRemovedPlayer(undefined);
    setReplacementOriginalFormation(undefined);
    setCoachBeforeReward(undefined);
    setLastSelection(undefined);
    setScreen(shouldResumeInterseasonReward(loadedGame) ? "career_interseason_reward" : loadedGame.phase);
  }

  function handleSelectFormation(formation: Formation) {
    setSelectedFormation(formation);
    setSelectedPlayers([]);
    setSelectedCoach(undefined);
    setTeamRating(undefined);
    setLeagueContext(undefined);
    setPendingSeasonLuckWheelOffer(undefined);
    setFinalSummary(undefined);
    setLastSelection(undefined);
    setTeamValidationErrors([]);
    setCurrentRoundIndex(0);
    setPlayerRoundSeasons(createRandomPlayerRoundSeasons(TOTAL_PLAYER_ROUNDS, currentDraftSeasonPool));
    setPhase("player_selection");
    setScreen("season_reveal");
  }

  function handleStartDraftAfterReveal() {
    setPhase("player_selection");
    setScreen("player_selection");
  }

  function handleSelectPlayer(selection: SelectedPlayer) {
    if (!selectedFormation) return;

    // Comprobación directa de encaje táctico para el jugador recién elegido,
    // en vez de buscar el error dentro del texto de `validateSelectedTeam`:
    // el filtro anterior buscaba "no puede jugar"/"solo acepta", frases que
    // `resolvePlayerSlotPlacement` ya no produce desde el motor único de
    // posiciones (v0.12.26/v0.12.28) — así que un jugador incompatible con
    // su puesto nunca bloqueaba la selección en el momento, solo al final
    // de la ronda 13/13.
    const selectedSlot = selectedFormation.slots.find((item) => item.id === selection.slotId);
    const selectedPlacement = selectedSlot
      ? resolvePlayerSlotPlacement(selection.playerSeason, selectedSlot)
      : undefined;

    if (!selectedPlacement?.canPlace) {
      setTeamValidationErrors([
        selectedPlacement?.reason ?? `${selection.playerSeason.name} no puede ocupar este puesto.`,
      ]);
      return;
    }

    const nextPlayers = [...selectedPlayers, selection];
    const validation = validateSelectedTeam({
      formation: selectedFormation,
      selectedPlayers: nextPlayers,
    });

    const duplicateOrCriticalErrors = validation.errors.filter(
      (error) =>
        error.includes("Jugador repetido") ||
        error.includes("Puesto ocupado dos veces")
    );

    if (duplicateOrCriticalErrors.length > 0) {
      setTeamValidationErrors(duplicateOrCriticalErrors);
      return;
    }

    setTeamValidationErrors([]);
    setLastSelection(selection);
    setSelectedPlayers(nextPlayers);
    const nextRoundIndex = currentRoundIndex + 1;

    if (nextRoundIndex >= TOTAL_PLAYER_ROUNDS) {
      const finalValidation = validateSelectedTeam({
        formation: selectedFormation,
        selectedPlayers: nextPlayers,
      });

      if (!finalValidation.valid) {
        setTeamValidationErrors(finalValidation.errors);
        return;
      }

      setCurrentRoundIndex(nextRoundIndex);
      setPhase("coach_selection");
      setScreen("coach_selection");
      return;
    }

    setCurrentRoundIndex(nextRoundIndex);
    setPhase("player_selection");
    setScreen("season_reveal");
  }

  function handleSkipRound() {
    setPlayerRoundSeasons((previous) => {
      const usedSeasons = new Set<SeasonId>(
        previous.filter((season, index) => Boolean(season) && index !== currentRoundIndex)
      );
      const previousSeason = currentRoundIndex > 0 ? previous[currentRoundIndex - 1] : undefined;

      const copy = [...previous];
      copy[currentRoundIndex] = pickRandomSeason(currentDraftSeasonPool, usedSeasons, previousSeason);
      return copy;
    });
  }

  function handleSelectCoach(selection: SelectedCoach) {
    const validation = validateSelectedTeam({
      formation: selectedFormation,
      selectedPlayers,
    });

    if (!validation.valid) {
      setTeamValidationErrors(validation.errors);
      setPhase("player_selection");
      setScreen("player_selection");
      return;
    }

    setTeamValidationErrors([]);
    setSelectedCoach(selection);
    recalculateVisibleTeamRating({
      formation: selectedFormation,
      selectedPlayers,
      selectedCoach: selection,
    });

    if (careerRewardFlow === "coach_bonus" || careerRewardFlow === "standard_coach") {
      if (careerRewardFlow === "coach_bonus") {
        setCareerSeasonRatingBonus((previous) => Math.max(previous, 0.5));
      }
      setCareerRewardFlow(undefined);
      setCareerRewardSnapshot(undefined);
      setCoachBeforeReward(undefined);
      setPhase("team_summary");
      setScreen("team_summary");
      return;
    }

    if (careerRewardFlow === "luck_wheel_coach") {
      setCareerRewardFlow(undefined);
      setCoachBeforeReward(undefined);
      setPhase("league_simulation");
      setScreen("league_simulation");
      return;
    }

    setPhase("team_summary");
    setScreen("team_summary");
  }

  function handleStartLeagueSimulation(nextTeamRating: TeamRating) {
    const validation = validateSelectedTeam({
      formation: selectedFormation,
      selectedPlayers,
    });

    if (!validation.valid) {
      setTeamValidationErrors(validation.errors);
      setPhase("player_selection");
      setScreen("player_selection");
      return;
    }

    setTeamValidationErrors([]);
    const ratingWithCareerBonus = isCareerMode
      ? applyCareerRatingBonus(nextTeamRating, careerSeasonRatingBonus)
      : nextTeamRating;
    setTeamRating(ratingWithCareerBonus);
    setCareerSeasonRatingBonus(0);
    setLeagueContext(undefined);
    setPendingSeasonLuckWheelOffer(undefined);

    if (isCareerMode && careerPendingSupercopa?.userQualified) {
      setPhase("team_summary");
      setScreen("career_supercopa");
      return;
    }

    setPhase("league_simulation");
    setScreen("league_simulation");
  }

  function handleSimulateCareerSupercopa() {
    if (!careerPendingSupercopa || !teamRating) return;

    const result = simulateCareerSupercopa({
      qualification: careerPendingSupercopa,
      teamRating,
      selectedPlayers,
      rivals: careerLeagueRivals,
    });

    setCareerCurrentSupercopaResult(result);
  }

  function handleContinueAfterSupercopa() {
    setCareerPendingSupercopa(undefined);
    setLeagueContext(undefined);
    setPendingSeasonLuckWheelOffer(undefined);
    setPhase("league_simulation");
    setScreen("league_simulation");
  }

  function handleFinishLeague(summary: FinalGameSummary) {
    setFinalSummary(summary);
    setPhase("finished");

    if (isCareerMode) {
      const seasonResult = buildCareerSeasonResult(summary, careerSeasonLabel, Boolean(careerCurrentSupercopaResult?.won));
      const objectiveResult = evaluateCareerObjective(seasonResult);
      const nextBestLeaguePosition = getBestCareerLeaguePosition(careerBestLeaguePosition, seasonResult.leaguePosition);

      setCareerSeasonResult(seasonResult);
      setCareerObjectiveResult(objectiveResult);
      setCareerBestLeaguePosition(nextBestLeaguePosition);

      const europeanResult = resolveEuropeanQualification({
        leaguePosition: seasonResult.leaguePosition,
        userWonCopa: seasonResult.wonCopa,
        seasonNumber: careerCompletedSeasons,
      });
      const europeanEntry: EuropeanSeasonEntry = {
        seasonNumber: careerCompletedSeasons,
        qualified: europeanResult.qualified,
        competition: europeanResult.competition,
        source: europeanResult.source,
        explanation: europeanResult.explanation,
        achievedFromLeaguePosition: seasonResult.leaguePosition,
        achievedFromCopa: seasonResult.wonCopa,
      };
      setEuropeanCareerState((current) => appendEuropeanQualification(current, europeanEntry));

      if (objectiveResult.isGameOver) {
        const rankingEntry = buildCareerLocalRankingEntry({
          completedSeasons: careerCompletedSeasons,
          trophyCounts: careerTrophyCounts,
          seasonResult,
          bestLeaguePosition: nextBestLeaguePosition,
          europeanTournament: europeanCareerState.currentTournament,
        });

        setCareerCurrentRankingEntry(rankingEntry);
        setCareerLocalRanking(saveCareerLocalRankingEntry(rankingEntry));
      } else {
        setCareerCurrentRankingEntry(undefined);
      }

      setScreen(objectiveResult.survives ? "career_season_result" : "career_game_over");
      return;
    }

    setScreen("finished");
  }

  function handleContinueCareerAfterSeason() {
    if (!careerSeasonResult || !careerObjectiveResult?.survives || !finalSummary) return;

    const nextCompletedSeasons = careerCompletedSeasons + 1;
    const nextSeasonLabel = getCareerSeasonLabelFromIndex(nextCompletedSeasons);

    // Integra al palmarés un título europeo pendiente (Champions/Europa
    // League/Conference recién ganada) antes de sumar Liga/Copa/Supercopa, y
    // marca el torneo como ya integrado (europeanTrophyAwarded) para que no
    // pueda volver a sumarse si por lo que sea se releyera este mismo torneo.
    const europeanTrophyAward = awardEuropeanTrophyToCareer({
      trophyCounts: careerTrophyCounts,
      tournament: europeanCareerState.currentTournament,
    });
    const nextTrophyCounts = getFinalCareerTrophyCounts(europeanTrophyAward.trophyCounts, careerSeasonResult);

    // Encadena el prestigio europeo (v0.24.4a) sobre el mismo torneo que ya
    // llevó el título al palmarés, para que ambas marcas de "ya otorgado"
    // (europeanTrophyAwarded y europeanPrestigeAwarded) queden en el mismo
    // objeto y no se pierda ninguna al sustituir currentTournament.
    const europeanPrestigeAward = awardEuropeanPrestigeToCareer({
      previousRatingBonus: careerSeasonRatingBonus,
      tournament: europeanTrophyAward.tournament,
    });
    const nextCareerSeasonRatingBonus = europeanPrestigeAward.nextRatingBonus;

    const europeanCareerStateWithAward =
      europeanTrophyAward.awarded || europeanPrestigeAward.awarded
        ? setEuropeanCurrentTournament(europeanCareerState, europeanPrestigeAward.tournament ?? null)
        : europeanCareerState;

    const latestEuropeanQualification = getLatestEuropeanQualification(europeanCareerStateWithAward);
    const alreadyHasTournamentForNextSeason = europeanCareerStateWithAward.currentTournament?.seasonNumber === nextCompletedSeasons;

    let nextEuropeanCareerState = europeanCareerStateWithAward;

    if (latestEuropeanQualification?.qualified && !alreadyHasTournamentForNextSeason) {
      const nextTournament = createEuropeanTournamentForQualification({
        seasonNumber: nextCompletedSeasons,
        qualification: latestEuropeanQualification,
        seed: `${gameId}_${nextCompletedSeasons}`,
      });

      nextEuropeanCareerState = setEuropeanCurrentTournament(nextEuropeanCareerState, nextTournament);
    } else if (!latestEuropeanQualification?.qualified) {
      nextEuropeanCareerState = setEuropeanCurrentTournament(nextEuropeanCareerState, null);
    }
    let nextCareerLeagueRivals = careerLeagueRivals;
    let nextCareerSecondDivisionPool = careerSecondDivisionPool;
    let nextCareerPromotionTransition: CareerPromotionTransition | undefined;

    if (finalSummary.table) {
      const transition = createNextCareerLeagueTransition({
        previousTable: finalSummary.table,
        currentRivals: careerLeagueRivals,
        secondDivisionPool: careerSecondDivisionPool,
        completedSeasons: nextCompletedSeasons,
      });

      nextCareerLeagueRivals = transition.nextRivals;
      nextCareerSecondDivisionPool = transition.nextSecondDivisionPool;
      nextCareerPromotionTransition = {
        relegated: transition.relegated,
        promoted: transition.promoted,
        secondDivisionPool: transition.nextSecondDivisionPool,
      };
    }

    const supercopaQualification = createCareerSupercopaQualification({
      seasonLabel: nextSeasonLabel,
      previousSummary: finalSummary,
    });
    const nextCareerPendingSupercopa = supercopaQualification.userQualified ? supercopaQualification : undefined;

    const rewardSnapshot = buildCareerRewardSnapshot({
      selectedFormation,
      selectedPlayers,
      selectedCoach,
      teamRating,
      careerSeasonRatingBonus: nextCareerSeasonRatingBonus,
      careerSeasonLabel: nextSeasonLabel,
      careerCompletedSeasons: nextCompletedSeasons,
      careerTrophyCounts: nextTrophyCounts,
      careerLeagueRivals: nextCareerLeagueRivals,
      careerSecondDivisionPool: nextCareerSecondDivisionPool,
      careerPromotionTransition: nextCareerPromotionTransition,
      careerPendingSupercopa: nextCareerPendingSupercopa,
      careerCurrentSupercopaResult: undefined,
      playerRoundSeasons,
      currentRoundIndex: selectedPlayers.length,
    });

    setCareerCompletedSeasons(nextCompletedSeasons);
    setCareerSeasonLabel(nextSeasonLabel);
    setCareerTrophyCounts(nextTrophyCounts);
    setEuropeanCareerState(nextEuropeanCareerState);
    setCareerSeasonRatingBonus(nextCareerSeasonRatingBonus);
    setCareerEuropeanPrestigeReward(europeanPrestigeAward.reward ?? undefined);
    setCareerLeagueRivals(nextCareerLeagueRivals);
    setCareerSecondDivisionPool(nextCareerSecondDivisionPool);
    setCareerPromotionTransition(nextCareerPromotionTransition);
    setCareerPendingSupercopa(nextCareerPendingSupercopa);
    setCareerCurrentSupercopaResult(undefined);
    setCareerRewardSnapshot(rewardSnapshot);
    setLeagueContext(undefined);
    setPendingSeasonLuckWheelOffer(undefined);
    setFinalSummary(undefined);
    setTeamRating(undefined);
    setReplacementDraftSeason(undefined);
    setReplacementRemovedPlayer(undefined);
    setReplacementOriginalFormation(undefined);
    setPhase("team_summary");
    setScreen("career_interseason_reward");
  }

  function ensureCareerRewardSnapshot() {
    setCareerRewardSnapshot((previous) => previous ?? buildCareerRewardSnapshot({
      selectedFormation,
      selectedPlayers,
      selectedCoach,
      teamRating,
      careerSeasonRatingBonus,
      careerSeasonLabel,
      careerCompletedSeasons,
      careerTrophyCounts,
      careerLeagueRivals,
      careerSecondDivisionPool,
      careerPromotionTransition,
      careerPendingSupercopa,
      careerCurrentSupercopaResult,
      playerRoundSeasons,
      currentRoundIndex: selectedPlayers.length,
    }));
  }

  function restoreCareerRewardSnapshot(snapshot: CareerRewardSnapshot): boolean {
    const validation = validateSelectedTeam({
      formation: snapshot.selectedFormation,
      selectedPlayers: snapshot.selectedPlayers,
    });

    if (!snapshot.selectedFormation || !snapshot.selectedCoach || !validation.valid) {
      setTeamValidationErrors(validation.errors.length > 0 ? validation.errors : ["No se pudo restaurar el snapshot de recompensa."]);
      return false;
    }

    setSelectedFormation(snapshot.selectedFormation);
    setSelectedPlayers(snapshot.selectedPlayers);
    setSelectedCoach(snapshot.selectedCoach);
    setTeamRating(snapshot.teamRating);
    setCareerSeasonRatingBonus(snapshot.careerSeasonRatingBonus);
    setCareerSeasonLabel(snapshot.careerSeasonLabel);
    setCareerCompletedSeasons(snapshot.careerCompletedSeasons);
    setCareerTrophyCounts(snapshot.careerTrophyCounts);
    setCareerLeagueRivals(snapshot.careerLeagueRivals);
    setCareerSecondDivisionPool(snapshot.careerSecondDivisionPool);
    setCareerPromotionTransition(snapshot.careerPromotionTransition);
    setCareerPendingSupercopa(snapshot.careerPendingSupercopa);
    setCareerCurrentSupercopaResult(snapshot.careerCurrentSupercopaResult);
    setPlayerRoundSeasons(snapshot.playerRoundSeasons);
    setCurrentRoundIndex(snapshot.currentRoundIndex);
    setReplacementDraftSeason(undefined);
    setReplacementRemovedPlayer(undefined);
    setReplacementOriginalFormation(undefined);
    setCareerRewardFlow(undefined);
    setCareerRewardSnapshot(undefined);
    setTeamValidationErrors([]);
    setLeagueContext(undefined);
    setPendingSeasonLuckWheelOffer(undefined);
    setFinalSummary(undefined);
    setCareerSeasonResult(undefined);
    setCareerObjectiveResult(undefined);
    setLastSelection(undefined);
    setPhase("team_summary");
    setScreen("team_summary");
    return true;
  }

  function handleSeasonLuckWheelPlayerChange(nextContext: UserLeagueSimulationContext) {
    if (!selectedFormation || !selectedCoach) return;

    setLeagueContext(nextContext);
    setCareerRewardFlow("luck_wheel_player");
    setTeamRating(undefined);
    setFinalSummary(undefined);
    setCareerSeasonResult(undefined);
    setCareerObjectiveResult(undefined);
    setReplacementDraftSeason(undefined);
    setReplacementRemovedPlayer(undefined);
    setReplacementOriginalFormation(undefined);
    setTeamValidationErrors([]);
    setPhase("player_selection");
    setScreen("career_player_replacement_pick");
  }

  function handleSeasonLuckWheelCoachChange(nextContext: UserLeagueSimulationContext) {
    if (!selectedFormation || !selectedCoach) return;

    setLeagueContext(nextContext);
    setCareerRewardFlow("luck_wheel_coach");
    setCoachBeforeReward(selectedCoach);
    setSelectedCoach(undefined);
    setTeamRating(undefined);
    setFinalSummary(undefined);
    setCareerSeasonResult(undefined);
    setCareerObjectiveResult(undefined);
    setReplacementDraftSeason(undefined);
    setReplacementRemovedPlayer(undefined);
    setReplacementOriginalFormation(undefined);
    setTeamValidationErrors([]);
    setPhase("coach_selection");
    setScreen("coach_selection");
  }

  function handleCancelLuckWheelCoachChange() {
    if (!coachBeforeReward) return;

    setSelectedCoach(coachBeforeReward);
    recalculateVisibleTeamRating({
      formation: selectedFormation,
      selectedPlayers,
      selectedCoach: coachBeforeReward,
    });
    setCoachBeforeReward(undefined);
    setCareerRewardFlow(undefined);
    setTeamValidationErrors([]);
    setPhase("league_simulation");
    setScreen("league_simulation");
  }

  function handleChooseCareerCoachChange() {
    ensureCareerRewardSnapshot();

    const specialCoachBonus = Boolean(
      careerSeasonResult &&
      careerObjectiveResult &&
      (careerSeasonResult.wonLeague ||
        careerSeasonResult.wonCopa ||
        (careerSeasonResult.wonSupercopa && careerObjectiveResult.qualifiedForEurope))
    );

    setCoachBeforeReward(selectedCoach);
    setCareerRewardFlow(specialCoachBonus ? "coach_bonus" : "standard_coach");
    setSelectedCoach(undefined);
    setTeamRating(undefined);
    setLeagueContext(undefined);
    setPendingSeasonLuckWheelOffer(undefined);
    setFinalSummary(undefined);
    setCareerSeasonResult(undefined);
    setCareerObjectiveResult(undefined);
    setCareerPromotionTransition(undefined);
    setReplacementDraftSeason(undefined);
    setReplacementRemovedPlayer(undefined);
    setReplacementOriginalFormation(undefined);
    setPhase("coach_selection");
    setScreen("coach_selection");
  }

  function handleKeepCurrentCoachWithBonus() {
    if (!coachBeforeReward) return;

    setSelectedCoach(coachBeforeReward);
    recalculateVisibleTeamRating({
      formation: selectedFormation,
      selectedPlayers,
      selectedCoach: coachBeforeReward,
    });
    setCareerSeasonRatingBonus((previous) => Math.max(previous, 0.5));
    setCareerRewardFlow(undefined);
    setCareerRewardSnapshot(undefined);
    setCoachBeforeReward(undefined);
    setLeagueContext(undefined);
    setPendingSeasonLuckWheelOffer(undefined);
    setFinalSummary(undefined);
    setPhase("team_summary");
    setScreen("team_summary");
  }

  function handleChooseCareerPlayerChange() {
    if (!selectedFormation) return;

    ensureCareerRewardSnapshot();
    setCareerRewardFlow("standard_player");
    setTeamRating(undefined);
    setLeagueContext(undefined);
    setPendingSeasonLuckWheelOffer(undefined);
    setFinalSummary(undefined);
    setReplacementDraftSeason(undefined);
    setReplacementRemovedPlayer(undefined);
    setReplacementOriginalFormation(undefined);
    setPhase("player_selection");
    setScreen("career_player_replacement_pick");
  }

  function handleChooseCareerFormationChange() {
    if (!selectedFormation) return;

    ensureCareerRewardSnapshot();
    setCareerRewardFlow("player_formation");
    setTeamRating(undefined);
    setLeagueContext(undefined);
    setPendingSeasonLuckWheelOffer(undefined);
    setFinalSummary(undefined);
    setReplacementDraftSeason(undefined);
    setReplacementRemovedPlayer(undefined);
    setReplacementOriginalFormation(selectedFormation);
    setPhase("player_selection");
    setScreen("career_player_replacement_pick");
  }

  function handleConfirmCareerFormationChange(formation: Formation, remappedPlayers: SelectedPlayer[]) {
    if (careerRewardFlow === "player_formation") {
      const validation = validateSelectedTeam({
        formation,
        selectedPlayers: remappedPlayers,
        expectedPlayerCount: TOTAL_PLAYER_ROUNDS - 1,
      });
      const occupiedSlotIds = new Set(remappedPlayers.map((player) => player.slotId));
      const openSlots = formation.slots.filter((slot) => !occupiedSlotIds.has(slot.id));

      if (!validation.valid || openSlots.length !== 1) {
        setTeamValidationErrors([
          ...validation.errors,
          ...(openSlots.length === 1 ? [] : [`La nueva formación debe dejar exactamente 1 hueco y deja ${openSlots.length}.`]),
        ]);
        return;
      }

      setSelectedFormation(formation);
      setSelectedPlayers(remappedPlayers);
      setReplacementDraftSeason(pickRandomSeason(currentDraftSeasonPool));
      setCurrentRoundIndex(remappedPlayers.length);
      setLastSelection(undefined);
      setTeamValidationErrors([]);
      setPhase("player_selection");
      setScreen("career_player_replacement_draft");
      return;
    }

    const validation = validateSelectedTeam({
      formation,
      selectedPlayers: remappedPlayers,
    });

    if (!validation.valid) {
      setTeamValidationErrors(validation.errors);
      return;
    }

    setSelectedFormation(formation);
    setSelectedPlayers(remappedPlayers);
    recalculateVisibleTeamRating({
      formation,
      selectedPlayers: remappedPlayers,
      selectedCoach,
    });
    setLeagueContext(undefined);
    setPendingSeasonLuckWheelOffer(undefined);
    setFinalSummary(undefined);
    setCareerSeasonResult(undefined);
    setCareerObjectiveResult(undefined);
    setReplacementDraftSeason(undefined);
    setReplacementRemovedPlayer(undefined);
    setReplacementOriginalFormation(undefined);
    setCareerRewardFlow(undefined);
    setCareerRewardSnapshot(undefined);
    setTeamValidationErrors([]);
    setPhase("team_summary");
    setScreen("team_summary");
  }

  function handleSelectPlayerToReplace(selection: SelectedPlayer) {
    const validation = validateSelectedTeam({
      formation: selectedFormation,
      selectedPlayers,
    });

    if (!validation.valid) {
      setTeamValidationErrors(validation.errors);
      return;
    }

    const nextPlayers = selectedPlayers.filter(
      (item) => !(item.slotId === selection.slotId && item.playerSeason.id === selection.playerSeason.id)
    );

    if (nextPlayers.length !== TOTAL_PLAYER_ROUNDS - 1) {
      setTeamValidationErrors([`No se pudo retirar exactamente 1 jugador: quedan ${nextPlayers.length}/${TOTAL_PLAYER_ROUNDS - 1}.`]);
      return;
    }

    setSelectedPlayers(nextPlayers);
    setReplacementRemovedPlayer(selection);
    setCurrentRoundIndex(nextPlayers.length);
    setLastSelection(undefined);
    setTeamValidationErrors([]);

    if (careerRewardFlow === "player_formation") {
      setReplacementDraftSeason(undefined);
      setPhase("team_summary");
      setScreen("career_formation_change");
      return;
    }

    setReplacementDraftSeason(pickRandomSeason(currentDraftSeasonPool));
    setPhase("player_selection");
    setScreen("career_player_replacement_draft");
  }

  function handleCancelPlayerReplacement() {
    const isLuckWheelPlayerFlow = careerRewardFlow === "luck_wheel_player";

    if (!isLuckWheelPlayerFlow && careerRewardSnapshot && restoreCareerRewardSnapshot(careerRewardSnapshot)) {
      return;
    }

    const fallbackFormation = replacementOriginalFormation ?? selectedFormation;
    const fallbackPlayers = replacementRemovedPlayer
      ? (() => {
          const alreadyRestored = selectedPlayers.some(
            (item) => item.slotId === replacementRemovedPlayer.slotId &&
              item.playerSeason.id === replacementRemovedPlayer.playerSeason.id
          );

          return alreadyRestored ? selectedPlayers : [...selectedPlayers, replacementRemovedPlayer];
        })()
      : selectedPlayers;

    const validation = validateSelectedTeam({
      formation: fallbackFormation,
      selectedPlayers: fallbackPlayers,
    });

    if (!validation.valid) {
      setTeamValidationErrors(validation.errors);
      return;
    }

    setSelectedFormation(fallbackFormation);
    setSelectedPlayers(fallbackPlayers);
    recalculateVisibleTeamRating({
      formation: fallbackFormation,
      selectedPlayers: fallbackPlayers,
      selectedCoach,
    });
    setReplacementDraftSeason(undefined);
    setReplacementRemovedPlayer(undefined);
    setReplacementOriginalFormation(undefined);
    setCareerRewardFlow(undefined);
    setCareerRewardSnapshot(undefined);
    setTeamValidationErrors([]);
    if (!isLuckWheelPlayerFlow) {
      setLeagueContext(undefined);
      setPendingSeasonLuckWheelOffer(undefined);
    }
    setFinalSummary(undefined);
    setCareerSeasonResult(undefined);
    setCareerObjectiveResult(undefined);
    setPhase(isLuckWheelPlayerFlow ? "league_simulation" : "team_summary");
    setScreen(isLuckWheelPlayerFlow ? "league_simulation" : "team_summary");
  }

  function handleSelectReplacementPlayer(selection: SelectedPlayer) {
    if (!selectedFormation) return;

    if (selectedPlayers.length !== TOTAL_PLAYER_ROUNDS - 1) {
      setTeamValidationErrors([`El draft de sustituto necesita 10 jugadores previos y hay ${selectedPlayers.length}.`]);
      return;
    }

    const nextPlayers = [...selectedPlayers, selection];
    const validation = validateSelectedTeam({
      formation: selectedFormation,
      selectedPlayers: nextPlayers,
    });

    if (!validation.valid) {
      setTeamValidationErrors(validation.errors);
      return;
    }

    setSelectedPlayers(nextPlayers);
    recalculateVisibleTeamRating({
      formation: selectedFormation,
      selectedPlayers: nextPlayers,
      selectedCoach,
    });
    setLastSelection(selection);
    setReplacementDraftSeason(undefined);
    setReplacementRemovedPlayer(undefined);
    setReplacementOriginalFormation(undefined);
    setCareerRewardFlow(undefined);
    setCareerRewardSnapshot(undefined);
    setTeamValidationErrors([]);
    setCurrentRoundIndex(nextPlayers.length);
    setCareerSeasonResult(undefined);
    setCareerObjectiveResult(undefined);

    if (careerRewardFlow === "luck_wheel_player") {
      setPhase("league_simulation");
      setScreen("league_simulation");
      return;
    }

    setPhase("team_summary");
    setScreen("team_summary");
  }

  function handleRestart() {
    clearSavedGameState();
    resetGameState();
    setScreen("home");
  }

  function handleOpenLocalRanking() {
    setCareerLocalRanking(sortCareerLocalRanking(loadCareerLocalRanking()));
    setScreen("career_local_ranking");
  }

  function handleOpenGlobalRanking() {
    setScreen("career_global_ranking");
  }

  function handleClearLocalRanking() {
    const shouldClear = typeof window === "undefined"
      ? true
      : window.confirm("¿Borrar todo el ranking local de este navegador?");

    if (!shouldClear) return;

    clearCareerLocalRanking();
    setCareerLocalRanking([]);
  }

  function handleCopyShareText(shareText: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(shareText);
      return;
    }
    window.alert(shareText);
  }

  const displayedCareerTrophyCounts = isCareerMode && careerSeasonResult
    ? getFinalCareerTrophyCounts(careerTrophyCounts, careerSeasonResult, europeanCareerState.currentTournament)
    : undefined;

  const shouldShowProgress = ![
    "home",
    "career_preview",
    "career_season_result",
    "career_game_over",
    "career_local_ranking",
    "career_global_ranking",
    "career_interseason_reward",
    "career_supercopa",
    "career_player_replacement_pick",
    "career_formation_change",
  ].includes(screen);

  return (
    <div className="app-shell">
      {shouldShowProgress && (
        <PhaseProgress
          phase={phase}
          playerProgress={{
            selected: selectedPlayers.length,
            total: TOTAL_PLAYER_ROUNDS,
          }}
        />
      )}

      {shouldShowProgress && teamValidationErrors.length > 0 && (
        <section className="team-validation-banner">
          <div>
            <strong>Revisa tu once antes de continuar</strong>
            <ul>
              {teamValidationErrors.slice(0, 4).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!selectedFormation) return;

              const cleanedPlayers = sanitizeSelectedPlayers({
                formation: selectedFormation,
                selectedPlayers,
              });

              setSelectedPlayers(cleanedPlayers);
              setCurrentRoundIndex(cleanedPlayers.length);
              setPhase("player_selection");
              setScreen("season_reveal");
              setTeamValidationErrors([]);
            }}
          >
            Limpiar duplicados
          </button>
        </section>
      )}

      {screen === "career_local_ranking" && (
        <CareerLocalRanking
          entries={careerLocalRanking}
          onNewCareer={handleStartCareer}
          onClearRanking={handleClearLocalRanking}
          onBack={() => setScreen("home")}
        />
      )}

      {screen === "career_global_ranking" && (
        <CareerGlobalRanking
          onNewCareer={handleStartCareer}
          onViewLocalRanking={handleOpenLocalRanking}
          onBack={() => setScreen("home")}
        />
      )}

      {screen === "home" && (
        <GameHome
          hasSavedGame={hasSavedGameState()}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          easyModeSeasonRangeId={easyModeSeasonRangeId}
          onEasyModeSeasonRangeChange={setEasyModeSeasonRangeId}
          onNewGame={handleNewGame}
          onContinueGame={handleContinueGame}
          onCareerPreview={handleOpenCareerPreview}
          onViewLocalRanking={handleOpenLocalRanking}
          onViewGlobalRanking={handleOpenGlobalRanking}
        />
      )}

      {screen === "career_preview" && (
        <main className="career-preview-screen">
          <section className="career-preview-card">
            <p className="eyebrow">Modo carrera Athletic</p>
            <h1>Sobrevive temporada a temporada</h1>
            <p>
              Base preparada para el futuro modo carrera: empieza en 2025/26,
              clasifica a Europa o gana la Copa, y evita el descenso para seguir vivo.
            </p>

            <div className="career-preview-grid">
              <article>
                <strong>Objetivo</strong>
                <span>Clasifícate para Europa o gana la Copa del Rey. Si no, Game Over.</span>
              </article>
              <article>
                <strong>Entre temporadas</strong>
                <span>Cambiar un jugador o cambiar entrenador. Si ganas título o Supercopa + Europa, podrás ajustar formación compatible.</span>
              </article>
              <article>
                <strong>Progresión</strong>
                <span>Los rivales subirán poco a poco y la Copa será cada año más exigente.</span>
              </article>
              <article>
                <strong>Ranking arcade</strong>
                <span>Top 100 global futuro por temporadas superadas y puntos de palmarés.</span>
              </article>
            </div>

            <div className="career-preview-actions">
              <button type="button" className="primary-home-button" onClick={handleStartCareer}>
                Empezar carrera 2025/26
              </button>
              <button type="button" className="career-home-button" onClick={handleOpenLocalRanking}>
                Ver ranking local
              </button>
              <button type="button" className="secondary-home-button" onClick={() => setScreen("home")}>
                Volver
              </button>
            </div>
          </section>
        </main>
      )}

      {screen === "formation_selection" && (
        <FormationSelector
          selectedFormationId={selectedFormation?.id}
          onSelectFormation={handleSelectFormation}
        />
      )}

      {screen === "season_reveal" && selectedFormation && currentSeason && (
        <SeasonReveal
          formation={selectedFormation}
          finalSeason={currentSeason}
          availableSeasons={currentDraftSeasonPool}
          roundNumber={currentRoundIndex + 1}
          totalRounds={TOTAL_PLAYER_ROUNDS}
          onStartDraft={handleStartDraftAfterReveal}
        />
      )}

      {isPlayerSelectionReady && selectedFormation && currentSeason && (
        <PlayerRound
          roundNumber={currentRoundIndex + 1}
          totalRounds={TOTAL_PLAYER_ROUNDS}
          season={currentSeason}
          formation={selectedFormation}
          selectedPlayers={selectedPlayers}
          lastSelection={lastSelection}
          onSelectPlayer={handleSelectPlayer}
          onSkipRound={handleSkipRound}
        />
      )}

      {screen === "coach_selection" && selectedFormation && (
        <CoachRound onSelectCoach={handleSelectCoach} />
      )}

      {screen === "coach_selection" && careerRewardFlow === "coach_bonus" && coachBeforeReward && (
        <div className="career-replacement-floating-actions">
          <span>Premio especial: puedes mantener a {coachBeforeReward.coachSeason.name} y aplicar igualmente +0.5 media.</span>
          <button type="button" onClick={handleKeepCurrentCoachWithBonus}>
            Mantener entrenador actual +0.5
          </button>
        </div>
      )}

      {screen === "coach_selection" && careerRewardFlow === "luck_wheel_coach" && coachBeforeReward && (
        <div className="career-replacement-floating-actions">
          <span>Premio de ruleta: puedes cambiar a {coachBeforeReward.coachSeason.name} o cancelar y volver a la Liga.</span>
          <button type="button" onClick={handleCancelLuckWheelCoachChange}>
            Cancelar cambio y volver a la Liga
          </button>
        </div>
      )}

      {screen === "team_summary" && selectedFormation && selectedCoach && (
        <TeamSummary
          formation={selectedFormation}
          selectedPlayers={selectedPlayers}
          selectedCoach={selectedCoach}
          onStartLeagueSimulation={handleStartLeagueSimulation}
          onBackToCoach={() => setScreen("coach_selection")}
          modeLabel={isCareerMode ? `Carrera Athletic · ${careerSeasonLabel}` : undefined}
          startButtonLabel={isCareerMode ? (careerPendingSupercopa?.userQualified ? "Jugar Supercopa y temporada" : "Jugar temporada de carrera") : undefined}
          careerRatingBonus={isCareerMode ? careerSeasonRatingBonus : 0}
          difficulty={difficulty}
          isCareerMode={isCareerMode}
        />
      )}


      {screen === "career_supercopa" && careerPendingSupercopa && teamRating && (
        <CareerSupercopa
          qualification={careerPendingSupercopa}
          result={careerCurrentSupercopaResult}
          onSimulate={handleSimulateCareerSupercopa}
          onContinue={handleContinueAfterSupercopa}
          onRestart={handleRestart}
        />
      )}

      {screen === "league_simulation" && selectedFormation && selectedCoach && teamRating && (
        <LeagueSimulatorView
          gameId={gameId}
          difficulty={difficulty}
          formation={selectedFormation}
          selectedPlayers={selectedPlayers}
          selectedCoach={selectedCoach}
          teamRating={teamRating}
          isCareerMode={isCareerMode}
          leagueRivals={isCareerMode ? careerLeagueRivals : undefined}
          initialContext={leagueContext}
          onContextChange={setLeagueContext}
          initialPendingSeasonLuckWheelOffer={pendingSeasonLuckWheelOffer}
          onPendingSeasonLuckWheelOfferChange={setPendingSeasonLuckWheelOffer}
          onSeasonLuckWheelPlayerChange={handleSeasonLuckWheelPlayerChange}
          onSeasonLuckWheelCoachChange={handleSeasonLuckWheelCoachChange}
          onFinishLeague={handleFinishLeague}
          europeanTournament={isCareerMode ? europeanCareerState.currentTournament : undefined}
          onEuropeanTournamentChange={(tournament: EuropeanTournamentState) =>
            setEuropeanCareerState((current) => setEuropeanCurrentTournament(current, tournament))
          }
        />
      )}

      {(screen === "career_season_result" || screen === "career_game_over") && finalSummary && careerSeasonResult && careerObjectiveResult && (
        <CareerSeasonOutcome
          summary={finalSummary}
          seasonResult={careerSeasonResult}
          objectiveResult={careerObjectiveResult}
          onViewFullSummary={() => setScreen("finished")}
          onContinueCareer={careerObjectiveResult.survives ? handleContinueCareerAfterSeason : undefined}
          onRestart={handleStartCareer}
          onViewLocalRanking={handleOpenLocalRanking}
          onViewGlobalRanking={handleOpenGlobalRanking}
          rankingEntry={careerCurrentRankingEntry}
          selectedPlayers={selectedPlayers}
          teamRating={teamRating}
          completedSeasons={careerCompletedSeasons}
          trophyCounts={careerTrophyCounts}
          europeanQualification={careerEuropeanQualification}
          europeanCareerState={europeanCareerState}
          europeanTournament={europeanCareerState.currentTournament}
        />
      )}

      {screen === "career_interseason_reward" && selectedFormation && careerSeasonResult && careerObjectiveResult && (
        <CareerInterseasonReward
          completedSeasons={careerCompletedSeasons}
          nextSeasonLabel={careerSeasonLabel}
          formation={selectedFormation}
          selectedPlayers={selectedPlayers}
          selectedCoach={selectedCoach}
          seasonResult={careerSeasonResult}
          objectiveResult={careerObjectiveResult}
          trophyCounts={careerTrophyCounts}
          promotionTransition={careerPromotionTransition}
          pendingSupercopa={careerPendingSupercopa}
          europeanPrestigeReward={careerEuropeanPrestigeReward}
          onChoosePlayerChange={handleChooseCareerPlayerChange}
          onChooseCoachChange={handleChooseCareerCoachChange}
          onChooseFormationChange={handleChooseCareerFormationChange}
          onRestart={handleRestart}
        />
      )}


      {screen === "career_formation_change" && selectedFormation && (
        <CareerFormationChangePicker
          currentFormation={selectedFormation}
          selectedPlayers={selectedPlayers}
          nextSeasonLabel={careerSeasonLabel}
          onConfirmFormationChange={handleConfirmCareerFormationChange}
          allowOpenSlot={careerRewardFlow === "player_formation"}
          removedPlayer={replacementRemovedPlayer}
          onCancel={handleCancelPlayerReplacement}
        />
      )}

      {screen === "career_player_replacement_pick" && selectedFormation && (
        <CareerPlayerReplacementPicker
          formation={selectedFormation}
          selectedPlayers={selectedPlayers}
          nextSeasonLabel={careerSeasonLabel}
          mode={careerRewardFlow === "player_formation" ? "player_formation" : careerRewardFlow === "luck_wheel_player" ? "luck_wheel_player" : "player"}
          onSelectPlayerToReplace={handleSelectPlayerToReplace}
          onCancel={handleCancelPlayerReplacement}
        />
      )}

      {screen === "career_player_replacement_draft" && selectedFormation && replacementDraftSeason && (
        <PlayerRound
          roundNumber={1}
          totalRounds={1}
          season={replacementDraftSeason}
          formation={selectedFormation}
          selectedPlayers={selectedPlayers}
          lastSelection={lastSelection}
          strictOpenSlotLine={careerRewardFlow === "player_formation" ? getSingleOpenSlotLine({ formation: selectedFormation, selectedPlayers }) : undefined}
          onSelectPlayer={handleSelectReplacementPlayer}
          onSkipRound={() => setReplacementDraftSeason(pickRandomSeason(currentDraftSeasonPool))}
        />
      )}

      {screen === "career_player_replacement_draft" && replacementRemovedPlayer && (
        <div className="career-replacement-floating-actions">
          <span>
            {careerRewardFlow === "luck_wheel_player" ? "Premio de ruleta: " : ""}Sustituyendo a {replacementRemovedPlayer.playerSeason.name} ({replacementRemovedPlayer.position})
          </span>
          <button type="button" onClick={handleCancelPlayerReplacement}>
            {careerRewardFlow === "luck_wheel_player" ? "Cancelar y volver a la Liga" : "Cancelar y avanzar"}
          </button>
        </div>
      )}

      {screen === "finished" && finalSummary && selectedFormation && selectedCoach && teamRating && (
        <FinalSummary
          summary={finalSummary}
          difficulty={difficulty}
          formation={selectedFormation}
          selectedPlayers={selectedPlayers}
          selectedCoach={selectedCoach}
          teamRating={teamRating}
          onRestart={handleRestart}
          onReturnToCareer={isCareerMode && careerSeasonResult && careerObjectiveResult ? () => setScreen(careerObjectiveResult.survives ? "career_season_result" : "career_game_over") : undefined}
          onShare={handleCopyShareText}
          careerTrophyCounts={displayedCareerTrophyCounts}
          europeanQualification={isCareerMode ? careerEuropeanQualification : undefined}
        />
      )}
    </div>
  );
}


