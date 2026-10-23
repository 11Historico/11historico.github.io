import { describe, expect, it } from "vitest";
import {
  buildCupBracketRows,
  buildEuropeanBracketColumns,
  getCupMatchWinner,
  isUserTeamName,
} from "../../src/career/seasonBrackets";
import { USER_TEAM_NAME } from "../../src/simulation/leagueTable";
import type { EuropeanTournamentMatch, EuropeanTournamentState } from "../../src/europe/europeanTypes";
import type { MatchResult } from "../../src/types/game";

function cupMatch(roundName: string, homeGoals: number, awayGoals: number): MatchResult {
  return {
    fixtureId: roundName,
    matchday: 0,
    competition: "cup",
    roundName,
    homeTeamName: USER_TEAM_NAME,
    awayTeamName: "Rival",
    homeGoals,
    awayGoals,
    goalEvents: [],
    userTeamPlayed: true,
  };
}

describe("cuadro de la Copa", () => {
  it("las rondas jugadas por el Athletic quedan como jugadas", () => {
    const rows = buildCupBracketRows({ cupResults: [cupMatch("Dieciseisavos", 2, 0), cupMatch("Octavos", 1, 0)] });
    expect(rows.map((row) => row.status)).toEqual(["played", "played", "pending", "pending", "pending"]);
  });

  it("las rondas siguientes simuladas se marcan como simuladas", () => {
    const rows = buildCupBracketRows({
      cupResults: [cupMatch("Dieciseisavos", 0, 1)],
      simulatedResults: [cupMatch("Octavos", 2, 1), cupMatch("Cuartos", 1, 0), cupMatch("Semifinal", 0, 2), cupMatch("Final", 3, 1)],
    });
    expect(rows.map((row) => row.status)).toEqual(["played", "simulated", "simulated", "simulated", "simulated"]);
  });

  it("siempre devuelve las cinco rondas en orden", () => {
    const rows = buildCupBracketRows({ cupResults: [cupMatch("Final", 1, 0)] });
    expect(rows.map((row) => row.roundName)).toEqual(["Dieciseisavos", "Octavos", "Cuartos", "Semifinal", "Final"]);
  });

  it("el ganador sale del marcador", () => {
    expect(getCupMatchWinner(cupMatch("Final", 2, 1))).toBe("home");
    expect(getCupMatchWinner(cupMatch("Final", 0, 3))).toBe("away");
    expect(getCupMatchWinner(cupMatch("Final", 1, 1))).toBeUndefined();
  });

  it("reconoce al Athletic por su nombre", () => {
    expect(isUserTeamName(USER_TEAM_NAME)).toBe(true);
    expect(isUserTeamName("Rival")).toBe(false);
  });
});

function europeanMatch(id: string, phase: EuropeanTournamentMatch["phase"], status: EuropeanTournamentMatch["status"]): EuropeanTournamentMatch {
  return {
    id,
    seasonNumber: 1,
    competition: "champions_league",
    matchday: 1,
    phase,
    opponent: { id: "o", name: "Rival", country: "X", rating: 80, tier: "champions_league" },
    isHome: true,
    status,
  };
}

describe("cuadro europeo", () => {
  it("separa fase inicial, semifinal y final", () => {
    const tournament = {
      matches: [
        europeanMatch("l1", "league_phase", "played"),
        europeanMatch("l2", "league_phase", "played"),
        europeanMatch("s1", "semifinal", "played"),
      ],
    } as unknown as EuropeanTournamentState;

    const columns = buildEuropeanBracketColumns(tournament);
    expect(columns.leagueMatches).toHaveLength(2);
    expect(columns.semifinal.status).toBe("played");
    expect(columns.final.status).toBe("pending");
    expect(columns.final.match).toBeUndefined();
  });

  it("una semifinal sin jugar queda pendiente", () => {
    const tournament = {
      matches: [europeanMatch("s1", "semifinal", "scheduled")],
    } as unknown as EuropeanTournamentState;

    expect(buildEuropeanBracketColumns(tournament).semifinal.status).toBe("pending");
  });
});
