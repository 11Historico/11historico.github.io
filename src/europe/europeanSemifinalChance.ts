// src/europe/europeanSemifinalChance.ts
//
// Probabilidad de pasar a semifinales en la fase de liga europea (v0.25.95). Juega muchas
// veces lo que falta: tus partidos y los de los rivales que aún no cuentan en la tabla.
// Usa semillas propias, distintas de las de la partida, así que ni gasta azar del juego ni
// adelanta resultados: los partidos entre rivales tienen semilla fija en la tabla y aquí se
// simulan con otras.

import { buildEuropeanLeaguePhaseTable, compareRows, getEuropeanRivalPairs, recordResult } from "./europeanLeagueTable";
import { simulateEuropeanMatch } from "./europeanMatchEngine";
import { EUROPEAN_LEAGUE_PHASE_QUALIFYING_POSITIONS } from "./europeanTournament";
import type { EuropeanTournamentState } from "./europeanTypes";
import type { TeamRating } from "../types/game";

// Mismo nombre que la regla de clasificación (getEuropeanLeaguePhaseUserPosition): decide los desempates.
const USER_ROW_ID = "user";
// Con esta probabilidad o más, «pasas casi seguro».
const SAFE_CHANCE = 0.9;

export interface EuropeanSemifinalChance {
  /** Probabilidad de acabar entre los 2 primeros, de 0 a 1. */
  chance: number;
  /** Partidos de la fase de liga que te quedan. */
  remaining: number;
  /** Puntos en los partidos que quedan con los que pasas casi seguro, si hay alguno alcanzable. */
  safePoints?: number;
}

export function estimateEuropeanSemifinalChance(params: {
  tournament: EuropeanTournamentState;
  userTeamRating: number;
  userProfile?: TeamRating;
  samples?: number;
}): EuropeanSemifinalChance | null {
  const { tournament, userTeamRating, userProfile, samples = 200 } = params;
  const leagueMatches = tournament.matches.filter((match) => match.phase === "league_phase");
  const pending = leagueMatches.filter((match) => match.status !== "played");
  if (leagueMatches.length === 0 || pending.length === 0) return null;

  const played = leagueMatches.length - pending.length;
  const current = buildEuropeanLeaguePhaseTable(tournament, USER_ROW_ID);
  const futurePairs = getEuropeanRivalPairs(leagueMatches.map((match) => match.opponent)).filter((pair) => pair.round > played);
  // Por puntos sumados en lo que falta: cuántas veces se pasa con esos puntos.
  const byPoints = new Map<number, { qualified: number; total: number }>();
  let qualified = 0;

  for (let sample = 0; sample < samples; sample += 1) {
    const rows = new Map(current.map((row) => [row.teamId, { ...row }]));
    let gained = 0;

    for (const match of pending) {
      const outcome = simulateEuropeanMatch({
        userTeamRating,
        opponentRating: match.opponent.rating,
        isHome: match.isHome,
        competition: tournament.competition,
        userProfile,
        seed: `chance_${sample}_${match.id}`,
      });
      gained += outcome.result === "win" ? 3 : outcome.result === "draw" ? 1 : 0;
      recordResult(rows, USER_ROW_ID, match.opponent.id, outcome.userGoals, outcome.opponentGoals);
    }

    for (const { home, away } of futurePairs) {
      const outcome = simulateEuropeanMatch({
        userTeamRating: home.rating,
        opponentRating: away.rating,
        isHome: true,
        competition: tournament.competition,
        seed: `chance_${sample}_${home.id}_${away.id}`,
      });
      recordResult(rows, home.id, away.id, outcome.userGoals, outcome.opponentGoals);
    }

    const position = [...rows.values()].sort(compareRows).findIndex((row) => row.isUser) + 1;
    const passed = position <= EUROPEAN_LEAGUE_PHASE_QUALIFYING_POSITIONS;
    if (passed) qualified += 1;

    const bucket = byPoints.get(gained) ?? { qualified: 0, total: 0 };
    bucket.total += 1;
    if (passed) bucket.qualified += 1;
    byPoints.set(gained, bucket);
  }

  return { chance: qualified / samples, remaining: pending.length, safePoints: getSafePoints(byPoints, samples) };
}

/** Los menos puntos con los que, sumando eso o más, se pasa al menos el 90 % de las veces. */
function getSafePoints(byPoints: Map<number, { qualified: number; total: number }>, samples: number): number | undefined {
  const points = [...byPoints.keys()].sort((a, b) => b - a);
  let qualified = 0;
  let total = 0;
  let safe: number | undefined;

  // De más a menos puntos, acumulando: «con p o más». Se exige un mínimo de casos para no fiarse de 2 o 3.
  for (const value of points) {
    const bucket = byPoints.get(value)!;
    qualified += bucket.qualified;
    total += bucket.total;
    if (qualified / total >= SAFE_CHANCE && total >= samples * 0.05) safe = value;
    else if (safe !== undefined) break;
  }

  return safe;
}

export function getEuropeanSemifinalChanceText(result: EuropeanSemifinalChance): string {
  const percent = Math.round(result.chance * 100);
  const chance = `Probabilidad de pasar a semifinales: ${percent < 1 ? "menos del 1" : percent > 99 ? "más del 99" : percent} %.`;
  if (result.safePoints === undefined) return chance;

  const matches = result.remaining === 1 ? "el partido que falta" : `los ${result.remaining} partidos que faltan`;
  if (result.safePoints === 0) return `${chance} Pasas casi seguro pase lo que pase.`;

  return `${chance} Con ${result.safePoints} ${result.safePoints === 1 ? "punto" : "puntos"} en ${matches} pasas casi seguro.`;
}
