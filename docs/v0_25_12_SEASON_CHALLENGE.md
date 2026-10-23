# v0.25.12 — Enlace de reto tras una temporada superada

Amplía el enlace de reto (v0.25.9) a la pantalla de temporada superada, que es donde el jugador vive la mayoría de sus momentos buenos.

## Qué cambia

- `src/components/CareerSeasonOutcome.tsx`:
  - El botón "Copiar enlace de reto" es ahora el componente `ChallengeLinkButton`, usado en el fin de carrera y en la temporada superada.
  - Para una temporada superada, la marca se calcula con `buildCareerLocalRankingEntry` sin guardarla. Es la misma fórmula que al terminar la carrera.
  - Se muestra la sección "Reta a otros jugadores" con la puntuación y las temporadas superadas.
- `src/App.tsx`: pasa la mejor posición en Liga al resumen, que hace falta para la marca.
- `src/components/CareerSeasonOutcome.css`: estilo de tarjeta para la sección.
- `scripts/buildE2eFixture.ts`: genera también `career-strong.json` (equipo fuerte).

## Privacidad

Igual que el enlace de fin de carrera: solo puntuación, temporadas, mejor posición y palmarés. Sin nick, fechas ni identificadores.

## Validación

- `tests/e2e/season-challenge.spec.ts`: con la partida fuerte, avanza hasta "Temporada superada", comprueba la sección, copia el enlace y verifica que el portapapeles contiene el parámetro `reto`.
- Captura de la sección revisada en la app.
- `npm test`, `typecheck`, `lint`, `qa:tech-debt` completo y `npm run test:e2e` pasan.
