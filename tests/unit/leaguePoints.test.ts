import { describe, expect, it } from "vitest";
import strong from "../e2e/fixtures/career-strong.json";
import { USER_TEAM_ID } from "../../src/data/laliga2526Teams";
import { USER_TEAM_NAME } from "../../src/simulation/leagueTable";
import {
  createUserLeagueSimulation,
  getInitialCareerLeagueRivals,
  getPendingCupFixture,
  simulateNextCupMatch,
  simulateNextUserLeagueMatch,
} from "../../src/simulation/leagueSimulator";
import type { SelectedPlayer, TeamRating } from "../../src/types/game";

const teamRating = strong.teamRating as unknown as TeamRating;
const selectedPlayers = strong.selectedPlayers as unknown as SelectedPlayer[];

// v0.25.70: comprobación de que cada partido de Liga suma lo que dice su marcador.
describe("puntos de Liga del usuario", () => {
  it("cada partido suma 3, 1 o 0 puntos según el marcador, igual que su insignia y sus goles", () => {
    for (let season = 0; season < 5; season += 1) {
      let context = createUserLeagueSimulation({ rivals: getInitialCareerLeagueRivals() });
      let seed = 1000 * season;

      while (!context.state.completed) {
        if (getPendingCupFixture(context)) {
          context = simulateNextCupMatch({ context, teamRating, selectedPlayers, seed: seed++ }).context;
          continue;
        }

        const before = context.state.table.find((row) => row.teamId === USER_TEAM_ID)!;
        const simulation = simulateNextUserLeagueMatch({ context, teamRating, selectedPlayers, seed: seed++ });
        context = simulation.context;
        const result = simulation.result!;
        const after = context.state.table.find((row) => row.teamId === USER_TEAM_ID)!;

        const userIsHome = result.homeTeamName === USER_TEAM_NAME;
        const userGoals = userIsHome ? result.homeGoals : result.awayGoals;
        const rivalGoals = userIsHome ? result.awayGoals : result.homeGoals;
        const expectedPoints = userGoals > rivalGoals ? 3 : userGoals === rivalGoals ? 1 : 0;
        const badgePoints = result.userTeamWon ? 3 : result.userTeamDrew ? 1 : 0;

        expect(after.played).toBe(before.played + 1);
        expect(after.points - before.points).toBe(expectedPoints);
        expect(badgePoints).toBe(expectedPoints);
        // La secuencia en directo cuenta los goles con minuto: deben cuadrar con el marcador final.
        expect(result.goalEvents.filter((goal) => goal.teamName === result.homeTeamName)).toHaveLength(result.homeGoals);
        expect(result.goalEvents.filter((goal) => goal.teamName === result.awayTeamName)).toHaveLength(result.awayGoals);
      }
    }
  });
});
