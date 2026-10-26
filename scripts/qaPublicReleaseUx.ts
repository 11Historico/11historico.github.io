import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`QA Public Release UX failed: ${message}`);
  }
}

function assertIncludes(source: string, expected: string, context: string): void {
  assert(source.includes(expected), `${context} missing ${JSON.stringify(expected)}`);
}

function testHomeExplainsGameInTenSeconds(): void {
  const home = read("src/components/GameHome.tsx");

  assertIncludes(home, "Construye tu once histórico y sobrevive temporada a temporada", "home hero");
  assertIncludes(home, "Elige jugadores históricos", "public pillars");
  assertIncludes(home, "Compite en Liga, Copa y Europa", "public pillars");
  assertIncludes(home, "Gana títulos y entra al ranking", "public pillars");
  assertIncludes(home, "Jugar carrera", "primary CTA");
  assertIncludes(home, "Cómo funciona", "how to play CTA");
  assertIncludes(home, "Ver ranking", "ranking CTA");
}

function testHowToPlayExplainsObjectiveAndLoop(): void {
  const home = read("src/components/GameHome.tsx");

  assertIncludes(home, "Clasifícate para Europa o gana la Copa del Rey", "how to play objective");
  assertIncludes(home, "Game Over", "how to play failure state");
  assertIncludes(home, "Si sobrevives", "how to play survival loop");
  assertIncludes(home, "Palmarés", "how to play palmares");
  assertIncludes(home, "Champions, Europa League y Conference", "how to play european scope");
  assertIncludes(home, "entre los 5 primeros de Liga", "how to play copa reassignment");
  const indexHtml = read("index.html");
  assertIncludes(indexHtml, '<link rel="manifest" href="/manifest.webmanifest" />', "manifiesto web enlazado");
  const manifest = JSON.parse(read("public/manifest.webmanifest"));
  assertIncludes(JSON.stringify(manifest.icons), "icon-512.png", "manifiesto con icono 512");
  assertIncludes(JSON.stringify(manifest.icons), "icon-192.png", "manifiesto con icono 192");
}

function testPublicUxStylesExist(): void {
  const css = read("src/components/GameHome.css");

  assertIncludes(css, ".game-home-public-pillars", "public home styles");
  assertIncludes(css, ".how-to-play-card", "how to play styles");
  assertIncludes(css, "@media (max-width: 620px)", "mobile public home styles");
}

function testScriptsAndWorkflowAreRegistered(): void {
  const packageJson = read("package.json");

  assertIncludes(packageJson, "qa:public-release-ux", "package scripts");
  assertIncludes(packageJson, "npm run qa:public-release-ux", "qa:tech-debt chain");
  assertIncludes(read("scripts/runQaSuite.mjs"), "qaPublicReleaseUx", "runQaSuite debe ejecutar qaPublicReleaseUx.");
  assertIncludes(read("scripts/runQaSuite.mjs"), "qaPublicReleaseUx", "runQaSuite debe ejecutar qaPublicReleaseUx.");
}

function testDocsExist(): void {
  assert(existsSync(join(root, "docs/v0_24_8_PUBLIC_RELEASE_UX_HARDENING.md")), "phase doc missing");
  assert(existsSync(join(root, "docs/MANUAL_QA_PUBLIC_RELEASE.md")), "manual QA doc missing");

  const phaseDoc = read("docs/v0_24_8_PUBLIC_RELEASE_UX_HARDENING.md");
  const manualQa = read("docs/MANUAL_QA_PUBLIC_RELEASE.md");

  assertIncludes(phaseDoc, "Public Release UX Hardening", "phase doc");
  assertIncludes(phaseDoc, "No cambia balance", "phase doc scope");
  assertIncludes(manualQa, "Carrera completa", "manual QA checklist");
  assertIncludes(manualQa, "móvil", "manual QA checklist");
}

function run(): void {
  testHomeExplainsGameInTenSeconds();
  testHowToPlayExplainsObjectiveAndLoop();
  testPublicUxStylesExist();
  testScriptsAndWorkflowAreRegistered();
  testDocsExist();

  console.log("QA Public Release UX OK");
}

run();
