import { describe, expect, it } from "vitest";
import strong from "../e2e/fixtures/career-strong.json";
import { getSupercopaSemifinalPreview, simulateCareerSupercopa } from "../../src/career/supercopaRules";
import { getMatchApproachEffectText } from "../../src/components/matchSequenceTimeline";
import { USER_TEAM_ID } from "../../src/data/laliga2526Teams";
import { estimateEuropeanMatchOdds, simulateEuropeanMatch } from "../../src/europe/europeanMatchEngine";
import { coachReinforcesApproach, estimateMatchOdds, simulateMatch } from "../../src/simulation/matchEngine";
import {
  createUserLeagueSimulation,
  getCoachCompetitionBoost,
  getInitialCareerLeagueRivals,
  getNextUserMatchPreview,
} from "../../src/simulation/leagueSimulator";
import type { CoachSkills, MatchApproach, RivalTeam, SelectedCoach, SelectedPlayer, TeamRating } from "../../src/types/game";

const teamRating = strong.teamRating as unknown as TeamRating;
const selectedPlayers = strong.selectedPlayers as unknown as SelectedPlayer[];
const rivals = getInitialCareerLeagueRivals();
const plainCoach: CoachSkills = { attack: 80, defense: 80, management: 80, mentality: 80 };
const specialistCoach: CoachSkills = { attack: 92, defense: 92, management: 80, mentality: 80 };

function uniformTeam(overall: number): TeamRating {
  return { ...teamRating, attack: overall, defense: overall, control: overall, physical: overall, mentality: overall, goalkeeping: overall, overall };
}

function uniformRival(overall: number): RivalTeam {
  return { ...rivals[0], ratings: { attack: overall, midfield: overall, defense: overall, goalkeeping: overall, mentality: overall, overall } };
}

function getGoals(params: { team: TeamRating; rival: RivalTeam; approach: MatchApproach; coachSkills: CoachSkills }) {
  let userGoals = 0;
  let rivalGoals = 0;

  for (let seed = 1; seed <= 2000; seed += 1) {
    const result = simulateMatch({ fixtureId: "f", matchday: 1, rival: params.rival, venue: "home", teamRating: params.team, selectedPlayers, seed, approach: params.approach, coachSkills: params.coachSkills });
    userGoals += result.homeGoals;
    rivalGoals += result.awayGoals;
  }

  return { userGoals, rivalGoals };
}

// v0.25.75: el planteamiento es la primera decisión de partido.
describe("planteamiento", () => {
  it("el equilibrado es exactamente el partido de siempre", () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const params = { fixtureId: "f", matchday: 1, rival: rivals[seed % rivals.length], venue: "home" as const, teamRating, selectedPlayers, seed };
      const plain = simulateMatch(params);

      expect(simulateMatch({ ...params, approach: "balanced", coachSkills: specialistCoach })).toEqual(plain);
      expect(plain.approachEffect).toBeUndefined();
    }
  });

  it("el ofensivo trae más goles en los dos lados y el defensivo menos", () => {
    const params = { team: uniformTeam(82), rival: uniformRival(82), coachSkills: plainCoach };
    const balanced = getGoals({ ...params, approach: "balanced" });
    const attacking = getGoals({ ...params, approach: "attacking" });
    const defensive = getGoals({ ...params, approach: "defensive" });

    expect(attacking.userGoals).toBeGreaterThan(balanced.userGoals);
    expect(attacking.rivalGoals).toBeGreaterThan(balanced.rivalGoals);
    expect(defensive.userGoals).toBeLessThan(balanced.userGoals);
    expect(defensive.rivalGoals).toBeLessThan(balanced.rivalGoals);
  });

  it("atacar rinde al favorito y cerrarse al inferior", () => {
    const odds = (team: number, rival: number, approach: MatchApproach) =>
      estimateMatchOdds({ rival: uniformRival(rival), venue: "home", teamRating: uniformTeam(team), selectedPlayers, approach, coachSkills: plainCoach }, 3000);

    expect(odds(88, 78, "attacking").win).toBeGreaterThan(odds(88, 78, "balanced").win);
    expect(odds(88, 78, "defensive").win).toBeLessThan(odds(88, 78, "balanced").win);
    expect(odds(74, 84, "defensive").loss).toBeLessThan(odds(74, 84, "balanced").loss);
    expect(odds(74, 84, "attacking").loss).toBeGreaterThan(odds(74, 84, "balanced").loss);
  });

  it("el efecto compara con el partido real en equilibrado, con las mismas tiradas", () => {
    let changed = 0;

    for (let seed = 1; seed <= 500; seed += 1) {
      const params = { fixtureId: "f", matchday: 1, rival: rivals[seed % rivals.length], venue: "away" as const, teamRating, selectedPlayers, seed };
      const balanced = simulateMatch(params);
      const result = simulateMatch({ ...params, approach: "attacking", coachSkills: plainCoach });
      const effect = result.approachEffect!;

      expect(effect.balancedUserGoals).toBe(balanced.awayGoals);
      expect(effect.balancedRivalGoals).toBe(balanced.homeGoals);
      expect(effect.userGoals).toBe(result.awayGoals);
      expect(effect.rivalGoals).toBe(result.homeGoals);
      expect(result.goalEvents).toHaveLength(result.homeGoals + result.awayGoals);
      if (effect.userGoals !== effect.balancedUserGoals || effect.rivalGoals !== effect.balancedRivalGoals) changed += 1;
    }

    expect(changed).toBeGreaterThan(0);
  });

  it("también cambia Europa y la Supercopa, y sus previas lo reflejan", () => {
    const europe = { userTeamRating: 88, opponentRating: 78, isHome: true, competition: "conference_league" as const };
    expect(estimateEuropeanMatchOdds({ ...europe, approach: "attacking", coachSkills: plainCoach }, 2000).win).toBeGreaterThan(estimateEuropeanMatchOdds(europe, 2000).win);
    expect(simulateEuropeanMatch({ ...europe, seed: "x", approach: "defensive", coachSkills: plainCoach }).approachEffect?.approach).toBe("defensive");
    expect(simulateEuropeanMatch({ ...europe, seed: "x" }).approachEffect).toBeUndefined();

    const qualification = {
      seasonLabel: "x",
      userQualified: true,
      reason: "",
      participants: [
        { teamId: USER_TEAM_ID, teamName: "Athletic Club Histórico", source: "league_champion" as const, sourceLabel: "" },
        { teamId: rivals[0].id, teamName: rivals[0].name, source: "league_runner_up" as const, sourceLabel: "" },
        { teamId: rivals[1].id, teamName: rivals[1].name, source: "cup_champion" as const, sourceLabel: "" },
        { teamId: rivals[2].id, teamName: rivals[2].name, source: "cup_runner_up" as const, sourceLabel: "" },
      ],
    };
    const preview = getSupercopaSemifinalPreview({ qualification, teamRating, selectedPlayers, rivals });
    expect(preview?.rivalName).toBe(rivals[2].name);
    expect(preview?.venue).toBe("home");

    const supercopa = simulateCareerSupercopa({ qualification, teamRating, selectedPlayers, rivals, seed: 7, approach: "attacking", coachSkills: plainCoach });
    const userMatches = supercopa.results.filter((result) => result.userTeamPlayed);
    expect(userMatches.length).toBeGreaterThan(0);
    expect(userMatches.every((result) => result.approachEffect?.approach === "attacking")).toBe(true);
  });

  it("la Liga no usa el planteamiento en su previa", () => {
    const context = createUserLeagueSimulation({ rivals });
    const preview = getNextUserMatchPreview({ context, teamRating, selectedPlayers });

    expect(preview?.competition).toBe("league");
    expect(getNextUserMatchPreview({ context, teamRating, selectedPlayers, approach: "attacking" })?.odds).toEqual(preview?.odds);
  });
});

