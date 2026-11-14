import { describe, expect, it } from "vitest";
import {
  buildEuropeanLeaguePhaseTable,
  getEuropeanRivalPairs,
  sortEuropeanLeagueRows,
  type EuropeanLeagueTableRow,
} from "../../src/europe/europeanLeagueTable";
import { simulateEuropeanMatch } from "../../src/europe/europeanMatchEngine";
import { applyEuropeanMatchResult, createEuropeanTournamentForQualification, getEuropeanLeaguePhaseUserPosition } from "../../src/europe/europeanTournament";
import type { EuropeanQualificationResult, EuropeanTournamentMatch, EuropeanTournamentState } from "../../src/europe/europeanTypes";

const opponents = [
  { id: "r1", name: "Rival 1", country: "A", rating: 80, tier: "conference_league" as const },
  { id: "r2", name: "Rival 2", country: "B", rating: 78, tier: "conference_league" as const },
  { id: "r3", name: "Rival 3", country: "C", rating: 76, tier: "conference_league" as const },
  { id: "r4", name: "Rival 4", country: "D", rating: 74, tier: "conference_league" as const },
  { id: "r5", name: "Rival 5", country: "E", rating: 72, tier: "conference_league" as const },
  { id: "r6", name: "Rival 6", country: "F", rating: 70, tier: "conference_league" as const },
];

function tournamentWithPlayed(playedCount: number): EuropeanTournamentState {
  const matches: EuropeanTournamentMatch[] = opponents.map((opponent, index) => {
    const played = index < playedCount;
    return {
      id: `m${index + 1}`,
      seasonNumber: 1,
      competition: "conference_league",
      matchday: index + 1,
      phase: "league_phase",
      opponent,
      isHome: index % 2 === 0,
      status: played ? "played" : "scheduled",
      ...(played ? { userGoals: 2, opponentGoals: 1, result: "win" as const } : {}),
    };
  });

  return { seasonNumber: 1, competition: "conference_league", phase: "league_phase", matches } as unknown as EuropeanTournamentState;
}

/** 900 torneos con la fase de liga jugada entera, en las tres competiciones. */
function playedTournaments(): EuropeanTournamentState[] {
  const tournaments: EuropeanTournamentState[] = [];
  for (const competition of ["conference_league", "europa_league", "champions_league"] as const) {
    for (let seed = 0; seed < 300; seed += 1) {
      let tournament = createEuropeanTournamentForQualification({
        seasonNumber: 1 + (seed % 20),
        qualification: { qualified: true, competition } as EuropeanQualificationResult,
        seed: `tabla_regla_${seed}`,
        totalLeagueMatchdays: 38,
      })!;
      for (const match of tournament.matches.filter((candidate) => candidate.phase === "league_phase")) {
        const outcome = simulateEuropeanMatch({ userTeamRating: 85, opponentRating: match.opponent.rating, isHome: match.isHome, competition, seed: `tabla_regla_${seed}_${match.id}` });
        tournament = applyEuropeanMatchResult(tournament, match.id, { userGoals: outcome.userGoals, opponentGoals: outcome.opponentGoals, result: outcome.result }, 38);
      }
      tournaments.push(tournament);
    }
  }
  return tournaments;
}

/** Dos filas con los mismos puntos, diferencia y goles. */
function tiedRows(): EuropeanLeagueTableRow[] {
  const row = (teamId: string, teamName: string) => ({
    teamId, teamName, isUser: teamId === "user", played: 6, won: 2, drawn: 2, lost: 2, goalsFor: 8, goalsAgainst: 8, goalDifference: 0, points: 8,
  });
  return [row("alfa", "Alfa"), row("user", "Zeta")];
}

