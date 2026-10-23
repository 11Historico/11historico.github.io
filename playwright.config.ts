import { defineConfig, devices } from "@playwright/test";

// Pruebas de navegador contra el build de producción.
// En local, el servidor construye antes de servir y el build no incrusta el endpoint de .env.local.
// En CI, el paso de build del workflow ya ha generado dist/ con la configuración de despliegue
// (ranking global y analítica). No se vuelve a construir: sobrescribiría ese dist/.
const isCi = Boolean(process.env.CI);

if (!isCi) {
  process.env.VITE_GLOBAL_RANKING_ENDPOINT = "";
}

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: isCi ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:4173/",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: isCi
      ? "npm run preview -- --host 127.0.0.1 --port 4173 --strictPort"
      : "npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: !isCi,
    timeout: 60_000,
  },
});
