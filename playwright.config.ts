import { defineConfig, devices } from "@playwright/test";

// Pruebas de navegador contra el build de producción.
// Las pruebas no usan el ranking global: el build no debe incrustar el endpoint de .env.local.
process.env.VITE_GLOBAL_RANKING_ENDPOINT = "";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:4173/",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Construye antes de servir: dist/ está versionado y puede tener un build antiguo.
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
