import { describe, expect, it } from "vitest";
import strong from "../e2e/fixtures/career-strong.json";
import { simulateCareerSupercopa } from "../../src/career/supercopaRules";
import { USER_TEAM_ID } from "../../src/data/laliga2526Teams";
import { getInitialCareerLeagueRivals } from "../../src/simulation/leagueSimulator";
import type { CareerSupercopaParticipant, CareerSupercopaQualification } from "../../src/types/career";
import type { TeamRating } from "../../src/types/game";

describe("Supercopa: goles con minuto", () => {
  it("cada partido tiene tantos goles con minuto como marcador de cada equipo", () => {
    const rivals = getInitialCareerLeagueRivals();
    const participants = [
      { teamId: USER_TEAM_ID, teamName: "Athletic Club Histórico", source: "liga_1", sourceLabel: "1.º Liga" },
      { teamId: rivals[0].id, teamName: rivals[0].name, source: "liga_2", sourceLabel: "2.º Liga" },
      { teamId: rivals[1].id, teamName: rivals[1].name, source: "copa", sourceLabel: "Copa" },
      { teamId: rivals[2].id, teamName: rivals[2].name, source: "liga_3", sourceLabel: "3.º Liga" },
    ] as unknown as CareerSupercopaParticipant[];
    const qualification = {
      seasonLabel: "2028/29",
      participants,
      userQualified: true,
      reason: "",
    } as CareerSupercopaQualification;

    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const result = simulateCareerSupercopa({
        qualification,
        teamRating: strong.teamRating as unknown as TeamRating,
        selectedPlayers: [],
        rivals,
        seed,
      });

      for (const match of result.results) {
        const homeEvents = match.goalEvents.filter((goal) => goal.teamName === match.homeTeamName).length;
        const awayEvents = match.goalEvents.filter((goal) => goal.teamName === match.awayTeamName).length;

        expect(homeEvents).toBe(match.homeGoals);
        expect(awayEvents).toBe(match.awayGoals);
      }
    }
  });
});
