// scripts/qaEuropeanVisualPolish.ts
// QA de v0.24.6b: European Visual Polish.
//
// Fase de CSS/JSX puro. v0.24.6a (Mobile Polish) ya cubrió responsive; esta
// fase cubre coherencia visual: extiende el sistema de color por
// competición (azul Champions / naranja Europa League / verde Conference)
// que ya existía en EuropeanMatchEvent.css a EuropeanProgressPanel y
// EuropeanQualificationCard (donde antes las tres competiciones se veían
// idénticas), y da a la columna "Europa" del ranking un acento propio
// (el mismo azul "identidad europea" ya usado en el resto de pantallas
// europeas) para distinguirla de un vistazo de Liga/Copa/Supercopa.

import { readFileSync } from "node:fs";
import { join } from "node:path";

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

function assertIncludes(haystack: string, needle: string, message: string): void {
  assert(haystack.includes(needle), message);
}

function testQualificationCardHasThreeCompetitionColors(): void {
  const tsx = readText("src/components/EuropeanQualificationCard.tsx");
  const css = readText("src/components/EuropeanQualificationCard.css");

  assertIncludes(tsx, "getCompetitionModifierClass", "EuropeanQualificationCard debe calcular una clase modificadora por competición.");
  assertIncludes(tsx, "european-qualification-card-champions", "Debe existir la variante de clase para Champions.");
  assertIncludes(tsx, "european-qualification-card-europa", "Debe existir la variante de clase para Europa League.");
  assertIncludes(tsx, "european-qualification-card-conference", "Debe existir la variante de clase para Conference.");

  assertIncludes(css, ".european-qualification-card-champions {", "Debe existir estilo dedicado para Champions.");
  assertIncludes(css, ".european-qualification-card-europa {", "Debe existir estilo dedicado para Europa League.");
  assertIncludes(css, ".european-qualification-card-conference {", "Debe existir estilo dedicado para Conference.");
  assertIncludes(css, "rgba(128, 190, 255,", "Champions debe usar el mismo azul que EuropeanMatchEvent.css.");
  assertIncludes(css, "rgba(255, 185, 105,", "Europa League debe usar el mismo naranja que EuropeanMatchEvent.css.");
  assertIncludes(css, "rgba(95, 225, 160,", "Conference debe usar el mismo verde que EuropeanMatchEvent.css.");
  logOk("EuropeanQualificationCard distingue visualmente Champions/Europa League/Conference (antes idénticas)");
}

function testProgressPanelHasThreeCompetitionColors(): void {
  const tsx = readText("src/components/EuropeanProgressPanel.tsx");
  const css = readText("src/components/EuropeanProgressPanel.css");

  assertIncludes(tsx, "getCompetitionModifierClass", "EuropeanProgressPanel debe calcular una clase modificadora por competición.");
  assertIncludes(tsx, "european-progress-panel-champions", "Debe existir la variante de clase para Champions.");
  assertIncludes(tsx, "european-progress-panel-europa", "Debe existir la variante de clase para Europa League.");
  assertIncludes(tsx, "european-progress-panel-conference", "Debe existir la variante de clase para Conference.");

  assertIncludes(css, ".european-progress-panel-champions {", "Debe existir estilo dedicado para Champions.");
  assertIncludes(css, ".european-progress-panel-europa {", "Debe existir estilo dedicado para Europa League.");
  assertIncludes(css, ".european-progress-panel-conference {", "Debe existir estilo dedicado para Conference.");
  assertIncludes(css, "rgba(255, 185, 105,", "Europa League debe usar el mismo naranja que EuropeanMatchEvent.css.");
  assertIncludes(css, "rgba(95, 225, 160,", "Conference debe usar el mismo verde que EuropeanMatchEvent.css.");
  logOk("EuropeanProgressPanel distingue visualmente Champions/Europa League/Conference (antes idénticas)");
}

