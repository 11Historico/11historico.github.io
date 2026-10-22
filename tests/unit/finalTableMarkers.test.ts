import { describe, expect, it } from "vitest";
import { getFinalTableEuropeanSpot } from "../../src/europe/europeanQualification";

describe("marcas europeas de la tabla final", () => {
  it("campeón de Copa en 2.º: el 6.º recibe Europa League y el 7.º Conference", () => {
    expect(getFinalTableEuropeanSpot(5, 2)).toMatchObject({ competition: "europa_league", reallocated: false });
    expect(getFinalTableEuropeanSpot(6, 2)).toMatchObject({ competition: "europa_league", reallocated: true });
    expect(getFinalTableEuropeanSpot(7, 2)).toMatchObject({ competition: "conference_league", reallocated: true });
    expect(getFinalTableEuropeanSpot(8, 2)).toBeNull();
  });

  it("campeón de Copa en 5.º: su plaza es de Liga, y el 6.º y 7.º se reasignan", () => {
    expect(getFinalTableEuropeanSpot(5, 5)).toMatchObject({ competition: "europa_league", viaCopa: false });
    expect(getFinalTableEuropeanSpot(6, 5)).toMatchObject({ competition: "europa_league", reallocated: true });
    expect(getFinalTableEuropeanSpot(7, 5)).toMatchObject({ competition: "conference_league", reallocated: true });
  });

  it("campeón de Copa en 6.º: conserva la plaza de Copa y el 7.º recibe Conference", () => {
    expect(getFinalTableEuropeanSpot(6, 6)).toMatchObject({ competition: "europa_league", viaCopa: true });
    expect(getFinalTableEuropeanSpot(7, 6)).toMatchObject({ competition: "conference_league", reallocated: true });
    expect(getFinalTableEuropeanSpot(8, 6)).toBeNull();
  });

  it("campeón de Copa fuera de Europa: es Europa League vía Copa y el 6.º sigue en Conference", () => {
    expect(getFinalTableEuropeanSpot(12, 12)).toMatchObject({ competition: "europa_league", viaCopa: true });
    expect(getFinalTableEuropeanSpot(6, 12)).toMatchObject({ competition: "conference_league", reallocated: false });
    expect(getFinalTableEuropeanSpot(7, 12)).toBeNull();
  });

  it("campeón de Copa en Champions: no recibe plaza extra y el 7.º recibe Conference", () => {
    expect(getFinalTableEuropeanSpot(1, 1)).toMatchObject({ competition: "champions_league", viaCopa: false });
    expect(getFinalTableEuropeanSpot(6, 1)).toMatchObject({ competition: "europa_league", reallocated: true });
    expect(getFinalTableEuropeanSpot(7, 1)).toMatchObject({ competition: "conference_league", reallocated: true });
  });

  it("sin campeón de Copa conocido: 5.º Europa League, 6.º Conference", () => {
    expect(getFinalTableEuropeanSpot(6, null)).toMatchObject({ competition: "conference_league", reallocated: false });
    expect(getFinalTableEuropeanSpot(7, null)).toBeNull();
  });
});
