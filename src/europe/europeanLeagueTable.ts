// src/europe/europeanLeagueTable.ts
//
// Clasificación de la fase de liga europea (v0.25.52). El torneo solo guarda los partidos
// del usuario, así que la tabla añade los partidos entre rivales, simulados con el mismo
// motor y con semilla fija. Con el usuario y sus rivales hay 7 equipos y cada uno juega
// 6 partidos: todos contra todos una vez. Los partidos entre rivales se reparten en las
// jornadas del usuario y solo cuentan cuando esa jornada ya se ha jugado (v0.25.117: sin
// ningún rival con dos partidos en la misma jornada).

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

export function recordResult(
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

/** Un partido de la fase de liga que ya cuenta en la tabla. */
export interface EuropeanLeagueResult {
  homeId: string;
  awayId: string;
  homeGoals: number;
  awayGoals: number;
}

function compareTotals(a: EuropeanLeagueTableRow, b: EuropeanLeagueTableRow): number {
  return b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor;
}

/** FNV-1a: orden de sorteo fijo para cada torneo y equipo. */
function drawKey(seed: string, teamId: string): number {
  const text = `${seed}_${teamId}`;
  let hash = 2_166_136_261;
  for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 16_777_619);
  return hash >>> 0;
}

/** Semilla del sorteo de desempate: la del sorteo de rivales del torneo. */
export function getEuropeanLeagueTieSeed(tournament: Pick<EuropeanTournamentState, "drawSeed" | "seasonNumber" | "competition">): string {
  return tournament.drawSeed ?? `${tournament.seasonNumber}_${tournament.competition}`;
}

/**
 * Orden de la fase de liga: puntos, diferencia de goles y goles a favor. v0.25.120: con empate en
 * los tres, el enfrentamiento directo (puntos, diferencia y goles en los partidos entre los
 * empatados, una sola vez) y, si sigue, un sorteo con la semilla del torneo. Antes decidía el
 * nombre, y el usuario, que para la regla se llama "user", perdía casi todos esos empates
 * (docs/INFORME_DESEMPATE_EUROPEO_v0_25_119.md).
 */
export function sortEuropeanLeagueRows(
  rows: EuropeanLeagueTableRow[],
  results: EuropeanLeagueResult[],
  seed: string,
): EuropeanLeagueTableRow[] {
  const sorted = [...rows].sort(compareTotals);
  const order: EuropeanLeagueTableRow[] = [];

  for (let start = 0; start < sorted.length; ) {
    let end = start + 1;
    while (end < sorted.length && compareTotals(sorted[start], sorted[end]) === 0) end += 1;
    const group = sorted.slice(start, end);

    if (group.length > 1) {
      const mini = new Map(group.map((row) => [row.teamId, createRow(row.teamId, row.teamName, row.isUser)]));
      for (const result of results) {
        if (mini.has(result.homeId) && mini.has(result.awayId)) {
          recordResult(mini, result.homeId, result.awayId, result.homeGoals, result.awayGoals);
        }
      }
      group.sort(
        (a, b) =>
          compareTotals(mini.get(a.teamId)!, mini.get(b.teamId)!) ||
          drawKey(seed, a.teamId) - drawKey(seed, b.teamId) ||
          a.teamId.localeCompare(b.teamId),
      );
    }

    order.push(...group);
    start = end;
  }

  return order;
}

/**
 * Partidos entre rivales: todos contra todos una vez, repartidos en las jornadas del usuario.
 * `round` es la jornada del usuario tras la que cuenta el partido.
 *
 * v0.25.117: calendario de una liga de 7 equipos (el usuario es el 0 y el rival i-ésimo, el i + 1).
 * En la jornada r se enfrentan los que suman r módulo 7: el usuario juega contra el rival r, que
 * no juega otro partido esa jornada, y uno de los demás descansa. Los tres partidos de la jornada
 * en que descansaría el usuario (suma 0) cuentan con su sexta. Así, tras la jornada k nadie lleva
 * más de k partidos. Antes había rivales con dos partidos en la misma jornada.
 */
export function getEuropeanRivalPairs(
  opponents: EuropeanOpponent[],
): { home: EuropeanOpponent; away: EuropeanOpponent; round: number }[] {
  const pairs: { home: EuropeanOpponent; away: EuropeanOpponent; round: number }[] = [];
  const teams = opponents.length + 1;

  for (let i = 0; i < opponents.length; i += 1) {
    for (let j = i + 1; j < opponents.length; j += 1) {
      pairs.push({ home: opponents[i], away: opponents[j], round: (i + 1 + j + 1) % teams || opponents.length });
    }
  }

  return pairs;
}

/**
 * Partidos que ya cuentan en la tabla: los del usuario ya jugados (el usuario es "user") y los
 * de los rivales en las jornadas ya jugadas, simulados con semilla fija.
 */
export function getEuropeanLeaguePhaseResults(tournament: EuropeanTournamentState): EuropeanLeagueResult[] {
  const leagueMatches = tournament.matches.filter((match) => match.phase === "league_phase");
  const playedUserMatches = leagueMatches.filter((match) => match.status === "played");
  const results: EuropeanLeagueResult[] = playedUserMatches.map((match) => ({
    homeId: USER_ROW_ID,
    awayId: match.opponent.id,
    homeGoals: match.userGoals ?? 0,
    awayGoals: match.opponentGoals ?? 0,
  }));

  for (const { home, away, round } of getEuropeanRivalPairs(leagueMatches.map((match) => match.opponent))) {
    if (round > playedUserMatches.length) continue;

    const outcome = simulateEuropeanMatch({
      userTeamRating: home.rating,
      opponentRating: away.rating,
      isHome: true,
      competition: tournament.competition,
      seed: `${tournament.seasonNumber}_${tournament.competition}_${home.id}_${away.id}`,
    });
    results.push({ homeId: home.id, awayId: away.id, homeGoals: outcome.userGoals, awayGoals: outcome.opponentGoals });
  }

  return results;
}

/**
 * Tabla de la fase de liga: partidos del usuario ya jugados y partidos entre rivales
 * de las jornadas ya jugadas, ordenada con sortEuropeanLeagueRows.
 */
export function buildEuropeanLeaguePhaseTable(
  tournament: EuropeanTournamentState,
  userTeamName: string,
): EuropeanLeagueTableRow[] {
  const leagueMatches = tournament.matches.filter((match) => match.phase === "league_phase");
  if (leagueMatches.length === 0) return [];

  const opponents: EuropeanOpponent[] = leagueMatches.map((match) => match.opponent);
  const rows = new Map<string, EuropeanLeagueTableRow>();
  rows.set(USER_ROW_ID, createRow(USER_ROW_ID, userTeamName, true));
  for (const opponent of opponents) {
    rows.set(opponent.id, createRow(opponent.id, opponent.name, false));
  }

  const results = getEuropeanLeaguePhaseResults(tournament);
  for (const result of results) {
    recordResult(rows, result.homeId, result.awayId, result.homeGoals, result.awayGoals);
  }

  return sortEuropeanLeagueRows([...rows.values()], results, getEuropeanLeagueTieSeed(tournament));
}
