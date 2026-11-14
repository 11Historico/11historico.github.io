import { describe, expect, it } from "vitest";
import { buildEuropeanLeaguePhaseTable, getEuropeanRivalPairs } from "../../src/europe/europeanLeagueTable";
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

  // v0.25.119: con empate total decide el nombre, y la tabla te llamaba distinto que la regla.
  it("tu puesto en la tabla es siempre el que usa el juego para decidir quién pasa", () => {
    let mismatches = 0;
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
        const shown = buildEuropeanLeaguePhaseTable(tournament, "Athletic Club Histórico").findIndex((row) => row.isUser) + 1;
        if (shown !== getEuropeanLeaguePhaseUserPosition(tournament)) mismatches += 1;
      }
    }

    expect(mismatches).toBe(0);
  });

  it("es determinista: la misma temporada da la misma tabla", () => {
    const first = buildEuropeanLeaguePhaseTable(tournamentWithPlayed(4), "Once Histórico");
    const second = buildEuropeanLeaguePhaseTable(tournamentWithPlayed(4), "Once Histórico");

    expect(second).toEqual(first);
  });
});
