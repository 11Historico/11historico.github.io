import { describe, expect, it } from "vitest";
import { simulateEuropeanMatch } from "../../src/europe/europeanMatchEngine";

const seeds = Array.from({ length: 300 }, (_, index) => `unit_et_${index}`);
const base = { userTeamRating: 86, opponentRating: 86, isHome: true, competition: "champions_league" as const };

describe("motor europeo", () => {
  it("una eliminatoria nunca termina en empate", () => {
    for (const seed of seeds) {
      const outcome = simulateEuropeanMatch({ ...base, seed, isKnockout: true });
      expect(outcome.result === "win" || outcome.result === "loss").toBe(true);
      expect(outcome.decidedBy).toBeDefined();
    }
  });

  it("los tres caminos aparecen en el conjunto de semillas", () => {
    const decisions = new Set(seeds.map((seed) => simulateEuropeanMatch({ ...base, seed, isKnockout: true }).decidedBy));
    expect(decisions).toEqual(new Set(["regular_time", "extra_time", "penalties"]));
  });

  it("con la misma semilla el resultado es idéntico", () => {
    for (const seed of seeds.slice(0, 40)) {
      const first = simulateEuropeanMatch({ ...base, seed, isKnockout: true });
      const second = simulateEuropeanMatch({ ...base, seed, isKnockout: true });
      expect(second).toEqual(first);
    }
  });

  it("la fase inicial sigue pudiendo empatar y no usa prórroga", () => {
    const outcomes = seeds.map((seed) => simulateEuropeanMatch({ ...base, seed }));
    expect(outcomes.some((outcome) => outcome.result === "draw")).toBe(true);
    expect(outcomes.every((outcome) => outcome.decidedBy === undefined)).toBe(true);
  });

  it("una tanda siempre tiene ganador y coincide con el resultado", () => {
    for (const seed of seeds) {
      const outcome = simulateEuropeanMatch({ ...base, seed, isKnockout: true });
      if (outcome.decidedBy !== "penalties" || !outcome.penaltyShootout) continue;

      const { userScored, opponentScored } = outcome.penaltyShootout;
      expect(userScored).not.toBe(opponentScored);
      expect(outcome.result).toBe(userScored > opponentScored ? "win" : "loss");
    }
  });
});
