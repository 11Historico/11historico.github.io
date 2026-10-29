// src/types/game.ts

// ==========================
// POSICIONES
// ==========================

export type GoalkeeperPosition = "POR";

export type DefenderPosition =
  | "LD"
  | "DFC"
  | "LI"
  | "CAD"
  | "CAI";

export type MidfielderPosition =
  | "MCD"
  | "MC"
  | "MP"
  | "MI"
  | "MD";

export type ForwardPosition =
  | "EI"
  | "ED"
  | "SD"
  | "DC";

export type PlayerPosition =
  | GoalkeeperPosition
  | DefenderPosition
  | MidfielderPosition
  | ForwardPosition;

export type FormationSlotId = string;

export type TacticalSlotLabel =
  | "POR"
  | "LD"
  | "LI"
  | "DFC-D"
  | "DFC-C"
  | "DFC-I"
  | "CAD"
  | "CAI"
  | "MCD"
  | "MC"
  | "MC-D"
  | "MC-C"
  | "MC-I"
  | "MP"
  | "MI"
  | "MD"
  | "EI"
  | "ED"
  | "SD"
  | "DC"
  | "DC-D"
  | "DC-I";

// ==========================
// TEMPORADAS
// ==========================

export type SeasonId = string;

// ==========================
// DIFICULTAD
// ==========================

export type GameDifficulty = "normal" | "dificil" | "leyenda";

export type EasyModeSeasonRangeId =
  | "all"
  | "classic"
  | "transition"
  | "modern"
  | "recent";

export interface GameDifficultyOption {
  id: GameDifficulty;
  label: string;
  description: string;
}

export type RatingMethod = "official" | "stats" | "mixed" | "manual_estimate";

export interface DataSource {
  id: string;
  name: string;
  url: string;
  type:
    | "official_squad"
    | "official_matches"
    | "stats"
    | "market_reference"
    | "historical_reference"
    | "manual_review";
  description: string;
}

export interface Season {
  id: SeasonId;
  label: string;
  startYear: number;
  endYear: number;
}

// ==========================
// SKILLS DE JUGADOR
// ==========================

export interface PlayerSkills {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  goalkeeping: number;
  mentality: number;
}

export interface PlayerSeason {
  id: string;
  playerId: string;
  /** ID estable para bloquear duplicados reales entre temporadas o nombres abreviados. */
  canonicalPlayerId: string;
  name: string;
  season: SeasonId;
  positions: PlayerPosition[];

  /**
   * Afinidad táctica fina para slots concretos de una formación (p. ej. distinguir
   * DFC-I de DFC-D dentro de la familia genérica "DFC" de `positions`).
   * IMPORTANTE (desde v0.12.26, ver docs/v0_12_26_position_rules_engine.md): esta lista
   * es puramente ADITIVA, nunca restrictiva. `resolvePlayerSlotPlacement` la une con
   * `positions`, así que declarar aquí solo ["DFC-I", "DFC-C"] NO impide que el jugador
   * ocupe un slot "DFC-D": su posición genérica "DFC" ya lo permite por sí sola, porque
   * cada slot DFC-* acepta explícitamente la etiqueta "DFC" (ver `getExplicitAcceptedLabelsForSlot`
   * en src/domain/positionRules.ts). Es deliberado: v0.12.26 eliminó la validación dura
   * basada en tacticalSlotLabels precisamente porque rechazaba jugadores que sí debían
   * poder jugar ahí. Si no se informa, el jugador puede ocupar cualquier slot compatible
   * con sus posiciones generales.
   */
  tacticalSlotLabels?: TacticalSlotLabel[];

  matches: number;
  minutes: number;
  goals?: number;
  assists?: number;
  skills: PlayerSkills;
  overall: number;
  dataConfidence: number;
  ratingMethod: RatingMethod;
  sourceRefs: string[];
  notes?: string;
}

// ==========================
// ENTRENADORES
// ==========================

export interface CoachSkills {
  attack: number;
  defense: number;
  management: number;
  mentality: number;
  cup?: number;
  europe?: number;
}

