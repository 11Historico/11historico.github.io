// src/app/appScreen.ts

import type { GamePhase } from "../types/game";

export type AppScreen =
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
