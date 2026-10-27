import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildCupBracketRows, buildEuropeanBracketColumns } from "../../src/career/seasonBrackets";
import { CupBracket, EuropeanBracket } from "../../src/components/SeasonBrackets";
import type { EuropeanTournamentMatch, EuropeanTournamentState } from "../../src/europe/europeanTypes";
import type { MatchResult } from "../../src/types/game";

const cupMatch: MatchResult = {
  fixtureId: "d1",
  matchday: 0,
  competition: "cup",
  roundName: "Dieciseisavos",
  homeTeamName: "Athletic Club Histórico",
  awayTeamName: "Rival",
  homeGoals: 2,
  awayGoals: 0,
  goalEvents: [],
  userTeamPlayed: true,
};

describe("vista del cuadro de la Copa", () => {
  it("muestra las cinco rondas, el estado de cada una y el ganador en negrita", () => {
    const markup = renderToStaticMarkup(<CupBracket rows={buildCupBracketRows({ cupResults: [cupMatch] })} />);

    for (const round of ["Dieciseisavos", "Octavos", "Cuartos", "Semifinal", "Final"]) {
      expect(markup).toContain(`aria-label="${round}"`);
    }
    expect(markup).toContain("Jugado");
    expect(markup).toContain("Sin jugar");
    expect(markup).toContain("season-bracket-team-won");
    expect(markup).toContain("season-bracket-team-user");
  });

  it("marca como simuladas las rondas siguientes", () => {
    const simulated = { ...cupMatch, roundName: "Octavos", homeTeamName: "A", awayTeamName: "B" };
    const markup = renderToStaticMarkup(<CupBracket rows={buildCupBracketRows({ cupResults: [cupMatch], simulatedResults: [simulated] })} />);
    expect(markup).toContain("Simulado");
  });
});

const euroMatch = (id: string, phase: EuropeanTournamentMatch["phase"], status: EuropeanTournamentMatch["status"]): EuropeanTournamentMatch => ({
  id,
  seasonNumber: 1,
  competition: "champions_league",
  matchday: 1,
  phase,
  opponent: { id: "o", name: "Rival Europeo", country: "X", rating: 80, tier: "champions_league" },
  isHome: true,
  status,
  userGoals: 1,
  opponentGoals: 0,
  result: status === "played" ? "win" : undefined,
});

describe("vista del cuadro europeo", () => {
  it("muestra fase inicial, semifinal y final, con mensaje cuando no se llegó", () => {
    const tournament = { matches: [euroMatch("l1", "league_phase", "played")] } as unknown as EuropeanTournamentState;
    const markup = renderToStaticMarkup(<EuropeanBracket columns={buildEuropeanBracketColumns(tournament)} />);

    expect(markup).toContain("Fase inicial");
    expect(markup).toContain("Semifinal");
    expect(markup).toContain("No llegó a semifinal.");
    expect(markup).toContain("No llegó a la final.");
    expect(markup).toContain("vs Rival Europeo");
    expect(markup).toContain("Victoria");
  });
});
