import type { TeamRating } from "../types/game";
import {
  getSeasonLuckWheelAppearanceText,
  getSeasonLuckWheelResultText,
} from "./seasonLuckWheelText";

export type SeasonLuckWheelTriggerEvent =
  | "copa_elimination"
  | "europe_elimination"
  | "mid_season"
  | "bad_streak"
  | "good_streak";

export type SeasonLuckWheelResultGroup = "positive" | "neutral" | "negative";

export type SeasonLuckWheelPositiveResultType =
  | "rating_plus_0_5"
  | "player_change"
  | "coach_change"
  | "rating_plus_1"
  | "rating_plus_1_and_player_change";

export type SeasonLuckWheelNegativeResultType = "rating_minus_0_5" | "rating_minus_1";
export type SeasonLuckWheelNeutralResultType = "no_effect";

export type SeasonLuckWheelResultType =
  | SeasonLuckWheelPositiveResultType
  | SeasonLuckWheelNeutralResultType
  | SeasonLuckWheelNegativeResultType;

export interface SeasonLuckWheelProbabilitySet {
  positive: number;
  neutral: number;
  negative: number;
}

export interface SeasonLuckWheelPrecisionZone {
  id: "perfect_center" | "good_center" | "balanced" | "outer" | "edge";
  label: string;
  minDistanceFromCenter: number;
  maxDistanceFromCenter: number;
  probabilities: SeasonLuckWheelProbabilitySet;
}

export interface SeasonLuckWheelPrizeSegment {
  resultType: SeasonLuckWheelResultType;
  group: SeasonLuckWheelResultGroup;
  label: string;
  ratingDelta: number;
  requiresPlayerChange: boolean;
  requiresCoachChange: boolean;
}

export interface SeasonLuckWheelState {
  seasonId: string;
  used: boolean;
  triggerEvent?: SeasonLuckWheelTriggerEvent;
  offeredAt?: string;
  accepted?: boolean;
  resultGroup?: SeasonLuckWheelResultGroup;
  resultType?: SeasonLuckWheelResultType;
  ratingDelta?: number;
  requiresPlayerChange?: boolean;
  requiresCoachChange?: boolean;
  precisionPosition?: number;
  precisionZoneId?: SeasonLuckWheelPrecisionZone["id"];
  appearanceText?: string;
  resultText?: string;
}

export interface SeasonLuckWheelOffer {
  seasonId: string;
  triggerEvent: SeasonLuckWheelTriggerEvent;
  appearanceText: string;
  prizeSegments: SeasonLuckWheelPrizeSegment[];
  alreadyUsed: boolean;
  shouldPauseSimulation: true;
}

export interface SeasonLuckWheelResolvedResult {
  seasonId: string;
  used: true;
  triggerEvent: SeasonLuckWheelTriggerEvent;
  accepted: true;
  resultGroup: SeasonLuckWheelResultGroup;
  resultType: SeasonLuckWheelResultType;
  ratingDelta: number;
  precisionPosition: number;
  precisionZone: SeasonLuckWheelPrecisionZone;
  appearanceText: string;
  resultText: string;
  requiresPlayerChange: boolean;
  requiresCoachChange: boolean;
}

export interface ResolveSeasonLuckWheelParams {
  seasonId: string;
  triggerEvent: SeasonLuckWheelTriggerEvent;
  precisionPosition: number;
  randomGroup: number;
  randomPrize: number;
  randomText: number;
}

export const SEASON_LUCK_WHEEL_MAX_USES_PER_SEASON = 1;

export const SEASON_LUCK_WHEEL_BASE_PROBABILITIES: SeasonLuckWheelProbabilitySet = {
  positive: 40,
  neutral: 40,
  negative: 20,
};

export const SEASON_LUCK_WHEEL_POSITIVE_WEIGHTS: Record<SeasonLuckWheelPositiveResultType, number> = {
  rating_plus_0_5: 40,
  player_change: 30,
  coach_change: 20,
  rating_plus_1: 8,
  rating_plus_1_and_player_change: 2,
};

