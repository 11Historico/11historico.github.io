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
    description: "Tu equipo recibe +2 de valoración en los partidos. Puedes elegir el rango de temporadas del draft.",
  },
  {
    id: "dificil",
    label: "Normal",
    description: "Sin ajustes en tu equipo. Ganar la Liga cuesta, pero es posible.",
  },
  {
    id: "leyenda",
    label: "Leyenda",
    description: "Tu equipo recibe −4 de valoración en los partidos. Madrid, Barça y Atlético aprietan de verdad.",
  },
];

