import type {
  CareerSupercopaParticipant,
  CareerSupercopaQualification,
  CareerSupercopaResult,
} from "../types/career";
import type {
  FinalGameSummary,
  LeagueTableRow,
  MatchResult,
  RivalTeam,
  SelectedPlayer,
  TeamRating,
} from "../types/game";
import { USER_TEAM_ID } from "../data/laliga2526Teams";
import { USER_TEAM_NAME } from "../simulation/leagueTable";
import { simulateMatch } from "../simulation/matchEngine";

function sortTable(table: LeagueTableRow[] = []): LeagueTableRow[] {
  return [...table].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });
}

function sourceLabel(source: CareerSupercopaParticipant["source"]): string {
  if (source === "league_champion") return "1.º Liga";
  if (source === "league_runner_up") return "2.º Liga";
  if (source === "cup_champion") return "Campeón Copa";
  if (source === "cup_runner_up") return "Subcampeón Copa";
  return "Relevo por Liga";
}

function addParticipant(
  participants: CareerSupercopaParticipant[],
  usedIds: Set<string>,
  teamId: string | undefined,
  teamName: string | undefined,
  source: CareerSupercopaParticipant["source"],
): void {
  if (!teamId || !teamName || usedIds.has(teamId) || participants.length >= 4) return;

  participants.push({
    teamId,
    teamName,
    source,
    sourceLabel: sourceLabel(source),
  });
  usedIds.add(teamId);
}

export function createCareerSupercopaQualification(params: {
  seasonLabel: string;
  previousSummary: FinalGameSummary;
}): CareerSupercopaQualification {
  const { seasonLabel, previousSummary } = params;
  const sortedTable = sortTable(previousSummary.table);
  const participants: CareerSupercopaParticipant[] = [];
  const usedIds = new Set<string>();
  const leagueChampion = sortedTable[0];
  const leagueRunnerUp = sortedTable[1];

  addParticipant(participants, usedIds, leagueChampion?.teamId, leagueChampion?.teamName, "league_champion");
  addParticipant(participants, usedIds, leagueRunnerUp?.teamId, leagueRunnerUp?.teamName, "league_runner_up");
  addParticipant(participants, usedIds, previousSummary.cupChampionTeamId, previousSummary.cupChampionTeamName, "cup_champion");
  addParticipant(participants, usedIds, previousSummary.cupRunnerUpTeamId, previousSummary.cupRunnerUpTeamName, "cup_runner_up");

  for (const row of sortedTable) {
    if (participants.length >= 4) break;
    addParticipant(participants, usedIds, row.teamId, row.teamName, "league_replacement");
  }

  const userQualified = participants.some((participant) => participant.teamId === USER_TEAM_ID);

  return {
    seasonLabel,
    participants,
    userQualified,
    reason: userQualified
      ? "Athletic clasificado para Supercopa por Liga o Copa."
      : "Athletic no juega Supercopa: entran 1.º y 2.º de Liga y finalistas de Copa.",
  };
}

function seededRandom(seed: number): number {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1000003;
  }
  return hash;
}

function createFallbackRival(participant: CareerSupercopaParticipant): RivalTeam {
  const overall = participant.source === "league_replacement" ? 80 : 84;
  return {
    id: participant.teamId,
    name: participant.teamName,
    shirtIcon: "white_shirt",
    ratings: {
      attack: overall,
      midfield: overall,
      defense: overall,
      goalkeeping: overall,
      mentality: overall,
      overall,
    },
  };
}

function findRival(participant: CareerSupercopaParticipant, rivals: RivalTeam[]): RivalTeam {
  return rivals.find((rival) => rival.id === participant.teamId) ?? createFallbackRival(participant);
}

function participantBySource(
  participants: CareerSupercopaParticipant[],
  source: CareerSupercopaParticipant["source"],
): CareerSupercopaParticipant | undefined {
  return participants.find((participant) => participant.source === source);
}

