import { expect, test } from "@playwright/test";

test("la home carga en español, con título y sin errores de consola", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");

  await expect(page).toHaveTitle(/Futbol11/);
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
