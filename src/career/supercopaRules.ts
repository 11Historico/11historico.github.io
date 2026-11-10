import type {
  CareerSupercopaParticipant,
  CareerSupercopaQualification,
  CareerSupercopaResult,
} from "../types/career";
import type {
  CoachSkills,
  FinalGameSummary,
  GoalEvent,
  LeagueTableRow,
  MatchApproach,
  MatchLineDuel,
  MatchResult,
  RivalTeam,
  SelectedPlayer,
  TeamRating,
} from "../types/game";
import { USER_TEAM_ID } from "../data/laliga2526Teams";
import type { CupBracketRound } from "../simulation/leagueSimulator";
import { USER_TEAM_NAME } from "../simulation/leagueTable";
import { estimateMatchOdds, getMatchLineDuel, simulateMatch, type MatchCardEffect, type MatchOdds, type MatchVenue } from "../simulation/matchEngine";

/** Prórroga de la Supercopa con la carta Portero inspirado (v0.25.108), como en la Copa. */
const CARD_SHOOTOUT_WIN_CHANCE = 0.8;

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
      ? "Tu equipo se clasifica para la Supercopa por Liga o Copa."
      : "Tu equipo no juega la Supercopa: entran 1.º y 2.º de Liga y finalistas de Copa.",
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
  /** Carta Portero inspirado (v0.25.108). */
  inspiredGoalkeeper?: boolean;
}): { result: MatchResult; winner: CareerSupercopaParticipant } {
  const { result, userParticipant, rivalParticipant, teamRating, rival, seed, inspiredGoalkeeper } = params;

  if (!result.userTeamDrew) {
    return {
      result,
      winner: getWinnerFromUserMatch({ result, userParticipant, rivalParticipant }),
    };
  }

  const userChance = inspiredGoalkeeper ? CARD_SHOOTOUT_WIN_CHANCE : Math.max(0.35, Math.min(0.66, 0.5 + (teamRating.overall - rival.ratings.overall) / 60));
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

  // El gol que decide el empate se muestra como gol de la prórroga (91'-119', v0.25.74),
  // con una tirada aparte: el ganador y el marcador no cambian.
  const decidingTeamName = userWins === userIsHome ? result.homeTeamName : result.awayTeamName;
  const extraTimeMinute = 91 + Math.floor(seededRandom(seed + 7) * 29);

  return {
    result: {
      ...nextResult,
      goalEvents: [...nextResult.goalEvents, { minute: extraTimeMinute, teamName: decidingTeamName }],
      keyFactor: userWins ? "extra_time_win" : "extra_time_loss",
    },
    winner: userWins ? userParticipant : rivalParticipant,
  };
}

/** Goles con minuto que suman el marcador de un partido entre rivales. Siempre determinista. */
function buildRivalGoalEvents(params: {
  homeTeamName: string;
  awayTeamName: string;
  homeGoals: number;
  awayGoals: number;
  seed: number;
}): GoalEvent[] {
  const { homeTeamName, awayTeamName, homeGoals, awayGoals, seed } = params;
  const scorers = [
    ...Array.from({ length: homeGoals }, () => homeTeamName),
    ...Array.from({ length: awayGoals }, () => awayTeamName),
  ];

  return scorers
    .map((teamName, index) => ({
      minute: 1 + Math.floor(seededRandom(seed + 101 + index * 17) * 90),
      teamName,
    }))
    .sort((a, b) => a.minute - b.minute);
}

function simulateUserSupercopaMatch(params: {
  roundName: "Semifinal" | "Final";
  home: CareerSupercopaParticipant;
  away: CareerSupercopaParticipant;
  teamRating: TeamRating;
  selectedPlayers: SelectedPlayer[];
  rivals: RivalTeam[];
  seed: number;
  approach?: MatchApproach;
  coachSkills?: CoachSkills;
  card?: MatchCardEffect;
}): { result: MatchResult; winner: CareerSupercopaParticipant } {
  const { roundName, home, away, teamRating, selectedPlayers, rivals, seed, approach, coachSkills, card } = params;
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
    approach,
    coachSkills,
    card,
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
    inspiredGoalkeeper: card?.shootout,
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
      goalEvents: buildRivalGoalEvents({ homeTeamName: home.teamName, awayTeamName: away.teamName, homeGoals, awayGoals, seed }),
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
  approach?: MatchApproach;
  coachSkills?: CoachSkills;
  card?: MatchCardEffect;
}): { result: MatchResult; winner: CareerSupercopaParticipant } {
  const { home, away } = params;
  if (home.teamId === USER_TEAM_ID || away.teamId === USER_TEAM_ID) {
    return simulateUserSupercopaMatch(params);
  }

  return simulateRivalSupercopaMatch(params);
}