describe("perfil del entrenador", () => {
  it("el ataque refuerza el ofensivo y la defensa el defensivo, desde 86", () => {
    expect(coachReinforcesApproach("attacking", { ...plainCoach, attack: 86 })).toBe(true);
    expect(coachReinforcesApproach("attacking", { ...plainCoach, attack: 85 })).toBe(false);
    expect(coachReinforcesApproach("defensive", { ...plainCoach, defense: 86 })).toBe(true);
    expect(coachReinforcesApproach("balanced", specialistCoach)).toBe(false);

    const params = { team: uniformTeam(82), rival: uniformRival(82) };
    expect(getGoals({ ...params, approach: "attacking", coachSkills: specialistCoach }).userGoals)
      .toBeGreaterThan(getGoals({ ...params, approach: "attacking", coachSkills: plainCoach }).userGoals);
    expect(getGoals({ ...params, approach: "defensive", coachSkills: specialistCoach }).rivalGoals)
      .toBeLessThan(getGoals({ ...params, approach: "defensive", coachSkills: plainCoach }).rivalGoals);
  });

  it("la habilidad europea suma +1 en Europa desde 86", () => {
    const coachWith = (europe: number) => ({ selectedCoach: { coachSeason: { skills: { ...plainCoach, europe } } } as SelectedCoach });

    expect(getCoachCompetitionBoost(coachWith(86), "europe")).toBe(1);
    expect(getCoachCompetitionBoost(coachWith(85), "europe")).toBe(0);
  });
});

describe("texto del efecto del planteamiento", () => {
  const effect = { approach: "attacking" as const, userGoals: 2, rivalGoals: 1, balancedUserGoals: 1, balancedRivalGoals: 1 };

  it("cuenta si cambió el resultado o solo el marcador", () => {
    expect(getMatchApproachEffectText(undefined)).toBeUndefined();
    expect(getMatchApproachEffectText(effect)).toBe("Tu planteamiento ofensivo cambió el partido: con uno equilibrado habrías empatado 1-1 a los 90 minutos.");
    expect(getMatchApproachEffectText({ ...effect, userGoals: 1, rivalGoals: 2, balancedUserGoals: 2, balancedRivalGoals: 1 }))
      .toBe("Tu planteamiento ofensivo te salió caro: con uno equilibrado habrías ganado 2-1 a los 90 minutos.");
    expect(getMatchApproachEffectText({ ...effect, approach: "defensive", userGoals: 1, rivalGoals: 0, balancedUserGoals: 2, balancedRivalGoals: 1 }))
      .toBe("Planteamiento defensivo: con uno equilibrado también habrías ganado, 2-1 a los 90 minutos.");
    expect(getMatchApproachEffectText({ ...effect, balancedUserGoals: 2 }))
      .toBe("Planteamiento ofensivo: con uno equilibrado, el marcador habría sido el mismo.");
  });
});
