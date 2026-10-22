import { defineConfig } from "vitest/config";

// Pruebas unitarias de lógica pura. Las pruebas de navegador viven en tests/e2e (Playwright).
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
  },
});
