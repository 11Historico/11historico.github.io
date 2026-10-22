// scripts/qaP1LowCost.ts
// QA de v0.25.2: bloque P1 de bajo coste (idioma, vista previa en redes, Dependabot,
// nota de privacidad y foco visible).

import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function testHtmlLanguageAndSocialPreview(): void {
  const html = read("index.html");

  assert(html.includes('<html lang="es">'), "index.html debe declarar lang=\"es\".");
  assert(html.includes('property="og:image"') && html.includes("og-image.png"), "Debe existir og:image apuntando a og-image.png.");
  assert(html.includes('property="og:title"') && html.includes('property="og:description"'), "Debe existir og:title y og:description.");
  assert(html.includes('name="twitter:card" content="summary_large_image"'), "Debe existir twitter:card summary_large_image.");
  logOk("El HTML declara idioma español y vista previa para redes");
}

function testPreviewImageIsPng1200x630(): void {
  const bytes = readFileSync("public/og-image.png");
  const signature = bytes.subarray(0, 8).toString("hex");

  assert(signature === "89504e470d0a1a0a", "og-image.png debe ser un PNG válido.");
  assert(bytes.readUInt32BE(16) === 1200 && bytes.readUInt32BE(20) === 630, "og-image.png debe medir 1200×630.");
  logOk("La imagen de vista previa es PNG de 1200×630");
}

function testDependabotCoversNpmAndActions(): void {
  const config = read(".github/dependabot.yml");

  assert(config.includes('package-ecosystem: "npm"'), "Dependabot debe vigilar npm.");
  assert(config.includes('package-ecosystem: "github-actions"'), "Dependabot debe vigilar GitHub Actions.");
  logOk("Dependabot vigila dependencias npm y acciones de GitHub");
}

function testPrivacyPageExistsAndLinked(): void {
  const page = read("public/privacidad.html");
  const ranking = read("src/components/CareerGlobalRanking.tsx");

  assert(page.includes("Política de privacidad"), "La página de privacidad debe tener su título.");
  assert(page.includes("No usamos analítica"), "La página debe declarar que no hay analítica.");
  assert(page.includes("No pedimos correo electrónico"), "La página debe declarar qué datos no se piden.");
  assert(ranking.includes('href="privacidad.html"'), "El ranking global debe enlazar la política de privacidad.");
  logOk("La nota de privacidad existe y se enlaza desde el ranking global");
}

function testVisibleFocusIsGlobal(): void {
  const css = read("src/index.css");

  assert(css.includes(":focus-visible"), "index.css debe definir :focus-visible.");
  assert(/:focus-visible\s*\{[^}]*outline:\s*3px solid #ffe08a/.test(css), "El foco visible debe usar un contorno de 3px dorado.");
  logOk("El foco visible se aplica a todos los controles por teclado");
}

console.log("QA P1 Low Cost");
testHtmlLanguageAndSocialPreview();
testPreviewImageIsPng1200x630();
testDependabotCoversNpmAndActions();
testPrivacyPageExistsAndLinked();
testVisibleFocusIsGlobal();
console.log("QA P1 low cost OK");
