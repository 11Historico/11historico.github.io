import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { APP_STATUS, APP_VERSION, APP_VERSION_NAME, CURRENT_RELEASE_DOC, CURRENT_RELEASE_TAG } from "../src/config/appVersion";

const ROOT = process.cwd();
const CURRENT_PUBLIC_VERSION = APP_VERSION;
const REAL_APPS_SCRIPT_ID_PATTERN = /AKfycb[a-zA-Z0-9_-]{20,}/;
const LOCAL_ENV_FILES = [".env", ".env.local", ".env.development.local", ".env.production.local"];
const TEXT_FILE_EXTENSIONS = new Set([
  ".css",
  ".env",
  ".gs",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".txt",
  ".yml",
  ".yaml",
]);

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

function walkTextFiles(dir: string, results: string[] = []): string[] {
  const fullDir = join(ROOT, dir);

  if (!existsSync(fullDir)) {
    return results;
  }

  for (const item of readdirSync(fullDir)) {
    const fullPath = join(fullDir, item);
    const relativePath = relative(ROOT, fullPath).replace(/\\/g, "/");
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if ([".git", ".audit-dist", "node_modules"].includes(item)) {
        continue;
      }
      walkTextFiles(relativePath, results);
      continue;
    }

    const extension = item.includes(".") ? item.slice(item.lastIndexOf(".")) : "";
    if (TEXT_FILE_EXTENSIONS.has(extension)) {
      results.push(relativePath);
    }
  }

  return results;
}

function testReleaseVersionMetadata(): void {
  assert(APP_VERSION === CURRENT_PUBLIC_VERSION, `APP_VERSION debe ser ${CURRENT_PUBLIC_VERSION}, pero es ${APP_VERSION}.`);
  assert(APP_VERSION_NAME === "Stable Public Release", `APP_VERSION_NAME inesperado: ${APP_VERSION_NAME}.`);
  assert(APP_STATUS.includes("Europa Career") && APP_STATUS.includes("palmarés"), "APP_STATUS debe describir el estado completo de Europa Career.");
  logOk("appVersion.ts apunta a la fase actual");
}

function testLocalEnvIsProtected(): void {
  const gitignore = readText(".gitignore");

  assert(gitignore.includes(".env"), ".gitignore debe proteger .env.");
  assert(gitignore.includes(".env.local"), ".gitignore debe proteger .env.local.");
  assert(
    gitignore.includes(".env.*.local") || gitignore.includes(".env.development.local"),
    ".gitignore debe proteger .env.development.local mediante patrón o entrada explícita.",
  );

  logOk("archivos .env locales protegidos por .gitignore");
}

function testNoRealEndpointLeakInTrackedText(): void {
  const scannedFiles = walkTextFiles(".").filter((path) => !path.startsWith("dist/assets/") && !path.startsWith("patch_files/"));

  for (const path of scannedFiles) {
    if (LOCAL_ENV_FILES.includes(path)) {
      continue;
    }

    const content = readText(path);
    assert(!REAL_APPS_SCRIPT_ID_PATTERN.test(content), `Posible endpoint real de Apps Script filtrado en ${path}.`);
  }

  logOk("no hay Deployment ID real de Apps Script filtrado en fuentes/docs");
}

function testGlobalRankingDocsAreSafe(): void {
  const setupDoc = readText("docs/GLOBAL_RANKING_APPS_SCRIPT_SETUP.md");

  assert(setupDoc.includes("/exec"), "La guía de Apps Script debe insistir en usar URL /exec.");
  assert(setupDoc.includes(".env.local"), "La guía debe documentar .env.local.");
  assert(setupDoc.includes("no se debe subir") || setupDoc.includes("no se sube"), "La guía debe advertir que .env.local no se debe subir.");
  assert(!REAL_APPS_SCRIPT_ID_PATTERN.test(setupDoc), "La guía no debe contener un Deployment ID real.");
  logOk("guía Apps Script segura para release");
}

function testReleaseDocsArePresent(): void {
  const changelog = readText("CHANGELOG.md").replace(/\r\n/g, "\n");
  const readme = readText("README.md");

  assert(changelog.startsWith(`# Changelog\n\n## ${APP_VERSION}`), `CHANGELOG debe empezar por ${APP_VERSION}.`);
  assert(readme.includes(`Versión pública actual: \`${CURRENT_RELEASE_TAG}\`.`), `README debe apuntar a ${CURRENT_RELEASE_TAG}.`);
  assert(existsSync(join(ROOT, CURRENT_RELEASE_DOC)), `Debe existir ${CURRENT_RELEASE_DOC}.`);
  logOk(`README, CHANGELOG y doc de release apuntan a ${APP_VERSION}`);
}

function testCriticalQaScriptsRemainRegistered(): void {
  const packageJson = JSON.parse(readText("package.json")) as { scripts?: Record<string, string> };
  const scripts = packageJson.scripts ?? {};

  for (const scriptName of [
    "qa:version",
    "qa:release-stabilization",
    "qa:agentjacking",
    "qa:tech-debt",
    "qa:formation-reward",
    "qa:career-ranking",
    "qa:global-ranking",
    "qa:global-ranking-ui",
    "qa:global-ranking-real",
    "qa:team-power",
    "qa:season-luck-wheel",
    "qa:season-luck-wheel-ui",
  ]) {
    assert(scripts[scriptName], `Debe existir script ${scriptName}.`);
  }

  assert(scripts["qa:tech-debt"]?.includes("qa:release-stabilization"), "qa:tech-debt debe incluir qa:release-stabilization.");
  assert(scripts["qa:tech-debt"]?.includes("qa:agentjacking"), "qa:tech-debt debe incluir qa:agentjacking.");
  assert(scripts["qa:tech-debt"]?.includes("qa:season-luck-wheel") && scripts["qa:tech-debt"]?.includes("qa:season-luck-wheel-ui"), "qa:tech-debt debe incluir qa:season-luck-wheel y qa:season-luck-wheel-ui.");
  logOk("scripts QA críticos siguen registrados");
}

function testDistDoesNotEmbedRealEndpoint(): void {
  if (!existsSync(join(ROOT, "dist"))) {
    logOk("dist no existe en esta copia; se omitió comprobación de endpoint embebido");
    return;
  }

  for (const path of walkTextFiles("dist")) {
    const content = readText(path);
    assert(!REAL_APPS_SCRIPT_ID_PATTERN.test(content), `dist contiene un Deployment ID real en ${path}.`);
  }

  logOk("dist no contiene endpoint real embebido");
}

console.log("QA Release Stabilization");

testReleaseVersionMetadata();
testLocalEnvIsProtected();
testNoRealEndpointLeakInTrackedText();
testGlobalRankingDocsAreSafe();
testReleaseDocsArePresent();
testCriticalQaScriptsRemainRegistered();
testDistDoesNotEmbedRealEndpoint();

console.log("QA release stabilization OK");
