import { describe, expect, it } from "vitest";
import { pickEuropeanOpponents } from "../../src/europe/europeanOpponents";
import type { EuropeanCompetition } from "../../src/europe/europeanTypes";

function ratingsByClub(competition: EuropeanCompetition, draws = 300): Map<string, Set<number>> {
  const byClub = new Map<string, Set<number>>();
  for (let draw = 0; draw < draws; draw += 1) {
    for (const opponent of pickEuropeanOpponents({ competition, count: 8, seed: `test_${draw}` })) {
      byClub.set(opponent.name, (byClub.get(opponent.name) ?? new Set()).add(opponent.rating));
    }
  }
  return byClub;
}

describe("rivales europeos con media fija por club (v0.25.98)", () => {
  it("cada club sale siempre con su media ±1", () => {
    for (const competition of ["champions_league", "europa_league", "conference_league"] as const) {
      for (const [club, ratings] of ratingsByClub(competition)) {
        const values = [...ratings];
        expect(Math.max(...values) - Math.min(...values), club).toBeLessThanOrEqual(2);
      }
    }
  });

  it("el Bayern es más fuerte que el Celtic, y ningún rival de Champions pasa de 91", () => {
    const champions = ratingsByClub("champions_league");
    expect(Math.min(...champions.get("Bayern München")!)).toBeGreaterThan(Math.max(...champions.get("Celtic")!));
    for (const ratings of champions.values()) expect(Math.max(...ratings)).toBeLessThanOrEqual(91);
  });

  it("la media de cada competición queda como estaba (88, 82 y 76)", () => {
    const average = (competition: EuropeanCompetition) => {
      const ratings = Array.from({ length: 300 }, (_, draw) => pickEuropeanOpponents({ competition, count: 6, seed: `avg_${draw}` }))
        .flat()
        .map((opponent) => opponent.rating);
      return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    };
    expect(average("champions_league")).toBeCloseTo(88, 0);
    expect(average("europa_league")).toBeCloseTo(82, 0);
    expect(average("conference_league")).toBeCloseTo(76, 0);
  });

  it("es determinista: la misma semilla da los mismos rivales", () => {
    const params = { competition: "europa_league" as const, count: 6, seed: "same" };
    expect(pickEuropeanOpponents(params)).toEqual(pickEuropeanOpponents(params));
  });
});
