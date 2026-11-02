import { describe, expect, it } from "vitest";
import { getCupVerdict, getEuropeanVerdict } from "../../src/components/matchVerdict";
import type { EuropeanTournamentMatch, EuropeanTournamentState } from "../../src/europe/europeanTypes";
import type { MatchResult } from "../../src/types/game";

function cup(roundName: string, won: boolean): MatchResult {
  return { competition: "cup", roundName, userTeamPlayed: true, userTeamWon: won, userTeamLost: !won } as MatchResult;
}

function europe(phase: EuropeanTournamentMatch["phase"], id: string, result?: "win" | "loss"): EuropeanTournamentMatch {
  return { id, phase, competition: "europa_league", status: "played", result } as EuropeanTournamentMatch;
}

function tournament(matches: EuropeanTournamentMatch[], flags: Partial<EuropeanTournamentState> = {}): EuropeanTournamentState {
  return { matches, qualifiedForSemifinal: false, eliminated: false, ...flags } as EuropeanTournamentState;
}

describe("cartel de Copa (v0.25.86)", () => {
  it("perder es quedar eliminado, y en la final, subcampeón", () => {
    expect(getCupVerdict(cup("Octavos", false))).toMatchObject({ kind: "out", title: "Has sido eliminado" });
    expect(getCupVerdict(cup("Final", false))).toMatchObject({ kind: "out", title: "Subcampeón" });
  });

  it("ganar es clasificarse, y en la final, campeón", () => {
    expect(getCupVerdict(cup("Cuartos", true))).toMatchObject({ kind: "through", title: "Has clasificado" });
    expect(getCupVerdict(cup("Final", true))).toMatchObject({ kind: "champion" });
  });

  it("no sale en Liga, en la Supercopa ni en partidos entre rivales", () => {
    expect(getCupVerdict({ ...cup("Octavos", false), competition: "league" } as MatchResult)).toBeUndefined();
    expect(getCupVerdict(cup("Supercopa · Final", false))).toBeUndefined();
    expect(getCupVerdict({ ...cup("Octavos", false), userTeamPlayed: false })).toBeUndefined();
  });
});

describe("cartel europeo (v0.25.86)", () => {
  const league = [europe("league_phase", "l1", "win"), europe("league_phase", "l2", "loss")];

  it("en la fase inicial solo decide el último partido", () => {
    expect(getEuropeanVerdict(tournament(league, { qualifiedForSemifinal: true }), league[0])).toBeUndefined();
    expect(getEuropeanVerdict(tournament(league, { qualifiedForSemifinal: true }), league[1])).toMatchObject({ kind: "through" });
    expect(getEuropeanVerdict(tournament(league, { eliminated: true }), league[1])).toMatchObject({ kind: "out" });
    // Antes de cerrarse la fase (estado previo al partido) no hay cartel.
    expect(getEuropeanVerdict(tournament(league), league[1])).toBeUndefined();
  });

  it("semifinal y final deciden por su resultado", () => {
    expect(getEuropeanVerdict(tournament(league), europe("semifinal", "s", "loss"))).toMatchObject({ kind: "out", title: "Has sido eliminado" });
    expect(getEuropeanVerdict(tournament(league), europe("semifinal", "s", "win"))).toMatchObject({ kind: "through" });
    expect(getEuropeanVerdict(tournament(league), europe("final", "f", "win"))).toMatchObject({ kind: "champion" });
    expect(getEuropeanVerdict(tournament(league), europe("final", "f", "loss"))).toMatchObject({ kind: "out", title: "Subcampeón" });
  });
});
