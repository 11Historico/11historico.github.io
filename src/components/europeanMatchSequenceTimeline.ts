// src/components/europeanMatchSequenceTimeline.ts
//
// Secuencia de partido europeo (v0.24.9j, Fase B): lógica pura de la línea de tiempo.
// El motor europeo no guarda minutos de gol, así que la secuencia no muestra goles:
// reproduce previa, 90', prórroga (si la hubo) y tanda (si la hubo) y revela el
// marcador de cada tramo al terminarlo.

import type { EuropeanKnockoutDecision, EuropeanTournamentMatch } from "../europe/europeanTypes";

export const EUROPEAN_SEQUENCE_PREVIEW_MS = 1000;
export const EUROPEAN_SEQUENCE_REGULAR_MS = 2400;
export const EUROPEAN_SEQUENCE_EXTRA_MS = 1400;
export const EUROPEAN_SEQUENCE_PENALTIES_MS = 1600;
export const EUROPEAN_SEQUENCE_TICK_MS = 100;

export type EuropeanSequenceStage = "preview" | "regular" | "extra_time" | "penalties" | "final";

/** Qué marcador está revelado en este momento. */
export type EuropeanSequenceScoreBasis = "none" | "regular" | "extra_time" | "final";

export interface EuropeanSequenceSegment {
  stage: EuropeanSequenceStage;
  startMs: number;
  durationMs: number;
}

export interface EuropeanSequenceFrame {
  stage: EuropeanSequenceStage;
  clockLabel: string;
  scoreBasis: EuropeanSequenceScoreBasis;
}

type MatchDecision = Pick<EuropeanTournamentMatch, "decidedBy">;

function hasExtraTime(decidedBy: EuropeanKnockoutDecision | undefined): boolean {
  return decidedBy === "extra_time" || decidedBy === "penalties";
}

export function getEuropeanSequenceSegments(match: MatchDecision, multiplier = 1): EuropeanSequenceSegment[] {
  const stages: Array<{ stage: EuropeanSequenceStage; durationMs: number }> = [
    { stage: "preview", durationMs: EUROPEAN_SEQUENCE_PREVIEW_MS * multiplier },
    { stage: "regular", durationMs: EUROPEAN_SEQUENCE_REGULAR_MS * multiplier },
  ];

  if (hasExtraTime(match.decidedBy)) {
    stages.push({ stage: "extra_time", durationMs: EUROPEAN_SEQUENCE_EXTRA_MS * multiplier });
  }

  if (match.decidedBy === "penalties") {
    stages.push({ stage: "penalties", durationMs: EUROPEAN_SEQUENCE_PENALTIES_MS * multiplier });
  }

  let startMs = 0;
  return stages.map(({ stage, durationMs }) => {
    const segment = { stage, startMs, durationMs };
    startMs += durationMs;
    return segment;
  });
}

export function getEuropeanSequenceDurationMs(match: MatchDecision, multiplier = 1): number {
  const segments = getEuropeanSequenceSegments(match, multiplier);
  const last = segments[segments.length - 1];
  return last.startMs + last.durationMs;
}

export function getEuropeanSequenceFrame(match: MatchDecision, elapsedMs: number, multiplier = 1): EuropeanSequenceFrame {
  const segments = getEuropeanSequenceSegments(match, multiplier);
  const durationMs = getEuropeanSequenceDurationMs(match, multiplier);

  if (elapsedMs >= durationMs) {
    return { stage: "final", clockLabel: "", scoreBasis: "final" };
  }

  const segment = segments.find((candidate) => elapsedMs < candidate.startMs + candidate.durationMs) ?? segments[0];
  const progress = (elapsedMs - segment.startMs) / segment.durationMs;

  if (segment.stage === "preview") {
    return { stage: "preview", clockLabel: "Previa", scoreBasis: "none" };
  }

  if (segment.stage === "regular") {
    const minute = Math.min(90, Math.floor(progress * 91));
    return { stage: "regular", clockLabel: `${minute}'`, scoreBasis: "none" };
  }

  if (segment.stage === "extra_time") {
    const minute = 91 + Math.min(29, Math.floor(progress * 30));
    return { stage: "extra_time", clockLabel: `${minute}'`, scoreBasis: "regular" };
  }

  return { stage: "penalties", clockLabel: "Penaltis", scoreBasis: "extra_time" };
}

/** Marcador (del punto de vista del Athletic) que corresponde a la base revelada. */
export function getEuropeanSequenceScore(
  match: Pick<EuropeanTournamentMatch, "userGoals" | "opponentGoals" | "regularTimeUserGoals" | "regularTimeOpponentGoals">,
  basis: EuropeanSequenceScoreBasis,
): { userGoals: number; opponentGoals: number } | null {
  if (basis === "none") return null;

  if (basis === "regular") {
    return {
      userGoals: match.regularTimeUserGoals ?? match.userGoals ?? 0,
      opponentGoals: match.regularTimeOpponentGoals ?? match.opponentGoals ?? 0,
    };
  }

  return { userGoals: match.userGoals ?? 0, opponentGoals: match.opponentGoals ?? 0 };
}
