# v0.25.28 — Fondo de estadio en la pantalla de carrera

Fase 12 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`).

## Cambio

- `src/App.css`: `.career-preview-screen` usa `src/assets/home-stadium.svg` como fondo, con el mismo velo que la portada (`.game-home-hero::before`). Se mantiene el brillo superior izquierdo y el color base.

## Validación

- `npm run typecheck`, `npx eslint src scripts`, `npm test` (73 pruebas).
- `npm run qa:ci` y `npm run qa:tech-debt` en verde (build sin endpoint local).
- `npx playwright test`: 7 pruebas en verde.
- Capturas en escritorio (1280 px) y móvil (375 px): el texto se lee y la ilustración se aprecia detrás de las tarjetas.
