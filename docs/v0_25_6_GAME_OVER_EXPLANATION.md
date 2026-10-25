# v0.25.6 — Explicación de la falta de plaza europea

Primer punto P2 del informe de UX: que el jugador entienda por qué se queda sin plaza europea. No cambia la regla de clasificación.

## Qué cambia

- `src/europe/europeanQualification.ts`: `getNoEuropeanQualificationExplanation(leaguePosition, copaWinnerLeaguePosition)` genera el texto según el campeón de Copa:
  - campeón en 1.º-5.º (ya en Europa por Liga): la plaza de Copa pasó al 6.º y la Conference al 7.º;
  - campeón 6.º: conserva su plaza de Copa y la Conference pasó al 7.º;
  - campeón fuera de Europa: su plaza de Copa era suya, y hay que quedar entre los 6 primeros;
  - sin campeón conocido: el reparto de Liga, sin mencionar la Copa.
- `src/components/EuropeanQualificationCard.tsx`: la tarjeta sin plaza muestra esa explicación (antes, un texto fijo).

## Validación

- `tests/unit/europeanQualification.test.ts`: 4 casos nuevos.
- `tests/e2e/career-full-flow.spec.ts`: el Game Over muestra "Quedaste N.º" en la tarjeta europea.
- `npm test`, `typecheck`, `lint`, `qa:tech-debt` completo y `npm run test:e2e` pasan.

## Pendiente

- Las demás explicaciones de la pantalla de carrera (ruleta, Copa, descenso) no se han revisado en este paso.