export interface SupercopaSemifinalPreview {
  rivalName: string;
  venue: MatchVenue;
  odds: MatchOdds;
  lineDuel: MatchLineDuel;
}

interface SupercopaUserMatchParams {
  teamRating: TeamRating;
  selectedPlayers: SelectedPlayer[];
  rivals: RivalTeam[];
  approach?: MatchApproach;
  coachSkills?: CoachSkills;
  /** Carta de partido del usuario (v0.25.108); su media ya va en teamRating. */
  card?: MatchCardEffect;
}

function getUserMatchPreview(
  pairing: [CareerSupercopaParticipant, CareerSupercopaParticipant] | undefined,
  params: SupercopaUserMatchParams,
): SupercopaSemifinalPreview | undefined {
  const { teamRating, selectedPlayers, rivals, approach, coachSkills, card } = params;

  if (!pairing || !pairing.some((team) => team.teamId === USER_TEAM_ID)) return undefined;

  const venue: MatchVenue = pairing[0].teamId === USER_TEAM_ID ? "home" : "away";
  const rival = findRival(venue === "home" ? pairing[1] : pairing[0], rivals);

  return {
    rivalName: rival.name,
    venue,
    odds: estimateMatchOdds({ userTeamName: USER_TEAM_NAME, rival, venue, teamRating, selectedPlayers, approach, coachSkills, card }),
    lineDuel: getMatchLineDuel(teamRating, rival),
  };
}

/** Previa de la semifinal del usuario (v0.25.75): la final depende de quién la alcance. */
export function getSupercopaSemifinalPreview(
  params: SupercopaUserMatchParams & { qualification: CareerSupercopaQualification },
): SupercopaSemifinalPreview | undefined {
  const pairing = createPairings(params.qualification.participants).find((pair) => pair.some((team) => team.teamId === USER_TEAM_ID));
  return getUserMatchPreview(pairing, params);
}

/** Los dos ganadores de semifinales, en el orden en que juegan la final (el primero en casa). */
function getSupercopaFinalists(semifinals: CareerSupercopaResult): [CareerSupercopaParticipant, CareerSupercopaParticipant] | undefined {
  const pairings = createPairings(semifinals.participants);
  const [semi1, semi2] = semifinals.results;

  if (pairings.length < 2 || !semi1 || !semi2) return undefined;

  const winner = (pair: [CareerSupercopaParticipant, CareerSupercopaParticipant], result: MatchResult) =>
    result.homeGoals > result.awayGoals ? pair[0] : pair[1];

  return [winner(pairings[0], semi1), winner(pairings[1], semi2)];
}

/** Previa de la final del usuario (v0.25.90), con las semifinales ya jugadas. */
export function getSupercopaFinalPreview(
  params: SupercopaUserMatchParams & { semifinals: CareerSupercopaResult },
): SupercopaSemifinalPreview | undefined {
  return getUserMatchPreview(getSupercopaFinalists(params.semifinals), params);
}

/** El rival y el campo del siguiente partido del usuario, sin calcular probabilidades (cartas, v0.25.108). */
export function getSupercopaUserOpponent(params: {
  rivals: RivalTeam[];
  qualification?: CareerSupercopaQualification;
  semifinals?: CareerSupercopaResult;
}): { rival: RivalTeam; venue: MatchVenue } | undefined {
  const pairing = params.semifinals
    ? getSupercopaFinalists(params.semifinals)
    : params.qualification && createPairings(params.qualification.participants).find((pair) => pair.some((team) => team.teamId === USER_TEAM_ID));

  if (!pairing || !pairing.some((team) => team.teamId === USER_TEAM_ID)) return undefined;

  const venue: MatchVenue = pairing[0].teamId === USER_TEAM_ID ? "home" : "away";
  return { rival: findRival(venue === "home" ? pairing[1] : pairing[0], params.rivals), venue };
}

interface SupercopaSimulationParams extends SupercopaUserMatchParams {
  qualification: CareerSupercopaQualification;
  seed?: number;
}

/**
 * Las dos semifinales (v0.25.90). Si pasas a la final, se para ahí (awaitingFinal): la final se
 * juega aparte, con su propio planteamiento. Si no, la final entre rivales se juega a la vez.
 */
