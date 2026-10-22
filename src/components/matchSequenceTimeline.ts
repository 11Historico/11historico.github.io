// src/components/matchSequenceTimeline.ts
//
// Secuencia de partido (v0.24.9i, Fase A): lógica pura de la línea de tiempo.
// Convierte el tiempo transcurrido en fotograma (fase, minuto y goles visibles)
// usando solo los `goalEvents` que ya genera el motor. No cambia la simulación.

import type { GoalEvent } from "../types/game";

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

export function getMatchSequenceFrame(goalEvents: GoalEvent[], elapsedMs: number): MatchSequenceFrame {
  const sortedGoals = [...goalEvents].sort((a, b) => a.minute - b.minute);

  if (elapsedMs >= MATCH_SEQUENCE_DURATION_MS) {
    return { stage: "final", minute: MATCH_MINUTES, visibleGoals: sortedGoals };
  }

  if (elapsedMs < MATCH_SEQUENCE_PREVIEW_MS) {
    return { stage: "preview", minute: 0, visibleGoals: [] };
  }

  // El reloj llega como mínimo a 90' y, si hay descuento, hasta el último gol.
  // Se reparte en lastMinute + 1 tramos para que el último minuto sí se muestre antes del final.
  const lastMinute = Math.max(MATCH_MINUTES, ...sortedGoals.map((goal) => goal.minute));
  const playProgress = (elapsedMs - MATCH_SEQUENCE_PREVIEW_MS) / MATCH_SEQUENCE_PLAY_MS;
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
