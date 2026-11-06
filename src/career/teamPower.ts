import type { GameDifficulty, TeamRating } from "../types/game";

export const CAREER_EFFECTIVE_RATING_BASE = 80;
export const CAREER_EFFECTIVE_RATING_FACTOR = 0.55;

export interface CareerTeamPowerPreview {
  baseRating: TeamRating;
  seasonRating: TeamRating;
  simulationRating: TeamRating;
  bonus: number;
  difficulty: GameDifficulty;
  hasBonus: boolean;
}

function roundToOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function clampRating(value: number, min = 40, max = 100): number {
  return Math.max(min, Math.min(max, roundToOne(value)));
}

function appendStrength(teamRating: TeamRating, strength: string): string[] {
  return teamRating.strengths.includes(strength)
    ? teamRating.strengths
    : [...teamRating.strengths, strength];
}

export function applyCareerRatingBonus(teamRating: TeamRating, bonus: number): TeamRating {
  if (bonus <= 0) return teamRating;

  const apply = (value: number) => clampRating(value + bonus);
  const bonusLabel = `Premio de entrenador: +${bonus.toFixed(1)} media`;

  return {
    ...teamRating,
    overall: apply(teamRating.overall),
    attack: apply(teamRating.attack),
    defense: apply(teamRating.defense),
    control: apply(teamRating.control),
    physical: apply(teamRating.physical),
    mentality: apply(teamRating.mentality),
    goalkeeping: apply(teamRating.goalkeeping),
    strengths: appendStrength(teamRating, bonusLabel),
  };
}

export function compressCareerRating(value: number): number {
  if (value <= CAREER_EFFECTIVE_RATING_BASE) return value;

  return (
    CAREER_EFFECTIVE_RATING_BASE +
    (value - CAREER_EFFECTIVE_RATING_BASE) * CAREER_EFFECTIVE_RATING_FACTOR
  );
}

export function applyCareerSimulationCompression(teamRating: TeamRating, isCareerMode: boolean): TeamRating {
  if (!isCareerMode) return teamRating;

  // v0.25.94: a una décima, no a entero. Con entero, 87 y 88 visibles daban los dos 84 y
  // mejorar el once no se notaba. Medido sin efecto en el equilibrio (INFORME_RATING_SIMULACION_v0_25_90).
  const clampCompressed = (value: number) =>
    Math.max(40, Math.min(99, roundToOne(compressCareerRating(value))));

  return {
    ...teamRating,
    attack: clampCompressed(teamRating.attack),
    defense: clampCompressed(teamRating.defense),
    control: clampCompressed(teamRating.control),
    physical: clampCompressed(teamRating.physical),
    mentality: clampCompressed(teamRating.mentality),
    goalkeeping: clampCompressed(teamRating.goalkeeping),
    overall: clampCompressed(teamRating.overall),
  };
}

export function getDifficultyRatingModifier(difficulty: GameDifficulty): number {
  if (difficulty === "normal") return 2;
  if (difficulty === "leyenda") return -4;
  return 0;
}

export function applyDifficultyToTeamRating(
  teamRating: TeamRating,
  difficulty: GameDifficulty,
  isCareerMode: boolean,
): TeamRating {
  const careerRating = applyCareerSimulationCompression(teamRating, isCareerMode);
  const modifier = getDifficultyRatingModifier(difficulty);
  // La carrera conserva la décima de la compresión; la partida rápida sigue en enteros.
  const round = isCareerMode ? roundToOne : Math.round;
  const clamp = (value: number) => Math.max(40, Math.min(99, round(value + modifier)));

  return {
    ...careerRating,
    attack: clamp(careerRating.attack),
    defense: clamp(careerRating.defense),
    control: clamp(careerRating.control),
    physical: clamp(careerRating.physical),
    mentality: clamp(careerRating.mentality),
    goalkeeping: clamp(careerRating.goalkeeping),
    overall: clamp(careerRating.overall),
  };
}

export function buildCareerTeamPowerPreview(params: {
  teamRating: TeamRating;
  bonus?: number;
  difficulty?: GameDifficulty;
  isCareerMode?: boolean;
}): CareerTeamPowerPreview {
  const {
    teamRating,
    bonus = 0,
    difficulty = "normal",
    isCareerMode = true,
  } = params;
  const safeBonus = Math.max(0, bonus);
  const seasonRating = applyCareerRatingBonus(teamRating, safeBonus);
  const simulationRating = applyDifficultyToTeamRating(seasonRating, difficulty, isCareerMode);

  return {
    baseRating: teamRating,
    seasonRating,
    simulationRating,
    bonus: safeBonus,
    difficulty,
    hasBonus: safeBonus > 0,
  };
}