export const SEASON_LUCK_WHEEL_NEGATIVE_WEIGHTS: Record<SeasonLuckWheelNegativeResultType, number> = {
  rating_minus_0_5: 90,
  rating_minus_1: 10,
};

export const SEASON_LUCK_WHEEL_PRECISION_ZONES: SeasonLuckWheelPrecisionZone[] = [
  {
    id: "perfect_center",
    label: "Centro perfecto",
    minDistanceFromCenter: 0,
    maxDistanceFromCenter: 0.06,
    probabilities: { positive: 65, neutral: 30, negative: 5 },
  },
  {
    id: "good_center",
    label: "Zona buena",
    minDistanceFromCenter: 0.06,
    maxDistanceFromCenter: 0.16,
    probabilities: { positive: 50, neutral: 35, negative: 15 },
  },
  {
    id: "balanced",
    label: "Zona equilibrada",
    minDistanceFromCenter: 0.16,
    maxDistanceFromCenter: 0.28,
    probabilities: SEASON_LUCK_WHEEL_BASE_PROBABILITIES,
  },
  {
    id: "outer",
    label: "Zona exterior",
    minDistanceFromCenter: 0.28,
    maxDistanceFromCenter: 0.4,
    probabilities: { positive: 25, neutral: 45, negative: 30 },
  },
  {
    id: "edge",
    label: "Extremo",
    minDistanceFromCenter: 0.4,
    maxDistanceFromCenter: 0.5,
    probabilities: { positive: 10, neutral: 40, negative: 50 },
  },
];

export const SEASON_LUCK_WHEEL_PRIZE_SEGMENTS: SeasonLuckWheelPrizeSegment[] = [
  {
    resultType: "rating_plus_0_5",
    group: "positive",
    label: "+0.5 media",
    ratingDelta: 0.5,
    requiresPlayerChange: false,
    requiresCoachChange: false,
  },
  {
    resultType: "no_effect",
    group: "neutral",
    label: "Sin efecto",
    ratingDelta: 0,
    requiresPlayerChange: false,
    requiresCoachChange: false,
  },
  {
    resultType: "player_change",
    group: "positive",
    label: "Cambio de jugador",
    ratingDelta: 0,
    requiresPlayerChange: true,
    requiresCoachChange: false,
  },
  {
    resultType: "rating_minus_0_5",
    group: "negative",
    label: "-0.5 media",
    ratingDelta: -0.5,
    requiresPlayerChange: false,
    requiresCoachChange: false,
  },
  {
    resultType: "rating_plus_0_5",
    group: "positive",
    label: "+0.5 media",
    ratingDelta: 0.5,
    requiresPlayerChange: false,
    requiresCoachChange: false,
  },
  {
    resultType: "no_effect",
    group: "neutral",
    label: "Sin efecto",
    ratingDelta: 0,
    requiresPlayerChange: false,
    requiresCoachChange: false,
  },
  {
    resultType: "coach_change",
    group: "positive",
    label: "Cambio de entrenador",
    ratingDelta: 0,
    requiresPlayerChange: false,
    requiresCoachChange: true,
  },
  {
    resultType: "rating_plus_1",
    group: "positive",
    label: "+1.0 media",
    ratingDelta: 1,
    requiresPlayerChange: false,
    requiresCoachChange: false,
  },
  {
    resultType: "no_effect",
    group: "neutral",
    label: "Sin efecto",
    ratingDelta: 0,
    requiresPlayerChange: false,
    requiresCoachChange: false,
  },
  {
    resultType: "rating_plus_0_5",
    group: "positive",
    label: "+0.5 media",
    ratingDelta: 0.5,
    requiresPlayerChange: false,
    requiresCoachChange: false,
  },
  {
    resultType: "rating_minus_1",
    group: "negative",
    label: "-1.0 media",
    ratingDelta: -1,
    requiresPlayerChange: false,
    requiresCoachChange: false,
  },
  {
    resultType: "rating_plus_1_and_player_change",
    group: "positive",
    label: "+1.0 media + jugador",
    ratingDelta: 1,
    requiresPlayerChange: true,
    requiresCoachChange: false,
  },
];

