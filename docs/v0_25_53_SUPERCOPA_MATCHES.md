# v0.25.53 — Supercopa en directo: cada partido se reproduce como en Liga

## Problema

La Supercopa mostraba el resultado de sus partidos de golpe. Los partidos entre rivales no tenían goles con minuto, así que no había nada que reproducir.

## Cambio

- `src/career/supercopaRules.ts`:
  - Los partidos entre rivales generan sus goles con minuto a partir del marcador, con semilla fija. El marcador no cambia.
  - Cuando el empate de una semifinal o final se decide a favor de un equipo, ese gol se registra al 90' para que la secuencia termine en el marcador.
- `src/components/LeagueSimulatorView.tsx`: `MatchSequence` se exporta para reutilizarla. Un partido sin el usuario muestra "Final" en vez de una insignia de victoria o derrota. La etiqueta de la Supercopa muestra su ronda.
- `src/components/CareerSupercopa.tsx`: los partidos se reproducen uno tras otro, con su marcador en directo y sus goles. El veredicto y el botón de continuar aparecen al terminar el último.
- `tests/unit/supercopaGoalEvents.test.ts`: comprueba que cada partido tiene tantos goles con minuto como marcador en seis semillas.

## Lo que no cubre

- Los goleadores de los partidos entre rivales no existen: solo hay minutos y equipo.
- Si se entra de nuevo en la pantalla de la Supercopa, los partidos se reproducen otra vez.

## Validación

- `npm run typecheck` y `npx eslint src scripts`: sin errores.
- `npm test`: incluye la prueba nueva de goles con minuto.
- `npm run qa:ci`: 30 scripts en verde.
- `npx playwright test`: 12/12.
- Pendiente: comprobación visual en una carrera real.
