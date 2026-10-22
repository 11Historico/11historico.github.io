// scripts/qaMatchSequence.ts
// QA de v0.24.9i (Fase A): secuencia de partido de Liga y Copa.

import { readFileSync } from "node:fs";
import {
  MATCH_SEQUENCE_DURATION_MS,
  MATCH_SEQUENCE_PLAY_MS,
  MATCH_SEQUENCE_PREVIEW_MS,
  countGoalsForTeam,
  getMatchSequenceFrame,
} from "../src/components/matchSequenceTimeline";
import type { GoalEvent } from "../src/types/game";

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

// Tiempo transcurrido que cae en el centro del minuto `minute` durante la fase de juego.
function elapsedAtMinute(minute: number): number {
  return MATCH_SEQUENCE_PREVIEW_MS + (MATCH_SEQUENCE_PLAY_MS * (minute + 0.5)) / 91;
}

const goals: GoalEvent[] = [
  { minute: 70, teamName: "Athletic Club", scorerName: "Dani" },
  { minute: 12, teamName: "Rival CF", scorerName: "Ruiz" },
  { minute: 30, teamName: "Athletic Club", scorerName: "Iker" },
];

function testPreviewHasNoGoals(): void {
  const frame = getMatchSequenceFrame(goals, 0);
  assert(frame.stage === "preview", "Al inicio debe mostrarse la previa.");
  assert(frame.minute === 0 && frame.visibleGoals.length === 0, "La previa no muestra minuto ni goles.");
  logOk("La previa empieza en 0' sin goles");
}

function testGoalsAppearAtTheirMinute(): void {
  const beforeGoal = getMatchSequenceFrame(goals, elapsedAtMinute(29));
  assert(beforeGoal.stage === "playing", "Minuto 29 debe estar en juego.");
  assert(beforeGoal.minute === 29, `Minuto 29 esperado y obtenido ${beforeGoal.minute}.`);
  assert(beforeGoal.visibleGoals.map((goal) => goal.minute).join(",") === "12", "A 29' solo debe verse el gol de 12'.");

  const atGoal = getMatchSequenceFrame(goals, elapsedAtMinute(30));
  assert(atGoal.visibleGoals.map((goal) => goal.minute).join(",") === "12,30", "A 30' debe aparecer el gol de 30'.");
  logOk("Cada gol aparece en su minuto");
}

function testFinalShowsEverythingInOrder(): void {
  const frame = getMatchSequenceFrame(goals, MATCH_SEQUENCE_DURATION_MS);
  assert(frame.stage === "final", "Al terminar la secuencia debe mostrarse el resultado final.");
  assert(frame.minute === 90, "El resultado final muestra el minuto 90.");
  assert(frame.visibleGoals.map((goal) => goal.minute).join(",") === "12,30,70", "En final todos los goles deben verse en orden de minuto.");
  logOk("El estado final muestra todos los goles en orden");
}

function testStoppageTimeGoalIsNotHiddenBeforeTheEnd(): void {
  const stoppageGoals: GoalEvent[] = [{ minute: 93, teamName: "Rival CF", scorerName: "Lopez" }];
  const beforeStoppage = getMatchSequenceFrame(stoppageGoals, MATCH_SEQUENCE_PREVIEW_MS + MATCH_SEQUENCE_PLAY_MS * 0.9);
  assert(beforeStoppage.stage === "playing", "A mitad del descuento la secuencia sigue en juego.");
  assert(beforeStoppage.visibleGoals.length === 0, "El gol de 93' no debe verse antes de su minuto.");

  const atStoppageGoal = getMatchSequenceFrame(stoppageGoals, MATCH_SEQUENCE_PREVIEW_MS + MATCH_SEQUENCE_PLAY_MS * 0.995);
  assert(atStoppageGoal.stage === "playing", "Justo antes del final la secuencia sigue en juego.");
  assert(atStoppageGoal.minute === 93, `El reloj debe llegar al 93' antes del final; obtenido ${atStoppageGoal.minute}.`);
  assert(atStoppageGoal.visibleGoals.length === 1, "El gol de 93' debe verse en su minuto.");
  logOk("El gol del descuento aparece en su minuto, no solo al final");
}

function testUnsortedInputIsSorted(): void {
  const frame = getMatchSequenceFrame(goals, elapsedAtMinute(90));
  assert(frame.visibleGoals.map((goal) => goal.minute).join(",") === "12,30,70", "Los goles deben ordenarse por minuto.");
  logOk("Los goles desordenados se ordenan por minuto");
}

function testCountGoalsForTeam(): void {
  assert(countGoalsForTeam(goals, "Athletic Club") === 2, "Athletic marca dos goles en la muestra.");
  assert(countGoalsForTeam(goals, "Rival CF") === 1, "Rival marca un gol en la muestra.");
  assert(countGoalsForTeam([], "Athletic Club") === 0, "Sin goles el marcador parcial es 0.");
  logOk("El marcador parcial cuenta goles por equipo");
}

function testWiring(): void {
  const view = read("src/components/LeagueSimulatorView.tsx");
  const css = read("src/components/LeagueSimulatorView.css");

  assert(view.includes("<MatchSequence"), "La vista debe usar MatchSequence para el último resultado.");
  assert(!view.includes('<article className="last-result-card">'), "La tarjeta estática de resultado debe haberse sustituido.");
  assert(
    view.includes("if (!isAutoSimulating || isSequencePlaying) return undefined;"),
    "La auto-simulación debe esperar a que termine la secuencia.",
  );
  assert(view.includes("onPlayingChange={setIsSequencePlaying}"), "La secuencia debe avisar a la vista cuando juega.");
  assert(css.includes(".match-sequence-cup"), "La Copa debe tener su estilo propio.");
  logOk("La vista usa la secuencia, espera a que termine y la Copa tiene estilo propio");
}

console.log("QA Match Sequence");
testPreviewHasNoGoals();
testGoalsAppearAtTheirMinute();
testFinalShowsEverythingInOrder();
testStoppageTimeGoalIsNotHiddenBeforeTheEnd();
testUnsortedInputIsSorted();
testCountGoalsForTeam();
testWiring();
console.log("QA match sequence OK");
