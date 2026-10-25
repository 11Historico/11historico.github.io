import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { getInitialCareerLeagueRivals, getInitialCareerSecondDivisionPool } from "../../src/simulation/leagueSimulator";
import { seedRandomness } from "./seedRandomness";

// Cambio de formación desde la pantalla entre temporadas (fase 13). Se usa una partida guardada
// con una temporada ganada en Liga, que es lo que desbloquea el cambio de formación.
const SAVE_KEY = "once_historico_zurigorri_saved_game_v1";
const base = JSON.parse(readFileSync(new URL("./fixtures/career-strong.json", import.meta.url), "utf8"));

function interseasonSave() {
  const seasonResult = {
    seasonLabel: "2028/29",
    leaguePosition: 1,
    wonLeague: true,
    wonCopa: false,
    wonSupercopa: false,
    isRelegated: false,
    europeanQualification: "champions",
    copaWinnerLeaguePosition: null,
  };
  const objectiveResult = {
    survives: true,
    reason: "Liga ganada.",
    isGameOver: false,
    qualifiedForEurope: true,
    wonCopa: false,
    isRelegated: false,
  };
  const rewardSnapshot = {
    selectedFormation: base.selectedFormation,
    selectedPlayers: base.selectedPlayers,
    selectedCoach: base.selectedCoach,
    teamRating: base.teamRating,
    mediaXi: base.teamRating?.overall ?? 80,
    careerSeasonRatingBonus: 0,
    careerSeasonLabel: base.careerSeasonLabel,
    careerCompletedSeasons: base.careerCompletedSeasons,
    careerTrophyCounts: base.careerTrophyCounts,
    careerLeagueRivals: getInitialCareerLeagueRivals(),
    careerSecondDivisionPool: getInitialCareerSecondDivisionPool(),
    playerRoundSeasons: base.playerRoundSeasons,
    currentRoundIndex: base.currentRoundIndex,
  };

  return JSON.stringify({
    ...base,
    phase: "team_summary",
    careerSeasonResult: seasonResult,
    careerObjectiveResult: objectiveResult,
    careerRewardSnapshot: rewardSnapshot,
    careerLeagueRivals: getInitialCareerLeagueRivals(),
    careerSecondDivisionPool: getInitialCareerSecondDivisionPool(),
    savedAt: "2026-10-25T00:00:00.000Z",
  });
}

test("cambio de formación: se abre el selector y cancelar vuelve al resumen del equipo", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seedRandomness(page, 1);
  await page.goto("/");
  await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [SAVE_KEY, interseasonSave()]);
  await page.reload();
  await page.getByRole("button", { name: "Continuar" }).click();

  // Pantalla entre temporadas: la acción principal ofrece cambiar jugador y alineación.
  await expect(page.getByRole("heading", { name: "Temporada superada. Toca decidir." })).toBeVisible();
  await page.getByRole("button", { name: "Jugador + alineación" }).click();

  // Selector de reemplazo en modo cambio de formación.
  await expect(page.getByRole("button", { name: "Cancelar y avanzar" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar y avanzar" }).click();

  // Cancelar restaura la formación guardada y vuelve al resumen del equipo.
  await expect(page.getByRole("button", { name: "Cancelar y avanzar" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Ratings que influyen en la temporada" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("cambio de formación: confirmar lleva al sorteo del sustituto y sobrevive a recargar", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seedRandomness(page, 1);
  await page.goto("/");
  await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [SAVE_KEY, interseasonSave()]);
  await page.reload();
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByRole("button", { name: "Jugador + alineación" }).click();
  await page.getByRole("button", { name: "Elegir y ver alineaciones" }).first().click();

  // Mantener la formación actual: solo se sustituye al jugador elegido.
  await page.getByRole("button", { name: /Mantener formación/ }).click();
  await page.getByRole("button", { name: "Solo cambiar jugador" }).click();

  // Tras confirmar, el sorteo del sustituto muestra al jugador que sale.
  await expect(page.getByText(/Sustituyendo a/)).toBeVisible();

  // Recargar en mitad del sorteo conserva el reemplazo pendiente.
  await page.reload();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText(/Sustituyendo a/)).toBeVisible();
  expect(pageErrors).toEqual([]);
});
