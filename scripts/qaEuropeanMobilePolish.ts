// scripts/qaEuropeanMobilePolish.ts
// QA de v0.24.6a: European Mobile Polish.
//
// Fase de CSS/JSX puro sobre pantallas ya existentes (ranking local/global,
// evento de partido europeo). No añade mecánica nueva ni toca lógica de
// negocio. Corrige 3 huecos concretos encontrados al auditar el móvil:
//
// 1. La columna "Europa" de las tablas de ranking (añadida en v0.24.5a) no
//    estaba envuelta en <span>, así que en la vista apilada de móvil no
//    heredaba el alineado a la derecha del resto de celdas.
// 2. El grid de KPIs de EuropeanMatchEvent (.european-match-event-grid)
//    podía seguir mostrando 2 columnas en un móvil estrecho.
// 3. El botón de acción de EuropeanMatchEvent no era ancho completo en
//    móvil, a diferencia del resto de pantallas de recompensa/ranking.

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

function testRankingEuropaColumnWrappedInSpan(): void {
  const local = readText("src/components/CareerLocalRanking.tsx");
  const global = readText("src/components/CareerGlobalRanking.tsx");

  assertIncludes(
    local,
    "<span>{formatEuropeanTrophyBreakdownLabel(entry.trophyCounts)}</span>",
    "La celda Europa del ranking local debe envolver el texto en <span> para heredar el alineado móvil.",
  );
  assertIncludes(
    global,
    "<span>{formatEuropeanTrophyBreakdownLabel(entry.trophyCounts)}</span>",
    "La celda Europa del ranking global debe envolver el texto en <span> para heredar el alineado móvil.",
  );
  logOk("La columna Europa de ambos rankings envuelve su texto en <span> (alineado móvil consistente)");
}

function testRankingMobileSpanAlignmentRulesExist(): void {
  const localCss = readText("src/components/CareerLocalRanking.css");
  const globalCss = readText("src/components/CareerGlobalRanking.css");

  assertIncludes(localCss, ".career-ranking-table td span {", "El CSS del ranking local debe seguir alineando a la derecha los <span> de celda en móvil.");
  assertIncludes(globalCss, ".career-global-ranking-table td span,", "El CSS del ranking global debe seguir alineando a la derecha los <span> de celda en móvil.");
  logOk("Las reglas móviles de alineado de <span> en celdas de ranking siguen existiendo (no se rompió nada al tocarlas)");
}

function testEuropeanMatchEventGridCollapsesOnMobile(): void {
  const css = readText("src/components/EuropeanMatchEvent.css");
  const mobileBlockMatch = /@media \(max-width: 560px\) \{[\s\S]*?\n\}/.exec(css);
  assert(mobileBlockMatch !== null, "Debe existir el bloque @media (max-width: 560px) en EuropeanMatchEvent.css.");

  const block = mobileBlockMatch[0];
  assertIncludes(block, ".european-match-event-grid", "El grid de KPIs (Rival/Rating/Sede) debe colapsar a una columna en móvil estrecho.");
  logOk("El grid de KPIs de EuropeanMatchEvent colapsa a una columna por debajo de 560px");
}

function testEuropeanMatchEventActionButtonFullWidthOnMobile(): void {
  const css = readText("src/components/EuropeanMatchEvent.css");
  const mobileBlockMatch = /@media \(max-width: 560px\) \{[\s\S]*?\n\}/.exec(css);
  assert(mobileBlockMatch !== null, "Debe existir el bloque @media (max-width: 560px) en EuropeanMatchEvent.css.");

  const block = mobileBlockMatch[0];
  const ruleMatch = /\.european-match-event-actions button \{[\s\S]*?\}/.exec(block);
  assert(ruleMatch !== null, "El bloque móvil debe tener una regla para .european-match-event-actions button.");
  assertIncludes(ruleMatch[0], "width: 100%;", "El botón de acción (Simular/Continuar) debe ser ancho completo en móvil, como en el resto de pantallas.");
  logOk("El botón de acción de EuropeanMatchEvent es ancho completo en móvil");
}

function testExistingMobileCoverageStillIntact(): void {
  const progressCss = readText("src/components/EuropeanProgressPanel.css");
  const qualificationCss = readText("src/components/EuropeanQualificationCard.css");

  assertIncludes(progressCss, "grid-template-columns: repeat(2, minmax(0, 1fr));", "El grid de KPIs de EuropeanProgressPanel debe seguir colapsando a 2 columnas en tablet/móvil ancho.");
  assert(qualificationCss.length > 0, "EuropeanQualificationCard.css debe seguir existiendo con su propia cobertura móvil.");
  logOk("La cobertura móvil ya existente (EuropeanProgressPanel, EuropeanQualificationCard) no se ha tocado ni roto");
}

function testQaRegisteredInPackageAndWorkflow(): void {
  const packageJson = JSON.parse(readText("package.json")) as { scripts?: Record<string, string> };
  const scripts = packageJson.scripts ?? {};

  assert(Boolean(scripts["qa:european-mobile-polish"]), "Debe existir qa:european-mobile-polish en package.json.");
  assert(Boolean(scripts["qa:tech-debt"]?.includes("qa:european-mobile-polish")), "qa:tech-debt debe incluir qa:european-mobile-polish.");
  assertIncludes(readText("scripts/runQaSuite.mjs"), "qaEuropeanMobilePolish", "runQaSuite debe ejecutar qaEuropeanMobilePolish.");
  assertIncludes(readText("scripts/runQaSuite.mjs"), "qaEuropeanMobilePolish", "runQaSuite debe ejecutar qaEuropeanMobilePolish.");
  logOk("QA de pulido móvil europeo registrada en package.json y deploy.yml");
}

console.log("QA European Mobile Polish");
testRankingEuropaColumnWrappedInSpan();
testRankingMobileSpanAlignmentRulesExist();
testEuropeanMatchEventGridCollapsesOnMobile();
testEuropeanMatchEventActionButtonFullWidthOnMobile();
testExistingMobileCoverageStillIntact();
testQaRegisteredInPackageAndWorkflow();
console.log("QA european mobile polish OK");
