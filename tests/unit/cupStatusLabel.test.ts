import { describe, expect, it } from "vitest";
import { getCupStatusLabel } from "../../src/simulation/leagueSimulator";
import type { CupSimulationState, MatchResult } from "../../src/types/game";

function eliminatedIn(roundName: string): CupSimulationState {
  return {
    status: "eliminated",
    currentRoundIndex: 0,
    fixtures: [],
    results: [{ roundName } as MatchResult],
    championTeamName: "Rayo Vallecano",
  };
}

describe("getCupStatusLabel (v0.25.85)", () => {
  it("perder la final es quedar subcampeón", () => {
    expect(getCupStatusLabel(eliminatedIn("Final"))).toBe("Subcampeón · Campeón: Rayo Vallecano");
  });

  it("las demás rondas siguen diciendo en cuál se cayó", () => {
    expect(getCupStatusLabel(eliminatedIn("Semifinal"))).toBe("Eliminado en Semifinal · Campeón: Rayo Vallecano");
  });
});
