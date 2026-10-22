// src/components/matchPlaybackSpeed.ts
//
// Velocidad de reproducción de las secuencias de partido (v0.24.9k, Fase C).
// Es una preferencia de este navegador: no afecta a la simulación ni a los
// resultados, solo al ritmo con el que se muestran.

import { useSyncExternalStore } from "react";

export type MatchPlaybackSpeed = "slow" | "normal" | "fast";

export const MATCH_PLAYBACK_SPEED_OPTIONS: Array<{ value: MatchPlaybackSpeed; label: string }> = [
  { value: "slow", label: "Lento" },
  { value: "normal", label: "Normal" },
  { value: "fast", label: "Rápido" },
];

const STORAGE_KEY = "once_historico_match_playback_speed_v1";
const DURATION_MULTIPLIERS: Record<MatchPlaybackSpeed, number> = {
  slow: 1.5,
  normal: 1,
  fast: 0.5,
};

function readStoredSpeed(): MatchPlaybackSpeed {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "slow" || stored === "fast" ? stored : "normal";
  } catch {
    return "normal";
  }
}

let currentSpeed: MatchPlaybackSpeed = readStoredSpeed();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMatchPlaybackMultiplier(speed: MatchPlaybackSpeed): number {
  return DURATION_MULTIPLIERS[speed];
}

export function setMatchPlaybackSpeed(speed: MatchPlaybackSpeed): void {
  currentSpeed = speed;

  try {
    window.localStorage.setItem(STORAGE_KEY, speed);
  } catch {
    // Sin almacenamiento (modo privado, cuota): la preferencia dura hasta recargar.
  }

  listeners.forEach((listener) => listener());
}

export function useMatchPlaybackSpeed(): MatchPlaybackSpeed {
  return useSyncExternalStore(subscribe, () => currentSpeed, () => "normal");
}
