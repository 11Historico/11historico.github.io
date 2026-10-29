import { describe, expect, it } from "vitest";
import strong from "../e2e/fixtures/career-strong.json";
import { estimateEuropeanMatchOdds } from "../../src/europe/europeanMatchEngine";
import { estimateMatchOdds, simulateMatch } from "../../src/simulation/matchEngine";
import {
  createUserLeagueSimulation,
  getInitialCareerLeagueRivals,
  getNextUserMatchPreview,
  getPendingCupFixture,
  simulateNextCupMatch,
  simulateNextUserLeagueMatch,
} from "../../src/simulation/leagueSimulator";
import { getMatchKeyFactorText } from "../../src/components/matchSequenceTimeline";
import type { MatchKeyFactor, SelectedPlayer, TeamRating } from "../../src/types/game";

const teamRating = strong.teamRating as unknown as TeamRating;
const selectedPlayers = strong.selectedPlayers as unknown as SelectedPlayer[];
const rivals = getInitialCareerLeagueRivals();

const WIN_FACTORS: MatchKeyFactor[] = ["mentality_win", "giant_killing", "attack_win", "clean_sheet_win", "home_win", "away_win"];
const DRAW_FACTORS: MatchKeyFactor[] = ["overconfidence", "lead_lost", "even_draw", "away_draw"];
const LOSS_FACTORS: MatchKeyFactor[] = ["mentality_loss", "overconfidence", "upset", "stronger_rival", "bad_day", "away_loss"];

// v0.25.74: el partido se explica sin cambiar ningún resultado.
describe("factor que decidió el partido", () => {
  it("cada partido tiene un factor coherente con su resultado y con texto", () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      for (const venue of ["home", "away"] as const) {
        const result = simulateMatch({ fixtureId: "f", matchday: 1, rival: rivals[seed % rivals.length], venue, teamRating, selectedPlayers, seed });
        const allowed = result.userTeamWon ? WIN_FACTORS : result.userTeamDrew ? DRAW_FACTORS : LOSS_FACTORS;

        expect(allowed).toContain(result.keyFactor);
        expect(getMatchKeyFactorText(result.keyFactor)).toBeTruthy();
      }
    }
  });

  it("un empate de Copa se decide en la prórroga con su gol y su factor", () => {
    let extraTimeTies = 0;

    for (let season = 0; season < 8; season += 1) {
      let context = createUserLeagueSimulation({ rivals });
      let seed = 3000 + season * 500;

      while (!context.state.completed) {
        if (!getPendingCupFixture(context)) {
          context = simulateNextUserLeagueMatch({ context, teamRating, selectedPlayers, seed: seed++ }).context;
          continue;
        }

        const simulation = simulateNextCupMatch({ context, teamRating, selectedPlayers, seed: seed++ });
        const result = simulation.result!;
        context = simulation.context;

        expect(result.goalEvents.filter((goal) => goal.teamName === result.homeTeamName)).toHaveLength(result.homeGoals);
        expect(result.goalEvents.filter((goal) => goal.teamName === result.awayTeamName)).toHaveLength(result.awayGoals);

        if (result.keyFactor === "extra_time_win" || result.keyFactor === "extra_time_loss") {
          extraTimeTies += 1;
          const lastGoal = [...result.goalEvents].sort((a, b) => a.minute - b.minute).at(-1)!;
          expect(lastGoal.minute).toBeGreaterThanOrEqual(91);
          expect(lastGoal.minute).toBeLessThanOrEqual(119);
          expect(result.keyFactor === "extra_time_win").toBe(Boolean(result.userTeamWon));
        }
      }
    }

    expect(extraTimeTies).toBeGreaterThan(0);
  });
});

describe("previa del partido", () => {
  it("las probabilidades suman 1, son estables y favorecen al mejor equipo", () => {
    const params = { rival: rivals[0], venue: "home" as const, teamRating, selectedPlayers };
    const odds = estimateMatchOdds(params);

    expect(odds.win + odds.draw + odds.loss).toBeCloseTo(1, 10);
    expect(estimateMatchOdds(params)).toEqual(odds);

    const weaker = { ...teamRating, attack: 60, defense: 60, control: 60, mentality: 60, goalkeeping: 60, physical: 60, overall: 60 };
    expect(estimateMatchOdds({ ...params, teamRating: weaker }).win).toBeLessThan(odds.win);
  });

  it("la previa europea favorece al que tiene más media", () => {
    const strongOdds = estimateEuropeanMatchOdds({ userTeamRating: 88, opponentRating: 72, isHome: true, competition: "conference_league" });
    const weakOdds = estimateEuropeanMatchOdds({ userTeamRating: 72, opponentRating: 88, isHome: false, competition: "conference_league" });

    expect(strongOdds.win).toBeGreaterThan(strongOdds.loss);
    expect(weakOdds.loss).toBeGreaterThan(weakOdds.win);
  });

  it("al empezar la temporada la previa es la jornada 1 de Liga", () => {
    const context = createUserLeagueSimulation({ rivals });
    const preview = getNextUserMatchPreview({ context, teamRating, selectedPlayers });

    expect(preview?.competition).toBe("league");
    expect(preview?.label).toBe("Jornada 1");
    expect(preview?.userOverall).toBe(Math.round(teamRating.overall));
  });
});
