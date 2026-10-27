import { describe, expect, it } from "vitest";
import { buildEuropeanLeaguePhaseTable } from "../../src/europe/europeanLeagueTable";
import type { EuropeanTournamentMatch, EuropeanTournamentState } from "../../src/europe/europeanTypes";

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

  it("es determinista: la misma temporada da la misma tabla", () => {
    const first = buildEuropeanLeaguePhaseTable(tournamentWithPlayed(4), "Once Histórico");
    const second = buildEuropeanLeaguePhaseTable(tournamentWithPlayed(4), "Once Histórico");

    expect(second).toEqual(first);
  });
});
