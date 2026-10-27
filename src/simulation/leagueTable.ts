// src/simulation/leagueTable.ts

import type {
  LeagueFixture,
  LeagueSimulationState,
  LeagueTableRow,
  MatchResult,
  RivalTeam,
} from "../types/game";

import { USER_TEAM_ID } from "../data/laliga2526Teams";

export const USER_TEAM_NAME = "Athletic Club Histórico";

export interface CreateInitialLeagueTableParams {
  rivals: RivalTeam[];
  includeRealAthletic?: boolean;
  userTeamName?: string;
}

export interface ApplyMatchResultParams {
  table: LeagueTableRow[];
  result: MatchResult;
  userTeamId?: string;
  userTeamName?: string;
}

export interface CreateLeagueSimulationStateParams {
  fixtures: LeagueFixture[];
  rivals: RivalTeam[];
  includeRealAthletic?: boolean;
  userTeamName?: string;
}

export function createEmptyTableRow(teamId: string, teamName: string): LeagueTableRow {
  return {
    teamId,
    teamName,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

export function createInitialLeagueTable(
  params: CreateInitialLeagueTableParams
): LeagueTableRow[] {
  const {
    rivals,
    includeRealAthletic = false,
    userTeamName = USER_TEAM_NAME,
  } = params;

  const table: LeagueTableRow[] = [createEmptyTableRow(USER_TEAM_ID, userTeamName)];

  for (const rival of rivals) {
    if (!includeRealAthletic && rival.id === "athletic_club") {
      continue;
    }

    table.push(createEmptyTableRow(rival.id, rival.name));
  }

  return sortLeagueTable(table);
}

function findTableRowIndex(params: {
  table: LeagueTableRow[];
  teamName: string;
  userTeamId: string;
  userTeamName: string;
}): number {
  const { table, teamName, userTeamId, userTeamName } = params;

  if (teamName === userTeamName) {
    return table.findIndex((row) => row.teamId === userTeamId);
  }

  return table.findIndex((row) => row.teamName === teamName);
}

function applyTeamMatchStats(params: {
  row: LeagueTableRow;
  goalsFor: number;
  goalsAgainst: number;
}): LeagueTableRow {
  const { row, goalsFor, goalsAgainst } = params;

  const won = goalsFor > goalsAgainst ? 1 : 0;
  const drawn = goalsFor === goalsAgainst ? 1 : 0;
  const lost = goalsFor < goalsAgainst ? 1 : 0;

  const updatedGoalsFor = row.goalsFor + goalsFor;
  const updatedGoalsAgainst = row.goalsAgainst + goalsAgainst;

  return {
    ...row,
    played: row.played + 1,
    won: row.won + won,
    drawn: row.drawn + drawn,
    lost: row.lost + lost,
    goalsFor: updatedGoalsFor,
    goalsAgainst: updatedGoalsAgainst,
    goalDifference: updatedGoalsFor - updatedGoalsAgainst,
    points: row.points + won * 3 + drawn,
  };
}

export function applyMatchResultToTable(params: ApplyMatchResultParams): LeagueTableRow[] {
  const {
    table,
    result,
    userTeamId = USER_TEAM_ID,
    userTeamName = USER_TEAM_NAME,
  } = params;

  const updatedTable = table.map((row) => ({ ...row }));

  const homeIndex = findTableRowIndex({
    table: updatedTable,
    teamName: result.homeTeamName,
    userTeamId,
    userTeamName,
  });

  const awayIndex = findTableRowIndex({
    table: updatedTable,
    teamName: result.awayTeamName,
    userTeamId,
    userTeamName,
  });

  if (homeIndex === -1 || awayIndex === -1) {
    throw new Error(
      `No se pudo aplicar el resultado. Equipo no encontrado: ${result.homeTeamName} vs ${result.awayTeamName}`
    );
  }

  updatedTable[homeIndex] = applyTeamMatchStats({
    row: updatedTable[homeIndex],
    goalsFor: result.homeGoals,
    goalsAgainst: result.awayGoals,
  });

  updatedTable[awayIndex] = applyTeamMatchStats({
    row: updatedTable[awayIndex],
    goalsFor: result.awayGoals,
    goalsAgainst: result.homeGoals,
  });

  return sortLeagueTable(updatedTable);
}

export function sortLeagueTable(table: LeagueTableRow[]): LeagueTableRow[] {
  return [...table].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst;

    return a.teamName.localeCompare(b.teamName);
  });
}

