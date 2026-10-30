// scripts/qaEuropeanMatchSequence.ts
// QA de v0.24.9j (Fase B): secuencia de partido europeo con prórroga y penaltis.

import { readFileSync } from "node:fs";
import {
  EUROPEAN_SEQUENCE_EXTRA_MS,
  EUROPEAN_SEQUENCE_PENALTIES_MS,
  EUROPEAN_SEQUENCE_PREVIEW_MS,
  EUROPEAN_SEQUENCE_REGULAR_MS,
  getEuropeanSequenceDurationMs,
  getEuropeanSequenceFrame,
  getEuropeanSequenceScore,
  getEuropeanSequenceSegments,
} from "../src/components/europeanMatchSequenceTimeline";
import type { EuropeanTournamentMatch } from "../src/europe/europeanTypes";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

const leagueMatch = { decidedBy: undefined };
const extraTimeMatch = { decidedBy: "extra_time" as const };
const penaltiesMatch = { decidedBy: "penalties" as const };

function stagesOf(match: { decidedBy?: "regular_time" | "extra_time" | "penalties" }): string {
  return getEuropeanSequenceSegments(match).map((segment) => segment.stage).join(">");
}

function testSegmentsPerOutcome(): void {
  assert(stagesOf(leagueMatch) === "preview>regular", "Un partido sin prórroga solo tiene previa y 90'.");
  assert(stagesOf(extraTimeMatch) === "preview>regular>extra_time", "Con prórroga debe aparecer el tramo de prórroga.");
  assert(stagesOf(penaltiesMatch) === "preview>regular>extra_time>penalties", "Con penaltis debe aparecer la tanda.");

  assert(
    getEuropeanSequenceDurationMs(leagueMatch) === EUROPEAN_SEQUENCE_PREVIEW_MS + EUROPEAN_SEQUENCE_REGULAR_MS,
    "Duración sin prórroga = previa + 90'.",
  );
  assert(
    getEuropeanSequenceDurationMs(penaltiesMatch) ===
      EUROPEAN_SEQUENCE_PREVIEW_MS + EUROPEAN_SEQUENCE_REGULAR_MS + EUROPEAN_SEQUENCE_EXTRA_MS + EUROPEAN_SEQUENCE_PENALTIES_MS,
    "Duración con penaltis = todos los tramos.",
  );
  logOk("Los tramos dependen de cómo se decidió el partido");
}

function testRegularTimeClock(): void {
  const frame = getEuropeanSequenceFrame(leagueMatch, EUROPEAN_SEQUENCE_PREVIEW_MS + EUROPEAN_SEQUENCE_REGULAR_MS / 2);
  assert(frame.stage === "regular", "A mitad de la fase de juego debe estar en 90'.");
  assert(frame.clockLabel === "45'", `El reloj a mitad debe marcar 45', marcó ${frame.clockLabel}.`);
  assert(frame.scoreBasis === "none", "Durante el juego el marcador no se revela.");
  logOk("El reloj avanza de 0' a 90' sin revelar marcador");
}

function testExtraTimeClock(): void {
  const start = EUROPEAN_SEQUENCE_PREVIEW_MS + EUROPEAN_SEQUENCE_REGULAR_MS;
  const frame = getEuropeanSequenceFrame(extraTimeMatch, start + 10);
  assert(frame.stage === "extra_time", "Tras los 90' debe empezar la prórroga.");
  assert(frame.clockLabel === "91'", `La prórroga empieza en 91', obtuvo ${frame.clockLabel}.`);
  assert(frame.scoreBasis === "regular", "En prórroga se revela el marcador de los 90'.");
  logOk("La prórroga cuenta de 91' y revela el marcador de 90'");
}

function testPenaltiesStage(): void {
  const start = EUROPEAN_SEQUENCE_PREVIEW_MS + EUROPEAN_SEQUENCE_REGULAR_MS + EUROPEAN_SEQUENCE_EXTRA_MS;
  const frame = getEuropeanSequenceFrame(penaltiesMatch, start + 10);
  assert(frame.stage === "penalties", "Tras la prórroga debe empezar la tanda.");
  assert(frame.clockLabel === "Penaltis", "La tanda se identifica con 'Penaltis'.");
  assert(frame.scoreBasis === "extra_time", "En la tanda se revela el marcador tras la prórroga.");
  logOk("La tanda de penaltis se muestra tras la prórroga");
}

function testFinalStage(): void {
  const frame = getEuropeanSequenceFrame(penaltiesMatch, getEuropeanSequenceDurationMs(penaltiesMatch));
  assert(frame.stage === "final", "Al terminar la secuencia debe mostrarse el resultado final.");
  assert(frame.scoreBasis === "final", "El final revela el marcador definitivo.");
  logOk("El final revela el marcador definitivo");
}

function testScoreBasis(): void {
  const match: Pick<EuropeanTournamentMatch, "userGoals" | "opponentGoals" | "regularTimeUserGoals" | "regularTimeOpponentGoals"> = {
    userGoals: 2,
    opponentGoals: 2,
    regularTimeUserGoals: 1,
    regularTimeOpponentGoals: 1,
  };

  assert(getEuropeanSequenceScore(match, "none") === null, "Sin revelar no hay marcador.");
  assert(
    JSON.stringify(getEuropeanSequenceScore(match, "regular")) === JSON.stringify({ userGoals: 1, opponentGoals: 1 }),
    "La base 'regular' usa el marcador de 90'.",
  );
  assert(
    JSON.stringify(getEuropeanSequenceScore(match, "extra_time")) === JSON.stringify({ userGoals: 2, opponentGoals: 2 }),
    "La base 'extra_time' usa el marcador tras la prórroga.",
  );
  logOk("El marcador revelado corresponde a cada tramo");
}

function testWiring(): void {
  const card = read("src/components/EuropeanMatchEvent.tsx");
  const css = read("src/components/EuropeanMatchEvent.css");

  assert(card.includes("<EuropeanMatchSequence key={match.id} match={match}"), "La tarjeta europea debe usar la secuencia.");
  assert(card.includes("getEuropeanMatchDecisionText(match)"), "El final de la secuencia debe mantener el texto de prórroga y penaltis.");
  assert(css.includes(".european-match-event-card-champions .european-match-sequence-progress span"), "Champions debe tener acento propio.");
  assert(css.includes(".european-match-event-card-conference .european-match-sequence-progress span"), "Conference debe tener acento propio.");
  logOk("La tarjeta europea usa la secuencia con acento por competición");
}

console.log("QA European Match Sequence");
testSegmentsPerOutcome();
testRegularTimeClock();
testExtraTimeClock();
testPenaltiesStage();
testFinalStage();
testScoreBasis();
testWiring();
console.log("QA european match sequence OK");
