import { describe, expect, it } from "vitest";
import {
  cancelLuckWheelCoachChange,
  hasSpecialCoachBonus,
  startCareerCoachChange,
  startLuckWheelCoachChange,
  startLuckWheelPlayerChange,
} from "../../src/app/careerRewardFlow";
import type { CareerObjectiveResult, CareerSeasonResult } from "../../src/types/career";
import type { SelectedCoach } from "../../src/types/game";
import type { UserLeagueSimulationContext } from "../../src/simulation/leagueSimulator";

const context = { id: "context" } as unknown as UserLeagueSimulationContext;
const coach = { id: "coach-a" } as unknown as SelectedCoach;

function seasonResult(overrides: Partial<CareerSeasonResult>): CareerSeasonResult {
  return { wonLeague: false, wonCopa: false, wonSupercopa: false, ...overrides } as unknown as CareerSeasonResult;
}

function objective(qualifiedForEurope: boolean): CareerObjectiveResult {
  return { qualifiedForEurope } as unknown as CareerObjectiveResult;
}

describe("transiciones de la ruleta de temporada", () => {
  it("cambio de jugador: guarda el contexto, entra en el reemplazo y limpia la temporada revisada", () => {
    const patch = startLuckWheelPlayerChange(context);

    expect(patch.leagueContext).toBe(context);
    expect(patch.careerRewardFlow).toBe("luck_wheel_player");
    expect(patch.screen).toBe("career_player_replacement_pick");
    expect(patch.phase).toBe("player_selection");
    expect(patch.teamRating).toBeUndefined();
    expect(patch.careerSeasonResult).toBeUndefined();
    expect(patch.teamValidationErrors).toEqual([]);
    // El entrenador no cambia en el cambio de jugador.
    expect("selectedCoach" in patch).toBe(false);
  });

  it("cambio de entrenador: guarda el entrenador anterior y deja el entrenador actual vacío", () => {
    const patch = startLuckWheelCoachChange(context, coach);

    expect(patch.careerRewardFlow).toBe("luck_wheel_coach");
    expect(patch.coachBeforeReward).toBe(coach);
    expect(patch.selectedCoach).toBeUndefined();
    expect(patch.screen).toBe("coach_selection");
    expect(patch.phase).toBe("coach_selection");
  });

  it("cancelar el cambio de entrenador: restaura al anterior y vuelve a la liga", () => {
    const patch = cancelLuckWheelCoachChange(coach);

    expect(patch.selectedCoach).toBe(coach);
    expect(patch.coachBeforeReward).toBeUndefined();
    expect(patch.careerRewardFlow).toBeUndefined();
    expect(patch.screen).toBe("league_simulation");
    expect(patch.phase).toBe("league_simulation");
  });
});

describe("cambio de entrenador desde la pantalla entre temporadas", () => {
  it("usa el flujo de bonus cuando el bonus especial aplica", () => {
    const patch = startCareerCoachChange({ selectedCoach: coach, specialCoachBonus: true });

    expect(patch.careerRewardFlow).toBe("coach_bonus");
    expect(patch.coachBeforeReward).toBe(coach);
    expect(patch.leagueContext).toBeUndefined();
    expect(patch.pendingSeasonLuckWheelOffer).toBeUndefined();
    expect(patch.careerPromotionTransition).toBeUndefined();
  });

  it("usa el flujo estándar cuando no aplica el bonus especial", () => {
    const patch = startCareerCoachChange({ selectedCoach: coach, specialCoachBonus: false });

    expect(patch.careerRewardFlow).toBe("standard_coach");
  });
});

describe("hasSpecialCoachBonus", () => {
  it("aplica con Liga o Copa ganadas", () => {
    expect(hasSpecialCoachBonus(seasonResult({ wonLeague: true }), objective(false))).toBe(true);
    expect(hasSpecialCoachBonus(seasonResult({ wonCopa: true }), objective(false))).toBe(true);
  });

  it("aplica con Supercopa solo si además hay plaza europea por Liga", () => {
    expect(hasSpecialCoachBonus(seasonResult({ wonSupercopa: true }), objective(true))).toBe(true);
    expect(hasSpecialCoachBonus(seasonResult({ wonSupercopa: true }), objective(false))).toBe(false);
  });

  it("no aplica sin resultado u objetivo", () => {
    expect(hasSpecialCoachBonus(undefined, objective(true))).toBe(false);
    expect(hasSpecialCoachBonus(seasonResult({ wonLeague: true }), undefined)).toBe(false);
  });
});
