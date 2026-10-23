import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { APP_STATUS, APP_VERSION, APP_VERSION_NAME, CURRENT_RELEASE_DOC, CURRENT_RELEASE_TAG } from "../src/config/appVersion";

type PackageJson = {
  version?: string;
  scripts?: Record<string, string>;
};

type PackageLockJson = {
  version?: string;
  packages?: Record<string, { version?: string }>;
};

const ROOT = process.cwd();
const CURRENT_PUBLIC_VERSION = APP_VERSION;
const CURRENT_PACKAGE_VERSION = "0.25.15";
// Doc histórico de v0.24.2a (no el release actual): esta QA nació en esa
// fase y sigue comprobando que ese documento concreto siga describiendo la
// UI de jornada europea, independientemente de cuál sea la fase actual.
const MATCHDAY_UI_DOC = "docs/v0_24_2a_EUROPEAN_UI_MATCHDAY_VIEW.md";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function readText(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function readJson<T>(path: string): T {
  return JSON.parse(readText(path)) as T;
}

function testVersionMetadata(): void {
  const packageJson = readJson<PackageJson>("package.json");
  const packageLock = readJson<PackageLockJson>("package-lock.json");

  assert(APP_VERSION === CURRENT_PUBLIC_VERSION, `APP_VERSION debe ser ${CURRENT_PUBLIC_VERSION}, pero es ${APP_VERSION}.`);
  assert(APP_VERSION_NAME === "Stable Public Release", `APP_VERSION_NAME inesperado: ${APP_VERSION_NAME}.`);
  assert(APP_STATUS.includes("Europa Career") && APP_STATUS.includes("clasificación"), "APP_STATUS debe describir la base de Europa Career y su clasificación.");
  assert(packageJson.version === CURRENT_PACKAGE_VERSION, `package.json debe usar ${CURRENT_PACKAGE_VERSION}, pero usa ${packageJson.version}.`);
  assert(packageLock.version === packageJson.version, "package-lock.json version debe coincidir con package.json.");
  assert(packageLock.packages?.[""]?.version === packageJson.version, "package-lock raíz debe coincidir con package.json.");
  logOk("versionado de limpieza de hooks alineado");
}

function testScriptsAndWorkflow(): void {
  const packageJson = readJson<PackageJson>("package.json");
  const scripts = packageJson.scripts ?? {};
  const workflow = readText(".github/workflows/deploy.yml");

  assert(scripts["lint:src"] === "eslint src scripts", "Debe existir lint:src sobre código vivo.");
  assert(scripts["qa:hooks-simulation-deps"]?.includes("qaHooksSimulationDeps.ts"), "Debe existir qa:hooks-simulation-deps.");
  assert(scripts["qa:tech-debt"]?.includes("qa:hooks-simulation-deps"), "qa:tech-debt debe incluir qa:hooks-simulation-deps.");
  assert(workflow.includes("run: npm run qa:hooks-simulation-deps"), "deploy.yml debe ejecutar qa:hooks-simulation-deps.");
  assert(workflow.includes("run: npm run lint:src"), "deploy.yml debe ejecutar lint:src.");
  assert(workflow.indexOf("run: npm run qa:hooks-simulation-deps") < workflow.indexOf("run: npm run build"), "qa:hooks-simulation-deps debe ejecutarse antes del build.");
  assert(workflow.indexOf("run: npm run lint:src") < workflow.indexOf("run: npm run build"), "lint:src debe ejecutarse antes del build.");
  logOk("scripts y workflow bloquean regresiones de hooks antes del deploy");
}

function testLeagueSimulatorHookDeps(): void {
  const source = readText("src/components/LeagueSimulatorView.tsx");

  assert(source.includes("useCallback"), "LeagueSimulatorView debe importar y usar useCallback.");
  assert(source.includes("const commitContext = useCallback"), "commitContext debe estar memoizado.");
  assert(source.includes("const maybeOfferSeasonLuckWheel = useCallback"), "maybeOfferSeasonLuckWheel debe estar memoizado.");
  assert(source.includes("const finishIfReady = useCallback"), "finishIfReady debe estar memoizado.");
  assert(source.includes("commitContext, context, effectiveTeamRating, finishIfReady, isAutoSimulating, isSequencePlaying, maybeOfferSeasonLuckWheel, pendingEuropeanMatch, playbackMultiplier, selectedPlayers"), "El efecto de auto-simulación debe declarar dependencias reales.");
  assert(!source.includes("setIsAutoSimulating(false);\n      return undefined;"), "El efecto de auto-simulación no debe hacer setState síncrono y salir.");
  logOk("LeagueSimulatorView declara dependencias reales y reduce closures obsoletos");
}

function testSetStateInEffectCleanups(): void {
  const coachRound = readText("src/components/CoachRound.tsx");
  const seasonReveal = readText("src/components/SeasonReveal.tsx");
  const finalSummary = readText("src/components/FinalSummary.tsx");
  const balanceAudit = readText("src/components/BalanceAuditPanel.tsx");
  const globalSubmit = readText("src/components/CareerGlobalSubmitPanel.tsx");

  assert(!coachRound.includes("setRevealedCount(0);"), "CoachRound no debe resetear revealedCount de forma síncrona dentro del efecto.");
  assert(!seasonReveal.includes("setRevealed(false);"), "SeasonReveal no debe resetear revealed de forma síncrona dentro del efecto.");
  assert(seasonReveal.includes("revealedSeason === finalSeason"), "SeasonReveal debe derivar revealed desde revealedSeason.");
  assert(!finalSummary.includes("const [history, setHistory]"), "FinalSummary no debe derivar history con setState dentro de useEffect.");
  assert(balanceAudit.includes("const runAudit = useCallback"), "BalanceAuditPanel debe memoizar runAudit.");
  assert(globalSubmit.includes("const endpointStatus = useMemo"), "CareerGlobalSubmitPanel debe agrupar estado derivado de endpoint.");
  logOk("limpiezas de set-state-in-effect aplicadas en componentes señalados");
}

function testDocs(): void {
  const changelog = readText("CHANGELOG.md").replace(/\r\n/g, "\n");
  const readme = readText("README.md");
  const matchdayDoc = readText(MATCHDAY_UI_DOC);

  assert(changelog.startsWith(`# Changelog\n\n## ${APP_VERSION}`), `CHANGELOG debe empezar por ${APP_VERSION}.`);
  assert(readme.includes(`Versión pública actual: \`${CURRENT_RELEASE_TAG}\`.`), `README debe apuntar a ${CURRENT_RELEASE_TAG}.`);
  assert(existsSync(join(ROOT, CURRENT_RELEASE_DOC)), `Debe existir ${CURRENT_RELEASE_DOC}.`);
  assert(
    matchdayDoc.includes("Europa") && matchdayDoc.includes("Noche europea") && matchdayDoc.includes("EuropeanMatchEvent"),
    `${MATCHDAY_UI_DOC} debe seguir explicando la UI de jornada europea.`,
  );
  logOk("documentación de fase alineada");
}

console.log("QA Hooks Simulation Deps");

testVersionMetadata();
testScriptsAndWorkflow();
testLeagueSimulatorHookDeps();
testSetStateInEffectCleanups();
testDocs();

console.log("QA hooks simulation deps OK");
