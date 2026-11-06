import { describe, expect, it } from "vitest";
import { applyDifficultyToTeamRating } from "../../src/career/teamPower";
import type { TeamRating } from "../../src/types/game";

function rating(value: number): TeamRating {
  return {
    attack: value,
    defense: value,
    control: value,
    physical: value,
    mentality: value,
    goalkeeping: value,
    overall: value,
    profileLabel: "Test",
    strengths: [],
    weaknesses: [],
  };
}

describe("rating de simulación en carrera (v0.25.94)", () => {
  it("conserva una décima: 87 y 88 visibles ya no dan el mismo número", () => {
    // Dificultad «Normal» (interna "dificil"): sin modificador.
    expect(applyDifficultyToTeamRating(rating(87), "dificil", true).overall).toBe(83.9);
    expect(applyDifficultyToTeamRating(rating(88), "dificil", true).overall).toBe(84.4);
    expect(applyDifficultyToTeamRating(rating(88), "normal", true).overall).toBe(86.4);
  });

  it("la partida rápida sigue en enteros", () => {
    expect(applyDifficultyToTeamRating(rating(87.6), "dificil", false).overall).toBe(88);
  });
});
