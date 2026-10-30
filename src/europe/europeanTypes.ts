// src/europe/europeanTypes.ts
//
// Europa Career Foundation (v0.24.0a) + European Tournament Skeleton (v0.24.1a).
//
// Tipos puros para la base de reglas de clasificación europea y, desde
// v0.24.1a, para el esqueleto de torneo europeo jugable (fase inicial,
// semifinal, final). No incluye todavía calendario UEFA completo de 36
// equipos, eliminatorias ida/vuelta ni ranking europeo global.
//
// Importante: este módulo es independiente del tipo `EuropeanCompetition`
// heredado de `src/types/career.ts` (usado por `getEuropeanQualification` en
// `src/career/careerRules.ts` para decidir si la carrera sobrevive). Ese
// mecanismo interno no se toca en esta fase. Ver docs/v0_24_0c_EUROPA_QUALIFICATION_FOUNDATION.md
// para la justificación de mantener ambos sistemas por separado.

import type { MatchApproachEffect, MatchExpectedGoals, MatchKeyFactor, MatchLineDuel } from "../types/game";

export type EuropeanCompetition =
  | "champions_league"
  | "europa_league"
  | "conference_league";

export type EuropeanQualificationSource =
  | "league_position"
  | "copa_winner"
  | "copa_runner_up_reallocation"
  | "league_reallocation"
  | "none";

export interface EuropeanQualificationResult {
  qualified: boolean;
  competition: EuropeanCompetition | null;
  source: EuropeanQualificationSource;
  label: string;
  shortLabel: string;
  explanation: string;
  priority: number;
}

export interface EuropeanSeasonEntry {
  seasonNumber: number;
  qualified: boolean;
  competition: EuropeanCompetition | null;
  source: EuropeanQualificationSource;
  explanation: string;
  achievedFromLeaguePosition?: number;
  achievedFromCopa?: boolean;
}

// ==========================
// TORNEO EUROPEO (v0.24.1a)
// ==========================

export type EuropeanTournamentPhase =
  | "not_started"
  | "league_phase"
  | "semifinal"
  | "final"
  | "completed"
  | "eliminated";

export type EuropeanMatchStatus = "scheduled" | "played";

export type EuropeanMatchOutcome = "win" | "draw" | "loss";

export interface EuropeanOpponent {
  id: string;
  name: string;
  country: string;
  rating: number;
  tier: EuropeanCompetition;
}

/** Cómo se decidió una eliminatoria a partido único (semifinal o final). */
export type EuropeanKnockoutDecision = "regular_time" | "extra_time" | "penalties";

export interface EuropeanPenaltyShootout {
  userScored: number;
  opponentScored: number;
}

/** Gol del tiempo reglamentario, con minuto para reproducir el partido como en Liga. */
export interface EuropeanGoalEvent {
  minute: number;
  isUserGoal: boolean;
  scorerName?: string;
  /** Solo se muestran en el partido: no suman a las estadísticas de la temporada (v0.25.77). */
  assistName?: string;
}

export interface EuropeanTournamentMatch {
  id: string;
  seasonNumber: number;
  competition: EuropeanCompetition;
  matchday: number;
  phase: EuropeanTournamentPhase;
  opponent: EuropeanOpponent;
  isHome: boolean;
  status: EuropeanMatchStatus;
  /** Marcador final del partido (tras la prórroga si la hubo; sin penaltis). */
  userGoals?: number;
  opponentGoals?: number;
  result?: EuropeanMatchOutcome;
  /** Solo en semifinal/final: cómo se decidió. Ausente en partidos anteriores a v0.24.9f. */
  decidedBy?: EuropeanKnockoutDecision;
  /** Marcador a los 90' cuando hubo prórroga o penaltis. */
  regularTimeUserGoals?: number;
  regularTimeOpponentGoals?: number;
  penaltyShootout?: EuropeanPenaltyShootout;
  /** Goles del tiempo reglamentario con minuto. Ausente en partidos anteriores a v0.25.51. */
  goalEvents?: EuropeanGoalEvent[];
  /** Factor que decidió el partido (v0.25.74). */
  keyFactor?: MatchKeyFactor;
  /** Qué cambió el planteamiento (v0.25.75). */
  approachEffect?: MatchApproachEffect;
  /** Goles esperados del partido (v0.25.76). */
  expectedGoals?: MatchExpectedGoals;
  /** Tus líneas contra el nivel del rival (v0.25.77). */
  lineDuel?: MatchLineDuel;
}

export interface EuropeanTournamentState {
  seasonNumber: number;
  competition: EuropeanCompetition;
  phase: EuropeanTournamentPhase;
  matches: EuropeanTournamentMatch[];
  leaguePhasePoints: number;
  leaguePhasePlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  qualifiedForSemifinal: boolean;
  eliminated: boolean;
  completed: boolean;
  champion: boolean;
  europeanTrophyAwarded?: boolean;
  europeanTrophyAwardedAt?: string;
  europeanPrestigeAwarded?: boolean;
  europeanPrestigeAwardedAt?: string;
  currentMatchId?: string | null;
}

export interface EuropeanCareerState {
  currentQualification?: EuropeanSeasonEntry | null;
  history: EuropeanSeasonEntry[];
  bestCompetition?: EuropeanCompetition | null;
  totalQualifications: number;
  currentTournament?: EuropeanTournamentState | null;
}
