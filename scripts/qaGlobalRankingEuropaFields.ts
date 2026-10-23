// scripts/qaGlobalRankingEuropaFields.ts
// QA de v0.24.5a: Global Ranking Europa Fields.
//
// Fase puramente de cliente: expone el desglose de títulos europeos
// (Champions/Europa League/Conference) que ya viaja en `CareerTrophyCounts`
// dentro de cada entrada de ranking (local y global), sin añadir campos
// nuevos al payload que se envía al backend ni tocar apps-script/. Eso se
// deja explícitamente para v0.24.5b (Backend Ranking Migration).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  formatEuropeanTrophyBreakdownLabel,
  getEuropeanTrophyBreakdown,
} from "../src/career/careerRanking";
import type { CareerTrophyCounts } from "../src/types/career";

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

function assertNotIncludes(haystack: string, needle: string, message: string): void {
  assert(!haystack.includes(needle), message);
}

function makeTrophyCounts(overrides: Partial<CareerTrophyCounts>): CareerTrophyCounts {
  return {
    champions: 0,
    liga: 0,
    europaLeague: 0,
    copa: 0,
    conference: 0,
    supercopa: 0,
    ...overrides,
  };
}

function testBreakdownComputesEachCompetitionAndTotal(): void {
  const breakdown = getEuropeanTrophyBreakdown(makeTrophyCounts({ champions: 2, europaLeague: 1, conference: 3, liga: 5, copa: 1 }));

  assert(breakdown.champions === 2, "El desglose debe respetar el contador de Champions.");
  assert(breakdown.europaLeague === 1, "El desglose debe respetar el contador de Europa League.");
  assert(breakdown.conference === 3, "El desglose debe respetar el contador de Conference.");
  assert(breakdown.total === 6, "El total debe ser la suma de las tres competiciones europeas, sin contar Liga/Copa/Supercopa.");
  logOk("getEuropeanTrophyBreakdown calcula cada competición y el total correctamente");
}

function testBreakdownIgnoresNationalTrophies(): void {
  const breakdown = getEuropeanTrophyBreakdown(makeTrophyCounts({ liga: 10, copa: 10, supercopa: 10 }));

  assert(breakdown.total === 0, "Liga, Copa y Supercopa no deben contar como títulos europeos.");
  logOk("El desglose europeo ignora Liga, Copa y Supercopa");
}

function testLabelListsOnlyNonZeroCompetitions(): void {
  const label = formatEuropeanTrophyBreakdownLabel(makeTrophyCounts({ champions: 1, conference: 2 }));

  assert(label.includes("Champions 1"), "La etiqueta debe mostrar los títulos de Champions.");
  assert(label.includes("Conference 2"), "La etiqueta debe mostrar los títulos de Conference.");
  assert(!label.includes("Europa Lg"), "La etiqueta no debe mostrar competiciones con 0 títulos.");
  logOk(`formatEuropeanTrophyBreakdownLabel omite competiciones en 0: "${label}"`);
}

function testLabelHandlesNoEuropeanTrophies(): void {
  const label = formatEuropeanTrophyBreakdownLabel(makeTrophyCounts({ liga: 3 }));

  assert(label === "Sin títulos europeos", `Sin títulos europeos debe mostrar el texto explícito, obtenido "${label}".`);
  logOk("Sin títulos europeos se muestra con texto explícito, no vacío");
}

function testLocalRankingUsesSharedHelperInsteadOfAdHocSum(): void {
  const component = readText("src/components/CareerLocalRanking.tsx");

  assertIncludes(component, "getEuropeanTrophyBreakdown", "El ranking local debe usar el helper compartido para el total europeo.");
  assertIncludes(component, "formatEuropeanTrophyBreakdownLabel", "El ranking local debe usar el helper compartido para el desglose europeo.");
  assertNotIncludes(
    component,
    "entry.trophyCounts.champions + entry.trophyCounts.europaLeague + entry.trophyCounts.conference",
    "El ranking local no debe seguir sumando los tres contadores europeos a mano; debe usar el helper compartido.",
  );
  assertIncludes(component, "data-label=\"Europa\"", "El ranking local debe tener una columna dedicada de Europa.");
  logOk("El ranking local usa el helper compartido y tiene columna de Europa");
}

