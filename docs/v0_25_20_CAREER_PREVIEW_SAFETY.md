# v0.25.20 — Pantalla de entrada a la carrera: seguridad y accesibilidad

## Problema

- "Empezar carrera" borraba la partida guardada sin avisar (`handleStartCareer` llama a `clearSavedGameState`).
- La temporada inicial estaba escrita a mano en dos sitios.
- El título dejaba una palabra sola en la segunda línea.
- Los botones no mostraban foco visible al navegar con teclado.

## Cambios

- `src/App.tsx`: si `hasSavedGameState()` es verdadero, se pide confirmación antes de empezar. La temporada usa `CAREER_INITIAL_SEASON_LABEL`.
- `src/App.css`: `text-wrap: balance` en el título y contorno de foco en botones y enlaces de la pantalla.
- `tests/e2e/career-preview-safety.spec.ts`: al cancelar la confirmación, la partida guardada se conserva.

## Qué no cambia

- La lógica de la carrera, las reglas y el texto de las tarjetas.

## Validación

- `npm run typecheck`, `npx eslint src scripts`, `npm test`.
- QA de versión y de portada.
- `npx playwright test`, con la nueva prueba de confirmación.
