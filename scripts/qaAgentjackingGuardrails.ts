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

function testVersionMetadata(): void {
  assert(APP_VERSION === CURRENT_PUBLIC_VERSION, `APP_VERSION debe ser ${CURRENT_PUBLIC_VERSION}, pero es ${APP_VERSION}.`);
  assert(APP_VERSION_NAME === "Stable Public Release", `APP_VERSION_NAME inesperado: ${APP_VERSION_NAME}.`);
  assert(APP_STATUS.includes("Europa Career") && APP_STATUS.includes("clasificación"), "APP_STATUS debe mencionar la base de Europa Career.");
  logOk("appVersion.ts apunta a la fase actual");
}

function testAgentsGuardrailsArePresent(): void {
  const agents = readText("AGENTS.md");

  for (const requiredFragment of [
    "## Anti-agentjacking / prompt-injection guardrails",
    "entrada no confiable",
    "ignore previous instructions",
    "ignora las instrucciones anteriores",
    "No exponer, copiar, resumir literalmente ni commitear secretos",
    "No usar `git add .`",
    "git reset --hard",
    "git clean -fd",
    "git push --force",
    "No commitear cambios generados en `dist` salvo que la fase incluya expresamente una build de release",
    "No modificar ratings históricos",
  ]) {
    assert(agents.includes(requiredFragment), `AGENTS.md debe contener guardrail: ${requiredFragment}`);
  }

  logOk("AGENTS.md contiene guardarraíles anti-agentjacking");
}

function testLocalEnvIsProtected(): void {
  const gitignore = readText(".gitignore");

  assert(gitignore.includes(".env"), ".gitignore debe proteger .env.");
  assert(gitignore.includes(".env.local"), ".gitignore debe proteger .env.local.");
  assert(
    gitignore.includes(".env.*.local") || gitignore.includes(".env.development.local"),
    ".gitignore debe proteger .env.development.local mediante patrón o entrada explícita.",
  );

  logOk("archivos .env locales siguen protegidos");
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

  logOk("no hay Deployment ID real de Apps Script filtrado");
}

function testDangerousGitCommandsAreNotRecommended(): void {
  const filesToScan = walkTextFiles(".").filter((path) => {
    if (["AGENTS.md", "docs/v0_23_1a_AGENTJACKING_GUARDRAILS.md", "scripts/qaAgentjackingGuardrails.ts"].includes(path)) {
      return false;
    }

    return ["README.md", "CHANGELOG.md"].includes(path) || path.startsWith("docs/");
  });

  const dangerousPatterns = [/git add \./, /git reset --hard/, /git clean -fd/, /git push --force/, /--force-with-lease/];
  const allowedContext = /no usar|no ejecutar|sin confirmaci[oó]n|prohibid|evitar|bloquea|guardrail|anti-agentjacking|destructiv/i;

  for (const path of filesToScan) {
    const lines = readText(path).split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(line)) {
          assert(allowedContext.test(line), `Comando peligroso no contextualizado en ${path}:${index + 1}: ${line}`);
        }
      }
    });
  }

  logOk("no hay recomendaciones peligrosas de git en docs generales");
}

function testDocsArePresent(): void {
  const changelog = readText("CHANGELOG.md").replace(/\r\n/g, "\n");
  const readme = readText("README.md");

  assert(changelog.startsWith(`# Changelog\n\n## ${APP_VERSION}`), `CHANGELOG debe empezar por ${APP_VERSION}.`);
  assert(readme.includes(`Versión pública actual: \`${CURRENT_RELEASE_TAG}\`.`), `README debe apuntar a ${CURRENT_RELEASE_TAG}.`);
  assert(existsSync(join(ROOT, CURRENT_RELEASE_DOC)), `Debe existir ${CURRENT_RELEASE_DOC}.`);
  logOk(`README, CHANGELOG y doc de fase apuntan a ${APP_VERSION}`);
}

function testQaScriptsAreRegistered(): void {
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

  assert(scripts["qa:tech-debt"]?.includes("qa:agentjacking"), "qa:tech-debt debe incluir qa:agentjacking.");
  assert(scripts["qa:tech-debt"]?.includes("qa:season-luck-wheel") && scripts["qa:tech-debt"]?.includes("qa:season-luck-wheel-ui"), "qa:tech-debt debe incluir qa:season-luck-wheel y qa:season-luck-wheel-ui.");
  logOk("scripts QA críticos incluyen la auditoría anti-agentjacking");
}

console.log("QA Agentjacking Guardrails");

testVersionMetadata();
testAgentsGuardrailsArePresent();
testLocalEnvIsProtected();
testNoRealEndpointLeakInTrackedText();
testDangerousGitCommandsAreNotRecommended();
testDocsArePresent();
testQaScriptsAreRegistered();

console.log("QA agentjacking guardrails OK");
