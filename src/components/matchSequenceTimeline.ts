// src/components/matchSequenceTimeline.ts
//
// Secuencia de partido (v0.24.9i, Fase A): lógica pura de la línea de tiempo.
// Convierte el tiempo transcurrido en fotograma (fase, minuto y goles visibles)
// usando solo los `goalEvents` que ya genera el motor. No cambia la simulación.

import type {
  GoalEvent,
  MatchApproachEffect,
  MatchExpectedGoals,
  MatchHalfTimeEffect,
  MatchKeyFactor,
  MatchLineDuel,
  MatchResult,
} from "../types/game";
import type { MatchIconKind } from "./MatchIcon";

export const MATCH_SEQUENCE_PREVIEW_MS = 1000;
export const MATCH_SEQUENCE_PLAY_MS = 2800;
export const MATCH_SEQUENCE_DURATION_MS = MATCH_SEQUENCE_PREVIEW_MS + MATCH_SEQUENCE_PLAY_MS;
export const MATCH_SEQUENCE_TICK_MS = 100;
const MATCH_MINUTES = 90;

export type MatchSequenceStage = "preview" | "playing" | "final";

export interface MatchSequenceFrame {
  stage: MatchSequenceStage;
  minute: number;
  /** Goles ya mostrados, en orden de minuto. */
  visibleGoals: GoalEvent[];
}

export function getMatchSequenceDurationMs(multiplier = 1): number {
  return MATCH_SEQUENCE_DURATION_MS * multiplier;
}

export function getMatchSequenceFrame(goalEvents: GoalEvent[], elapsedMs: number, multiplier = 1): MatchSequenceFrame {
  const sortedGoals = [...goalEvents].sort((a, b) => a.minute - b.minute);
  const previewMs = MATCH_SEQUENCE_PREVIEW_MS * multiplier;
  const playMs = MATCH_SEQUENCE_PLAY_MS * multiplier;

  if (elapsedMs >= previewMs + playMs) {
    return { stage: "final", minute: MATCH_MINUTES, visibleGoals: sortedGoals };
  }

  if (elapsedMs < previewMs) {
    return { stage: "preview", minute: 0, visibleGoals: [] };
  }

  // El reloj llega como mínimo a 90' y, si hay descuento, hasta el último gol.
  // Se reparte en lastMinute + 1 tramos para que el último minuto sí se muestre antes del final.
  const lastMinute = Math.max(MATCH_MINUTES, ...sortedGoals.map((goal) => goal.minute));
  const playProgress = (elapsedMs - previewMs) / playMs;
  const minute = Math.min(lastMinute, Math.floor(playProgress * (lastMinute + 1)));

  return {
    stage: "playing",
    minute,
    visibleGoals: sortedGoals.filter((goal) => goal.minute <= minute),
  };
}

/** Momento de la secuencia en el que el reloj marca 45' y el partido se para (v0.25.78). */
export function getHalfTimeElapsedMs(goalEvents: GoalEvent[], multiplier = 1): number {
  const lastMinute = Math.max(MATCH_MINUTES, ...goalEvents.map((goal) => goal.minute));

  return (MATCH_SEQUENCE_PREVIEW_MS + MATCH_SEQUENCE_PLAY_MS * (45.5 / (lastMinute + 1))) * multiplier;
}

export function countGoalsForTeam(goals: GoalEvent[], teamName: string): number {
  return goals.filter((goal) => goal.teamName === teamName).length;
}

// Insignia del resultado del usuario: la usan la secuencia y los últimos resultados.
export function getResultBadge(result: MatchResult): string {
  if (result.userTeamWon) return "Victoria";
  if (result.userTeamDrew) return "Empate";
  return "Derrota";
}

export function getResultClass(result: MatchResult): string {
  if (result.userTeamWon) return "result-badge result-badge-win";
  if (result.userTeamDrew) return "result-badge result-badge-draw";
  return "result-badge result-badge-loss";
}

