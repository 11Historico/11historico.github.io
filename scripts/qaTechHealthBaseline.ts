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
  assert(packageJson.version === "0.25.14", `package.json debe usar 0.25.14, pero usa ${packageJson.version}.`);
  assert(packageLock.version === packageJson.version, "package-lock.json version debe coincidir con package.json.");
  assert(packageLock.packages?.[""]?.version === packageJson.version, "package-lock raíz debe coincidir con package.json.");
  logOk("versionado técnico alineado");
}

function testScripts(): void {
  const packageJson = readJson<PackageJson>("package.json");
  const scripts = packageJson.scripts ?? {};

  assert(scripts.typecheck === "tsc -b", "Debe existir script typecheck con tsc -b.");
  assert(scripts.build === "npm run typecheck && vite build", "build debe ejecutar typecheck antes de Vite.");
  assert(scripts["lint:src"] === "eslint src scripts", "Debe existir lint:src focalizado en código vivo.");
  assert(scripts["qa:tech-health-baseline"]?.includes("qaTechHealthBaseline.ts"), "Debe existir qa:tech-health-baseline.");
  assert(scripts["qa:tech-debt"]?.includes("qa:tech-health-baseline"), "qa:tech-debt debe incluir qa:tech-health-baseline.");
  logOk("scripts de CI/calidad registrados");
}

function testDeployWorkflow(): void {
  const workflow = readText(".github/workflows/deploy.yml");

  assert(workflow.includes("node-version: 24"), "deploy.yml debe usar Node 24.");
  assert(workflow.includes("run: npm run typecheck"), "deploy.yml debe ejecutar typecheck.");
  assert(workflow.includes("run: npm run qa:tech-health-baseline"), "deploy.yml debe ejecutar QA técnica baseline.");
  assert(workflow.includes("run: npm run build"), "deploy.yml debe conservar el build.");
  assert(workflow.indexOf("run: npm run typecheck") < workflow.indexOf("run: npm run build"), "typecheck debe ejecutarse antes del build.");
  logOk("workflow de GitHub Pages reforzado");
}

function testEslintIgnores(): void {
  const eslintConfig = readText("eslint.config.js");
  const requiredFragments = [
    "dist/**",
    ".audit-dist/**",
    "reports/**",
    "patch_files/**",
    "**/*_FIXED.ts",
    "**/*.backup_*",
    "src/**/*.{ts,tsx}",
    "scripts/**/*.ts",
  ];

  for (const fragment of requiredFragments) {
    assert(eslintConfig.includes(fragment), `eslint.config.js debe incluir ${fragment}.`);
  }

  logOk("ESLint ignora ruido histórico/temporal y apunta a código vivo");
}

function testGitignore(): void {
  const gitignore = readText(".gitignore");

  assert(gitignore.includes(".env.local"), ".gitignore debe proteger .env.local.");
  assert(gitignore.includes(".audit-dist/"), ".gitignore debe proteger .audit-dist/.");
  assert(gitignore.includes("Auditoria_*.docx"), ".gitignore debe proteger documentos locales de auditoría.");
  logOk(".gitignore protege secretos y artefactos locales");
}

function testDocs(): void {
  const changelog = readText("CHANGELOG.md").replace(/\r\n/g, "\n");
  const readme = readText("README.md");

  assert(changelog.startsWith(`# Changelog\n\n## ${APP_VERSION}`), `CHANGELOG debe empezar por ${APP_VERSION}.`);
  assert(readme.includes(`Versión pública actual: \`${CURRENT_RELEASE_TAG}\`.`), `README debe apuntar a ${CURRENT_RELEASE_TAG}.`);
  assert(existsSync(join(ROOT, CURRENT_RELEASE_DOC)), `Debe existir ${CURRENT_RELEASE_DOC}.`);
  logOk("documentación de fase alineada");
}

console.log("QA Tech Health Baseline");

testVersionMetadata();
testScripts();
testDeployWorkflow();
testEslintIgnores();
testGitignore();
testDocs();

console.log("QA tech health baseline OK");
