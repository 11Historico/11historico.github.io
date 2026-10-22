// scripts/qaGlobalRankingBackendMigration.ts
// QA de v0.24.5b: Backend Ranking Migration.
//
// apps-script/globalRankingBackend.gs es Google Apps Script: no se puede
// ejecutar con Node/Vite como el resto del proyecto. Esta QA valida el
// código fuente por texto (igual que otras fases que tocan ese archivo),
// centrada en el único objetivo de esta fase: añadir columnas estructuradas
// de títulos por competición para consulta/orden directo en Sheets, sin
// romper compatibilidad con el cliente ni tocar la fórmula de puntuación.

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

function testNewColumnsAppendedAfterExistingHeaders(): void {
  const backend = readText("apps-script/globalRankingBackend.gs");
  const headersMatch = /const HEADERS = \[([\s\S]*?)\];/.exec(backend);
  assert(headersMatch !== null, "Debe existir el array HEADERS.");

  const headerNames = Array.from(headersMatch[1].matchAll(/'([a-zA-Z]+)'/g)).map((match) => match[1]);
  const expected = [
    "id", "careerId", "nick", "completedSeasons", "arcadeScore", "palmaresScore", "survivalScore",
    "trophyCounts", "bestLeaguePosition", "lastSeasonLabel", "lastLeaguePosition", "gameVersion",
    "createdAt", "submittedAt", "serverReceivedAt",
    "championsTitles", "ligaTitles", "europaLeagueTitles", "copaTitles", "conferenceTitles", "supercopaTitles",
    "oculto",
  ];

  assert(headerNames.length === expected.length, `HEADERS debe tener ${expected.length} columnas, tiene ${headerNames.length}.`);
  expected.forEach((name, index) => {
    assert(headerNames[index] === name, `La columna ${index + 1} debe ser "${name}", es "${headerNames[index]}".`);
  });

  logOk("Las 6 columnas de títulos por competición se añaden al final de HEADERS, sin desplazar las existentes");
}

function testHiddenRowsAreFilteredOut(): void {
  const backend = readText("apps-script/globalRankingBackend.gs");

  assertIncludes(backend, "function isHiddenRow_(row)", "Debe existir el filtro de filas ocultas.");
  assertIncludes(backend, ".filter((row) => !isHiddenRow_(row))", "readEntries_ debe excluir las filas ocultas antes de convertirlas.");
  assertIncludes(backend, ".concat(trophyCountsToColumns_(entry.trophyCounts), [''])", "Las filas nuevas deben dejar vacía la columna oculto (visible por defecto).");
  logOk("La columna de moderación oculta filas sin borrar datos y las nuevas filas quedan visibles");
}

function testTextColumnIndicesUnchanged(): void {
  const backend = readText("apps-script/globalRankingBackend.gs");

  assertIncludes(
    backend,
    "const TEXT_COLUMNS = [1, 2, 3, 10, 12, 13, 14, 15];",
    "TEXT_COLUMNS no debe cambiar de índices: las columnas nuevas van después y son numéricas, no necesitan formato de texto.",
  );
  logOk("Los índices de TEXT_COLUMNS quedan intactos (las columnas nuevas son numéricas y van al final)");
}

function testTrophyCountsColumnStillWiredCompatible(): void {
  const backend = readText("apps-script/globalRankingBackend.gs");

  assertIncludes(backend, "JSON.stringify(entry.trophyCounts)", "La columna trophyCounts debe seguir escribiéndose como JSON, sin cambios de formato.");
  assertIncludes(backend, "trophyCountsToColumns_(entry.trophyCounts)", "toRow_ debe añadir las columnas nuevas a partir del mismo trophyCounts, no de datos distintos.");
  logOk("La columna trophyCounts (JSON) se mantiene sin cambios; las columnas nuevas son una vista derivada");
}

function testClientFacingResponseUnchanged(): void {
  const backend = readText("apps-script/globalRankingBackend.gs");
  const rowToEntryMatch = /function rowToEntry_\(row\) \{[\s\S]*?\n\}/.exec(backend);
  assert(rowToEntryMatch !== null, "Debe existir rowToEntry_.");

  const body = rowToEntryMatch[0];
  assert(!body.includes("championsTitles"), "rowToEntry_ (lo que se devuelve al cliente) no debe exponer las columnas nuevas: el formato de red no cambia en esta fase.");
  assert(!body.includes("row[15]") && !body.includes("row[16]"), "rowToEntry_ no debe leer las columnas nuevas (índices 15+).");
  logOk("El JSON que recibe el cliente (rowToEntry_) no cambia: sigue exponiendo exactamente los mismos campos que antes");
}

