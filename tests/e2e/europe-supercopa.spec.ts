import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { USER_TEAM_ID } from "../../src/data/laliga2526Teams";
import { createEuropeanTournamentForQualification } from "../../src/europe/europeanTournament";
import type { EuropeanQualificationResult } from "../../src/europe/europeanTypes";
import { getInitialCareerLeagueRivals } from "../../src/simulation/leagueSimulator";
import { seedRandomness } from "./seedRandomness";

// Novedades de v0.25.50 a v0.25.55: palmarés y clasificación europea en la liga,
// partido europeo en directo y Supercopa en directo.
const SAVE_KEY = "once_historico_zurigorri_saved_game_v1";
const base = JSON.parse(readFileSync(new URL("./fixtures/career-strong.json", import.meta.url), "utf8"));
const rivals = getInitialCareerLeagueRivals();

function europeanSave() {
  const tournament = createEuropeanTournamentForQualification({
    seasonNumber: base.careerCompletedSeasons + 1,
    qualification: {
      qualified: true,
      competition: "conference_league",
      source: "league",
      label: "Conference League",
      shortLabel: "Conference",
      explanation: "",
      priority: 3,
    } as unknown as EuropeanQualificationResult,
    seed: "e2e_europa",
    totalLeagueMatchdays: 38,
  });

  return {
    ...base,
    phase: "league_simulation",
    careerLeagueRivals: rivals,
    europeanCareer: { ...base.europeanCareer, currentTournament: tournament },
    savedAt: "2026-10-27T00:00:00.000Z",
  };
}

function supercopaSave() {
  return {
    ...base,
    phase: "team_summary",
    careerLeagueRivals: rivals,
    careerPendingSupercopa: {
      seasonLabel: base.careerSeasonLabel,
      userQualified: true,
      reason: "",
      participants: [
        { teamId: USER_TEAM_ID, teamName: "Athletic Club Histórico", source: "league_champion", sourceLabel: "1.º Liga" },
        { teamId: rivals[0].id, teamName: rivals[0].name, source: "league_runner_up", sourceLabel: "2.º Liga" },
        { teamId: rivals[1].id, teamName: rivals[1].name, source: "cup_champion", sourceLabel: "Campeón Copa" },
        { teamId: rivals[2].id, teamName: rivals[2].name, source: "cup_runner_up", sourceLabel: "Subcampeón Copa" },
      ],
    },
    savedAt: "2026-10-27T00:00:00.000Z",
  };
}

async function loadSave(page: Page, save: object) {
  await seedRandomness(page, 3);
  await page.goto("/");
  await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [SAVE_KEY, JSON.stringify(save)]);
  await page.reload();
  await page.getByRole("button", { name: "Continuar" }).click();
}

test("la liga permite consultar la clasificación europea y el palmarés", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await loadSave(page, europeanSave());

  await page.getByRole("tab", { name: "Clasificación europea" }).click();
  const table = page.getByRole("region", { name: "Clasificación de la competición europea" });
  await expect(table.getByRole("heading", { name: "Clasificación europea · fase de liga" })).toBeVisible();
  await expect(table.getByText("Pasan a semifinales los 2 primeros.")).toBeVisible();
  await expect(table.locator(".league-table-row")).toHaveCount(7);

  await page.getByRole("tab", { name: "Palmarés" }).click();
  await expect(page.getByRole("heading", { name: "Vitrina histórica" })).toBeVisible();
  // Las pestañas son excluyentes: al abrir el palmarés se oculta la clasificación europea.
  await expect(table).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "Palmarés" })).toHaveAttribute("aria-selected", "true");
  expect(pageErrors).toEqual([]);
});

