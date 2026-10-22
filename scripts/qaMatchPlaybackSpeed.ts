// scripts/qaMatchPlaybackSpeed.ts
// QA de v0.24.9k (Fase C): velocidad de reproducción, movimiento reducido y contraste de la secuencia.

import { readFileSync } from "node:fs";
import { getMatchPlaybackMultiplier } from "../src/components/matchPlaybackSpeed";
import {
  getEuropeanSequenceDurationMs,
  getEuropeanSequenceFrame,
} from "../src/components/europeanMatchSequenceTimeline";
import {
  getMatchSequenceDurationMs,
  getMatchSequenceFrame,
} from "../src/components/matchSequenceTimeline";

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

function testMultipliers(): void {
  assert(getMatchPlaybackMultiplier("normal") === 1, "Normal no cambia la duración.");
  assert(getMatchPlaybackMultiplier("slow") === 1.5, "Lento alarga la secuencia un 50%.");
  assert(getMatchPlaybackMultiplier("fast") === 0.5, "Rápido acorta la secuencia a la mitad.");
  logOk("Lento, Normal y Rápido tienen multiplicadores fijos");
}

function testLeagueSequenceScales(): void {
  assert(getMatchSequenceDurationMs(1) === 3800, "Liga normal dura 3,8 s.");
  assert(getMatchSequenceDurationMs(0.5) === 1900, "Liga rápida dura 1,9 s.");
  assert(getMatchSequenceFrame([], 499, 0.5).stage === "preview", "Liga rápida sigue en previa hasta 0,5 s.");
  assert(getMatchSequenceFrame([], 500, 0.5).stage === "playing", "Liga rápida pasa a juego a los 0,5 s.");
  assert(getMatchSequenceFrame([], 1900, 0.5).stage === "final", "Liga rápida termina a los 1,9 s.");
  logOk("La línea de tiempo de Liga se escala con la velocidad");
}

function testEuropeanSequenceScales(): void {
  const penaltiesMatch = { decidedBy: "penalties" as const };
  assert(getEuropeanSequenceDurationMs(penaltiesMatch, 1) === 6400, "Europa con penaltis normal dura 6,4 s.");
  assert(getEuropeanSequenceDurationMs(penaltiesMatch, 1.5) === 9600, "Europa con penaltis lenta dura 9,6 s.");
  assert(getEuropeanSequenceFrame(penaltiesMatch, 2800, 0.5).stage === "penalties", "Con velocidad rápida la tanda empieza a los 2,4 s.");
  assert(getEuropeanSequenceFrame(penaltiesMatch, 3200, 0.5).stage === "final", "Con velocidad rápida el final llega a los 3,2 s.");
  logOk("La secuencia europea se escala con la velocidad");
}

function testWiring(): void {
  const view = read("src/components/LeagueSimulatorView.tsx");
  const card = read("src/components/EuropeanMatchEvent.tsx");
  const speedStore = read("src/components/matchPlaybackSpeed.ts");
  const leagueCss = read("src/components/LeagueSimulatorView.css");
  const europeanCss = read("src/components/EuropeanMatchEvent.css");

  assert(view.includes("<PlaybackSpeedControl />"), "La tarjeta de acciones debe mostrar el selector de velocidad.");
  assert(view.includes("AUTO_SIMULATION_DELAY_MS * playbackMultiplier"), "La pausa entre partidos debe escalar con la velocidad.");
  assert(card.includes("getEuropeanSequenceDurationMs(match, playbackMultiplier)"), "La secuencia europea debe usar la velocidad.");
  assert(speedStore.includes("try {") && speedStore.includes("catch"), "La preferencia debe tolerar un almacenamiento no disponible.");
  assert(leagueCss.includes("@media (prefers-reduced-motion: reduce)"), "Liga debe respetar el movimiento reducido.");
  assert(europeanCss.includes("@media (prefers-reduced-motion: reduce)"), "Europa debe respetar el movimiento reducido.");
  assert(leagueCss.includes(".playback-speed-option-active"), "La opción activa del selector debe destacarse.");
  logOk("El selector, la pausa automática y el movimiento reducido están cableados");
}

console.log("QA Match Playback Speed");
testMultipliers();
testLeagueSequenceScales();
testEuropeanSequenceScales();
testWiring();
console.log("QA match playback speed OK");