function testMigrationHelperExistsAndIsAdditiveOnly(): void {
  const backend = readText("apps-script/globalRankingBackend.gs");
  const migrationMatch = /function migrateExistingTrophyColumns_\(\) \{[\s\S]*?\n\}/.exec(backend);
  assert(migrationMatch !== null, "Debe existir migrateExistingTrophyColumns_ para rellenar filas ya existentes.");

  const body = migrationMatch[0];
  assert(body.includes("trophyColumnIndex"), "La migración debe leer la columna trophyCounts existente como fuente.");
  assert(body.includes("firstNewColumn"), "La migración debe escribir solo a partir de la primera columna nueva.");
  assert(!body.includes(".setValue(") || body.includes("setValues(rows)"), "La migración debe escribir con setValues sobre el rango nuevo, no sobrescribir celdas sueltas fuera de rango.");
  logOk("migrateExistingTrophyColumns_ existe, lee de trophyCounts y escribe solo en las columnas nuevas");
}

function testScoringFormulaUntouched(): void {
  const backend = readText("apps-script/globalRankingBackend.gs");
  const pointsMatch = /const PALMARES_POINTS = \{[\s\S]*?\};/.exec(backend);
  assert(pointsMatch !== null, "Debe existir el objeto PALMARES_POINTS.");

  const points = pointsMatch[0];
  ["champions: 10,", "liga: 8,", "europaLeague: 6,", "copa: 5,", "conference: 4,", "supercopa: 2,"].forEach((line) => {
    assertIncludes(points, line, `PALMARES_POINTS no debe modificarse en una fase de migración de almacenamiento: falta "${line}".`);
  });
  assertIncludes(backend, "function computeScores_(completedSeasons, trophyCounts) {", "computeScores_ debe seguir existiendo sin cambios de firma.");
  logOk("La fórmula de puntuación (PALMARES_POINTS/computeScores_) no se toca en esta fase");
}

function testDocsDescribeManualDeploySteps(): void {
  const docs = readText("docs/v0_24_5b_BACKEND_RANKING_MIGRATION.md");

  assertIncludes(docs, "migrateExistingTrophyColumns_", "La documentación debe explicar cómo ejecutar la migración de un solo uso.");
  assertIncludes(docs, "manual", "La documentación debe dejar claro que el despliegue/migración en Apps Script es un paso manual del usuario.");
  logOk("La documentación explica el paso manual de despliegue y migración en Apps Script");
}

function testQaRegisteredInPackageAndWorkflow(): void {
  const packageJson = JSON.parse(readText("package.json")) as { scripts?: Record<string, string> };
  const scripts = packageJson.scripts ?? {};
  const workflow = readText(".github/workflows/deploy.yml");

  assert(Boolean(scripts["qa:global-ranking-backend-migration"]), "Debe existir qa:global-ranking-backend-migration en package.json.");
  assert(Boolean(scripts["qa:tech-debt"]?.includes("qa:global-ranking-backend-migration")), "qa:tech-debt debe incluir qa:global-ranking-backend-migration.");
  assertIncludes(workflow, "Run global ranking backend migration QA", "GitHub Actions debe ejecutar la QA de migración del backend de ranking.");
  assertIncludes(workflow, "npm run qa:global-ranking-backend-migration", "deploy.yml debe lanzar qa:global-ranking-backend-migration.");
  logOk("QA de migración del backend de ranking registrada en package.json y deploy.yml");
}

console.log("QA Global Ranking Backend Migration");
testNewColumnsAppendedAfterExistingHeaders();
testHiddenRowsAreFilteredOut();
testTextColumnIndicesUnchanged();
testTrophyCountsColumnStillWiredCompatible();
testClientFacingResponseUnchanged();
testMigrationHelperExistsAndIsAdditiveOnly();
testScoringFormulaUntouched();
testDocsDescribeManualDeploySteps();
testQaRegisteredInPackageAndWorkflow();
console.log("QA global ranking backend migration OK");
