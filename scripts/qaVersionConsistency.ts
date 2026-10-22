import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { APP_STATUS, APP_VERSION, APP_VERSION_NAME, CURRENT_RELEASE_DOC, CURRENT_RELEASE_TAG } from "../src/config/appVersion";

type PackageJson = {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
};

type PackageLockJson = {
  name?: string;
  version?: string;
  packages?: Record<string, { version?: string }>;
};

const ROOT = process.cwd();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function getExpectedPackageVersion(appVersion: string): string {
  const match = /^v(?<base>\d+\.\d+\.\d+)(?<suffix>[a-z]\d*)?$/.exec(appVersion);
  assert(match?.groups?.base, `APP_VERSION no tiene formato esperado: ${appVersion}`);

  const { base, suffix } = match.groups;
  return suffix ? `${base}-${suffix}.0` : base;
}

function assertNoMojibake(label: string, value: string): void {
  assert(!/[�ÃÂ]/.test(value), `${label} contiene posible mojibake: ${value}`);
}

function testPackageVersionMatchesAppVersion(): void {
  const packageJson = readJson<PackageJson>(join(ROOT, "package.json"));
  const expectedPackageVersion = getExpectedPackageVersion(APP_VERSION);

  assert(packageJson.version === expectedPackageVersion, `package.json debe usar ${expectedPackageVersion}, pero usa ${packageJson.version}`);
  logOk("package.json versiona la fase pública actual");
}

function testPackageLockMatchesPackageJson(): void {
  const packageJson = readJson<PackageJson>(join(ROOT, "package.json"));
  const packageLock = readJson<PackageLockJson>(join(ROOT, "package-lock.json"));

  assert(packageLock.version === packageJson.version, "package-lock.json version debe coincidir con package.json.");
  assert(packageLock.packages?.[""]?.version === packageJson.version, "package-lock raíz debe coincidir con package.json.");
  logOk("package-lock.json está alineado con package.json");
}

function testAppVersionMetadata(): void {
  assert(APP_VERSION === "v0.25.7", `APP_VERSION debe ser v0.25.7, pero es ${APP_VERSION}`);
  assert(APP_VERSION_NAME.trim().length > 0, "APP_VERSION_NAME no puede estar vacío.");
  assert(APP_STATUS.trim().length > 0, "APP_STATUS no puede estar vacío.");
  assertNoMojibake("APP_VERSION_NAME", APP_VERSION_NAME);
  assertNoMojibake("APP_STATUS", APP_STATUS);
  logOk("appVersion.ts está auditado");
}

function testDocsMentionCurrentVersion(): void {
  const changelog = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8").replace(/\r\n/g, "\n");
  const readme = readFileSync(join(ROOT, "README.md"), "utf8");
  const releaseDocPath = join(ROOT, CURRENT_RELEASE_DOC);

  assert(changelog.startsWith(`# Changelog\n\n## ${APP_VERSION}`), `CHANGELOG debe empezar por ${APP_VERSION}.`);
  assert(readme.includes(`Versión pública actual: \`${CURRENT_RELEASE_TAG}\`.`), `README debe apuntar a ${CURRENT_RELEASE_TAG}.`);
  assert(existsSync(releaseDocPath), `Debe existir ${CURRENT_RELEASE_DOC}.`);
  logOk(`README, CHANGELOG y doc de fase apuntan a ${APP_VERSION}`);
}

