import { describe, expect, it } from "vitest";
import { getEuropeanCrestBackground, getEuropeanCrestInitials } from "../../src/europe/europeanCrest";
import { pickEuropeanOpponents } from "../../src/europe/europeanOpponents";
import type { EuropeanCompetition } from "../../src/europe/europeanTypes";

const COMPETITIONS: EuropeanCompetition[] = ["champions_league", "europa_league", "conference_league"];
const allOpponents = (competition: EuropeanCompetition) => pickEuropeanOpponents({ competition, count: 50, seed: "crest" });

describe("escudos genéricos europeos (v0.25.102)", () => {
  it("iniciales: palabras con mayúscula, como mucho tres", () => {
    expect(getEuropeanCrestInitials("Bayern München")).toBe("BM");
    expect(getEuropeanCrestInitials("Paris Saint-Germain")).toBe("PSG");
    expect(getEuropeanCrestInitials("Inter de Milán")).toBe("IM");
    expect(getEuropeanCrestInitials("Red Bull Salzburgo")).toBe("RBS");
  });

  it("un nombre de una palabra da tres letras, y las siglas cortas van enteras", () => {
    expect(getEuropeanCrestInitials("Arsenal")).toBe("ARS");
    expect(getEuropeanCrestInitials("Qarabağ")).toBe("QAR");
    expect(getEuropeanCrestInitials("PAOK")).toBe("PAOK");
    expect(getEuropeanCrestInitials("APOEL")).toBe("APO");
  });

  it("todos los países de los rivales tienen bandera", () => {
    for (const competition of COMPETITIONS) {
      for (const opponent of allOpponents(competition)) {
        expect(getEuropeanCrestBackground(opponent.country), opponent.country).toContain("gradient");
      }
    }
  });

  it("dentro de cada competición no hay dos clubes del mismo país con las mismas iniciales", () => {
    for (const competition of COMPETITIONS) {
      const keys = allOpponents(competition).map((opponent) => `${opponent.country}:${getEuropeanCrestInitials(opponent.name)}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("un país desconocido da un fondo neutro, sin romper el escudo", () => {
    expect(getEuropeanCrestBackground("Narnia")).toBe("#5b6b84");
  });
});
