// src/components/matchSequenceTimeline.ts
//
// Secuencia de partido (v0.24.9i, Fase A): lógica pura de la línea de tiempo.
// Convierte el tiempo transcurrido en fotograma (fase, minuto y goles visibles)
// usando solo los `goalEvents` que ya genera el motor. No cambia la simulación.

import type { GoalEvent, MatchResult } from "../types/game";

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