// Factor que decidió el partido (v0.25.74): lo calcula el motor sin cambiar el resultado.
// Los textos no dicen el campo concreto: la Supercopa se juega en sede neutral.
const KEY_FACTOR_TEXT: Record<MatchKeyFactor, string> = {
  mentality_win: "La mentalidad decidió un partido igualado a tu favor.",
  mentality_loss: "El rival tuvo más mentalidad y decidió un partido igualado.",
  lead_lost: "Costó cerrar el partido: el rival arañó el empate.",
  upset: "Partido igualado que acabó cayendo del lado del rival.",
  overconfidence: "Exceso de confianza: eras muy favorito y no pudiste ganar.",
  giant_killing: "Victoria de mérito ante un rival superior.",
  attack_win: "Tu ataque pudo con su defensa.",
  clean_sheet_win: "Tu defensa dejó la portería a cero.",
  home_win: "Tu equipo fue mejor y lo reflejó en el marcador.",
  away_win: "Victoria trabajada fuera de casa.",
  away_draw: "Punto sumado fuera de casa.",
  even_draw: "Partido igualado: ninguno encontró la forma de ganarlo.",
  stronger_rival: "El rival era superior y lo demostró.",
  away_loss: "Fuera de casa costó competir.",
  bad_day: "Día torcido: el equipo no estuvo a su nivel.",
  extra_time_win: "Empate a los 90 minutos: lo resolviste en la prórroga.",
  extra_time_loss: "Empate a los 90 minutos: el rival lo resolvió en la prórroga.",
};

export function getMatchKeyFactorText(factor: MatchKeyFactor | undefined): string | undefined {
  return factor ? KEY_FACTOR_TEXT[factor] : undefined;
}

const KEY_FACTOR_ICON: Record<MatchKeyFactor, MatchIconKind> = {
  mentality_win: "mentality",
  mentality_loss: "mentality",
  lead_lost: "warning",
  upset: "warning",
  overconfidence: "warning",
  giant_killing: "merit",
  attack_win: "attacking",
  clean_sheet_win: "defensive",
  home_win: "merit",
  away_win: "merit",
  away_draw: "balanced",
  even_draw: "balanced",
  stronger_rival: "warning",
  away_loss: "warning",
  bad_day: "warning",
  extra_time_win: "extra_time",
  extra_time_loss: "extra_time",
};

export function getMatchKeyFactorIcon(factor: MatchKeyFactor): MatchIconKind {
  return KEY_FACTOR_ICON[factor];
}

/** Línea de la previa: las mismas líneas que usa el motor (v0.25.76). */
export function getLineDuelSummary(duel: MatchLineDuel): string {
  if (duel.rivalHasOnlyOverall) {
    return `Tu ataque ${duel.userAttack} · Tu defensa ${duel.userDefense} · Nivel del rival ${duel.rivalAttack}`;
  }

  return `Tu ataque ${duel.userAttack} contra su defensa ${duel.rivalDefense} · Tu defensa ${duel.userDefense} contra su ataque ${duel.rivalAttack}`;
}

/**
 * Crónica del partido (v0.25.76): la línea que explica el resultado, solo si el
 * marcador y los ratings dicen lo mismo. Si no, no se cuenta nada que no pasó.
 */
export function getLineDuelText(
  result: Pick<MatchResult, "lineDuel" | "keyFactor" | "homeGoals" | "awayGoals" | "userTeamWon" | "userTeamLost">,
): string | undefined {
  const duel = result.lineDuel;

  if (!duel || isExtraTimeFactor(result.keyFactor)) return undefined;

  const onlyOverall = duel.rivalHasOnlyOverall;
  const toRivalDefense = onlyOverall ? "al rival" : "a su defensa";
  const toRivalAttack = onlyOverall ? "al rival" : "a su ataque";
  const rivalAttackName = onlyOverall ? "El rival" : "Su ataque";
  const rivalDefenseName = onlyOverall ? "El rival" : "Su defensa";

  const highGoals = Math.max(result.homeGoals, result.awayGoals);
  const lowGoals = Math.min(result.homeGoals, result.awayGoals);
  const userGoals = result.userTeamLost ? lowGoals : highGoals;
  const rivalGoals = result.userTeamWon ? lowGoals : highGoals;
  const attackEdge = duel.userAttack - duel.rivalDefense;
  const defenseEdge = duel.userDefense - duel.rivalAttack;

  if (result.userTeamWon) {
    if (userGoals >= 2 && attackEdge > 0) return `Tu ataque (${duel.userAttack}) superó ${toRivalDefense} (${duel.rivalDefense}).`;
    if (rivalGoals === 0 && defenseEdge > 0) return `Tu defensa (${duel.userDefense}) frenó ${toRivalAttack} (${duel.rivalAttack}).`;
    return undefined;
  }

  if (result.userTeamLost) {
    if (rivalGoals >= 2 && defenseEdge < 0) return `${rivalAttackName} (${duel.rivalAttack}) superó a tu defensa (${duel.userDefense}).`;
    if (userGoals === 0 && attackEdge < 0) return `${rivalDefenseName} (${duel.rivalDefense}) frenó a tu ataque (${duel.userAttack}).`;
    return undefined;
  }

  if (userGoals === 0 && attackEdge < 0) return `${rivalDefenseName} (${duel.rivalDefense}) frenó a tu ataque (${duel.userAttack}).`;
  return undefined;
}

