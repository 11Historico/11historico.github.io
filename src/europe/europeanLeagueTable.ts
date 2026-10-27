// src/europe/europeanLeagueTable.ts
//
// Clasificación de la fase de liga europea (v0.25.52). El torneo solo guarda los partidos
// del usuario, así que la tabla añade los partidos entre rivales, simulados con el mismo
// motor y con semilla fija. Con el usuario y sus rivales hay 7 equipos y cada uno juega
// 6 partidos: todos contra todos una vez. Los partidos entre rivales se reparten en las
// jornadas del usuario y solo cuentan cuando esa jornada ya se ha jugado.

import { simulateEuropeanMatch } from "./europeanMatchEngine";
import type { EuropeanOpponent, EuropeanTournamentState } from "./europeanTypes";

export interface EuropeanLeagueTableRow {
  teamId: string;
  teamName: string;
  isUser: boolean;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

const USER_ROW_ID = "user";

function createRow(teamId: string, teamName: string, isUser: boolean): EuropeanLeagueTableRow {
  return {
    teamId,
    teamName,
    isUser,
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

function recordResult(
  rows: Map<string, EuropeanLeagueTableRow>,
  homeId: string,
  awayId: string,
  homeGoals: number,
  awayGoals: number,
): void {
  const home = rows.get(homeId);
  const away = rows.get(awayId);
  if (!home || !away) return;

  for (const [row, goalsFor, goalsAgainst] of [
    [home, homeGoals, awayGoals],
    [away, awayGoals, homeGoals],
  ] as const) {
    row.played += 1;
    row.goalsFor += goalsFor;
    row.goalsAgainst += goalsAgainst;
    row.goalDifference = row.goalsFor - row.goalsAgainst;

    if (goalsFor > goalsAgainst) {
      row.won += 1;
      row.points += 3;
    } else if (goalsFor === goalsAgainst) {
      row.drawn += 1;
      row.points += 1;
    } else {
      row.lost += 1;
    }
  }
}

function compareRows(a: EuropeanLeagueTableRow, b: EuropeanLeagueTableRow): number {
  return (
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    a.teamName.localeCompare(b.teamName, "es")
  );
}

/**
 * Tabla de la fase de liga: partidos del usuario ya jugados y partidos entre rivales
 * de las jornadas ya jugadas. Ordenada por puntos, diferencia de goles y goles a favor.
 */
export function buildEuropeanLeaguePhaseTable(
  tournament: EuropeanTournamentState,
  userTeamName: string,
): EuropeanLeagueTableRow[] {
  const leagueMatches = tournament.matches.filter((match) => match.phase === "league_phase");
  if (leagueMatches.length === 0) return [];

  const playedUserMatches = leagueMatches.filter((match) => match.status === "played");
  const opponents: EuropeanOpponent[] = leagueMatches.map((match) => match.opponent);

  const rows = new Map<string, EuropeanLeagueTableRow>();
  rows.set(USER_ROW_ID, createRow(USER_ROW_ID, userTeamName, true));
  for (const opponent of opponents) {
    rows.set(opponent.id, createRow(opponent.id, opponent.name, false));
  }

  for (const match of playedUserMatches) {
    recordResult(rows, USER_ROW_ID, match.opponent.id, match.userGoals ?? 0, match.opponentGoals ?? 0);
  }

  let pairIndex = 0;
  for (let i = 0; i < opponents.length; i += 1) {
    for (let j = i + 1; j < opponents.length; j += 1) {
      const round = (pairIndex % leagueMatches.length) + 1;
      pairIndex += 1;
      if (round > playedUserMatches.length) continue;

      const home = opponents[i];
      const away = opponents[j];
      const outcome = simulateEuropeanMatch({
        userTeamRating: home.rating,
        opponentRating: away.rating,
        isHome: true,
        competition: tournament.competition,
        seed: `${tournament.seasonNumber}_${tournament.competition}_${home.id}_${away.id}`,
      });
      recordResult(rows, home.id, away.id, outcome.userGoals, outcome.opponentGoals);
    }
  }

  return [...rows.values()].sort(compareRows);
}
