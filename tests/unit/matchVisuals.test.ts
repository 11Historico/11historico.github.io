import { describe, expect, it } from "vitest";
import strong from "../e2e/fixtures/career-strong.json";
import {
  getGoalContributions,
  getLineDuelSummary,
  getLineDuelText,
  getMatchDominance,
  getMatchKeyFactorIcon,
} from "../../src/components/matchSequenceTimeline";
import { simulateEuropeanMatch } from "../../src/europe/europeanMatchEngine";
import { getInitialCareerLeagueRivals } from "../../src/simulation/leagueSimulator";
import { simulateMatch } from "../../src/simulation/matchEngine";
import type { MatchResult, SelectedPlayer, TeamRating } from "../../src/types/game";

const teamRating = strong.teamRating as unknown as TeamRating;
const selectedPlayers = strong.selectedPlayers as unknown as SelectedPlayer[];
const rivals = getInitialCareerLeagueRivals();

function resultWith(params: { userWon?: boolean; userLost?: boolean; high: number; low: number; duel: [number, number, number, number] }): MatchResult {
  const [userAttack, rivalDefense, userDefense, rivalAttack] = params.duel;

  return {
    fixtureId: "f",
    matchday: 1,
    homeTeamName: "A",
    awayTeamName: "B",
    homeGoals: params.high,
    awayGoals: params.low,
    goalEvents: [],
    userTeamPlayed: true,
    userTeamWon: Boolean(params.userWon),
    userTeamDrew: !params.userWon && !params.userLost,
    userTeamLost: Boolean(params.userLost),
    lineDuel: { userAttack, userDefense, rivalAttack, rivalDefense },
  };
}

// v0.25.76: el partido se ve con datos del motor, sin cambiar el resultado.
describe("datos del motor para la secuencia", () => {
  it("cada partido informa de sus goles esperados y de sus líneas", () => {
    const rival = rivals[0];
    const result = simulateMatch({ fixtureId: "f", matchday: 1, rival, venue: "away", teamRating, selectedPlayers, seed: 5 });

    expect(result.expectedGoals?.userIsHome).toBe(false);
    expect(result.expectedGoals?.user).toBeGreaterThan(0);
    expect(result.expectedGoals?.rival).toBeGreaterThan(0);
    expect(result.lineDuel).toEqual({
      userAttack: Math.round(teamRating.attack),
      userDefense: Math.round(teamRating.defense),
      rivalAttack: Math.round(rival.ratings.attack),
      rivalDefense: Math.round(rival.ratings.defense),
    });
  });

  it("el planteamiento se nota en los goles esperados", () => {
    const params = { fixtureId: "f", matchday: 1, rival: rivals[0], venue: "home" as const, teamRating, selectedPlayers, seed: 5 };

    expect(simulateMatch({ ...params, approach: "attacking" }).expectedGoals!.user).toBeGreaterThan(simulateMatch(params).expectedGoals!.user);
    expect(simulateMatch({ ...params, approach: "defensive" }).expectedGoals!.rival).toBeLessThanOrEqual(simulateMatch(params).expectedGoals!.rival);
  });

  it("Europa da goles esperados pero no líneas, porque aún usa solo la media", () => {
    const outcome = simulateEuropeanMatch({ userTeamRating: 85, opponentRating: 80, isHome: false, competition: "europa_league", seed: "x" });

    expect(outcome.expectedGoals?.userIsHome).toBe(false);
    expect(outcome).not.toHaveProperty("lineDuel");
  });
});

describe("barra de dominio", () => {
  it("reparte de local a visitante y suma 100", () => {
    expect(getMatchDominance({ user: 1.5, rival: 0.5, userIsHome: true })).toEqual({ home: 75, away: 25, userIsHome: true });
    expect(getMatchDominance({ user: 1.5, rival: 0.5, userIsHome: false })).toEqual({ home: 25, away: 75, userIsHome: false });
    expect(getMatchDominance({ user: 0, rival: 0, userIsHome: true })).toEqual({ home: 50, away: 50, userIsHome: true });
  });
});

describe("crónica de las líneas", () => {
  it("cuenta la línea que explica el resultado", () => {
    expect(getLineDuelText(resultWith({ userWon: true, high: 3, low: 1, duel: [90, 80, 80, 80] }))).toBe("Tu ataque (90) superó a su defensa (80).");
    expect(getLineDuelText(resultWith({ userWon: true, high: 1, low: 0, duel: [80, 80, 90, 75] }))).toBe("Tu defensa (90) frenó a su ataque (75).");
    expect(getLineDuelText(resultWith({ userLost: true, high: 3, low: 0, duel: [80, 80, 75, 90] }))).toBe("Su ataque (90) superó a tu defensa (75).");
    expect(getLineDuelText(resultWith({ userLost: true, high: 1, low: 0, duel: [75, 90, 85, 80] }))).toBe("Su defensa (90) frenó a tu ataque (75).");
    expect(getLineDuelText(resultWith({ high: 0, low: 0, duel: [75, 90, 85, 80] }))).toBe("Su defensa (90) frenó a tu ataque (75).");
  });

  it("no cuenta nada si el marcador y los ratings no dicen lo mismo", () => {
    expect(getLineDuelText(resultWith({ userWon: true, high: 3, low: 1, duel: [70, 90, 70, 90] }))).toBeUndefined();
    expect(getLineDuelText(resultWith({ userLost: true, high: 3, low: 1, duel: [90, 70, 90, 70] }))).toBeUndefined();
    expect(getLineDuelText(resultWith({ high: 1, low: 1, duel: [90, 70, 90, 70] }))).toBeUndefined();
    expect(getLineDuelText({ ...resultWith({ userWon: true, high: 3, low: 1, duel: [90, 80, 80, 80] }), keyFactor: "extra_time_win" })).toBeUndefined();
    expect(getLineDuelText({ ...resultWith({ userWon: true, high: 3, low: 1, duel: [90, 80, 80, 80] }), lineDuel: undefined })).toBeUndefined();
  });

  it("la previa resume las dos líneas", () => {
    expect(getLineDuelSummary({ userAttack: 90, userDefense: 85, rivalAttack: 80, rivalDefense: 75 }))
      .toBe("Tu ataque 90 contra su defensa 75 · Tu defensa 85 contra su ataque 80");
  });
});

describe("mini campo e iconos", () => {
  it("el gol manda sobre la asistencia", () => {
    const goals = [
      { minute: 10, teamName: "A", scorerName: "Dani", assistName: "Iker" },
      { minute: 20, teamName: "A", scorerName: "Iker", assistName: "Muniain" },
      { minute: 30, teamName: "B" },
    ];

    expect(getGoalContributions(goals)).toEqual({ Dani: "goal", Iker: "goal", Muniain: "assist" });
    expect(getGoalContributions([])).toEqual({});
  });

  it("cada factor tiene icono", () => {
    expect(getMatchKeyFactorIcon("clean_sheet_win")).toBe("defensive");
    expect(getMatchKeyFactorIcon("extra_time_loss")).toBe("extra_time");
  });
});