export function getTeamPosition(params: {
  table: LeagueTableRow[];
  teamId: string;
}): number | undefined {
  const sortedTable = sortLeagueTable(params.table);
  const index = sortedTable.findIndex((row) => row.teamId === params.teamId);

  return index === -1 ? undefined : index + 1;
}

export function getUserTeamTableRow(
  table: LeagueTableRow[],
  userTeamId = USER_TEAM_ID
): LeagueTableRow | undefined {
  return table.find((row) => row.teamId === userTeamId);
}

export function createLeagueSimulationState(
  params: CreateLeagueSimulationStateParams
): LeagueSimulationState {
  const {
    fixtures,
    rivals,
    includeRealAthletic = false,
    userTeamName = USER_TEAM_NAME,
  } = params;

  return {
    currentMatchday: 1,
    fixtures,
    results: [],
    table: createInitialLeagueTable({
      rivals,
      includeRealAthletic,
      userTeamName,
    }),
    completed: false,
  };
}

export function applyMatchResultToLeagueState(params: {
  state: LeagueSimulationState;
  result: MatchResult;
  userTeamId?: string;
  userTeamName?: string;
}): LeagueSimulationState {
  const {
    state,
    result,
    userTeamId = USER_TEAM_ID,
    userTeamName = USER_TEAM_NAME,
  } = params;

  const nextResults = [...state.results, result];

  const nextTable = applyMatchResultToTable({
    table: state.table,
    result,
    userTeamId,
    userTeamName,
  });

  const maxMatchday = Math.max(...state.fixtures.map((fixture) => fixture.matchday), 0);

  const resultsInCurrentMatchday = nextResults.filter(
    (matchResult) => matchResult.matchday === state.currentMatchday
  ).length;

  const fixturesInCurrentMatchday = state.fixtures.filter(
    (fixture) => fixture.matchday === state.currentMatchday
  ).length;

  const matchdayCompleted =
    fixturesInCurrentMatchday > 0 && resultsInCurrentMatchday >= fixturesInCurrentMatchday;

  const nextMatchday = matchdayCompleted
    ? Math.min(state.currentMatchday + 1, maxMatchday)
    : state.currentMatchday;

  const completed = nextResults.length >= state.fixtures.length;

  return {
    ...state,
    currentMatchday: completed ? maxMatchday : nextMatchday,
    results: nextResults,
    table: nextTable,
    completed,
  };
}

export function getFixturesByMatchday(
  fixtures: LeagueFixture[],
  matchday: number
): LeagueFixture[] {
  return fixtures.filter((fixture) => fixture.matchday === matchday);
}

export function getNextPendingFixture(state: LeagueSimulationState): LeagueFixture | undefined {
  const playedFixtureIds = new Set(state.results.map((result) => result.fixtureId));

  return state.fixtures.find((fixture) => !playedFixtureIds.has(fixture.id));
}

export function getPendingFixturesForCurrentMatchday(
  state: LeagueSimulationState
): LeagueFixture[] {
  const playedFixtureIds = new Set(state.results.map((result) => result.fixtureId));

  return state.fixtures.filter(
    (fixture) =>
      fixture.matchday === state.currentMatchday && !playedFixtureIds.has(fixture.id)
  );
}

export function getDisplayTable(table: LeagueTableRow[], limit?: number): LeagueTableRow[] {
  const sorted = sortLeagueTable(table);

  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function getUserLeagueSummary(params: {
  table: LeagueTableRow[];
  userTeamId?: string;
}): {
  position?: number;
  row?: LeagueTableRow;
} {
  const { table, userTeamId = USER_TEAM_ID } = params;
  const sortedTable = sortLeagueTable(table);
  const index = sortedTable.findIndex((row) => row.teamId === userTeamId);

  if (index === -1) {
    return {};
  }

  return {
    position: index + 1,
    row: sortedTable[index],
  };
}