test("el partido europeo se reproduce en directo antes de mostrar el resultado", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await loadSave(page, europeanSave());

  // v0.25.74: previa con probabilidades antes de cada partido.
  await expect(page.getByRole("region", { name: "Previa del próximo partido" })).toContainText(/Victoria \d+\s%/);

  const simulateEuropean = page.getByRole("button", { name: "Simular partido europeo" });
  for (let step = 0; step < 20 && !(await simulateEuropean.isVisible()); step += 1) {
    const cup = page.getByRole("button", { name: "Simular partido de Copa" });
    const declineWheel = page.getByRole("button", { name: "No jugar" });
    const skip = page.getByRole("button", { name: "Saltar hasta próximo evento" });

    if (await declineWheel.isVisible()) await declineWheel.click();
    else if (await cup.isVisible()) await cup.click();
    else if (await skip.isEnabled()) await skip.click();
    await page.waitForTimeout(300);
  }

  // v0.25.72: el local va a la izquierda, juegue en casa o fuera, igual que el marcador.
  const teams = page.locator(".european-match-event-team");
  await expect(teams.first()).toContainText("Local");
  await expect(teams.last()).toContainText("Visitante");
  const preview = page.getByRole("region", { name: "Previa del próximo partido" });
  await expect(preview.locator(".match-odds")).toContainText(/Victoria \d+\s%/);

  // v0.25.75: el planteamiento se elige en la previa y el resultado cuenta qué cambió.
  await preview.getByRole("button", { name: "Ofensivo" }).click();
  await expect(preview.getByRole("button", { name: "Ofensivo" })).toHaveAttribute("aria-pressed", "true");
  // v0.25.77: tus líneas en la previa, con el rival como un solo número.
  await expect(preview).toContainText("Nivel del rival");

  // Mientras se reproduce un partido de Liga, las estadísticas no se actualizan hasta que acaba.
  await expect(page.locator(".match-sequence-skip")).toHaveCount(0, { timeout: 15_000 });
  const seasonGoals = page.locator(".season-stats-grid strong");
  const seasonGoalsBefore = await seasonGoals.allTextContents();

  await simulateEuropean.click();
  await expect(page.getByText(/Previa europea|Partido en juego/)).toBeVisible();
  // Durante el partido el marcador va en directo (antes de v0.25.51 mostraba "–" hasta el final).
  await expect(page.getByText("Partido en juego")).toBeVisible();
  await expect(page.locator(".european-match-sequence-live-score strong").first()).toHaveText(/^\d+$/);
  await expect(page.getByText("Resultado europeo")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("region", { name: "Evento europeo" }).locator(".match-key-factor")).not.toBeEmpty();
  await expect(page.getByRole("region", { name: "Evento europeo" }).locator(".match-approach-effect")).toContainText("ofensivo");
  // v0.25.76 y v0.25.77: barra de dominio y mini campo. Los goles europeos no suman a las estadísticas.
  await expect(page.getByRole("region", { name: "Evento europeo" }).getByRole("img", { name: /Dominio según los goles esperados/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "Evento europeo" }).locator(".match-sequence-pitch")).toBeVisible();
  expect(await seasonGoals.allTextContents()).toEqual(seasonGoalsBefore);

  // v0.25.69: al seguir con la Liga, el resultado europeo deja paso al partido de Liga
  // y la Conference pasa a una tarjeta de próximo partido.
  await page.getByRole("button", { name: /^Simular$/ }).click();
  await expect(page.getByRole("region", { name: "Evento europeo" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Próximo partido europeo" })).toBeVisible();
  await page.getByRole("button", { name: "Parar simulación" }).click();
  expect(pageErrors).toEqual([]);
});

test("la Supercopa se reproduce partido a partido y el veredicto llega al final", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await loadSave(page, supercopaSave());

  await page.locator(".start-league-button-header").click();
  await expect(page.getByRole("heading", { name: "Supercopa de España" })).toBeVisible();

  // v0.25.75: planteamiento para toda la Supercopa, con la previa de la semifinal.
  const preview = page.getByRole("region", { name: "Previa de la semifinal" });
  await expect(preview).toContainText(/Victoria \d+\s%/);
  await preview.getByRole("button", { name: "Defensivo" }).click();
  await expect(preview.getByRole("button", { name: "Defensivo" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Simular Supercopa" }).click();

  // Mientras se juegan los partidos no hay veredicto ni botón para seguir.
  await expect(page.getByText("Supercopa en directo")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Jugar Liga/ })).toHaveCount(0);

  await expect(page.getByRole("heading", { name: /Campeón de Supercopa|Eliminado en/ })).toBeVisible({ timeout: 30_000 });
  // v0.25.76: tu partido lleva dominio y mini campo; el partido entre rivales, no.
  await expect(page.locator(".match-sequence .match-dominance").first()).toBeVisible();
  await expect(page.locator(".match-sequence-pitch").first()).toBeVisible();
  await expect(page.locator(".match-sequence-pitch")).toHaveCount(await page.locator(".match-sequence .match-dominance").count());
  await expect(page.getByRole("button", { name: /^Jugar Liga/ })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
