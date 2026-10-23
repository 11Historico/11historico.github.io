import { describe, expect, it } from "vitest";
import { applyCareerRivalProgression, getRivalDifficultyBonus } from "../../src/career/careerRules";
import type { RivalTeam } from "../../src/types/game";

const rival: RivalTeam = {
  id: "rival_test",
  name: "Rival test",
  shirtIcon: "",
  ratings: { attack: 70, midfield: 70, defense: 70, goalkeeping: 70, mentality: 70, overall: 70 },
};

describe("applyCareerRivalProgression", () => {
  it("no cambia a los rivales en la primera temporada", () => {
    expect(applyCareerRivalProgression([rival], 0)).toEqual([rival]);
  });

  it("sube la valoración según la curva de temporadas superadas", () => {
    const [progressed] = applyCareerRivalProgression([rival], 3);
    expect(progressed.ratings.overall).toBeCloseTo(70 + getRivalDifficultyBonus(3));
  });

  it("no modifica la lista original", () => {
    applyCareerRivalProgression([rival], 6);
    expect(rival.ratings.overall).toBe(70);
  });

  it("no supera 99 en ninguna valoración", () => {
    const strong: RivalTeam = { ...rival, ratings: { ...rival.ratings, attack: 98, overall: 98 } };
    const [progressed] = applyCareerRivalProgression([strong], 20);
    expect(progressed.ratings.attack).toBeLessThanOrEqual(99);
    expect(progressed.ratings.overall).toBeLessThanOrEqual(99);
  });
});
