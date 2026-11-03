import { describe, expect, it } from "vitest";
import { USER_TEAM_ID } from "../../src/data/laliga2526Teams";
import {
  buildCupBracket,
  createUserLeagueSimulation,
  simulateNextCupMatch,
  type CupBracketRound,
  type CupBracketTie,
  type UserLeagueSimulationContext,
} from "../../src/simulation/leagueSimulator";
import { USER_TEAM_NAME } from "../../src/simulation/leagueTable";
import type { TeamRating } from "../../src/types/game";

function rating(value: number): TeamRating {
  return { attack: value, defense: value, control: value, physical: value, mentality: value, goalkeeping: value, overall: value, profileLabel: "", strengths: [], weaknesses: [] };
}

function newCup(): UserLeagueSimulationContext {
  const context = createUserLeagueSimulation();
  // Con la Liga acabada, todas las rondas de Copa se pueden jugar y enseñar.
  context.state.table.find((row) => row.teamId === USER_TEAM_ID)!.played = 38;
  return context;
}

/** Juega la Copa entera y guarda el contexto antes de cada partido tuyo. */
function playCup(value: number, seed: number) {
  let context = newCup();
  const before: UserLeagueSimulationContext[] = [];
  while (context.cupState.status === "active") {
    before.push(context);
    context = simulateNextCupMatch({ context, teamRating: rating(value), selectedPlayers: [], seed }).context;
  }
  return { context, before };
}

function winnerOf(tie: CupBracketTie): string | undefined {
  if (!tie.result) return undefined;
  return tie.result.homeGoals > tie.result.awayGoals ? tie.result.homeTeamName : tie.result.awayTeamName;
}

function expectConsistent(rounds: CupBracketRound[]) {
  rounds.forEach((round, roundIndex) => {
    if (roundIndex === 0) return;
    round.ties.forEach((tie, tieIndex) => {
      if (!tie.result) return;
      const fromBelow = [winnerOf(rounds[roundIndex - 1].ties[tieIndex * 2]), winnerOf(rounds[roundIndex - 1].ties[tieIndex * 2 + 1])];
      expect([tie.homeTeamName, tie.awayTeamName].sort()).toEqual(fromBelow.sort());
    });
  });
}

describe("cuadro de Copa en espejo (v0.25.87)", () => {
  it("tiene 32 equipos distintos, 16 cruces y tú en el primero", () => {
    const rounds = buildCupBracket(playCup(99, 11).context.cupState, 38);
    expect(rounds.map((round) => round.ties.length)).toEqual([16, 8, 4, 2, 1]);
    const teams = rounds[0].ties.flatMap((tie) => [tie.homeTeamName, tie.awayTeamName]);
    expect(new Set(teams).size).toBe(32);
    expect([rounds[0].ties[0].homeTeamName, rounds[0].ties[0].awayTeamName]).toContain(USER_TEAM_NAME);
  });

  it("siempre da lo mismo para la misma Copa", () => {
    const { cupState } = playCup(80, 21).context;
    expect(buildCupBracket(cupState, 38)).toEqual(buildCupBracket(cupState, 38));
  });

  it("cuadra de principio a fin, y el campeón es el que guarda la Copa", () => {
    for (let seed = 1; seed <= 150; seed += 1) {
      const { context } = playCup(seed % 3 === 0 ? 92 : 76, seed);
      const rounds = buildCupBracket(context.cupState, 38);
      expectConsistent(rounds);
      expect(rounds.every((round) => round.ties.every((tie) => tie.result))).toBe(true);
      expect(winnerOf(rounds[4].ties[0])).toBe(context.cupState.championTeamName);
    }
  });

  it("lo ya enseñado no cambia cuando te eliminan", () => {
    for (let seed = 1; seed <= 150; seed += 1) {
      const { context, before } = playCup(80, seed);
      const after = buildCupBracket(context.cupState, 38);
      before.forEach((snapshot) => {
        const earlier = buildCupBracket(snapshot.cupState, 38);
        earlier.forEach((round, roundIndex) => {
          round.ties.forEach((tie, tieIndex) => {
            if (tie.result) expect(after[roundIndex].ties[tieIndex]).toEqual(tie);
            else if (tie.homeTeamName) {
              expect(after[roundIndex].ties[tieIndex].homeTeamName).toBe(tie.homeTeamName);
              expect(after[roundIndex].ties[tieIndex].awayTeamName).toBe(tie.awayTeamName);
            }
          });
        });
      });
    }
  });

  it("no adelanta rondas: antes de jugar solo se ven los cruces de dieciseisavos", () => {
    const rounds = buildCupBracket(newCup().cupState, 38);
    expect(rounds[0].ties.every((tie) => tie.homeTeamName && !tie.result)).toBe(true);
    expect(rounds.slice(1).every((round) => round.ties.every((tie) => !tie.homeTeamName))).toBe(true);
  });

  it("tras caer, las rondas siguientes esperan a su jornada de Liga", () => {
    const { context } = playCup(40, 5);
    const eliminatedIndex = context.cupState.fixtures.findIndex((fixture) => fixture.roundName === context.cupState.userEliminatedRoundName);
    const nextGate = context.cupState.fixtures[eliminatedIndex + 1]?.gateMatchday;
    if (!nextGate) return;
    const rounds = buildCupBracket(context.cupState, nextGate - 1);
    expect(rounds[eliminatedIndex].ties.every((tie) => tie.result)).toBe(true);
    expect(rounds[eliminatedIndex + 1].ties.some((tie) => tie.result)).toBe(false);
  });
});