function createPairings(participants: CareerSupercopaParticipant[]): [CareerSupercopaParticipant, CareerSupercopaParticipant][] {
  const ordered: CareerSupercopaParticipant[] = [];
  const usedIds = new Set<string>();

  const push = (participant?: CareerSupercopaParticipant) => {
    if (!participant || usedIds.has(participant.teamId)) return;
    ordered.push(participant);
    usedIds.add(participant.teamId);
  };

  push(participantBySource(participants, "league_champion"));
  push(participantBySource(participants, "cup_runner_up"));
  push(participantBySource(participants, "cup_champion"));
  push(participantBySource(participants, "league_runner_up"));

  for (const participant of participants) push(participant);

  return [
    [ordered[0], ordered[1]],
    [ordered[2], ordered[3]],
  ].filter((pair): pair is [CareerSupercopaParticipant, CareerSupercopaParticipant] => Boolean(pair[0] && pair[1]));
}

function getWinnerFromUserMatch(params: {
  result: MatchResult;
  userParticipant: CareerSupercopaParticipant;
  rivalParticipant: CareerSupercopaParticipant;
}): CareerSupercopaParticipant {
  const { result, userParticipant, rivalParticipant } = params;
  if (result.userTeamWon) return userParticipant;
  return rivalParticipant;
}

function forceKnockoutWinner(params: {
  result: MatchResult;
  userParticipant: CareerSupercopaParticipant;
  rivalParticipant: CareerSupercopaParticipant;
  teamRating: TeamRating;
  rival: RivalTeam;
  seed: number;
}): { result: MatchResult; winner: CareerSupercopaParticipant } {
  const { result, userParticipant, rivalParticipant, teamRating, rival, seed } = params;

  if (!result.userTeamDrew) {
    return {
      result,
      winner: getWinnerFromUserMatch({ result, userParticipant, rivalParticipant }),
    };
  }

  const userChance = Math.max(0.35, Math.min(0.66, 0.5 + (teamRating.overall - rival.ratings.overall) / 60));
  const userWins = seededRandom(seed) < userChance;
  const userIsHome = result.homeTeamName === USER_TEAM_NAME;
  const nextResult: MatchResult = {
    ...result,
    homeGoals: result.homeGoals + (userWins === userIsHome ? 1 : 0),
    awayGoals: result.awayGoals + (userWins !== userIsHome ? 1 : 0),
    userTeamWon: userWins,
    userTeamDrew: false,
    userTeamLost: !userWins,
  };

  return {
    result: nextResult,
    winner: userWins ? userParticipant : rivalParticipant,
  };
}

function simulateUserSupercopaMatch(params: {
  roundName: "Semifinal" | "Final";
  home: CareerSupercopaParticipant;
  away: CareerSupercopaParticipant;
  teamRating: TeamRating;
  selectedPlayers: SelectedPlayer[];
  rivals: RivalTeam[];
  seed: number;
}): { result: MatchResult; winner: CareerSupercopaParticipant } {
  const { roundName, home, away, teamRating, selectedPlayers, rivals, seed } = params;
  const userIsHome = home.teamId === USER_TEAM_ID;
  const userParticipant = userIsHome ? home : away;
  const rivalParticipant = userIsHome ? away : home;
  const rival = findRival(rivalParticipant, rivals);

  const rawResult = simulateMatch({
    fixtureId: `supercopa_${roundName.toLowerCase()}_${home.teamId}_vs_${away.teamId}`,
    matchday: 0,
    userTeamName: USER_TEAM_NAME,
    rival,
    venue: userIsHome ? "home" : "away",
    teamRating,
    selectedPlayers,
    seed,
  });

  return forceKnockoutWinner({
    result: {
      ...rawResult,
      roundName: `Supercopa · ${roundName}`,
    },
    userParticipant,
    rivalParticipant,
    teamRating,
    rival,
    seed: seed + 911,
  });
}