export function simulateSupercopaSemifinals(params: SupercopaSimulationParams): CareerSupercopaResult {
  const { qualification, teamRating, selectedPlayers, rivals, seed = Date.now(), approach, coachSkills, card } = params;
  const pairings = createPairings(qualification.participants);

  if (pairings.length < 2) {
    return {
      seasonLabel: qualification.seasonLabel,
      participants: qualification.participants,
      results: [],
      played: false,
      won: false,
      championTeamId: "",
      championTeamName: "Sin datos",
    };
  }

  const [semi1, semi2] = pairings.map((pairing, index) =>
    simulateSupercopaMatch({
      roundName: "Semifinal",
      home: pairing[0],
      away: pairing[1],
      teamRating,
      selectedPlayers,
      rivals,
      seed: seed + 101 * (index + 1),
      approach,
      coachSkills,
      card,
    }),
  );
  const semifinals: CareerSupercopaResult = {
    seasonLabel: qualification.seasonLabel,
    participants: qualification.participants,
    results: [semi1.result, semi2.result],
    played: true,
    won: false,
    awaitingFinal: true,
    championTeamId: "",
    championTeamName: "",
  };

  const userInFinal = semi1.winner.teamId === USER_TEAM_ID || semi2.winner.teamId === USER_TEAM_ID;
  return userInFinal ? semifinals : simulateSupercopaFinal({ ...params, seed, semifinals });
}

/** La final, a partir de las semifinales ya jugadas (v0.25.90). */
export function simulateSupercopaFinal(
  params: SupercopaUserMatchParams & { semifinals: CareerSupercopaResult; seed?: number },
): CareerSupercopaResult {
  const { semifinals, teamRating, selectedPlayers, rivals, seed = Date.now(), approach, coachSkills, card } = params;
  const finalists = getSupercopaFinalists(semifinals);

  if (!finalists) return semifinals;

  const final = simulateSupercopaMatch({
    roundName: "Final",
    home: finalists[0],
    away: finalists[1],
    teamRating,
    selectedPlayers,
    rivals,
    seed: seed + 303,
    approach,
    coachSkills,
    card,
  });

  const userWon = final.winner.teamId === USER_TEAM_ID;
  const userPlayedSemi = semifinals.results.some((result) => result.homeTeamName === USER_TEAM_NAME || result.awayTeamName === USER_TEAM_NAME);
  const userReachedFinal = finalists.some((team) => team.teamId === USER_TEAM_ID);
  const eliminatedRoundName = userWon ? undefined : userReachedFinal ? "Final" : userPlayedSemi ? "Semifinal" : undefined;
  const runnerUp = final.winner.teamId === finalists[0].teamId ? finalists[1] : finalists[0];

  return {
    seasonLabel: semifinals.seasonLabel,
    participants: semifinals.participants,
    results: [...semifinals.results, final.result],
    played: true,
    won: userWon,
    eliminatedRoundName,
    championTeamId: final.winner.teamId,
    championTeamName: final.winner.teamName,
    runnerUpTeamId: runnerUp.teamId,
    runnerUpTeamName: runnerUp.teamName,
  };
}

/** La Supercopa entera de una vez, con el mismo planteamiento: auditorías y tests. */
export function simulateCareerSupercopa(params: SupercopaSimulationParams): CareerSupercopaResult {
  const seed = params.seed ?? Date.now();
  const semifinals = simulateSupercopaSemifinals({ ...params, seed });
  return semifinals.awaitingFinal ? simulateSupercopaFinal({ ...params, seed, semifinals }) : semifinals;
}

/**
 * Cuadro de la Supercopa (v0.25.90), con la forma del de Copa: una semifinal a cada lado y la
 * final en el centro. `shownMatches`: partidos ya vistos; los demás salen sin resultado.
 */
export function getSupercopaBracketRounds(
  participants: CareerSupercopaParticipant[],
  result: CareerSupercopaResult | undefined,
  shownMatches: number,
): CupBracketRound[] {
  const pairings = createPairings(participants);
  const results = result?.results ?? [];
  const finalists = result && shownMatches >= 2 ? getSupercopaFinalists(result) : undefined;
  const shown = (index: number) => (index < shownMatches ? results[index] : undefined);

  return [
    {
      roundName: "Semifinal",
      ties: pairings.map((pair, index) => ({ homeTeamName: pair[0].teamName, awayTeamName: pair[1].teamName, result: shown(index) })),
    },
    {
      roundName: "Final",
      ties: [finalists ? { homeTeamName: finalists[0].teamName, awayTeamName: finalists[1].teamName, result: shown(2) } : {}],
    },
  ];
}