/** Reparto de los goles esperados, de local a visitante, en porcentaje (v0.25.76). */
export function getMatchDominance(expectedGoals: MatchExpectedGoals): { home: number; away: number; userIsHome: boolean } {
  const { user, rival, userIsHome } = expectedGoals;
  const total = user + rival;
  const homeShare = total > 0 ? (userIsHome ? user : rival) / total : 0.5;
  const home = Math.round(homeShare * 100);

  return { home, away: 100 - home, userIsHome };
}

/** Jugadores que ya han marcado o asistido, para el mini campo. El gol manda sobre la asistencia. */
export function getGoalContributions(goals: Pick<GoalEvent, "scorerName" | "assistName">[]): Record<string, "goal" | "assist"> {
  const contributions: Record<string, "goal" | "assist"> = {};

  for (const goal of goals) {
    if (goal.assistName && !contributions[goal.assistName]) contributions[goal.assistName] = "assist";
  }

  for (const goal of goals) {
    if (goal.scorerName) contributions[goal.scorerName] = "goal";
  }

  return contributions;
}

/**
 * Qué cambió el planteamiento (v0.25.75), comparando con el mismo partido en
 * equilibrado. Habla de los 90 minutos: la prórroga no depende del planteamiento.
 */
export function getMatchApproachEffectText(effect: MatchApproachEffect | undefined): string | undefined {
  if (!effect) return undefined;

  const { approach, userGoals, rivalGoals, balancedUserGoals, balancedRivalGoals } = effect;
  const name = approach === "attacking" ? "ofensivo" : "defensivo";

  if (userGoals === balancedUserGoals && rivalGoals === balancedRivalGoals) {
    return `Planteamiento ${name}: con uno equilibrado, el marcador habría sido el mismo.`;
  }

  const outcome = Math.sign(userGoals - rivalGoals);
  const balancedOutcome = Math.sign(balancedUserGoals - balancedRivalGoals);
  const verb = balancedOutcome > 0 ? "ganado" : balancedOutcome < 0 ? "perdido" : "empatado";
  const score = `${Math.max(balancedUserGoals, balancedRivalGoals)}-${Math.min(balancedUserGoals, balancedRivalGoals)}`;

  if (outcome > balancedOutcome) {
    return `Tu planteamiento ${name} cambió el partido: con uno equilibrado habrías ${verb} ${score} a los 90 minutos.`;
  }

  if (outcome < balancedOutcome) {
    return `Tu planteamiento ${name} te salió caro: con uno equilibrado habrías ${verb} ${score} a los 90 minutos.`;
  }

  return `Planteamiento ${name}: con uno equilibrado también habrías ${verb}, ${score} a los 90 minutos.`;
}

/** Qué cambió la decisión del descanso (v0.25.78), comparando con seguir igual. */
export function getHalfTimeEffectText(effect: MatchHalfTimeEffect | undefined): string | undefined {
  if (!effect) return undefined;

  const { choice, userGoals, rivalGoals, keptUserGoals, keptRivalGoals } = effect;
  const name = choice === "push" ? "Arriesgar" : "Cerrar el partido";

  if (userGoals === keptUserGoals && rivalGoals === keptRivalGoals) {
    return `${name}: sin tocar nada, el marcador habría sido el mismo.`;
  }

  const outcome = Math.sign(userGoals - rivalGoals);
  const keptOutcome = Math.sign(keptUserGoals - keptRivalGoals);
  const verb = keptOutcome > 0 ? "ganado" : keptOutcome < 0 ? "perdido" : "empatado";
  const score = `${Math.max(keptUserGoals, keptRivalGoals)}-${Math.min(keptUserGoals, keptRivalGoals)}`;

  if (outcome > keptOutcome) return `${name} cambió el partido: sin tocar nada habrías ${verb} ${score} a los 90 minutos.`;
  if (outcome < keptOutcome) return `${name} te salió caro: sin tocar nada habrías ${verb} ${score} a los 90 minutos.`;
  return `${name}: sin tocar nada también habrías ${verb}, ${score} a los 90 minutos.`;
}

export function isExtraTimeFactor(factor: MatchKeyFactor | undefined): boolean {
  return factor === "extra_time_win" || factor === "extra_time_loss";
}
