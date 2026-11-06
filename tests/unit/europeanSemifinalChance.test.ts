import { afterEach, describe, expect, it, vi } from "vitest";
import { estimateEuropeanSemifinalChance, getEuropeanSemifinalChanceText } from "../../src/europe/europeanSemifinalChance";
import { applyEuropeanMatchResult, createEuropeanTournamentForQualification } from "../../src/europe/europeanTournament";
import type { EuropeanQualificationResult, EuropeanTournamentState } from "../../src/europe/europeanTypes";

function newTournament(): EuropeanTournamentState {
  const tournament = createEuropeanTournamentForQualification({
    seasonNumber: 1,
    qualification: { qualified: true, competition: "europa_league" } as EuropeanQualificationResult,
    seed: "semifinal_chance",
    totalLeagueMatchdays: 38,
  });
  if (!tournament) throw new Error("No se creó el torneo");
  return tournament;
}

function play(tournament: EuropeanTournamentState, count: number, userGoals: number, opponentGoals: number): EuropeanTournamentState {
  const result = userGoals > opponentGoals ? "win" : userGoals === opponentGoals ? "draw" : "loss";
  return tournament.matches
    .filter((match) => match.phase === "league_phase")
    .slice(0, count)
    .reduce((state, match) => applyEuropeanMatchResult(state, match.id, { userGoals, opponentGoals, result }, 38), tournament);
}

afterEach(() => vi.restoreAllMocks());

describe("probabilidad de pasar a semifinales europeas (v0.25.95)", () => {
  it("da siempre lo mismo y no gasta azar de la partida", () => {
    const random = vi.spyOn(Math, "random");
    const params = { tournament: newTournament(), userTeamRating: 84 };
    expect(estimateEuropeanSemifinalChance(params)).toEqual(estimateEuropeanSemifinalChance(params));
    expect(random).not.toHaveBeenCalled();
  });

  it("un equipo mejor tiene más opciones", () => {
    const tournament = newTournament();
    const strong = estimateEuropeanSemifinalChance({ tournament, userTeamRating: 92 })!;
    const weak = estimateEuropeanSemifinalChance({ tournament, userTeamRating: 76 })!;
    expect(strong.chance).toBeGreaterThan(weak.chance);
    expect(strong.remaining).toBe(6);
  });

  it("ganar los primeros partidos sube la probabilidad, y perderlos la baja", () => {
    const tournament = newTournament();
    const before = estimateEuropeanSemifinalChance({ tournament, userTeamRating: 84 })!.chance;
    const winning = estimateEuropeanSemifinalChance({ tournament: play(tournament, 3, 3, 0), userTeamRating: 84 })!;
    const losing = estimateEuropeanSemifinalChance({ tournament: play(tournament, 3, 0, 3), userTeamRating: 84 })!;
    expect(winning.chance).toBeGreaterThan(before);
    expect(losing.chance).toBeLessThan(before);
    expect(winning.remaining).toBe(3);
  });

  it("no hay probabilidad cuando la fase de liga ha terminado", () => {
    expect(estimateEuropeanSemifinalChance({ tournament: play(newTournament(), 6, 1, 1), userTeamRating: 84 })).toBeNull();
  });

  it("tarda poco: se calcula al abrir la Liga y tras cada partido", () => {
    const start = performance.now();
    estimateEuropeanSemifinalChance({ tournament: newTournament(), userTeamRating: 84 });
    expect(performance.now() - start).toBeLessThan(1500);
  });

  it("dice la probabilidad y, si los hay, los puntos con los que pasas casi seguro", () => {
    expect(getEuropeanSemifinalChanceText({ chance: 0.31, remaining: 2, safePoints: 4 })).toBe(
      "Probabilidad de pasar a semifinales: 31 %. Con 4 puntos en los 2 partidos que faltan pasas casi seguro.",
    );
    expect(getEuropeanSemifinalChanceText({ chance: 0.05, remaining: 1 })).toBe("Probabilidad de pasar a semifinales: 5 %.");
    expect(getEuropeanSemifinalChanceText({ chance: 0.002, remaining: 1, safePoints: 3 })).toBe(
      "Probabilidad de pasar a semifinales: menos del 1 %. Con 3 puntos en el partido que falta pasas casi seguro.",
    );
    expect(getEuropeanSemifinalChanceText({ chance: 0.97, remaining: 1, safePoints: 0 })).toBe(
      "Probabilidad de pasar a semifinales: 97 %. Pasas casi seguro pase lo que pase.",
    );
  });
});
