// src/config/difficultyOptions.ts
//
// Opciones de dificultad de la portada y de la pantalla de entrada a la carrera.

import type { GameDifficulty } from "../types/game";

export interface DifficultyOption {
  id: GameDifficulty;
  label: string;
  description: string;
}

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    id: "normal",
    label: "Fácil",
    description: "Más accesible. Permite elegir el rango histórico del draft.",
  },
  {
    id: "dificil",
    label: "Normal",
    description: "Equilibrado. Ganar la Liga cuesta, pero es posible.",
  },
  {
    id: "leyenda",
    label: "Leyenda",
    description: "Madrid, Barça y Atlético aprietan de verdad.",
  },
];

