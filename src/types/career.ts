import type { Formation, FormationSlot, MatchResult, RivalTeam, SelectedCoach, SelectedPlayer, SeasonId, TeamRating } from "./game";

export type EuropeanCompetition =
  | "champions"
  | "europa_league"
  | "conference"
  | "none";

export type CareerTrophy =
  | "champions"
  | "liga"
  | "europa_league"
  | "copa"
  | "conference"
  | "supercopa";

export interface CareerTrophyCounts {
  champions: number;
  liga: number;
  europaLeague: number;
  copa: number;
  conference: number;
  supercopa: number;
}

export interface CareerSeasonResult {
  seasonLabel: string;
  leaguePosition: number;
  wonLeague: boolean;
  wonCopa: boolean;
  wonSupercopa: boolean;
  isRelegated: boolean;
  europeanQualification: EuropeanCompetition;
  /** Posición en Liga del campeón de Copa externo (null si ganó el usuario o no se conoce). */
  copaWinnerLeaguePosition?: number | null;
}

export interface CareerObjectiveResult {
  survives: boolean;
  reason: string;
  isGameOver: boolean;
  qualifiedForEurope: boolean;
  wonCopa: boolean;
  isRelegated: boolean;
}


export type CareerSupercopaParticipantSource =
  | "league_champion"
  | "league_runner_up"
  | "cup_champion"
  | "cup_runner_up"
  | "league_replacement";

export interface CareerSupercopaParticipant {
  teamId: string;
  teamName: string;
  source: CareerSupercopaParticipantSource;
  sourceLabel: string;
}

export interface CareerSupercopaQualification {
  seasonLabel: string;
  participants: CareerSupercopaParticipant[];
  userQualified: boolean;
  reason: string;
}

export interface CareerSupercopaResult {
  seasonLabel: string;
  participants: CareerSupercopaParticipant[];
  results: MatchResult[];
  played: boolean;
  won: boolean;
  eliminatedRoundName?: "Semifinal" | "Final";
  championTeamId: string;
  championTeamName: string;
  runnerUpTeamId?: string;
  runnerUpTeamName?: string;
}

export interface CareerPromotionTransition {
  relegated: RivalTeam[];
  promoted: RivalTeam[];
  secondDivisionPool: RivalTeam[];
}

export interface CareerRewardSnapshot {
  selectedFormation?: Formation;
  selectedPlayers: SelectedPlayer[];
  selectedCoach?: SelectedCoach;
  teamRating?: TeamRating;
  mediaXi: number;
  careerSeasonRatingBonus: number;
  careerSeasonLabel: string;
  careerCompletedSeasons: number;
  careerTrophyCounts: CareerTrophyCounts;
  careerLeagueRivals: RivalTeam[];
  careerSecondDivisionPool: RivalTeam[];
  careerPromotionTransition?: CareerPromotionTransition;
  careerPendingSupercopa?: CareerSupercopaQualification;
  careerCurrentSupercopaResult?: CareerSupercopaResult;
  playerRoundSeasons: SeasonId[];
  currentRoundIndex: number;
  savedAt: string;
}


export interface CareerLocalRankingEntry {
  id: string;
  completedSeasons: number;
  arcadeScore: number;
  palmaresScore: number;
  survivalScore: number;
  trophyCounts: CareerTrophyCounts;
  bestLeaguePosition: number;
  lastSeasonLabel: string;
  lastLeaguePosition: number;
  gameVersion: string;
  createdAt: string;
}

export interface CareerGlobalRankingSubmitPayload {
  careerId: string;
  nick: string;
  completedSeasons: number;
  arcadeScore: number;
  palmaresScore: number;
  survivalScore: number;
  trophyCounts: CareerTrophyCounts;
  bestLeaguePosition: number;
  lastSeasonLabel: string;
  lastLeaguePosition: number;
  gameVersion: string;
  createdAt: string;
  submittedAt: string;
}

export interface CareerGlobalRankingEntry extends CareerLocalRankingEntry {
  careerId: string;
  nick: string;
  submittedAt: string;
}

export interface CareerState {
  currentSeasonIndex: number;
  currentSeasonLabel: string;
  completedSeasons: number;
  trophyCounts: CareerTrophyCounts;
  lastSeasonResult?: CareerSeasonResult;
  secondDivisionPool: RivalTeam[];
  lastPromotionTransition?: CareerPromotionTransition;
}

export type CareerRewardChoice = "player" | "coach";

export type CareerRewardFlow =
  | "standard_player"
  | "standard_coach"
  | "player_formation"
  | "coach_bonus"
  | "luck_wheel_player"
  | "luck_wheel_coach";

export interface FormationLineCounts {
  goalkeeper: number;
  defense: number;
  midfield: number;
  attack: number;
}

export interface FormationChangeEligibility {
  canChange: boolean;
  reason: string;
  from: Formation["id"];
  to: Formation["id"];
  removedLine?: FormationSlot["line"];
  addedLine?: FormationSlot["line"];
}