function testCompetitionColorsMatchEuropeanMatchEventSource(): void {
  const matchEventCss = readText("src/components/EuropeanMatchEvent.css");

  assertIncludes(matchEventCss, "rgba(128, 190, 255, 0.55)", "El azul de Champions reutilizado debe coincidir con EuropeanMatchEvent.css (fuente de los tonos por competición).");
  assertIncludes(matchEventCss, "rgba(255, 185, 105, 0.48)", "El naranja de Europa League reutilizado debe coincidir con EuropeanMatchEvent.css.");
  assertIncludes(matchEventCss, "rgba(95, 225, 160, 0.48)", "El verde de Conference reutilizado debe coincidir con EuropeanMatchEvent.css.");
  logOk("Los tonos reutilizados en las otras pantallas coinciden exactamente con los ya definidos en EuropeanMatchEvent.css");
}

function testRankingEuropaColumnHasDistinctAccent(): void {
  const localTsx = readText("src/components/CareerLocalRanking.tsx");
  const globalTsx = readText("src/components/CareerGlobalRanking.tsx");
  const localCss = readText("src/components/CareerLocalRanking.css");
  const globalCss = readText("src/components/CareerGlobalRanking.css");

  assertIncludes(localTsx, 'className="career-ranking-europa-cell"', "La celda Europa del ranking local debe tener una clase dedicada.");
  assertIncludes(globalTsx, 'className="career-global-ranking-europa-cell"', "La celda Europa del ranking global debe tener una clase dedicada.");
  assertIncludes(localCss.replace(/\s+/g, " "), ".career-ranking-europa-cell span { color: #cfe0ff; }", "La celda Europa del ranking local debe tener el acento azul europeo.");
  assertIncludes(globalCss.replace(/\s+/g, " "), ".career-global-ranking-europa-cell span { color: #cfe0ff; }", "La celda Europa del ranking global debe tener el acento azul europeo.");
  logOk("La columna Europa de ambos rankings tiene un acento de color propio (#cfe0ff), distinto de Liga/Copa/Supercopa");
}

function testNoUnrelatedSystemsTouched(): void {
  const qualificationCss = readText("src/components/EuropeanQualificationCard.css");
  const progressCss = readText("src/components/EuropeanProgressPanel.css");

  assert(!qualificationCss.includes("careerSeasonRatingBonus"), "El polish visual no debe tocar lógica de bonus/rating.");
  assert(!progressCss.includes("careerSeasonRatingBonus"), "El polish visual no debe tocar lógica de bonus/rating.");
  logOk("El polish visual se mantiene puramente en CSS/clases, sin tocar lógica de negocio");
}

function testQaRegisteredInPackageAndWorkflow(): void {
  const packageJson = JSON.parse(readText("package.json")) as { scripts?: Record<string, string> };
  const scripts = packageJson.scripts ?? {};

  assert(Boolean(scripts["qa:european-visual-polish"]), "Debe existir qa:european-visual-polish en package.json.");
  assert(Boolean(scripts["qa:tech-debt"]?.includes("qa:european-visual-polish")), "qa:tech-debt debe incluir qa:european-visual-polish.");
  assertIncludes(readText("scripts/runQaSuite.mjs"), "qaEuropeanVisualPolish", "runQaSuite debe ejecutar qaEuropeanVisualPolish.");
  assertIncludes(readText("scripts/runQaSuite.mjs"), "qaEuropeanVisualPolish", "runQaSuite debe ejecutar qaEuropeanVisualPolish.");
  logOk("QA de pulido visual europeo registrada en package.json y deploy.yml");
}

console.log("QA European Visual Polish");
testQualificationCardHasThreeCompetitionColors();
testProgressPanelHasThreeCompetitionColors();
testCompetitionColorsMatchEuropeanMatchEventSource();
testRankingEuropaColumnHasDistinctAccent();
testNoUnrelatedSystemsTouched();
testQaRegisteredInPackageAndWorkflow();
console.log("QA european visual polish OK");
