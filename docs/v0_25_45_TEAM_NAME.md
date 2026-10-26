# v0.25.45 — Nombre del equipo del usuario: Once Histórico

## Decisión

Tras la marca del producto (v0.25.44), el usuario decide que el equipo que crea dentro del juego también se llame "Once Histórico". Sustituye a "Athletic Club Histórico" en la interfaz y en los textos que hablan de ese equipo.

## Cambio

- `src/simulation/leagueTable.ts`: `USER_TEAM_NAME = "Once Histórico"`. Toda la lógica que identifica al equipo del usuario usa esta constante, así que no hace falta cambiar comparaciones.
- Pantallas: título y frases del resumen del equipo (`TeamSummary.tsx`), estadísticas de la liga (`LeagueSimulatorView.tsx`), resumen final (`FinalSummary.tsx`) y marcador europeo (`EuropeanMatchEvent.tsx`).
- Mensajes de la liga y de la Europa: frases "El Athletic …" del equipo del usuario pasan a "El Once Histórico …" (`EuropeanMatchEvent.tsx`, `EuropeanProgressPanel.tsx`, `EuropeanQualificationCard.tsx`, `seasonLuckWheelText.ts`, `supercopaRules.ts`, `leagueSimulator.ts`).
- Textos para compartir: "Mi Once Histórico" (`shareCard.ts`, `shareRetention.ts`).
- Modo de la pantalla de liga: "Carrera · …" (`App.tsx`).
- Tests y QA que comprobaban esos textos (`tests/unit/seasonBracketsView.test.tsx`, `tests/unit/seasonBrackets.test.ts`, `scripts/qaEuropeanQualificationUi.ts`).

## Lo que no cambia

- Nombres reales de la plantilla histórica: "Athletic clásico/moderno/actual" y el nombre del club en la revelación de temporada (`SeasonReveal.tsx`), porque describen el club real de cada época.
- Portada: "temporadas reales del Athletic" (`GameHome.tsx`).
- Panel de auditoría de balance (`BalanceAuditPanel.tsx`), que es una herramienta de desarrollo.
- Datos reales (`src/data/*`): plantillas, temporadas, rivales de la Liga 25/26 y calendario. Quedan para la asesoría de la fase 16.
- Comentarios de código y los datos de prueba de goles en `matchSequence` y `qaMatchSequence`.

## Validación

- `npm run typecheck` y `npx eslint src scripts`: sin errores.
- `npm test`: 99/99.
- `npm run qa:ci`: 30 scripts en verde.
- `npx playwright test`: 12/12.
