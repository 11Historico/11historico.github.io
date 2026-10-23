# v0.25.25 — Versión en una sola fuente

Fase 5 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`).

## Problema

La versión se escribía a mano en varios sitios: `src/config/appVersion.ts`, `package.json`, `package-lock.json`, README y varios QA. Cada subida de versión podía dejar uno desactualizado, y eso ya había provocado fallos de QA.

## Cambio

- `src/config/appVersion.ts`: `APP_VERSION` se deriva de `package.json` con `import packageJson from "../../package.json"`.
- `tsconfig.app.json`: `"resolveJsonModule": true`, necesario para importar JSON desde `src`.
- Los QA con literal de versión (`qaHooksSimulationDeps`, `qaMobileViewportFix`, `qaVersionConsistency`, `qaLuckWheelRealRewards`, `qaTechHealthBaseline`) leen la versión de `package.json`. Donde antes comparaban con un literal, ahora comprueban formato semver o la igualdad con `APP_VERSION`.

## Procedimiento para subir de versión

1. `npm version <x.y.z> --no-git-tag-version`: actualiza `package.json` y `package-lock.json` a la vez.
2. Actualizar a mano lo que es texto y no se puede derivar:
   - `README.md`: línea "Versión pública actual".
   - `CHANGELOG.md`: nueva sección al principio.
   - `docs/v<x>_<y>_<z>_*.md`: documento de fase.
   - `CURRENT_RELEASE_DOC` en `src/config/appVersion.ts`: ruta del documento de fase.
3. `npm run qa:ci` y `npm run qa:version`. Si falta algo en README, CHANGELOG o el documento, el QA lo indica.

## Qué no se deriva

- `APP_VERSION_NAME` y `APP_STATUS`: son texto de producto.
- `CURRENT_RELEASE_DOC`: el nombre del documento incluye un tema además de la versión.

## Validación

- `npm run typecheck`, `npx eslint src scripts`, `npm test` (73 pruebas).
- `npm run qa:ci` (29 QA) y los QA de versión, en verde.
- Build: el bundle incluye `version: "0.25.25"` tomado de `package.json`.
- `npx playwright test`: 7 pruebas en verde.