function simulateRivalSupercopaMatch(params: {
  roundName: "Semifinal" | "Final";
  home: CareerSupercopaParticipant;
  away: CareerSupercopaParticipant;
  rivals: RivalTeam[];
  seed: number;
}): { result: MatchResult; winner: CareerSupercopaParticipant } {
  const { roundName, home, away, rivals, seed } = params;
  const homeRival = findRival(home, rivals);
  const awayRival = findRival(away, rivals);
  const homePower = homeRival.ratings.overall + seededRandom(seed + hashString(home.teamId)) * 6;
  const awayPower = awayRival.ratings.overall + seededRandom(seed + hashString(away.teamId)) * 6;
  const homeGoalsBase = homePower >= awayPower ? 2 : 1;
  const awayGoalsBase = awayPower >= homePower ? 2 : 1;
  let homeGoals = Math.max(0, Math.round(homeGoalsBase + seededRandom(seed + 13) * 2 - 1));
  let awayGoals = Math.max(0, Math.round(awayGoalsBase + seededRandom(seed + 29) * 2 - 1));

  if (homeGoals === awayGoals) {
    if (homePower >= awayPower) homeGoals += 1;
    else awayGoals += 1;
  }

  const winner = homeGoals > awayGoals ? home : away;

  return {
    winner,
    result: {
      fixtureId: `supercopa_${roundName.toLowerCase()}_${home.teamId}_vs_${away.teamId}`,
      matchday: 0,
      roundName: `Supercopa · ${roundName}`,
      homeTeamName: home.teamName,
      awayTeamName: away.teamName,
      homeGoals,
      awayGoals,
      goalEvents: [],
      userTeamPlayed: false,
    },
  };
}

function simulateSupercopaMatch(params: {
  roundName: "Semifinal" | "Final";
  home: CareerSupercopaParticipant;
  away: CareerSupercopaParticipant;
  teamRating: TeamRating;
  selectedPlayers: SelectedPlayer[];
  rivals: RivalTeam[];
  seed: number;
}): { result: MatchResult; winner: CareerSupercopaParticipant } {
  const { home, away } = params;
  if (home.teamId === USER_TEAM_ID || away.teamId === USER_TEAM_ID) {
    return simulateUserSupercopaMatch(params);
  }

  return simulateRivalSupercopaMatch(params);
}

export function simulateCareerSupercopa(params: {
  qualification: CareerSupercopaQualification;
  teamRating: TeamRating;
  selectedPlayers: SelectedPlayer[];
  rivals: RivalTeam[];
  seed?: number;
}): CareerSupercopaResult {
  const { qualification, teamRating, selectedPlayers, rivals, seed = Date.now() } = params;
  const pairings = createPairings(qualification.participants);
  const results: MatchResult[] = [];

  if (pairings.length < 2) {
    return {
      seasonLabel: qualification.seasonLabel,
      participants: qualification.participants,
      results,
      played: false,
      won: false,
      championTeamId: "",
      championTeamName: "Sin datos",
    };
  }

  const semi1 = simulateSupercopaMatch({
    roundName: "Semifinal",
    home: pairings[0][0],
    away: pairings[0][1],
    teamRating,
    selectedPlayers,
    rivals,
    seed: seed + 101,
  });
  results.push(semi1.result);

  const semi2 = simulateSupercopaMatch({
    roundName: "Semifinal",
    home: pairings[1][0],
    away: pairings[1][1],
    teamRating,
    selectedPlayers,
    rivals,
    seed: seed + 202,
  });
  results.push(semi2.result);

  const final = simulateSupercopaMatch({
    roundName: "Final",
    home: semi1.winner,
    away: semi2.winner,
    teamRating,
    selectedPlayers,
    rivals,
    seed: seed + 303,
  });
  results.push(final.result);

  const userWon = final.winner.teamId === USER_TEAM_ID;
  const userSemi = [semi1, semi2].find(
    (semi) => semi.result.homeTeamName === USER_TEAM_NAME || semi.result.awayTeamName === USER_TEAM_NAME,
  );
  const userReachedFinal = final.result.homeTeamName === USER_TEAM_NAME || final.result.awayTeamName === USER_TEAM_NAME;
  const eliminatedRoundName = userWon ? undefined : userReachedFinal ? "Final" : userSemi ? "Semifinal" : undefined;
  const runnerUp = final.winner.teamId === semi1.winner.teamId ? semi2.winner : semi1.winner;

  return {
    seasonLabel: qualification.seasonLabel,
    participants: qualification.participants,
    results,
    played: true,
    won: userWon,
    eliminatedRoundName,
    championTeamId: final.winner.teamId,
    championTeamName: final.winner.teamName,
    runnerUpTeamId: runnerUp.teamId,
    runnerUpTeamName: runnerUp.teamName,
  };
}
