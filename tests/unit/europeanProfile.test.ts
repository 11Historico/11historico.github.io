import { describe, expect, it } from "vitest";
import strong from "../e2e/fixtures/career-strong.json";
import { getEuropeanVisibleGoals } from "../../src/components/europeanMatchSequenceTimeline";
import { getLineDuelSummary, getLineDuelText } from "../../src/components/matchSequenceTimeline";
import { getEuropeanLineDuel, simulateEuropeanMatch } from "../../src/europe/europeanMatchEngine";
import type { SelectedPlayer, TeamRating } from "../../src/types/game";

const realProfile = strong.teamRating as unknown as TeamRating;
const selectedPlayers = strong.selectedPlayers as unknown as SelectedPlayer[];
const base = { userTeamRating: 84, opponentRating: 80, isHome: true, competition: "europa_league" as const };

function flatProfile(line: number): TeamRating {
  return { ...realProfile, attack: line, defense: line, control: line, physical: line, mentality: line, goalkeeping: line, overall: line };
}

function score(outcome: { userGoals: number; opponentGoals: number; result: string }) {
  return [outcome.userGoals, outcome.opponentGoals, outcome.result];
}

function totalGoals(userProfile: TeamRating) {
  let userGoals = 0;
  let opponentGoals = 0;

  for (let seed = 1; seed <= 3000; seed += 1) {
    const outcome = simulateEuropeanMatch({ ...base, seed, userProfile });
    userGoals += outcome.userGoals;
    opponentGoals += outcome.opponentGoals;
  }

  return { userGoals, opponentGoals };
}

// v0.25.77: Europa juega con las líneas reales, con la misma fuerza que marca la media.
describe("perfil real en Europa", () => {
  it("sin perfil, el partido es el de siempre: sin goleadores ni líneas", () => {
    const outcome = simulateEuropeanMatch({ ...base, seed: "x" });

    expect(outcome.goalEvents.every((goal) => !goal.scorerName && !goal.assistName)).toBe(true);
    expect(outcome.lineDuel).toBeUndefined();
  });

  it("el perfil reparte la fuerza, no la aumenta: las líneas por encima de la media no inflan al equipo", () => {
    for (let seed = 1; seed <= 500; seed += 1) {
      const uniform = simulateEuropeanMatch({ ...base, seed });

      expect(score(simulateEuropeanMatch({ ...base, seed, userProfile: flatProfile(84) }))).toEqual(score(uniform));
      expect(score(simulateEuropeanMatch({ ...base, seed, userProfile: flatProfile(96) }))).toEqual(score(uniform));
    }
  });

  it("un perfil ofensivo marca más y encaja más que uno defensivo con la misma media", () => {
    const attacking = totalGoals({ ...flatProfile(84), attack: 92, defense: 76 });
    const defensive = totalGoals({ ...flatProfile(84), attack: 76, defense: 92 });

    expect(attacking.userGoals).toBeGreaterThan(defensive.userGoals);
    expect(attacking.opponentGoals).toBeGreaterThan(defensive.opponentGoals);
  });

  it("los goles del usuario llevan goleador de su once, y los del rival no", () => {
    const names = selectedPlayers.map((selected) => selected.playerSeason.name);
    let userGoals = 0;

    for (let seed = 1; seed <= 300; seed += 1) {
      const outcome = simulateEuropeanMatch({ ...base, seed, userProfile: realProfile, selectedPlayers });

      for (const goal of outcome.goalEvents) {
        if (goal.isUserGoal) {
          userGoals += 1;
          expect(names).toContain(goal.scorerName);
          if (goal.assistName) {
            expect(names).toContain(goal.assistName);
            expect(goal.assistName).not.toBe(goal.scorerName);
          }
        } else {
          expect(goal.scorerName).toBeUndefined();
        }
      }
    }

    expect(userGoals).toBeGreaterThan(0);
  });

  it("los goleadores no cambian el marcador", () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const withPlayers = simulateEuropeanMatch({ ...base, seed, userProfile: realProfile, selectedPlayers, isKnockout: true });
      const withoutPlayers = simulateEuropeanMatch({ ...base, seed, userProfile: realProfile, isKnockout: true });

      expect(score(withPlayers)).toEqual(score(withoutPlayers));
    }
  });

  it("las líneas se ajustan a la media y el rival es un solo número", () => {
    const duel = getEuropeanLineDuel({ ...base, userProfile: { ...flatProfile(96), attack: 100, defense: 92 } });

    expect(duel).toEqual({ userAttack: 88, userDefense: 80, rivalAttack: 80, rivalDefense: 80, rivalHasOnlyOverall: true });
    expect(simulateEuropeanMatch({ ...base, seed: "x", userProfile: realProfile }).lineDuel?.rivalHasOnlyOverall).toBe(true);
  });
});

describe("textos con un rival de un solo número", () => {
  const duel = { userAttack: 90, userDefense: 70, rivalAttack: 80, rivalDefense: 80, rivalHasOnlyOverall: true };

  it("no hablan de líneas que el rival no tiene", () => {
    expect(getLineDuelSummary(duel)).toBe("Tu ataque 90 · Tu defensa 70 · Nivel del rival 80");
    expect(getLineDuelText({ lineDuel: duel, homeGoals: 3, awayGoals: 1, userTeamWon: true, userTeamLost: false })).toBe("Tu ataque (90) superó al rival (80).");
    expect(getLineDuelText({ lineDuel: duel, homeGoals: 1, awayGoals: 3, userTeamWon: false, userTeamLost: true })).toBe("El rival (80) superó a tu defensa (70).");
  });
});

describe("goles visibles en la secuencia europea", () => {
  const goals = [
    { minute: 10, isUserGoal: true, scorerName: "Dani" },
    { minute: 70, isUserGoal: false },
  ];

  it("aparecen en su minuto y siguen a la vista desde el final de los 90", () => {
    expect(getEuropeanVisibleGoals(goals, { stage: "preview", clockLabel: "", scoreBasis: "none" })).toEqual([]);
    expect(getEuropeanVisibleGoals(goals, { stage: "regular", clockLabel: "", scoreBasis: "none", minute: 30 })).toEqual([goals[0]]);
    expect(getEuropeanVisibleGoals(goals, { stage: "extra_time", clockLabel: "", scoreBasis: "regular" })).toEqual(goals);
    expect(getEuropeanVisibleGoals(goals, { stage: "final", clockLabel: "", scoreBasis: "final" })).toEqual(goals);
    expect(getEuropeanVisibleGoals(undefined, { stage: "final", clockLabel: "", scoreBasis: "final" })).toEqual([]);
  });
});