function assertProbabilitySet(probabilities: SeasonLuckWheelProbabilitySet, label: string): void {
  const total = probabilities.positive + probabilities.neutral + probabilities.negative;
  if (total !== 100) {
    throw new Error(`${label} debe sumar 100, pero suma ${total}.`);
  }
}

function sumWeights(weights: Record<string, number>): number {
  return Object.values(weights).reduce((total, value) => total + value, 0);
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

function roundToOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function clampRating(value: number): number {
  return Math.max(40, Math.min(100, roundToOne(value)));
}

function pickWeighted<T extends string>(weights: Record<T, number>, randomValue: number): T {
  const safeRandom = clamp01(randomValue) * 100;
  let cursor = 0;

  for (const [key, weight] of Object.entries(weights) as [T, number][]) {
    cursor += weight;
    if (safeRandom < cursor) {
      return key;
    }
  }

  return Object.keys(weights).at(-1) as T;
}

export function validateSeasonLuckWheelConfig(): void {
  assertProbabilitySet(SEASON_LUCK_WHEEL_BASE_PROBABILITIES, "Probabilidad base");

  for (const zone of SEASON_LUCK_WHEEL_PRECISION_ZONES) {
    assertProbabilitySet(zone.probabilities, `Zona ${zone.id}`);
  }

  const positiveTotal = sumWeights(SEASON_LUCK_WHEEL_POSITIVE_WEIGHTS);
  const negativeTotal = sumWeights(SEASON_LUCK_WHEEL_NEGATIVE_WEIGHTS);

  if (positiveTotal !== 100) {
    throw new Error(`Pesos positivos deben sumar 100, pero suman ${positiveTotal}.`);
  }

  if (negativeTotal !== 100) {
    throw new Error(`Pesos negativos deben sumar 100, pero suman ${negativeTotal}.`);
  }
}

export function getSeasonLuckWheelPrecisionZone(position: number): SeasonLuckWheelPrecisionZone {
  const safePosition = clamp01(position);
  const distance = Math.abs(safePosition - 0.5);

  return (
    SEASON_LUCK_WHEEL_PRECISION_ZONES.find(
      (zone) => distance >= zone.minDistanceFromCenter && distance <= zone.maxDistanceFromCenter,
    ) ?? SEASON_LUCK_WHEEL_PRECISION_ZONES.at(-1)!
  );
}

export function resolveSeasonLuckWheelResultGroup(
  probabilities: SeasonLuckWheelProbabilitySet,
  randomValue: number,
): SeasonLuckWheelResultGroup {
  const roll = clamp01(randomValue) * 100;

  if (roll < probabilities.positive) return "positive";
  if (roll < probabilities.positive + probabilities.neutral) return "neutral";
  return "negative";
}

export function resolveSeasonLuckWheelResultType(
  group: SeasonLuckWheelResultGroup,
  randomValue: number,
): SeasonLuckWheelResultType {
  if (group === "neutral") return "no_effect";
  if (group === "positive") return pickWeighted(SEASON_LUCK_WHEEL_POSITIVE_WEIGHTS, randomValue);
  return pickWeighted(SEASON_LUCK_WHEEL_NEGATIVE_WEIGHTS, randomValue);
}

export function getSeasonLuckWheelPrizeSegment(resultType: SeasonLuckWheelResultType): SeasonLuckWheelPrizeSegment {
  const segment = SEASON_LUCK_WHEEL_PRIZE_SEGMENTS.find((candidate) => candidate.resultType === resultType);

  if (!segment) {
    throw new Error(`Premio de ruleta desconocido: ${resultType}`);
  }

  return segment;
}

export function hasSeasonLuckWheelBeenUsed(state?: SeasonLuckWheelState): boolean {
  return state?.used === true;
}

export function canOfferSeasonLuckWheel(state?: SeasonLuckWheelState): boolean {
  return !hasSeasonLuckWheelBeenUsed(state);
}

export function buildSeasonLuckWheelOffer(params: {
  seasonId: string;
  triggerEvent: SeasonLuckWheelTriggerEvent;
  currentState?: SeasonLuckWheelState;
  randomText?: number;
}): SeasonLuckWheelOffer | undefined {
  if (!canOfferSeasonLuckWheel(params.currentState)) return undefined;

  const textIndex = Math.floor(clamp01(params.randomText ?? Math.random()) * 1000);

  return {
    seasonId: params.seasonId,
    triggerEvent: params.triggerEvent,
    appearanceText: getSeasonLuckWheelAppearanceText(params.triggerEvent, textIndex),
    prizeSegments: SEASON_LUCK_WHEEL_PRIZE_SEGMENTS,
    alreadyUsed: false,
    shouldPauseSimulation: true,
  };
}

export function declineSeasonLuckWheel(params: {
  seasonId: string;
  triggerEvent: SeasonLuckWheelTriggerEvent;
  appearanceText: string;
}): SeasonLuckWheelState {
  return {
    seasonId: params.seasonId,
    used: true,
    triggerEvent: params.triggerEvent,
    offeredAt: new Date().toISOString(),
    accepted: false,
    ratingDelta: 0,
    appearanceText: params.appearanceText,
  };
}

export function resolveSeasonLuckWheel(params: ResolveSeasonLuckWheelParams): SeasonLuckWheelResolvedResult {
  validateSeasonLuckWheelConfig();

  const precisionPosition = clamp01(params.precisionPosition);
  const precisionZone = getSeasonLuckWheelPrecisionZone(precisionPosition);
  const resultGroup = resolveSeasonLuckWheelResultGroup(precisionZone.probabilities, params.randomGroup);
  const resultType = resolveSeasonLuckWheelResultType(resultGroup, params.randomPrize);
  const segment = getSeasonLuckWheelPrizeSegment(resultType);
  const textIndex = Math.floor(clamp01(params.randomText) * 1000);
  const appearanceText = getSeasonLuckWheelAppearanceText(params.triggerEvent, textIndex);
  const resultText = getSeasonLuckWheelResultText(resultGroup, textIndex);

  return {
    seasonId: params.seasonId,
    used: true,
    triggerEvent: params.triggerEvent,
    accepted: true,
    resultGroup,
    resultType,
    ratingDelta: segment.ratingDelta,
    precisionPosition,
    precisionZone,
    appearanceText,
    resultText,
    requiresPlayerChange: segment.requiresPlayerChange,
    requiresCoachChange: segment.requiresCoachChange,
  };
}

export function applySeasonLuckWheelRatingDelta(teamRating: TeamRating, ratingDelta: number): TeamRating {
  if (ratingDelta === 0) return teamRating;

  const apply = (value: number) => clampRating(value + ratingDelta);
  const label = `Ruleta de temporada: ${ratingDelta > 0 ? "+" : ""}${ratingDelta.toFixed(1)} media`;

  return {
    ...teamRating,
    overall: apply(teamRating.overall),
    attack: apply(teamRating.attack),
    defense: apply(teamRating.defense),
    control: apply(teamRating.control),
    physical: apply(teamRating.physical),
    mentality: apply(teamRating.mentality),
    goalkeeping: apply(teamRating.goalkeeping),
    strengths: ratingDelta > 0 && !teamRating.strengths.includes(label)
      ? [...teamRating.strengths, label]
      : teamRating.strengths,
    weaknesses: ratingDelta < 0 && !teamRating.weaknesses.includes(label)
      ? [...teamRating.weaknesses, label]
      : teamRating.weaknesses,
  };
}

/** Estado guardado en la carrera cuando el jugador acepta la ruleta y gira. */
export function buildAcceptedSeasonLuckWheelState(
  result: SeasonLuckWheelResolvedResult,
  offeredAt: string,
): SeasonLuckWheelState {
  return {
    seasonId: result.seasonId,
    used: true,
    triggerEvent: result.triggerEvent,
    offeredAt,
    accepted: true,
    resultGroup: result.resultGroup,
    resultType: result.resultType,
    ratingDelta: result.ratingDelta,
    precisionPosition: result.precisionPosition,
    precisionZoneId: result.precisionZone.id,
    appearanceText: result.appearanceText,
    resultText: result.resultText,
    requiresPlayerChange: result.requiresPlayerChange,
    requiresCoachChange: result.requiresCoachChange,
  };
}
