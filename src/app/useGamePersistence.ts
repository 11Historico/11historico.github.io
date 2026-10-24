// src/app/useGamePersistence.ts

import { useEffect } from "react";
import { saveGameState } from "../storage/localGameStorage";

export type GameSnapshot = Parameters<typeof saveGameState>[0];

/**
 * Guarda la partida cada vez que cambia la instantánea. Se desactiva en pantallas sin partida
 * (inicio y entrada a la carrera), igual que antes.
 */
export function useGamePersistence(snapshot: GameSnapshot, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    saveGameState(snapshot);
  }, [snapshot, enabled]);
}
