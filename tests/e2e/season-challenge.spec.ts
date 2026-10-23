import { readFileSync } from "node:fs";
import { seedRandomness } from "./seedRandomness";
import { expect, test, type Page } from "@playwright/test";

// Partida guardada con equipo fuerte (npm run e2e:fixture): la temporada se supera.
const SAVE_KEY = "once_historico_zurigorri_saved_game_v1";
const fixture = readFileSync(new URL("./fixtures/career-strong.json", import.meta.url), "utf8");

const ADVANCE_BUTTONS = [
  /^Saltar$/,
  /^Continuar$/,
  /^Continuar temporada$/,
  /^Continuar carrera$/,
  /^No jugar$/,
  /^Simular partido de Copa$/,
  /^Simular Copa y terminar temporada$/,
  /^Saltar hasta próximo evento$/,
];

async function advanceOnce(page: Page): Promise<boolean> {
  const wheel = page.locator(".season-wheel-overlay");
  if (await wheel.isVisible()) {
    const decline = wheel.getByRole("button", { name: "No jugar" });
    if (await decline.isVisible()) {
      await decline.click();
      return true;
    }
    await wheel.getByRole("button", { name: "Continuar temporada" }).click();
    return true;
  }

  for (const name of ADVANCE_BUTTONS) {
    const button = page.getByRole("button", { name }).first();
    if ((await button.count()) > 0 && (await button.isVisible()) && (await button.isEnabled())) {
      await button.click();
      return true;
    }
  }

  return false;
}

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test("una temporada superada ofrece el reto con la marca actual", async ({ page }) => {
  test.setTimeout(240_000);

  await seedRandomness(page, 2);
  await page.goto("/");
  await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [SAVE_KEY, fixture]);
  await page.reload();
  await page.getByRole("button", { name: "Continuar" }).click();

  const survived = page.getByRole("heading", { name: "Temporada superada" });
  let stalls = 0;

  for (let step = 0; step < 400; step += 1) {
    if (await survived.isVisible()) break;

    const advanced = await advanceOnce(page);
    stalls = advanced ? 0 : stalls + 1;
    expect(stalls, "La temporada no ofrece ningún paso de avance").toBeLessThan(10);

    if (advanced) await page.waitForTimeout(150);
  }

  await expect(survived).toBeVisible();

  const challenge = page.getByRole("region", { name: "Retar a otros jugadores" });
  await expect(challenge).toBeVisible();
  await expect(challenge).toContainText(/\d+ puntos y \d+ temporadas superadas/);

  await challenge.getByRole("button", { name: "Copiar enlace de reto" }).click();
  await expect(challenge.getByRole("status").first()).toHaveText("Enlace de reto copiado.");

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(/\?reto=[A-Za-z0-9_-]+$/);
});
