// scripts/qaEuropeanProgressUi.ts
// QA de v0.24.2b: panel de progreso europeo consultivo.

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function assertIncludes(haystack: string, needle: string, message: string): void {
  assert(haystack.includes(needle), message);
}

function testEuropeanProgressPanelComponent(): void {
  const component = read("src/components/EuropeanProgressPanel.tsx");
  const css = read("src/components/EuropeanProgressPanel.css");

  assertIncludes(component, "EuropeanProgressPanel", "Debe existir el componente EuropeanProgressPanel.");
  assertIncludes(component, "getEuropeanTournamentSummary", "El panel debe reutilizar el resumen del torneo europeo.");
  assertIncludes(component, "Panel europeo", "El panel debe rotularse como panel europeo consultivo.");
  assertIncludes(component, "Métricas europeas", "El panel debe exponer métricas europeas.");
  assertIncludes(component, "Calendario europeo", "El panel debe exponer calendario europeo.");
  assertIncludes(component, "Próxima noche europea", "El panel debe destacar el próximo partido europeo.");
  assertIncludes(component, "Objetivo fase inicial", "El panel debe explicar el objetivo de fase inicial.");
  assertIncludes(component, "primeros para entrar en semifinales", "El panel debe mostrar la regla de acceso a semifinales (2 primeros).");
  assertIncludes(component, "champion", "El panel debe distinguir campeón pendiente de palmarés.");
  assertIncludes(component, "currentMatchId", "El panel debe marcar el partido europeo actual.");

  assertIncludes(css, ".european-progress-panel", "El CSS debe definir el contenedor del panel europeo.");
  assertIncludes(css, ".european-progress-kpis", "El CSS debe definir KPIs europeos.");
  assertIncludes(css, ".european-progress-calendar", "El CSS debe definir calendario europeo.");
  assertIncludes(css, ".european-progress-match-current", "El CSS debe destacar el partido actual.");
  assertIncludes(css, "@media (max-width: 560px)", "El panel debe tener responsive móvil.");
}

function testEuropeanMatchEventIntegration(): void {
  const event = read("src/components/EuropeanMatchEvent.tsx");

  assertIncludes(event, "EuropeanProgressPanel", "EuropeanMatchEvent debe integrar el panel de progreso europeo.");
  assertIncludes(event, "currentMatchId={match.id}", "EuropeanMatchEvent debe marcar el partido europeo visible como actual.");
  assertIncludes(event, "European UI Matchday View (v0.24.2a) + European Progress UI (v0.24.2b)", "EuropeanMatchEvent debe documentar la extensión v0.24.2b.");
}

function testQaRegistry(): void {
  const packageJson = read("package.json");
  const workflow = read(".github/workflows/deploy.yml");

  assertIncludes(packageJson, "qa:european-progress-ui", "package.json debe registrar qa:european-progress-ui.");
  assertIncludes(packageJson, "qa:european-matchday-ui && npm run qa:european-progress-ui", "qa:tech-debt debe ejecutar qa:european-progress-ui después de matchday UI.");
  assertIncludes(workflow, "pull_request", "GitHub Actions debe validar pull requests para trabajar sin local.");
  assertIncludes(read("scripts/runQaSuite.mjs"), "qaEuropeanProgressUi", "runQaSuite debe ejecutar qaEuropeanProgressUi.");
  assertIncludes(read("scripts/runQaSuite.mjs"), "qaEuropeanProgressUi", "runQaSuite debe ejecutar qaEuropeanProgressUi.");
}

console.log("QA European Progress UI");
testEuropeanProgressPanelComponent();
console.log("✓ EuropeanProgressPanel muestra fase, objetivos, KPIs, calendario y próximo partido");
testEuropeanMatchEventIntegration();
console.log("✓ EuropeanMatchEvent integra el panel de progreso europeo");
testQaRegistry();
console.log("✓ QA registrada en package.json y GitHub Actions con pull_request");
console.log("QA european progress UI OK");
