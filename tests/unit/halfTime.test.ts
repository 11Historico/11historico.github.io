import { describe, expect, it } from "vitest";
import strong from "../e2e/fixtures/career-strong.json";
import { getHalfTimeEffectText, getHalfTimeElapsedMs, getMatchSequenceFrame } from "../../src/components/matchSequenceTimeline";
import { getEuropeanHalfTimeElapsedMs, getEuropeanSequenceFrame } from "../../src/components/europeanMatchSequenceTimeline";
import { simulateEuropeanMatch } from "../../src/europe/europeanMatchEngine";
import { applyHalfTimeChoice, simulateMatch } from "../../src/simulation/matchEngine";
import {
  createUserLeagueSimulation,
  getInitialCareerLeagueRivals,
  getPendingCupFixture,
  simulateNextCupMatch,
  simulateNextUserLeagueMatch,
} from "../../src/simulation/leagueSimulator";
import type { MatchResult, SelectedPlayer, TeamRating } from "../../src/types/game";

const teamRating = strong.teamRating as unknown as TeamRating;
const selectedPlayers = strong.selectedPlayers as unknown as SelectedPlayer[];
const rivals = getInitialCareerLeagueRivals();

function playedMatch(seed: number): MatchResult {
  return simulateMatch({ fixtureId: "f", matchday: 1, userTeamName: "Yo", rival: rivals[seed % rivals.length], venue: seed % 2 ? "home" : "away", teamRating, selectedPlayers, seed });
}

function userGoals(result: MatchResult) {
  return result.expectedGoals?.userIsHome ? result.homeGoals : result.awayGoals;
}

function rivalGoals(result: MatchResult) {
  return result.expectedGoals?.userIsHome ? result.awayGoals : result.homeGoals;
}

// v0.25.78: la decisión del descanso solo toca la segunda parte.
describe("decisión del descanso", () => {
  it("los goles de la primera parte no cambian y el marcador cuadra con los goles", () => {
    for (let seed = 1; seed <= 500; seed += 1) {
      const base = playedMatch(seed);

      for (const choice of ["push", "close"] as const) {
        const decided = applyHalfTimeChoice({ result: base, choice, selectedPlayers, seed: seed + 7919 });

        expect(decided.goalEvents.filter((goal) => goal.minute <= 45)).toEqual(base.goalEvents.filter((goal) => goal.minute <= 45));
        expect(decided.goalEvents.filter((goal) => goal.teamName === decided.homeTeamName)).toHaveLength(decided.homeGoals);
        expect(decided.goalEvents.filter((goal) => goal.teamName === decided.awayTeamName)).toHaveLength(decided.awayGoals);
        expect(Boolean(decided.userTeamWon)).toBe(userGoals(decided) > rivalGoals(decided));
        expect(Boolean(decided.userTeamLost)).toBe(userGoals(decided) < rivalGoals(decided));
        expect(decided.cleanSheetForUserTeam).toBe(rivalGoals(decided) === 0);
        expect(decided.halfTimeEffect).toMatchObject({ choice, keptUserGoals: userGoals(base), keptRivalGoals: rivalGoals(base), userGoals: userGoals(decided), rivalGoals: rivalGoals(decided) });
      }
    }
  });

  it("arriesgar solo añade goles, y cerrar solo los quita", () => {
    let pushChanged = 0;
    let closeChanged = 0;

    for (let seed = 1; seed <= 500; seed += 1) {
      const base = playedMatch(seed);
      const pushed = applyHalfTimeChoice({ result: base, choice: "push", selectedPlayers, seed: seed + 7919 });
      const closed = applyHalfTimeChoice({ result: base, choice: "close", selectedPlayers, seed: seed + 7919 });

      expect(userGoals(pushed)).toBeGreaterThanOrEqual(userGoals(base));
      expect(rivalGoals(pushed)).toBeGreaterThanOrEqual(rivalGoals(base));
      expect(userGoals(closed)).toBeLessThanOrEqual(userGoals(base));
      expect(rivalGoals(closed)).toBeLessThanOrEqual(rivalGoals(base));
      if (pushed.goalEvents.length !== base.goalEvents.length) pushChanged += 1;
      if (closed.goalEvents.length !== base.goalEvents.length) closeChanged += 1;
    }

    expect(pushChanged).toBeGreaterThan(0);
    expect(closeChanged).toBeGreaterThan(0);
  });

  it("los goles añadidos son de la segunda parte y con goleador del once", () => {
    const names = selectedPlayers.map((selected) => selected.playerSeason.name);

    for (let seed = 1; seed <= 300; seed += 1) {
      const base = playedMatch(seed);
      const pushed = applyHalfTimeChoice({ result: base, choice: "push", selectedPlayers, seed: seed + 7919 });
      const added = pushed.goalEvents.filter((goal) => !base.goalEvents.includes(goal));

      for (const goal of added) {
        expect(goal.minute).toBeGreaterThan(45);
        expect(goal.minute).toBeLessThanOrEqual(90);
        if (goal.teamName === "Yo") expect(names).toContain(goal.scorerName);
        else expect(goal.scorerName).toBeUndefined();
      }
    }
  });

  it("si cambia el marcador, se quita la comparación del planteamiento y el factor es coherente", () => {
    let changed = 0;

    for (let seed = 1; seed <= 500; seed += 1) {
      const base = simulateMatch({ fixtureId: "f", matchday: 1, userTeamName: "Yo", rival: rivals[seed % rivals.length], venue: "home", teamRating, selectedPlayers, seed, approach: "attacking" });
      const decided = applyHalfTimeChoice({ result: base, choice: "push", selectedPlayers, seed: seed + 7919 });

      if (decided.goalEvents.length === base.goalEvents.length) {
        expect(decided.approachEffect).toEqual(base.approachEffect);
        expect(decided.keyFactor).toBe(base.keyFactor);
      } else {
        changed += 1;
        expect(decided.approachEffect).toBeUndefined();
        if (decided.keyFactor === "clean_sheet_win") expect(rivalGoals(decided)).toBe(0);
      }
    }

    expect(changed).toBeGreaterThan(0);
  });

  it("no aplica sin datos del motor (partidas guardadas antiguas)", () => {
    const base = { ...playedMatch(1), expectedGoals: undefined };

    expect(applyHalfTimeChoice({ result: base, choice: "push", selectedPlayers })).toBe(base);
  });
});

