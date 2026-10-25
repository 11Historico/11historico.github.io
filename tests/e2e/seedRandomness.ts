import type { Page } from "@playwright/test";

// La liga usa Date.now() y Math.random() como semilla de cada temporada. Fijarlos en el
// navegador hace reproducible el resultado: la misma semilla, el mismo final de temporada.
export async function seedRandomness(page: Page, seed: number): Promise<void> {
  await page.addInitScript((initialSeed: number) => {
    let state = initialSeed >>> 0;
    Math.random = () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    Date.now = () => 1_769_000_000_000;
  }, seed);
}
