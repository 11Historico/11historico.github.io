import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// En modo carrera, la pantalla de liga no debe presentarse como "Partida rápida".
const SAVE_KEY = "once_historico_zurigorri_saved_game_v1";
const fixture = readFileSync(new URL("./fixtures/career-weak.json", import.meta.url), "utf8");

test("la pantalla de liga en carrera dice Carrera, no Partida rápida", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [SAVE_KEY, fixture]);
  await page.reload();
  await page.getByRole("button", { name: "Continuar" }).click();

  const header = page.locator(".league-header");
  await expect(header).toContainText("Carrera: simula Liga y Copa");
  await expect(header).not.toContainText("Partida rápida");
});
