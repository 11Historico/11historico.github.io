import { readFileSync } from "node:fs";
import { test, type Page } from "@playwright/test";
import { seedRandomness } from "./seedRandomness";

// Genera las capturas del README en docs/screenshots (v0.25.66). No forma parte de las pruebas:
// solo se ejecuta con README_SCREENSHOTS=1 (ver docs/v0_25_66_README_SCREENSHOTS.md).
const DIR = "docs/screenshots";

test.skip(!process.env.README_SCREENSHOTS, "Solo para regenerar las capturas del README.");
const SAVE_KEY = "once_historico_zurigorri_saved_game_v1";
const strong = readFileSync(new URL("./fixtures/career-strong.json", import.meta.url), "utf8");

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${DIR}/${name}.jpg`, type: "jpeg", quality: 82 });
}

test.use({ viewport: { width: 1280, height: 800 } });

test("captura portada y draft", async ({ page }) => {
  await seedRandomness(page, 3);
  await page.goto("/");
  await page.waitForTimeout(800);
  await shot(page, "portada");

  await page.getByRole("button", { name: /Jugar carrera/ }).click();
  await page.getByRole("button", { name: /Empezar carrera/ }).click();
  await page.getByRole("button", { name: "Elegir formación" }).first().click();
  await page.getByRole("button", { name: /Empezar ronda 1/i }).click({ timeout: 15_000 });
  await page.waitForTimeout(1200);
  await shot(page, "draft");
});

test("captura liga y temporada superada", async ({ page }) => {
  test.setTimeout(240_000);
  await seedRandomness(page, 2);
  await page.goto("/");
  await page.evaluate(([k, v]) => window.localStorage.setItem(k, v), [SAVE_KEY, strong]);
  await page.reload();
  await page.getByRole("button", { name: "Continuar" }).click();

  // Media temporada en automático y parada con el último partido ya terminado.
  await page.getByRole("button", { name: /^Simular$/ }).click();
  const stop = page.getByRole("button", { name: "Parar simulación" });
  for (let i = 0; i < 120; i += 1) {
    const wheel = page.locator(".season-wheel-overlay");
    if (await wheel.isVisible()) await wheel.getByRole("button", { name: "No jugar" }).click();
    const text = await page.locator(".league-actions-card").innerText().catch(() => "");
    if (/Jornada (1[4-9]|2\d)/.test(text) && (await stop.isVisible())) break;
    for (const name of [/^Seguir igual$/, /^Simular$/, /^Simular partido de Copa$/, /^Continuar temporada$/]) {
      const button = page.getByRole("button", { name }).first();
      if (await button.isVisible()) await button.click();
    }
    await page.waitForTimeout(500);
  }
  if (await stop.isVisible()) await stop.click();
  await page.locator(".match-sequence-skip").waitFor({ state: "detached", timeout: 20_000 }).catch(() => undefined);
  await page.waitForTimeout(600);
  await page.locator(".league-actions-card").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -16));
  await shot(page, "liga");

  // Hasta el final de la temporada.
  const survived = page.getByRole("heading", { name: "Temporada superada", exact: true });
  for (let i = 0; i < 400 && !(await survived.isVisible()); i += 1) {
    const wheel = page.locator(".season-wheel-overlay");
    if (await wheel.isVisible()) {
      await wheel.getByRole("button", { name: "No jugar" }).click();
      continue;
    }
    for (const name of [/^Seguir igual$/, /^Saltar$/, /^Continuar$/, /^Continuar temporada$/, /^Simular partido de Copa$/, /^Simular Copa y terminar temporada$/, /^Saltar hasta próximo evento$/]) {
      const button = page.getByRole("button", { name }).first();
      if ((await button.count()) > 0 && (await button.isVisible()) && (await button.isEnabled())) {
        await button.click();
        break;
      }
    }
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await shot(page, "temporada-superada");
});
