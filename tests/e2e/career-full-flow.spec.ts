import { readFileSync } from "node:fs";
import { seedRandomness } from "./seedRandomness";
import { expect, test, type Page } from "@playwright/test";

// Partida guardada de prueba (npm run e2e:fixture). Ver scripts/buildE2eFixture.ts.
const SAVE_KEY = "once_historico_zurigorri_saved_game_v1";
const fixture = readFileSync(new URL("./fixtures/career-weak.json", import.meta.url), "utf8");

// Botones que hacen avanzar la carrera, por orden de prioridad. Se descarta la ruleta
// (No jugar) para que la prueba sea determinista.
const ADVANCE_BUTTONS = [
  /^Seguir igual$/,
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
  // La ruleta de temporada es un modal que tapa la pantalla: se resuelve primero.
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
      // Con tope: «Saltar» desaparece al llegar al descanso y, sin él, el clic lo esperaría para siempre.
      return button.click({ timeout: 2_000 }).then(() => true, () => false);
    }
  }

  return false;
}

// Con la semilla fijada, la plantilla débil termina en Game Over de forma reproducible.
test("carrera completa desde la partida guardada hasta el Game Over", async ({ page }) => {
  test.setTimeout(240_000);

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await seedRandomness(page, 1);
  await page.goto("/");
  await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [SAVE_KEY, fixture]);
  await page.reload();

  await page.getByRole("button", { name: "Continuar" }).click();

  const gameOver = page.getByRole("heading", { name: /game over/i });
  let stalls = 0;

  for (let step = 0; step < 400; step += 1) {
    if (await gameOver.isVisible()) break;

    const advanced = await advanceOnce(page);
    stalls = advanced ? 0 : stalls + 1;

    // Sin botones de avance durante varios intentos seguidos: la carrera está atascada.
    if (stalls >= 10) {
      const buttons = await page.getByRole("button").allInnerTexts();
      const text = (await page.locator("body").innerText()).slice(0, 400);
      throw new Error(`La carrera no ofrece ningún paso de avance.
Botones: ${buttons.join(" | ")}
Texto: ${text}`);
    }

    // Sin botón visible, esperar: la siguiente pantalla (carga diferida) puede tardar en CI.
    await page.waitForTimeout(advanced ? 150 : 250);
  }

  await expect(gameOver).toBeVisible();
  const body = await page.locator("body").innerText();
  // El Game Over puede deberse a objetivo fallido o a descenso: la pantalla debe decir cuál.
  expect(body, "La pantalla de Game Over debe explicar el motivo").toMatch(/Objetivo fallido|Descenso/);
  // La tarjeta europea explica por qué no hay plaza, con la posición del equipo.
  await expect(page.locator(".european-qualification-narrative")).toContainText(/Quedaste \d+\.º/);

  // Al terminar con Game Over, la pregunta de envío al ranking global es explícita y se puede decir que no.
  await expect(page.getByRole("heading", { name: "¿Enviar esta carrera al ranking global?" })).toBeVisible();
  await page.getByRole("button", { name: "No enviar" }).click();
  await expect(page.getByText("Esta carrera no se envía al ranking global")).toBeVisible();

  // La imagen para compartir se descarga (o se comparte, si el navegador lo permite).
  await page.getByRole("button", { name: "Compartir imagen" }).click();
  await expect(page.getByText(/Imagen (descargada|compartida)\./)).toBeVisible();

  // El resumen completo abre el palmarés por defecto (v0.25.54).
  await page.getByRole("button", { name: "Ver resumen completo" }).click();
  await expect(page.getByRole("heading", { name: "Vitrina histórica" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
