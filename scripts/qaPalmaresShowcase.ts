import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function testPalmaresTrophyCaseSupportsCareerCounts(): void {
  const component = read("src/components/PalmaresTrophyCase.tsx");

  assert(!component.includes("Pendiente de Europa Career"), "Una vitrina vacía no debe mostrar texto interno de desarrollo.");
  assert(component.includes("Sin ${trophy.label} ganada todavía"), "Las vitrinas vacías deben decir qué trofeo falta.");
  assert(component.includes("CareerTrophyCounts"), "PalmaresTrophyCase debe aceptar CareerTrophyCounts.");
  assert(component.includes("trophyCounts?: CareerTrophyCounts"), "La vitrina debe tener prop opcional trophyCounts.");
  assert(component.includes("buildCareerTrophies"), "La vitrina debe construir trofeos acumulados de carrera.");
  assert(component.includes("trophyCounts.supercopa"), "La Supercopa debe mapearse desde trophyCounts.supercopa.");
  assert(component.includes("trophyCounts.europaLeague"), "Europa League debe mapearse desde trophyCounts.europaLeague.");
  assert(component.includes("trophyCounts.champions"), "Champions debe mapearse desde trophyCounts.champions.");
  assert(component.includes("trophyCounts.conference"), "Conference debe mapearse desde trophyCounts.conference.");
  assert(component.includes("variant?: \"single-game\" | \"career\""), "La vitrina debe distinguir partida suelta y carrera.");
  logOk("PalmaresTrophyCase soporta todos los títulos acumulados de carrera");
}

function testGameOverShowsPalmaresShowcase(): void {
  const outcome = read("src/components/CareerSeasonOutcome.tsx");

  assert(outcome.includes("PalmaresTrophyCase"), "Game Over debe importar la vitrina de palmarés.");
  assert(outcome.includes("career-game-over-palmares-showcase"), "Game Over debe renderizar un bloque de vitrina de palmarés.");
  assert(
    outcome.includes("getFinalCareerTrophyCounts(trophyCounts, seasonResult, europeanTournament)"),
    "Game Over debe sumar la temporada actual (incluido un título europeo pendiente) antes de mostrar palmarés.",
  );
  assert(outcome.includes("trophyCounts={finalTrophies}"), "La vitrina de Game Over debe recibir los trofeos finales acumulados.");
  assert(outcome.includes("variant=\"career\""), "La vitrina de Game Over debe usar modo carrera.");
  logOk("Game Over muestra vitrina de palmarés con la temporada actual incluida");
}

function testFinalSummaryUsesCareerPalmaresWhenAvailable(): void {
  const finalSummary = read("src/components/FinalSummary.tsx");
  const app = read("src/App.tsx");

  assert(finalSummary.includes("careerTrophyCounts?: CareerTrophyCounts"), "FinalSummary debe aceptar palmarés acumulado de carrera.");
  assert(finalSummary.includes("trophyCounts={careerTrophyCounts}"), "FinalSummary debe pasar el palmarés acumulado a PalmaresTrophyCase.");
  assert(app.includes("displayedCareerTrophyCounts"), "App debe calcular el palmarés visible de carrera.");
  assert(
    app.includes("getFinalCareerTrophyCounts(careerTrophyCounts, careerSeasonResult, europeanCareerState.currentTournament)"),
    "App debe sumar la temporada actual (incluido un título europeo pendiente) para el palmarés visible.",
  );
  assert(app.includes("careerTrophyCounts={displayedCareerTrophyCounts}"), "App debe pasar el palmarés acumulado al resumen completo.");
  logOk("Resumen completo usa palmarés acumulado de carrera cuando existe");
}

function testDocsAndStylesExist(): void {
  assert(existsSync(join(ROOT, "docs/v0_23_2b5_PALMARES_SUPERCOPA_GAMEOVER_SHOWCASE.md")), "Debe existir doc de fase v0.23.2b5.");
  const css = read("src/components/CareerSeasonOutcome.css");
  assert(css.includes("career-game-over-palmares-showcase"), "Debe existir estilo para la vitrina de Game Over.");
  logOk("documentación y estilos de showcase existen");
}

function testQaRegistered(): void {
  const packageJson = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
  const scripts = packageJson.scripts ?? {};

  assert(scripts["qa:palmares-showcase"], "Debe existir qa:palmares-showcase.");
  assert(scripts["qa:tech-debt"]?.includes("qa:palmares-showcase"), "qa:tech-debt debe incluir qa:palmares-showcase.");
  logOk("QA de palmarés registrada en package.json");
}

console.log("QA Palmarés Showcase");

testPalmaresTrophyCaseSupportsCareerCounts();
testGameOverShowsPalmaresShowcase();
testFinalSummaryUsesCareerPalmaresWhenAvailable();
testDocsAndStylesExist();
testQaRegistered();

console.log("QA palmarés showcase OK");
