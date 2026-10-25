import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { seedRandomness } from "./seedRandomness";

// Recargar la página en mitad de un flujo de recompensas (v0.25.39): la partida debe retomarse
// en la pantalla correcta y con el botón de cancelar funcionando.
const SAVE_KEY = "once_historico_zurigorri_saved_game_v1";
const base = JSON.parse(readFileSync(new URL("./fixtures/career-strong.json", import.meta.url), "utf8"));

async function loadSave(page: import("@playwright/test").Page, save: object) {
  await seedRandomness(page, 1);
  await page.goto("/");
  await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [SAVE_KEY, JSON.stringify(save)]);
  await page.reload();
  await page.getByRole("button", { name: "Continuar" }).click();
}

test("recargar con el cambio de entrenador de la ruleta en curso permite cancelar y volver a la Liga", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await loadSave(page, {
    ...base,
    phase: "coach_selection",
    careerRewardFlow: "luck_wheel_coach",
    coachBeforeReward: base.selectedCoach,
    selectedCoach: undefined,
    savedAt: "2026-10-25T00:00:00.000Z",
  });

  await page.getByRole("button", { name: "Cancelar cambio y volver a la Liga" }).click();
  await expect(page.getByRole("heading", { name: "Simulación de temporada" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("recargar con el reemplazo de jugador de la ruleta en curso vuelve al selector de reemplazo", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await loadSave(page, {
    ...base,
    phase: "player_selection",
    careerRewardFlow: "luck_wheel_player",
    savedAt: "2026-10-25T00:00:00.000Z",
  });

  await expect(page.getByRole("button", { name: "Cancelar y volver a la Liga" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