function testQaScriptsAreRegistered(): void {
  const packageJson = readJson<PackageJson>(join(ROOT, "package.json"));

  assert(packageJson.scripts?.["qa:version"], "Debe existir script qa:version.");
  assert(packageJson.scripts?.["qa:tech-debt"], "Debe existir script qa:tech-debt.");
  assert(packageJson.scripts?.["qa:tech-health-baseline"], "Debe existir script qa:tech-health-baseline.");
  assert(packageJson.scripts?.["qa:release-stabilization"], "Debe existir script qa:release-stabilization.");
  assert(packageJson.scripts?.["qa:agentjacking"], "Debe existir script qa:agentjacking.");
  assert(packageJson.scripts?.["qa:formation-reward"], "Debe conservar qa:formation-reward.");
  assert(packageJson.scripts?.["qa:career-ranking"], "Debe conservar qa:career-ranking.");
  assert(packageJson.scripts?.["qa:global-ranking"], "Debe existir script qa:global-ranking.");
  assert(packageJson.scripts?.["qa:team-power"], "Debe existir script qa:team-power.");
  assert(packageJson.scripts?.["qa:global-ranking-real"], "Debe existir script qa:global-ranking-real.");
  assert(packageJson.scripts?.["qa:global-ranking-ui"], "Debe existir script qa:global-ranking-ui.");
  assert(packageJson.scripts?.["qa:season-luck-wheel"], "Debe existir script qa:season-luck-wheel.");
  assert(packageJson.scripts?.["qa:european-qualification"], "Debe existir script qa:european-qualification.");
  assert(packageJson.scripts?.["qa:european-qualification-ui"], "Debe existir script qa:european-qualification-ui.");
  assert(packageJson.scripts?.["qa:european-persistence"], "Debe existir script qa:european-persistence.");
  assert(packageJson.scripts?.["qa:european-tournament"], "Debe existir script qa:european-tournament.");
  assert(packageJson.scripts?.["qa:european-match-engine"], "Debe existir script qa:european-match-engine.");
  assert(packageJson.scripts?.["qa:european-calendar"], "Debe existir script qa:european-calendar.");
  assert(packageJson.scripts?.["qa:european-matchday-ui"], "Debe existir script qa:european-matchday-ui.");
  assert(packageJson.scripts?.["qa:european-progress-ui"], "Debe existir script qa:european-progress-ui.");
  assert(packageJson.scripts?.["qa:european-knockouts"], "Debe existir script qa:european-knockouts.");
  assert(packageJson.scripts?.["qa:european-trophies-palmares"], "Debe existir script qa:european-trophies-palmares.");
  assert(packageJson.scripts?.["qa:european-rewards-prestige"], "Debe existir script qa:european-rewards-prestige.");
  assert(packageJson.scripts?.["qa:european-balance"], "Debe existir script qa:european-balance.");
  assert(packageJson.scripts?.["qa:global-ranking-europa-fields"], "Debe existir script qa:global-ranking-europa-fields.");
  assert(packageJson.scripts?.["qa:global-ranking-backend-migration"], "Debe existir script qa:global-ranking-backend-migration.");
  assert(packageJson.scripts?.["qa:european-mobile-polish"], "Debe existir script qa:european-mobile-polish.");
  assert(packageJson.scripts?.["qa:european-visual-polish"], "Debe existir script qa:european-visual-polish.");
  assert(packageJson.scripts?.["qa:tech-debt"]?.includes("qa:tech-health-baseline"), "qa:tech-debt debe incluir qa:tech-health-baseline.");
  assert(packageJson.scripts?.["qa:tech-debt"]?.includes("qa:hooks-simulation-deps"), "qa:tech-debt debe incluir qa:hooks-simulation-deps.");
  assert(packageJson.scripts?.["qa:tech-debt"]?.includes("qa:agentjacking"), "qa:tech-debt debe incluir qa:agentjacking.");
  assert(packageJson.scripts?.["qa:tech-debt"]?.includes("qa:season-luck-wheel"), "qa:tech-debt debe incluir qa:season-luck-wheel.");
  assert(packageJson.scripts?.["qa:tech-debt"]?.includes("qa:european-qualification"), "qa:tech-debt debe incluir qa:european-qualification.");
  assert(packageJson.scripts?.["qa:tech-debt"]?.includes("qa:european-qualification-ui"), "qa:tech-debt debe incluir qa:european-qualification-ui.");
  assert(packageJson.scripts?.["qa:tech-debt"]?.includes("qa:european-persistence"), "qa:tech-debt debe incluir qa:european-persistence.");
  assert(packageJson.scripts?.["qa:tech-debt"]?.includes("qa:european-tournament"), "qa:tech-debt debe incluir qa:european-tournament.");
  assert(packageJson.scripts?.["qa:tech-debt"]?.includes("qa:european-match-engine"), "qa:tech-debt debe incluir qa:european-match-engine.");
  assert(packageJson.scripts?.["qa:tech-debt"]?.includes("qa:european-calendar"), "qa:tech-debt debe incluir qa:european-calendar.");
  logOk("scripts QA críticos registrados");
}

console.log("QA Version Consistency");

testAppVersionMetadata();
testPackageVersionMatchesAppVersion();
testPackageLockMatchesPackageJson();
testDocsMentionCurrentVersion();
testQaScriptsAreRegistered();

console.log("QA version consistency OK");