describe("clasificación de la fase de liga europea", () => {
  it("sin partidos jugados, todos los equipos tienen cero partidos", () => {
    const table = buildEuropeanLeaguePhaseTable(tournamentWithPlayed(0), "Once Histórico");

    expect(table).toHaveLength(7);
    expect(table.every((row) => row.played === 0 && row.points === 0)).toBe(true);
  });

  it("el usuario solo acumula sus partidos jugados", () => {
    const table = buildEuropeanLeaguePhaseTable(tournamentWithPlayed(2), "Once Histórico");
    const user = table.find((row) => row.isUser);

    expect(user?.teamName).toBe("Once Histórico");
    expect(user?.played).toBe(2);
    expect(user?.won).toBe(2);
    expect(user?.points).toBe(6);
    expect(user?.goalsFor).toBe(4);
    expect(user?.goalsAgainst).toBe(2);
  });

  it("ningún equipo supera los partidos de la fase de liga y la tabla va ordenada por puntos", () => {
    const table = buildEuropeanLeaguePhaseTable(tournamentWithPlayed(3), "Once Histórico");

    expect(table.every((row) => row.played <= 6)).toBe(true);
    for (let i = 1; i < table.length; i += 1) {
      expect(table[i - 1].points).toBeGreaterThanOrEqual(table[i].points);
    }
  });

  // v0.25.117: antes, tras 2 jornadas un rival podía llevar 4 partidos.
  it("tras la jornada k nadie lleva más de k partidos, y al final todos llevan 6", () => {
    for (let played = 1; played <= 5; played += 1) {
      const table = buildEuropeanLeaguePhaseTable(tournamentWithPlayed(played), "Once Histórico");
      for (const row of table) {
        expect(row.played, `${row.teamName} tras la jornada ${played}`).toBeGreaterThanOrEqual(played - 1);
        expect(row.played, `${row.teamName} tras la jornada ${played}`).toBeLessThanOrEqual(played);
      }
    }

    const final = buildEuropeanLeaguePhaseTable(tournamentWithPlayed(6), "Once Histórico");
    expect(final.every((row) => row.played === 6)).toBe(true);
  });

  it("cada pareja de rivales se enfrenta una vez, y el rival de tu jornada no juega otro partido en ella", () => {
    const pairs = getEuropeanRivalPairs(opponents);
    expect(pairs).toHaveLength(15);
    expect(new Set(pairs.map((pair) => `${pair.home.id}-${pair.away.id}`)).size).toBe(15);

    for (let round = 1; round <= 5; round += 1) {
      const teams = pairs.filter((pair) => pair.round === round).flatMap((pair) => [pair.home.id, pair.away.id]);
      expect(new Set(teams).size, `jornada ${round}`).toBe(teams.length);
      expect(teams, `jornada ${round}`).not.toContain(opponents[round - 1].id);
    }
  });

  // v0.25.119: con empate total decidía el nombre, y la tabla te llamaba distinto que la regla.
  it("tu puesto en la tabla es siempre el que usa el juego para decidir quién pasa", () => {
    const mismatches = playedTournaments().filter(
      (tournament) => buildEuropeanLeaguePhaseTable(tournament, "Athletic Club Histórico").findIndex((row) => row.isUser) + 1 !== getEuropeanLeaguePhaseUserPosition(tournament),
    );

    expect(mismatches).toHaveLength(0);
  });

  // v0.25.120: con empate total decide el enfrentamiento directo y, si sigue, un sorteo; no el nombre.
  it("con empate total gana el enfrentamiento directo, aunque el otro vaya antes por nombre", () => {
    const results = [{ homeId: "alfa", awayId: "user", homeGoals: 0, awayGoals: 1 }];

    expect(sortEuropeanLeagueRows(tiedRows(), results, "semilla").map((row) => row.teamId)).toEqual(["user", "alfa"]);
    expect(sortEuropeanLeagueRows(tiedRows().reverse(), results, "otra").map((row) => row.teamId)).toEqual(["user", "alfa"]);
  });

  it("con el directo empatado decide un sorteo fijo por torneo, no el nombre", () => {
    const results = [{ homeId: "alfa", awayId: "user", homeGoals: 1, awayGoals: 1 }];
    const firsts = new Set<string>();
    for (let seed = 0; seed < 20; seed += 1) {
      const order = sortEuropeanLeagueRows(tiedRows(), results, `semilla_${seed}`).map((row) => row.teamId);
      expect(sortEuropeanLeagueRows(tiedRows().reverse(), results, `semilla_${seed}`).map((row) => row.teamId)).toEqual(order);
      firsts.add(order[0]);
    }

    expect(firsts).toEqual(new Set(["alfa", "user"]));
  });

  it("ganas más o menos la mitad de los empates totales", () => {
    let ties = 0;
    let won = 0;
    for (const tournament of playedTournaments()) {
      const table = buildEuropeanLeaguePhaseTable(tournament, "Athletic Club Histórico");
      const user = table.find((row) => row.isUser)!;
      const tied = table.filter((row) => row.points === user.points && row.goalDifference === user.goalDifference && row.goalsFor === user.goalsFor);
      if (tied.length < 2) continue;
      ties += 1;
      if (tied[0].isUser) won += 1;
    }

    expect(ties).toBeGreaterThanOrEqual(15);
    expect(won / ties).toBeGreaterThan(0.3);
    expect(won / ties).toBeLessThan(0.7);
  });

  it("es determinista: la misma temporada da la misma tabla", () => {
    const first = buildEuropeanLeaguePhaseTable(tournamentWithPlayed(4), "Once Histórico");
    const second = buildEuropeanLeaguePhaseTable(tournamentWithPlayed(4), "Once Histórico");

    expect(second).toEqual(first);
  });
});