function testGlobalRankingRendersEuropeanBreakdown(): void {
  const component = readText("src/components/CareerGlobalRanking.tsx");

  assertIncludes(component, "formatEuropeanTrophyBreakdownLabel", "El ranking global debe mostrar el desglose europeo.");
  assertIncludes(component, "data-label=\"Europa\"", "El ranking global debe tener una columna dedicada de Europa.");
  assertIncludes(component, "entry.trophyCounts", "El ranking global debe leer trophyCounts, que ya viaja en cada entrada.");
  logOk("El ranking global muestra el desglose de títulos europeos por entrada");
}

function testNoNewFieldsAddedToWirePayload(): void {
  const types = readText("src/types/career.ts");

  assertNotIncludes(types, "europeanTrophyBreakdown", "No debe añadirse un campo nuevo al payload; el desglose se calcula en cliente a partir de trophyCounts.");
  assertIncludes(types, "trophyCounts: CareerTrophyCounts;", "El payload debe seguir enviando trophyCounts tal cual, sin cambios de formato.");
  logOk("No se añaden campos nuevos al payload de ranking global (sigue viajando trophyCounts tal cual)");
}

function testBackendUntouched(): void {
  const backend = readText("apps-script/globalRankingBackend.gs");

  assertNotIncludes(backend, "getEuropeanTrophyBreakdown", "El backend de Apps Script no debe tocarse en esta fase (eso es v0.24.5b).");
  assertNotIncludes(backend, "europeanTrophyBreakdown", "El backend de Apps Script no debe recibir un campo nuevo en esta fase.");
  logOk("apps-script/globalRankingBackend.gs queda intacto; la migración de backend es v0.24.5b");
}

function testQaRegisteredInPackageAndWorkflow(): void {
  const packageJson = JSON.parse(readText("package.json")) as { scripts?: Record<string, string> };
  const scripts = packageJson.scripts ?? {};

  assert(Boolean(scripts["qa:global-ranking-europa-fields"]), "Debe existir qa:global-ranking-europa-fields en package.json.");
  assert(Boolean(scripts["qa:tech-debt"]?.includes("qa:global-ranking-europa-fields")), "qa:tech-debt debe incluir qa:global-ranking-europa-fields.");
  assertIncludes(readText("scripts/runQaSuite.mjs"), "qaGlobalRankingEuropaFields", "runQaSuite debe ejecutar qaGlobalRankingEuropaFields.");
  assertIncludes(readText("scripts/runQaSuite.mjs"), "qaGlobalRankingEuropaFields", "runQaSuite debe ejecutar qaGlobalRankingEuropaFields.");
  logOk("QA de campos europeos del ranking registrada en package.json y deploy.yml");
}

function testInterseasonPalmaresMentionsEuropeanTitles(): void {
  const reward = readText("src/components/CareerInterseasonReward.tsx");

  assertIncludes(reward, "getEuropeanTrophyBreakdown(trophyCounts).total", "La pantalla entre temporadas debe contar los títulos europeos con el helper compartido.");
  assertIncludes(reward, "· Europa {", "El detalle del palmarés entre temporadas debe incluir Europa: los puntos de palmarés incluyen títulos europeos que antes no se veían desglosados.");
  logOk("El palmarés entre temporadas desglosa también los títulos europeos");
}

function testLocalRankingCopyDoesNotDenyGlobalRanking(): void {
  const local = readText("src/components/CareerLocalRanking.tsx");

  assertNotIncludes(local, "Sin backend, sin ranking global", "El ranking local no debe decir que no hay ranking global: ya existe.");
  assertIncludes(local, "usa el ranking global", "El ranking local debe orientar al jugador hacia el ranking global.");
  logOk("El texto del ranking local ya no niega el ranking global");
}

console.log("QA Global Ranking Europa Fields");
testBreakdownComputesEachCompetitionAndTotal();
testBreakdownIgnoresNationalTrophies();
testLabelListsOnlyNonZeroCompetitions();
testLabelHandlesNoEuropeanTrophies();
testLocalRankingUsesSharedHelperInsteadOfAdHocSum();
testGlobalRankingRendersEuropeanBreakdown();
testNoNewFieldsAddedToWirePayload();
testBackendUntouched();
testInterseasonPalmaresMentionsEuropeanTitles();
testLocalRankingCopyDoesNotDenyGlobalRanking();
testQaRegisteredInPackageAndWorkflow();
console.log("QA global ranking europa fields OK");
