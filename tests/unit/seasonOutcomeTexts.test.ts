import { describe, expect, it } from "vitest";
import { evaluateCareerObjective } from "../../src/career/careerRules";
import { buildEuropeanPrestigeReward } from "../../src/career/europeanPrestige";
import {
  applyEuropeanMatchResult,
  createEuropeanTournamentForQualification,
  getEuropeanLeaguePhaseUserPosition,
} from "../../src/europe/europeanTournament";
import type { EuropeanQualificationResult } from "../../src/europe/europeanTypes";
import type { CareerSeasonResult } from "../../src/types/career";

const season: CareerSeasonResult = {
  seasonLabel: "2025/26",
  leaguePosition: 5,
  wonLeague: false,
  wonCopa: false,
  wonSupercopa: false,
  isRelegated: false,
  europeanQualification: "europa_league",
};

describe("línea de objetivo de la temporada", () => {
  it("nombra el título de Liga, no solo la plaza", () => {
    const result = evaluateCareerObjective({ ...season, leaguePosition: 1, wonLeague: true, europeanQualification: "champions" });
    expect(result.reason).toBe("Objetivo cumplido: campeón de Liga y clasificación a Champions League.");
  });

  it("con Liga y Copa, nombra los dos títulos", () => {
    const result = evaluateCareerObjective({ ...season, leaguePosition: 1, wonLeague: true, wonCopa: true, europeanQualification: "champions" });
    expect(result.reason).toBe("Objetivo cumplido: campeón de Liga y de Copa del Rey.");
  });

  it("sin títulos, sigue diciendo la plaza europea", () => {
    expect(evaluateCareerObjective(season).reason).toBe("Objetivo cumplido: clasificación a Europa League.");
  });
});

describe("prestigio europeo al caer en la fase inicial", () => {
  it("dice el puesto en la tabla", () => {
    let tournament = createEuropeanTournamentForQualification({
      seasonNumber: 1,
      qualification: { qualified: true, competition: "europa_league" } as EuropeanQualificationResult,
      seed: "prestige_text",
      totalLeagueMatchdays: 38,
    });
    if (!tournament) throw new Error("No se creó el torneo");

    for (const match of tournament.matches) {
      tournament = applyEuropeanMatchResult(tournament, match.id, { userGoals: 0, opponentGoals: 2, result: "loss" }, 38);
    }

    const position = getEuropeanLeaguePhaseUserPosition(tournament);
    expect(buildEuropeanPrestigeReward(tournament).narrative).toBe(
      `Eliminado en la fase inicial de Europa League (${position}.º de 7): sin prestigio adicional para la próxima temporada.`,
    );
  });
});