export interface CoachSeason {
  id: string;
  coachId: string;
  name: string;
  season: SeasonId;
  skills: CoachSkills;
  overall: number;
  dataConfidence: number;
  ratingMethod: RatingMethod;
  sourceRefs: string[];
  notes?: string;
}

// ==========================
// PLANTILLA ATHLETIC POR TEMPORADA
// ==========================

export interface AthleticSeasonSquad {
  season: SeasonId;
  players: PlayerSeason[];
  coach: CoachSeason;
}

// ==========================
// FORMACIONES
// ==========================

export interface FormationSlot {
  id: FormationSlotId;
  label: TacticalSlotLabel;
  allowedPositions: PlayerPosition[];
  line: "goalkeeper" | "defense" | "midfield" | "attack";
}

export interface FormationModifiers {
  attack: number;
  defense: number;
  control: number;
  risk: number;
}

export interface Formation {
  id: string;
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  slots: FormationSlot[];
  modifiers: FormationModifiers;
}

// ==========================
// SELECCIÓN DEL USUARIO
// ==========================

export interface SelectedPlayer {
  slotId: FormationSlotId;
  position: PlayerPosition;
  playerSeason: PlayerSeason;
}

export interface SelectedCoach {
  coachSeason: CoachSeason;
}

// ==========================
// RONDAS
// ==========================

export type GamePhase =
  | "formation_selection"
  | "player_selection"
  | "coach_selection"
  | "team_summary"
  | "league_simulation"
  | "finished";

export interface PlayerRound {
  roundNumber: number;
  season: SeasonId;
  completed: boolean;
  selectedPlayer?: SelectedPlayer;
}

export interface CoachRound {
  availableCoaches: CoachSeason[];
  completed: boolean;
  selectedCoach?: SelectedCoach;
}

// ==========================
// RATINGS DEL EQUIPO CREADO
// ==========================

export interface TeamRating {
  attack: number;
  defense: number;
  control: number;
  physical: number;
  mentality: number;
  goalkeeping: number;
  overall: number;
  profileLabel: string;
  strengths: string[];
  weaknesses: string[];
}

// ==========================
// EQUIPOS RIVALES 25/26
// ==========================

export interface RivalTeamRatings {
  attack: number;
  midfield: number;
  defense: number;
  goalkeeping: number;
  mentality: number;
  overall: number;
}

export interface RivalTeam {
  id: string;
  name: string;
  shirtIcon: string;
  ratings: RivalTeamRatings;
}

// ==========================
// CALENDARIO LIGA
// ==========================

export type MatchSide = "home" | "away";

export interface LeagueFixture {
  id: string;
  matchday: number;
  homeTeamId: string;
  awayTeamId: string;
  includesUserTeam: boolean;
}

// ==========================
// COPA DEL REY
// ==========================

export type CompetitionType = "league" | "cup";

export type CupStatus = "active" | "won" | "eliminated";

export type CupRoundId =
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "final";

export interface CupFixture {
  id: string;
  roundId: CupRoundId;
  roundName: string;
  order: number;
  gateMatchday: number;
  rivalTeamId: string;
  venue: MatchSide;
  played: boolean;
}

export interface CupSimulationState {
  status: CupStatus;
  currentRoundIndex: number;
  fixtures: CupFixture[];
  results: MatchResult[];

  /** Campeón real/simulado del torneo completo. */
  championTeamId?: string;
  championTeamName?: string;

  /** Subcampeón real/simulado del torneo completo. */
  runnerUpTeamId?: string;
  runnerUpTeamName?: string;

  /** Ronda en la que cayó el Athletic Club Histórico, si fue eliminado. */
  userEliminatedRoundName?: string;

  /** Partidos simulados tras la eliminación del usuario para cerrar el cuadro. */
  simulatedRemainingResults?: MatchResult[];
}

// ==========================
// RESULTADO DE PARTIDO
// ==========================

export interface GoalEvent {
  minute: number;
  teamName: string;
  scorerName?: string;
  assistName?: string;
}

