import { describe, expect, it } from "vitest";
import {
  buildAcceptedSeasonLuckWheelState,
  getSeasonLuckWheelPrecisionZone,
  resolveSeasonLuckWheel,
  type SeasonLuckWheelResolvedResult,
} from "../../src/career/seasonLuckWheel";

describe("centro perfecto de la ruleta", () => {
  const rolls = Array.from({ length: 100 }, (_, index) => index / 100);

  it("siempre da premio, sea cual sea la tirada", () => {
    for (const position of [0.445, 0.5, 0.555]) {
      for (const roll of rolls) {
        const resolved = resolveSeasonLuckWheel({
          seasonId: "2025/26",
          triggerEvent: "mid_season",
          precisionPosition: position,
          randomGroup: roll,
          randomPrize: roll,
          randomText: roll,
        });
        expect(resolved.precisionZone.id).toBe("perfect_center");
        expect(resolved.resultGroup).toBe("positive");
      }
    }
  });

  it("deja igual las demás zonas", () => {
    expect(getSeasonLuckWheelPrecisionZone(0.6).probabilities).toEqual({ positive: 50, neutral: 35, negative: 15 });
    expect(getSeasonLuckWheelPrecisionZone(0.3).probabilities).toEqual({ positive: 40, neutral: 40, negative: 20 });
    expect(getSeasonLuckWheelPrecisionZone(0).probabilities).toEqual({ positive: 10, neutral: 40, negative: 50 });
  });
});

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
    probabilities: { positive: 100, neutral: 0, negative: 0 },
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
