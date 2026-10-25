# v0.25.21 — Textos de progresión y dificultad

## Hallazgo

- `getRivalDifficultyBonus` y `getCupDifficultyBonus` (`src/career/careerRules.ts`) no se usan en ningún sitio. El texto anterior de "Progresión" hablaba de rivales más fuertes y de una Copa más exigente, y eso no ocurre en el juego.
- Lo que sí ocurre cada temporada: `createNextCareerLeagueTransition` (`src/simulation/leagueSimulator.ts`) hace bajar a los tres peores rivales de Liga y sube a tres equipos de Segunda.
- La dificultad sí cambia la valoración del equipo en la simulación: `applyDifficultyToTeamRating` en `LeagueSimulatorView.tsx`. Fácil suma +2 y Leyenda resta −4.

## Cambios

- `src/App.tsx` (pantalla `career_preview`): texto de "Progresión" con el comportamiento real.
- `src/config/difficultyOptions.ts`: descripciones de dificultad con el efecto real.

## Pendiente (no se hace aquí)

- Eliminar o conectar `getRivalDifficultyBonus` y `getCupDifficultyBonus`. Cambia el balance, así que requiere una fase propia.
- Revisar "Madrid, Barça y Atlético aprietan de verdad" (Leyenda) contra los datos de rivales; no se ha comprobado en esta fase.

## Validación

- `npm run typecheck`, `npx eslint src scripts`, `npm test`.
- QA de versión y de portada.
- `npx playwright test`.
