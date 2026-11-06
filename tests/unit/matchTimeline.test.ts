import { describe, expect, it } from "vitest";

import {
  getMatchTimelineLabel,
  getTimelineHalfTimeLabel,
  getTimelinePercent,
} from "../../src/components/matchSequenceTimeline";

describe("línea de tiempo del partido (v0.25.99)", () => {
  it("coloca los minutos sobre 90' y, con prórroga, sobre 120'", () => {
    expect(getTimelinePercent(45, false)).toBe(50);
    expect(getTimelinePercent(90, false)).toBe(100);
    expect(getTimelinePercent(45, true)).toBe(37.5);
    expect(getTimelinePercent(90, true)).toBe(75);
  });

  it("no se sale de la barra", () => {
    expect(getTimelinePercent(-3, false)).toBe(0);
    expect(getTimelinePercent(105, false)).toBe(100);
    expect(getTimelinePercent(130, true)).toBe(100);
  });

  it("marca el descanso con tu decisión, y seguir igual se queda en «Descanso»", () => {
    const effect = { userGoals: 1, rivalGoals: 0, keptUserGoals: 1, keptRivalGoals: 0 };

    expect(getTimelineHalfTimeLabel(undefined)).toBe("Descanso");
    expect(getTimelineHalfTimeLabel({ ...effect, choice: "push" })).toBe("Arriesgaste");
    expect(getTimelineHalfTimeLabel({ ...effect, choice: "close" })).toBe("Cerraste");
  });

  it("cuenta en texto los goles de cada lado y la decisión", () => {
    const label = getMatchTimelineLabel({
      goals: [
        { minute: 12, isTop: true },
        { minute: 30, isTop: false },
        { minute: 67, isTop: true },
      ],
      minute: 90,
      extraTime: false,
      halfTimeEffect: { choice: "push", userGoals: 2, rivalGoals: 1, keptUserGoals: 1, keptRivalGoals: 1 },
      topLabel: "Tus goles",
      bottomLabel: "Goles del rival",
    });

    expect(label).toBe("Línea de tiempo, minuto 90 de 90. Tus goles: 12', 67'. Goles del rival: 30'. En el descanso arriesgaste.");
  });

  it("sin goles lo dice, y el minuto no pasa del final", () => {
    const label = getMatchTimelineLabel({ goals: [], minute: 120, extraTime: false, topLabel: "Goles de Sevilla", bottomLabel: "Goles de Betis" });

    expect(label).toBe("Línea de tiempo, minuto 90 de 90. Goles de Sevilla: ninguno. Goles de Betis: ninguno.");
  });
});