/**
 * Factor que decidió el partido según lo que pasó en el motor (v0.25.74).
 * Solo explica el resultado: calcularlo no cambia ningún marcador.
 */
export type MatchKeyFactor =
  | "mentality_win"
  | "mentality_loss"
  | "lead_lost"
  | "upset"
  | "overconfidence"
  | "giant_killing"
  | "attack_win"
  | "clean_sheet_win"
  | "home_win"
  | "away_win"
  | "away_draw"
  | "even_draw"
  | "stronger_rival"
  | "away_loss"
  | "bad_day"
  | "extra_time_win"
  | "extra_time_loss";

export interface MatchResult {
  fixtureId: string;
  matchday: number;
  competition?: CompetitionType;
  roundName?: string;

  homeTeamName: string;
  awayTeamName: string;

  homeGoals: number;
  awayGoals: number;

  goalEvents: GoalEvent[];

  userTeamPlayed: boolean;
  userTeamWon?: boolean;
  userTeamDrew?: boolean;
  userTeamLost?: boolean;

  cleanSheetForUserTeam?: boolean;
  keyFactor?: MatchKeyFactor;
}

// ==========================
// CLASIFICACIÓN
// ==========================

export interface LeagueTableRow {
  teamId: string;
  teamName: string;

  played: number;
  won: number;
  drawn: number;
  lost: number;

  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;

  points: number;
}

export interface LeagueSimulationState {
  currentMatchday: number;
  fixtures: LeagueFixture[];
  results: MatchResult[];
  table: LeagueTableRow[];
  completed: boolean;
}

// ==========================
// ESTADÍSTICAS DEL ATHLETIC HISTÓRICO
// ==========================

export interface UserPlayerSeasonStats {
  playerId: string;
  canonicalPlayerId?: string;
  playerName: string;
  goals: number;
  assists: number;
  cleanSheets: number;
}

export interface UserTeamSeasonStats {
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  topScorers: UserPlayerSeasonStats[];
  topAssisters: UserPlayerSeasonStats[];
}

// ==========================
// ESTADO COMPLETO DE PARTIDA
// ==========================

export interface GameState {
  id: string;
  userId?: string;
  phase: GamePhase;
  createdAt: string;
  updatedAt: string;
  selectedFormation?: Formation;
  playerRounds: PlayerRound[];
  coachRound?: CoachRound;
  selectedPlayers: SelectedPlayer[];
  selectedCoach?: SelectedCoach;
  teamRating?: TeamRating;
  leagueSimulation?: LeagueSimulationState;
  cupSimulation?: CupSimulationState;
  userTeamStats?: UserTeamSeasonStats;
  finished: boolean;
}

// ==========================
// PALMARÉS
// ==========================

export type TrophyId =
  | "liga"
  | "copa_del_rey"
  | "champions"
  | "europa_league"
  | "conference_league"
  | "supercopa";

export interface TrophyCount {
  id: TrophyId;
  label: string;
  count: number;
}

// ==========================
// RESULTADO FINAL
// ==========================

export interface FinalGameSummary {
  gameId: string;
  formationName: string;
  coachName: string;
  difficulty?: GameDifficulty;

  leaguePosition: number;
  points: number;
  wins: number;
  draws: number;
  losses: number;

  goalsFor: number;
  goalsAgainst: number;

  topScorer?: UserPlayerSeasonStats;
  topAssister?: UserPlayerSeasonStats;
  cleanSheets: number;

  table?: LeagueTableRow[];

  cupStatus?: CupStatus;
  cupRoundReached?: string;
  cupResults?: MatchResult[];
  cupTrophyWon?: boolean;
  cupChampionTeamId?: string;
  cupChampionTeamName?: string;
  cupRunnerUpTeamId?: string;
  cupRunnerUpTeamName?: string;
  cupUserEliminatedRoundName?: string;
  cupSimulatedRemainingResults?: MatchResult[];

  trophiesWon?: TrophyCount[];

  finalLabel: string;
  finalCategory: string;
}


