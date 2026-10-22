// scripts/qaSavedGameResume.ts
// QA: al recargar la web y pulsar "Continuar", la pantalla "Entre temporadas"
// (recompensa de jugador/entrenador + prestigio europeo) no se debe perder.
// Detectado jugando la app: la partida guardada solo persiste `phase`, y esa
// pantalla comparte phase `team_summary` con el resumen normal del equipo.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { shouldResumeInterseasonReward } from "../src/career/resumeScreen";
import type { SavedGameState } from "../src/storage/localGameStorage";

const ROOT = process.cwd();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function readText(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function makeSaved(overrides: Record<string, unknown> = {}): SavedGameState {
  return {
    gameId: "qa",
    phase: "team_summary",
    difficulty: "normal",
    playerRoundSeasons: [],
    currentRoundIndex: 11,
    selectedPlayers: [],
    isCareerMode: true,
    careerSeasonResult: { leaguePosition: 4 },
    careerObjectiveResult: { survives: true },
    careerRewardSnapshot: { careerSeasonLabel: "2029/30" },
    savedAt: new Date().toISOString(),
    ...overrides,
  } as unknown as SavedGameState;
}

function testResumesInterseasonRewardScreen(): void {
  assert(shouldResumeInterseasonReward(makeSaved()), "Una carrera superada, en team_summary y con snapshot de recompensa, debe volver a Entre temporadas.");
  logOk("Recargar en Entre temporadas vuelve a esa pantalla (recompensa y prestigio no se pierden)");
}

function testDoesNotResumeWhenRewardAlreadyChosenOrNotApplicable(): void {
  assert(!shouldResumeInterseasonReward(makeSaved({ careerRewardSnapshot: undefined })), "Con la recompensa ya elegida (snapshot borrado) no debe volver a Entre temporadas.");
  assert(!shouldResumeInterseasonReward(makeSaved({ careerRewardFlow: "standard_coach" })), "Con un flujo de recompensa en marcha no debe interferir.");
  assert(!shouldResumeInterseasonReward(makeSaved({ careerObjectiveResult: { survives: false } })), "Un Game Over no tiene pantalla Entre temporadas.");
  assert(!shouldResumeInterseasonReward(makeSaved({ careerSeasonResult: undefined })), "Sin resultado de temporada no hay recompensa pendiente.");
  assert(!shouldResumeInterseasonReward(makeSaved({ isCareerMode: false })), "Una partida suelta no tiene Entre temporadas.");
  assert(!shouldResumeInterseasonReward(makeSaved({ phase: "league_simulation" })), "Solo la fase team_summary es ambigua; el resto se restaura como siempre.");
  logOk("No interfiere con recompensa ya elegida, flujos en marcha, Game Over, partida suelta ni otras fases");
}

function testAppUsesIt(): void {
  const app = readText("src/App.tsx");
  assert(app.includes("shouldResumeInterseasonReward(loadedGame)"), "handleContinueGame debe usar shouldResumeInterseasonReward para elegir la pantalla.");
  logOk("handleContinueGame usa la función en la carga de partida");
}

function testRegistered(): void {
  const pkg = JSON.parse(readText("package.json")) as { scripts?: Record<string, string> };
  const workflow = readText(".github/workflows/deploy.yml");
  assert(Boolean(pkg.scripts?.["qa:saved-game-resume"]), "Debe existir qa:saved-game-resume en package.json.");
  assert(Boolean(pkg.scripts?.["qa:tech-debt"]?.includes("qa:saved-game-resume")), "qa:tech-debt debe incluir qa:saved-game-resume.");
  assert(workflow.includes("npm run qa:saved-game-resume"), "deploy.yml debe lanzar qa:saved-game-resume.");
  logOk("QA registrada en package.json y deploy.yml");
}

console.log("QA Saved Game Resume");
testResumesInterseasonRewardScreen();
testDoesNotResumeWhenRewardAlreadyChosenOrNotApplicable();
testAppUsesIt();
testRegistered();
console.log("QA saved game resume OK");
