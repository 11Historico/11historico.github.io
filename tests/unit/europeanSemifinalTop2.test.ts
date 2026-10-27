import { describe, expect, it } from "vitest";
import {
  EUROPEAN_LEAGUE_PHASE_QUALIFYING_POSITIONS,
  applyEuropeanMatchResult,
  createEuropeanTournamentForQualification,
  getEuropeanLeaguePhaseUserPosition,
} from "../../src/europe/europeanTournament";
import type { EuropeanQualificationResult, EuropeanTournamentState } from "../../src/europe/europeanTypes";

const qualification = {
  qualified: true,
  competition: "conference_league",
  source: "league",
  label: "Conference League",
  shortLabel: "Conference",
  explanation: "",
  priority: 3,
} as unknown as EuropeanQualificationResult;

function playLeaguePhase(userGoals: number, opponentGoals: number): EuropeanTournamentState {
  let tournament = createEuropeanTournamentForQualification({
    seasonNumber: 1,
    qualification,
    seed: "semifinal_top2",
    totalLeagueMatchdays: 38,
  });
  if (!tournament) throw new Error("No se creó el torneo");

  const leagueMatches = tournament.matches.filter((match) => match.phase === "league_phase");
  const result = userGoals > opponentGoals ? "win" : userGoals === opponentGoals ? "draw" : "loss";

  for (const match of leagueMatches) {
    tournament = applyEuropeanMatchResult(tournament, match.id, { userGoals, opponentGoals, result }, 38);
  }

  return tournament;
}

describe("semifinal europea: pasan los 2 primeros de la fase de liga", () => {
  it("ganar todos los partidos deja al usuario primero y en semifinales", () => {
    const tournament = playLeaguePhase(5, 0);

    expect(getEuropeanLeaguePhaseUserPosition(tournament)).toBe(1);
    expect(tournament.phase).toBe("semifinal");
    expect(tournament.qualifiedForSemifinal).toBe(true);
  });

  it("perder todos los partidos deja al usuario fuera de los 2 primeros y eliminado", () => {
    const tournament = playLeaguePhase(0, 5);

    expect(getEuropeanLeaguePhaseUserPosition(tournament)).toBeGreaterThan(EUROPEAN_LEAGUE_PHASE_QUALIFYING_POSITIONS);
    expect(tournament.phase).toBe("eliminated");
    expect(tournament.eliminated).toBe(true);
  });
});
