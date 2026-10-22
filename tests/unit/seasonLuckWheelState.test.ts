import { describe, expect, it } from "vitest";
import { buildAcceptedSeasonLuckWheelState, type SeasonLuckWheelResolvedResult } from "../../src/career/seasonLuckWheel";

const result: SeasonLuckWheelResolvedResult = {
  seasonId: "2025/26",
  used: true,
  triggerEvent: "mid_season",
  accepted: true,
  resultGroup: "positive",
  resultType: "rating_plus_1",
  ratingDelta: 1,
  precisionPosition: 0.52,
  precisionZone: {
    id: "perfect_center",
    label: "Centro perfecto",
    minDistanceFromCenter: 0,
    maxDistanceFromCenter: 0.06,
    probabilities: { positive: 65, neutral: 30, negative: 5 },
  },
  appearanceText: "Aparece la suerte.",
  resultText: "Sale bien.",
  requiresPlayerChange: false,
  requiresCoachChange: false,
};

describe("estado de la ruleta aceptada", () => {
  it("guarda el resultado con la hora de la oferta y la zona de precisión", () => {
    const state = buildAcceptedSeasonLuckWheelState(result, "2026-10-23T00:00:00.000Z");

    expect(state).toEqual({
      seasonId: "2025/26",
      used: true,
      triggerEvent: "mid_season",
      offeredAt: "2026-10-23T00:00:00.000Z",
      accepted: true,
      resultGroup: "positive",
      resultType: "rating_plus_1",
      ratingDelta: 1,
      precisionPosition: 0.52,
      precisionZoneId: "perfect_center",
      appearanceText: "Aparece la suerte.",
      resultText: "Sale bien.",
      requiresPlayerChange: false,
      requiresCoachChange: false,
    });
  });

  it("conserva los requisitos de cambio de jugador o entrenador", () => {
    const state = buildAcceptedSeasonLuckWheelState({ ...result, requiresCoachChange: true }, "t");
    expect(state.requiresCoachChange).toBe(true);
    expect(state.requiresPlayerChange).toBe(false);
  });
});