describe("descanso en Europa", () => {
  const input = { userTeamRating: 84, opponentRating: 82, isHome: true, competition: "europa_league" as const, userProfile: teamRating, selectedPlayers };

  it("sin decisión, el partido es el de siempre; con ella, la primera parte es la misma", () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const base = simulateEuropeanMatch({ ...input, seed });
      const decided = simulateEuropeanMatch({ ...input, seed, halfTimeChoice: "close" });

      expect(base.halfTimeEffect).toBeUndefined();
      expect(decided.goalEvents.filter((goal) => goal.minute <= 45)).toEqual(base.goalEvents.filter((goal) => goal.minute <= 45));
      expect(simulateEuropeanMatch({ ...input, seed, halfTimeChoice: "close" })).toEqual(decided);
    }
  });

  it("en eliminatoria nunca acaba en empate, también tras decidir", () => {
    const decisions = new Set<string | undefined>();

    for (let seed = 1; seed <= 300; seed += 1) {
      const outcome = simulateEuropeanMatch({ ...input, seed, isKnockout: true, halfTimeChoice: "push" });
      expect(outcome.result).not.toBe("draw");
      decisions.add(outcome.decidedBy);
    }

    expect(decisions.has("regular_time")).toBe(true);
    expect(decisions.has("extra_time") || decisions.has("penalties")).toBe(true);
  });
});

describe("descanso en Copa", () => {
  it("rehacer el partido con la decisión sustituye el resultado sin contar nada dos veces", () => {
    let context = createUserLeagueSimulation({ rivals });
    let seed = 700;

    while (!getPendingCupFixture(context)) {
      context = simulateNextUserLeagueMatch({ context, teamRating, selectedPlayers, seed: seed++ }).context;
    }

    const params = { context, teamRating, selectedPlayers, seed: 9001 };
    const played = simulateNextCupMatch(params);
    const decided = simulateNextCupMatch({
      ...params,
      regularTimeResult: applyHalfTimeChoice({ result: played.regularTimeResult!, choice: "push", selectedPlayers, seed: 5 }),
    });

    expect(decided.result?.userTeamDrew).toBeFalsy();
    expect(decided.context.cupState.results).toHaveLength(context.cupState.results.length + 1);
    expect(decided.context.userTeamStats.goalsFor - context.userTeamStats.goalsFor).toBe(
      decided.result!.expectedGoals!.userIsHome ? decided.result!.homeGoals : decided.result!.awayGoals,
    );
    expect(decided.context.cupState.status === "eliminated").toBe(Boolean(decided.result?.userTeamLost));
  });
});

describe("pausa y texto", () => {
  it("la pausa cae justo en el minuto 45 y solo enseña la primera parte", () => {
    const goals = [
      { minute: 45, teamName: "A" },
      { minute: 46, teamName: "B" },
      { minute: 94, teamName: "A" },
    ];

    for (const multiplier of [0.5, 1, 2]) {
      const frame = getMatchSequenceFrame(goals, getHalfTimeElapsedMs(goals, multiplier), multiplier);

      expect(frame.minute).toBe(45);
      expect(frame.visibleGoals.map((goal) => goal.minute)).toEqual([45]);
      expect(getEuropeanSequenceFrame({ decidedBy: "regular_time" }, getEuropeanHalfTimeElapsedMs(multiplier), multiplier).minute).toBe(45);
    }
  });

  it("cuenta qué cambió la decisión", () => {
    const effect = { choice: "push" as const, userGoals: 1, rivalGoals: 1, keptUserGoals: 0, keptRivalGoals: 1 };

    expect(getHalfTimeEffectText(undefined)).toBeUndefined();
    expect(getHalfTimeEffectText(effect)).toBe("Arriesgar cambió el partido: sin tocar nada habrías perdido 1-0 a los 90 minutos.");
    expect(getHalfTimeEffectText({ ...effect, userGoals: 1, rivalGoals: 2, keptUserGoals: 1, keptRivalGoals: 1 }))
      .toBe("Arriesgar te salió caro: sin tocar nada habrías empatado 1-1 a los 90 minutos.");
    expect(getHalfTimeEffectText({ ...effect, choice: "close", userGoals: 1, rivalGoals: 0, keptUserGoals: 2, keptRivalGoals: 0 }))
      .toBe("Cerrar el partido: sin tocar nada también habrías ganado, 2-0 a los 90 minutos.");
    expect(getHalfTimeEffectText({ ...effect, choice: "close", userGoals: 1, rivalGoals: 0, keptUserGoals: 1, keptRivalGoals: 0 }))
      .toBe("Cerrar el partido: sin tocar nada, el marcador habría sido el mismo.");
  });
});
