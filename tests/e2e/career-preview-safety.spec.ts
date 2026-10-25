import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Empezar una carrera nueva borra la partida guardada: debe pedir confirmación antes.
const SAVE_KEY = "once_historico_zurigorri_saved_game_v1";
const fixture = readFileSync(new URL("./fixtures/career-weak.json", import.meta.url), "utf8");

test("con partida guardada, empezar carrera pide confirmación y, si se cancela, la conserva", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [SAVE_KEY, fixture]);
  await page.reload();

  let dialogMessage = "";
  page.once("dialog", async (dialog) => {
    dialogMessage = dialog.message();
    await dialog.dismiss();
  });

  await page.getByRole("button", { name: "Jugar carrera" }).click();
  await page.getByRole("button", { name: "Empezar carrera 2025/26" }).click();

  expect(dialogMessage).toContain("se borrará");
  await expect(page.getByRole("button", { name: "Empezar carrera 2025/26" })).toBeVisible();
  expect(await page.evaluate((key) => window.localStorage.getItem(key), SAVE_KEY)).toBe(fixture);
});
