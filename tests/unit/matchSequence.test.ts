import { describe, expect, it } from "vitest";
import {
  EUROPEAN_SEQUENCE_EXTRA_MS,
  EUROPEAN_SEQUENCE_PENALTIES_MS,
  EUROPEAN_SEQUENCE_PREVIEW_MS,
  EUROPEAN_SEQUENCE_REGULAR_MS,
  getEuropeanLiveScore,
  getEuropeanSequenceDurationMs,
  getEuropeanSequenceFrame,
  getEuropeanSequenceScore,
} from "../../src/components/europeanMatchSequenceTimeline";
import {
  MATCH_SEQUENCE_DURATION_MS,
  countGoalsForTeam,
  getMatchSequenceFrame,
} from "../../src/components/matchSequenceTimeline";
import { getMatchPlaybackMultiplier } from "../../src/components/matchPlaybackSpeed";

const goals = [
  { minute: 70, teamName: "Athletic Club", scorerName: "Dani" },
  { minute: 12, teamName: "Rival CF", scorerName: "Ruiz" },
  { minute: 30, teamName: "Athletic Club", scorerName: "Iker" },
];

describe("secuencia de Liga y Copa", () => {
  it("empieza en la previa, sin goles", () => {
    const frame = getMatchSequenceFrame(goals, 0);
    expect(frame.stage).toBe("preview");
    expect(frame.visibleGoals).toEqual([]);
  });

  it("muestra cada gol en su minuto", () => {
    const frame = getMatchSequenceFrame(goals, 1000 + 2800 * (29.5 / 91));
    expect(frame.minute).toBe(29);
    expect(frame.visibleGoals.map((goal) => goal.minute)).toEqual([12]);
  });

  it("al final muestra todos los goles ordenados", () => {
    const frame = getMatchSequenceFrame(goals, MATCH_SEQUENCE_DURATION_MS);
    expect(frame.stage).toBe("final");
    expect(frame.visibleGoals.map((goal) => goal.minute)).toEqual([12, 30, 70]);
  });

  it("el gol del descuento aparece antes del final", () => {
    const stoppage = [{ minute: 93, teamName: "Rival CF" }];
    const frame = getMatchSequenceFrame(stoppage, 1000 + 2800 * 0.995);
    expect(frame.minute).toBe(93);
    expect(frame.visibleGoals).toHaveLength(1);
  });

  it("cuenta goles por equipo para el marcador parcial", () => {
    expect(countGoalsForTeam(goals, "Athletic Club")).toBe(2);
    expect(countGoalsForTeam(goals, "Rival CF")).toBe(1);
  });

  it("la velocidad rápida acorta la duración a la mitad", () => {
    expect(getMatchSequenceFrame([], 499, 0.5).stage).toBe("preview");
    expect(getMatchSequenceFrame([], 1900, 0.5).stage).toBe("final");
  });
});

describe("secuencia europea", () => {
  const league = { decidedBy: undefined };
  const extra = { decidedBy: "extra_time" as const };
  const penalties = { decidedBy: "penalties" as const };

  it("suma solo los tramos que hubo", () => {
    expect(getEuropeanSequenceDurationMs(league)).toBe(EUROPEAN_SEQUENCE_PREVIEW_MS + EUROPEAN_SEQUENCE_REGULAR_MS);
    expect(getEuropeanSequenceDurationMs(extra)).toBe(
      EUROPEAN_SEQUENCE_PREVIEW_MS + EUROPEAN_SEQUENCE_REGULAR_MS + EUROPEAN_SEQUENCE_EXTRA_MS,
    );
    expect(getEuropeanSequenceDurationMs(penalties)).toBe(
      EUROPEAN_SEQUENCE_PREVIEW_MS + EUROPEAN_SEQUENCE_REGULAR_MS + EUROPEAN_SEQUENCE_EXTRA_MS + EUROPEAN_SEQUENCE_PENALTIES_MS,
    );
  });

  it("la prórroga cuenta desde 91'", () => {
    const frame = getEuropeanSequenceFrame(extra, EUROPEAN_SEQUENCE_PREVIEW_MS + EUROPEAN_SEQUENCE_REGULAR_MS + 10);
    expect(frame.stage).toBe("extra_time");
    expect(frame.clockLabel).toBe("91'");
    expect(frame.scoreBasis).toBe("regular");
  });

  it("revela el marcador de cada tramo con su base", () => {
    const match = { userGoals: 2, opponentGoals: 2, regularTimeUserGoals: 1, regularTimeOpponentGoals: 1 };
    expect(getEuropeanSequenceScore(match, "none")).toBeNull();
    expect(getEuropeanSequenceScore(match, "regular")).toEqual({ userGoals: 1, opponentGoals: 1 });
    expect(getEuropeanSequenceScore(match, "extra_time")).toEqual({ userGoals: 2, opponentGoals: 2 });
  });

  it("la velocidad escala la duración europea", () => {
    // Previa 1000 + tramo normal 2800 (igual que Liga) + prórroga 1400 + penaltis 1600 = 6800 ms.
    expect(getEuropeanSequenceDurationMs(penalties, getMatchPlaybackMultiplier("fast"))).toBe(3400);
    expect(getEuropeanSequenceDurationMs(penalties, getMatchPlaybackMultiplier("slow"))).toBe(10200);
  });

  it("el marcador en directo cuenta solo los goles hasta el minuto actual", () => {
    const goals = [
      { minute: 10, isUserGoal: true },
      { minute: 55, isUserGoal: false },
      { minute: 80, isUserGoal: true },
    ];

    expect(getEuropeanLiveScore(goals, 9)).toEqual({ userGoals: 0, opponentGoals: 0 });
    expect(getEuropeanLiveScore(goals, 55)).toEqual({ userGoals: 1, opponentGoals: 1 });
    expect(getEuropeanLiveScore(goals, 90)).toEqual({ userGoals: 2, opponentGoals: 1 });
    expect(getEuropeanLiveScore(undefined, 90)).toEqual({ userGoals: 0, opponentGoals: 0 });
  });
});
