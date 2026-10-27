# v0.25.54 — Pantalla de final de temporada: palmarés visible, competiciones diferenciadas e iconos de equipo

## Problemas

- El palmarés estaba plegado al final de la pantalla y pasaba desapercibido.
- Todos los bloques de competición tenían el mismo aspecto: solo cambiaba el texto de la cabecera.
- La clasificación de liga no mostraba ningún icono de equipo.
- El texto de clasificación europea hablaba de "El Athletic" mientras el resto de la pantalla usa el nombre del equipo.

## Cambio

- `src/components/FinalSummary.tsx`:
  - El palmarés aparece abierto y justo después de las estadísticas principales.
  - Cada bloque de competición tiene su icono y su color: Liga, Copa, Champions League, Europa League y Conference League. La competición europea se toma del torneo o de la clasificación.
  - Cada fila de la clasificación de liga muestra la camiseta del equipo.
- `src/components/FinalSummary.css`: colores de acento por competición (`data-competition`), con borde izquierdo y color en la cabecera.
- `src/components/LeagueSimulatorView.tsx`: `TeamKitIcon` se exporta para reutilizarlo.
- `src/components/EuropeanQualificationCard.tsx`: el texto pasa a "Tu equipo jugará…" y "Tu equipo no se ha clasificado…". Coincide con la etiqueta "Tu equipo" de la tabla.
- `scripts/qaEuropeanQualificationUi.ts`: se actualiza la comprobación al nuevo texto.

## Lo que no cubre

- No se ha revisado visualmente en una temporada completa: hace falta llegar al final de una carrera.
- El cuadro de Copa y de Europa todavía no usan iconos de camiseta.

## Validación

- `npm run typecheck` y `npx eslint src scripts`: sin errores.
- `npm test`: 99/99.
- `npm run qa:ci`: 30 scripts en verde.
- `npx playwright test`: 12/12.
