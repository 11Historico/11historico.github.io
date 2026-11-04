import { afterEach, describe, expect, it, vi } from "vitest";
import { estimateExpectedLeagueRange, getExpectedLeagueRangeText } from "../../src/simulation/expectedLeagueRange";
import { createUserLeagueSimulation } from "../../src/simulation/leagueSimulator";
import type { TeamRating } from "../../src/types/game";

function rating(value: number): TeamRating {
  return { attack: value, defense: value, control: value, physical: value, mentality: value, goalkeeping: value, overall: value, profileLabel: "", strengths: [], weaknesses: [] };
}

const { fixtures } = createUserLeagueSimulation().state;

afterEach(() => vi.restoreAllMocks());

describe("rango esperado en Liga (v0.25.88)", () => {
  it("da siempre lo mismo para el mismo once y no gasta azar de la partida", () => {
    const random = vi.spyOn(Math, "random");
    const params = { fixtures, teamRating: rating(82), selectedPlayers: [] };
    expect(estimateExpectedLeagueRange(params)).toEqual(estimateExpectedLeagueRange(params));
    expect(random).not.toHaveBeenCalled();
  });

  it("un equipo mejor espera acabar más arriba", () => {
    const strong = estimateExpectedLeagueRange({ fixtures, teamRating: rating(90), selectedPlayers: [] });
    const weak = estimateExpectedLeagueRange({ fixtures, teamRating: rating(72), selectedPlayers: [] });
    expect(strong.best + strong.worst).toBeLessThan(weak.best + weak.worst);
    expect(strong.best).toBeLessThanOrEqual(strong.worst);
  });

  it("tarda poco: se calcula al abrir la Liga", () => {
    const start = performance.now();
    estimateExpectedLeagueRange({ fixtures, teamRating: rating(82), selectedPlayers: [] });
    expect(performance.now() - start).toBeLessThan(3000);
  });

  it("compara con el puesto actual solo cuando ya se ha jugado", () => {
    const range = { best: 5, worst: 8 };
    expect(getExpectedLeagueRangeText(range)).toBe("Lo normal con este once y estos rivales: acabar entre el 5.º y el 8.º.");
    expect(getExpectedLeagueRangeText(range, 3)).toMatch(/Vas 3\.º, por encima de lo esperado\.$/);
    expect(getExpectedLeagueRangeText(range, 6)).toMatch(/Vas 6\.º, dentro de lo esperado\.$/);
    expect(getExpectedLeagueRangeText(range, 11)).toMatch(/Vas 11\.º, por debajo de lo esperado\.$/);
    expect(getExpectedLeagueRangeText({ best: 1, worst: 1 })).toMatch(/acabar el 1\.º\.$/);
  });
});
