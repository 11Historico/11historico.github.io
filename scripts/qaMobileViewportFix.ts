import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
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
const CURRENT_PACKAGE_VERSION = "0.25.21";

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

function walkFiles(dir: string, predicate: (path: string) => boolean, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      walkFiles(fullPath, predicate, out);
      continue;
    }

    if (predicate(fullPath)) {
      out.push(fullPath);
    }
  }

  return out;
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
  logOk("versionado móvil alineado");
}

function testScripts(): void {
  const packageJson = readJson<PackageJson>("package.json");
  const scripts = packageJson.scripts ?? {};

  assert(scripts["qa:mobile-viewport"]?.includes("qaMobileViewportFix.ts"), "Debe existir qa:mobile-viewport.");
  assert(scripts["qa:tech-debt"]?.includes("qa:mobile-viewport"), "qa:tech-debt debe incluir qa:mobile-viewport.");
  logOk("QA móvil registrada en scripts");
}

function testCssViewportFallbacks(): void {
  const cssFiles = walkFiles(join(ROOT, "src"), (path) => path.endsWith(".css"));
  const filesUsingClassicViewport: string[] = [];
  const missingDynamicFallbacks: string[] = [];

  for (const filePath of cssFiles) {
    const text = readFileSync(filePath, "utf8");

    if (!text.includes("100vh")) {
      continue;
    }

    filesUsingClassicViewport.push(relative(ROOT, filePath));
    const lines = text.split(/\r?\n/);

    lines.forEach((line, index) => {
      if (!line.includes("100vh") || line.includes("100dvh")) {
        return;
      }

      const nextLine = lines[index + 1] ?? "";
      const property = line.split(":")[0]?.trim();
      const nextProperty = nextLine.split(":")[0]?.trim();

      if (!nextLine.includes("100dvh") || property !== nextProperty) {
        missingDynamicFallbacks.push(`${relative(ROOT, filePath)}:${index + 1}: ${line.trim()}`);
      }
    });
  }

  assert(filesUsingClassicViewport.length >= 15, "La QA debe auditar los CSS que usaban 100vh en la auditoría móvil.");
  assert(missingDynamicFallbacks.length === 0, `Hay reglas 100vh sin fallback 100dvh:\n${missingDynamicFallbacks.join("\n")}`);
  logOk("todas las reglas 100vh conservan fallback y añaden 100dvh");
}

function testDeployWorkflow(): void {
  const workflow = readText(".github/workflows/deploy.yml");

  assert(workflow.includes("run: npm run qa:mobile-viewport"), "deploy.yml debe ejecutar qa:mobile-viewport antes del build.");
  assert(workflow.indexOf("run: npm run qa:mobile-viewport") < workflow.indexOf("run: npm run build"), "qa:mobile-viewport debe ejecutarse antes del build.");
  logOk("workflow ejecuta QA móvil antes del build");
}

function testDocs(): void {
  const changelog = readText("CHANGELOG.md").replace(/\r\n/g, "\n");
  const readme = readText("README.md");

  assert(changelog.startsWith(`# Changelog\n\n## ${APP_VERSION}`), `CHANGELOG debe empezar por ${APP_VERSION}.`);
  assert(readme.includes(`Versión pública actual: \`${CURRENT_RELEASE_TAG}\`.`), `README debe apuntar a ${CURRENT_RELEASE_TAG}.`);
  assert(existsSync(join(ROOT, CURRENT_RELEASE_DOC)), `Debe existir ${CURRENT_RELEASE_DOC}.`);
  logOk("documentación de viewport móvil alineada");
}

console.log("QA Mobile Viewport Fix");

testVersionMetadata();
testScripts();
testCssViewportFallbacks();
testDeployWorkflow();
testDocs();

console.log("QA mobile viewport fix OK");
