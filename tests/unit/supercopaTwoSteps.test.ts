import { describe, expect, it } from "vitest";
import {
  getSupercopaBracketRounds,
  getSupercopaFinalPreview,
  simulateCareerSupercopa,
  simulateSupercopaFinal,
  simulateSupercopaSemifinals,
} from "../../src/career/supercopaRules";
import { USER_TEAM_ID } from "../../src/data/laliga2526Teams";
import { getInitialCareerLeagueRivals } from "../../src/simulation/leagueSimulator";
import type { CareerSupercopaQualification } from "../../src/types/career";
import type { TeamRating } from "../../src/types/game";

const rivals = getInitialCareerLeagueRivals();

function rating(value: number): TeamRating {
  return { attack: value, defense: value, control: value, physical: value, mentality: value, goalkeeping: value, overall: value, profileLabel: "", strengths: [], weaknesses: [] };
}

const qualification: CareerSupercopaQualification = {
  seasonLabel: "2026/27",
  userQualified: true,
  reason: "",
  participants: [
    { teamId: USER_TEAM_ID, teamName: "Athletic Club Histórico", source: "league_champion", sourceLabel: "1.º Liga" },
    { teamId: rivals[0].id, teamName: rivals[0].name, source: "league_runner_up", sourceLabel: "2.º Liga" },
    { teamId: rivals[1].id, teamName: rivals[1].name, source: "cup_champion", sourceLabel: "Campeón Copa" },
    { teamId: rivals[2].id, teamName: rivals[2].name, source: "cup_runner_up", sourceLabel: "Subcampeón Copa" },
  ],
};

function play(seed: number, value: number) {
  const params = { qualification, teamRating: rating(value), selectedPlayers: [], rivals, seed };
  return { params, semifinals: simulateSupercopaSemifinals(params) };
}

describe("Supercopa en dos pasos (v0.25.90)", () => {
  it("si ganas la semifinal, se para antes de la final", () => {
    const seed = Array.from({ length: 50 }, (_, index) => index + 1).find((candidate) => play(candidate, 95).semifinals.awaitingFinal)!;
    const { semifinals } = play(seed, 95);

    expect(semifinals.results).toHaveLength(2);
    expect(semifinals.championTeamName).toBe("");
    expect(semifinals.results[0].roundName).toBe("Supercopa · Semifinal");
  });

  it("la final aparte da lo mismo que la Supercopa entera con la misma semilla", () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const { params, semifinals } = play(seed, 88);
      const whole = simulateCareerSupercopa(params);
      const stepByStep = semifinals.awaitingFinal ? simulateSupercopaFinal({ ...params, semifinals }) : semifinals;

      expect(stepByStep).toEqual(whole);
      expect(stepByStep.results).toHaveLength(3);
      expect(stepByStep.awaitingFinal).toBeUndefined();
    }
  });

  it("si caes en semifinales, la final entre rivales se juega a la vez", () => {
    const seed = Array.from({ length: 50 }, (_, index) => index + 1).find((candidate) => !play(candidate, 70).semifinals.awaitingFinal)!;
    const { semifinals } = play(seed, 70);

    expect(semifinals.results).toHaveLength(3);
    expect(semifinals.eliminatedRoundName).toBe("Semifinal");
  });

  it("la previa de la final es contra el ganador de la otra semifinal", () => {
    const seed = Array.from({ length: 50 }, (_, index) => index + 1).find((candidate) => play(candidate, 95).semifinals.awaitingFinal)!;
    const { params, semifinals } = play(seed, 95);
    const otherSemi = semifinals.results.find((result) => result.userTeamPlayed === false)!;
    const otherWinner = otherSemi.homeGoals > otherSemi.awayGoals ? otherSemi.homeTeamName : otherSemi.awayTeamName;

    expect(getSupercopaFinalPreview({ ...params, semifinals })?.rivalName).toBe(otherWinner);
  });

  it("el cuadro solo enseña los partidos ya vistos", () => {
    const { params, semifinals } = play(3, 88);
    const whole = simulateCareerSupercopa(params);

    const before = getSupercopaBracketRounds(qualification.participants, undefined, 0);
    expect(before.map((round) => round.ties.length)).toEqual([2, 1]);
    expect(before[0].ties.every((tie) => tie.homeTeamName && !tie.result)).toBe(true);
    expect(before[1].ties[0].homeTeamName).toBeUndefined();

    const oneSeen = getSupercopaBracketRounds(qualification.participants, semifinals, 1);
    expect(oneSeen[0].ties[0].result).toBeDefined();
    expect(oneSeen[0].ties[1].result).toBeUndefined();
    expect(oneSeen[1].ties[0].homeTeamName).toBeUndefined();

    const all = getSupercopaBracketRounds(qualification.participants, whole, 3);
    expect(all[1].ties[0].result).toEqual(whole.results[2]);
  });
});
