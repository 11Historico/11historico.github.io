# v0.25.23 — Texto de carrera en la pantalla de liga

Fase 1 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`).

## Cambios

- `src/components/LeagueSimulatorView.tsx`: el encabezado dice "Carrera" en modo carrera y "Partida rápida" en el resto.
- `src/App.css`: se retira el bloque de foco de la pantalla de carrera (añadido en v0.25.20). Es redundante: `src/index.css` ya define `:focus-visible` para todos los controles desde v0.25.2.
- `tests/e2e/career-league-copy.spec.ts`: comprueba el texto en modo carrera.

## Corrección a la auditoría

El informe `docs/INFORME_AUDITORIA_ROLES_v0_25_22.md` decía que el foco visible no era global. Era incorrecto: `index.css` ya lo es. El punto queda resuelto y se retira de la fase 1.

## Validación

- `npm run typecheck`, `npx eslint src scripts`, `npm test`.
- QA de versión y de portada.
- `npx playwright test`, con la prueba nueva.
