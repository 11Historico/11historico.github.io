import { expect, test } from "@playwright/test";
import { encodeChallenge } from "../../src/career/challengeLink";

test("la home carga en español, con título y sin errores de consola", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");

  await expect(page).toHaveTitle(/Once Histórico/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.getByRole("button", { name: "Jugar carrera" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("el ranking global enlaza la política de privacidad", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ver ranking" }).click();

  const privacyLink = page.getByRole("link", { name: "Política de privacidad del ranking global" });
  await expect(privacyLink).toBeVisible();
  await privacyLink.click();

  await expect(page.getByRole("heading", { name: "Política de privacidad" })).toBeVisible();
});

test("un enlace de reto muestra la marca en la home y se puede cerrar", async ({ page }) => {
  const reto = encodeChallenge({
    arcadeScore: 1234,
    completedSeasons: 7,
    bestLeaguePosition: 2,
    trophyCounts: { liga: 1, copa: 2, supercopa: 0, champions: 0, europaLeague: 1, conference: 0 },
  });

  await page.goto(`/?reto=${reto}`);

  const banner = page.getByRole("region", { name: "Reto recibido" });
  await expect(banner).toBeVisible();
  await expect(banner).toContainText("1234 puntos");
  await expect(banner).toContainText("Mejor Liga 2.º");

  await banner.getByRole("button", { name: "Cerrar" }).click();
  await expect(banner).toHaveCount(0);
  await expect(page).not.toHaveURL(/reto=/);
});
