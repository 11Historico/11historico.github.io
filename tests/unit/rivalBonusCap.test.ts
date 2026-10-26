import { describe, expect, it } from "vitest";
import { getRivalDifficultyBonus } from "../../src/career/careerRules";

// Tope de la progresión de rivales: +3 de valoración como máximo (v0.25.42; antes +5 desde v0.25.38).
describe("tope de la progresión de rivales", () => {
  it("no supera +3 aunque pasen muchas temporadas", () => {
    expect(getRivalDifficultyBonus(20)).toBe(3);
    expect(getRivalDifficultyBonus(100)).toBe(3);
  });

  it("la curva sigue igual hasta alcanzar el tope", () => {
    expect(getRivalDifficultyBonus(0)).toBe(0);
    expect(getRivalDifficultyBonus(3)).toBeCloseTo(1.5);
    expect(getRivalDifficultyBonus(4)).toBeCloseTo(2.5);
    expect(getRivalDifficultyBonus(5)).toBe(3);
  });
});
