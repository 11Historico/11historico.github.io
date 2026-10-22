import { describe, expect, it } from "vitest";
import { getEuropeanQualification } from "../../src/career/careerRules";
import { resolveEuropeanQualification } from "../../src/europe/europeanQualification";

describe("reparto de Liga", () => {
  it("1º-4º van a Champions y el 5º a Europa League", () => {
    for (const position of [1, 2, 3, 4]) {
      expect(resolveEuropeanQualification({ leaguePosition: position, userWonCopa: false }).competition).toBe("champions_league");
    }
    expect(resolveEuropeanQualification({ leaguePosition: 5, userWonCopa: false }).competition).toBe("europa_league");
  });

  it("el 6º va a Conference si el campeón de Copa no está en Europa por Liga", () => {
    const result = resolveEuropeanQualification({ leaguePosition: 6, userWonCopa: false });
    expect(result.competition).toBe("conference_league");
    expect(result.source).toBe("league_position");
  });

  it("8º sin reasignación no tiene plaza europea", () => {
    const result = resolveEuropeanQualification({ leaguePosition: 8, userWonCopa: false });
    expect(result.qualified).toBe(false);
    expect(result.source).toBe("none");
  });
});

describe("reasignación por campeón de Copa externo", () => {
  it("si el campeón está en Europa por Liga, el 6º recibe Europa League", () => {
    const result = resolveEuropeanQualification({ leaguePosition: 6, userWonCopa: false, copaWinnerLeaguePosition: 2 });
    expect(result.competition).toBe("europa_league");
    expect(result.source).toBe("league_reallocation");
  });

  it("si el campeón está en Champions, el 7º recibe Conference y el 8º no tiene plaza", () => {
    expect(resolveEuropeanQualification({ leaguePosition: 7, userWonCopa: false, copaWinnerLeaguePosition: 1 }).competition).toBe("conference_league");
    expect(resolveEuropeanQualification({ leaguePosition: 8, userWonCopa: false, copaWinnerLeaguePosition: 1 }).qualified).toBe(false);
  });

  it("si el campeón queda 6º, el 7º recibe Conference", () => {
    expect(resolveEuropeanQualification({ leaguePosition: 7, userWonCopa: false, copaWinnerLeaguePosition: 6 }).competition).toBe("conference_league");
  });

  it("si el campeón está fuera de Europa, el 6º sigue con Conference", () => {
    expect(resolveEuropeanQualification({ leaguePosition: 6, userWonCopa: false, copaWinnerLeaguePosition: 12 }).competition).toBe("conference_league");
  });
});

describe("ganar la Copa siendo usuario", () => {
  it("garantiza Europa League desde 8º", () => {
    const result = resolveEuropeanQualification({ leaguePosition: 8, userWonCopa: true });
    expect(result.competition).toBe("europa_league");
    expect(result.source).toBe("copa_winner");
  });

  it("no empeora una plaza de Champions", () => {
    expect(resolveEuropeanQualification({ leaguePosition: 3, userWonCopa: true }).competition).toBe("champions_league");
  });
});

describe("getEuropeanQualification (Game Over)", () => {
  it("usa el mismo reparto que el torneo jugable", () => {
    expect(getEuropeanQualification(6, false, 2)).toBe("europa_league");
    expect(getEuropeanQualification(8, false, 1)).toBe("none");
    expect(getEuropeanQualification(8, true)).toBe("europa_league");
  });
});
