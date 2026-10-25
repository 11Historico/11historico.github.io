# v0.25.3 — Tests: Vitest y Playwright

Primer paso de la red de pruebas del informe por roles (rol QA). No cambia gameplay, balance, simulación, reparto europeo ni ranking.

## Qué se añade

- **Vitest** (`npm test`): configuración en `vitest.config.ts`, que solo incluye `tests/unit/`. Cubre lógica pura:
  - `tests/unit/europeanQualification.test.ts`: reparto de Liga, reasignación por campeón de Copa externo, Copa del usuario y el cálculo del Game Over.
  - `tests/unit/matchSequence.test.ts`: líneas de tiempo de Liga, Copa y Europa, marcador revelado y velocidad.
  - `tests/unit/europeanMatchEngine.test.ts`: eliminatorias sin empate, determinismo con la misma semilla, tandas con ganador.
- **Playwright** (`npm run test:e2e`): `playwright.config.ts` y `tests/e2e/smoke.spec.ts`. Se ejecuta contra `npm run preview` (el build de producción). Dos pruebas: la home carga en español sin errores de consola, y el ranking global enlaza la política de privacidad.
- **CI:** `.github/workflows/deploy.yml` ejecuta `npm test` antes del build y las pruebas de Playwright después, antes de publicar.

## Lo que no cubre todavía

La prueba de humo no recorre el draft, la simulación de liga ni el Game Over. Hace falta una partida guardada de prueba (fixture) para llegar a ese punto de forma reproducible, y es el siguiente paso.

## Validación

- `npm test`: 25 pruebas pasan.
- `npm run test:e2e`: 2 pruebas pasan en Chromium contra el build.
- `typecheck`, `lint` y `qa:tech-debt` completo pasan con `VITE_GLOBAL_RANKING_ENDPOINT=""`.

## Nota para ejecutar en local

Antes de `npm run test:e2e`, ejecuta `npm run build` (la prueba usa `dist/`). La primera vez, Playwright necesita su navegador: `npx playwright install chromium`.
