# v0.25.60 — Secuencia de partido y camisetas en módulos propios

## Problema

`MatchSequence` y `TeamKitIcon` estaban definidos dentro de `LeagueSimulatorView.tsx`. Desde v0.25.53/54, `CareerSupercopa` y `FinalSummary` los importaban de ahí. Las tres pantallas se cargan en diferido (`lazy`), así que abrir la Supercopa o la pantalla final arrastraba todo el simulador de liga.

## Decisión

Es la prioridad 6 del análisis por roles y no necesitaba decisión del usuario.

## Cambio

- `src/components/TeamKitIcon.tsx` (nuevo): `getTeamKitClass`, `TeamKitIcon` y `TeamWithKit`. El código es el mismo que había en `LeagueSimulatorView.tsx`.
- `src/components/MatchSequence.tsx` (nuevo): `MatchSequence` y su marcador (`ScoreTeam`). El código es el mismo que había en `LeagueSimulatorView.tsx`.
- `src/components/matchSequenceTimeline.ts`: recibe `getResultBadge` y `getResultClass`. Los usan la secuencia y los últimos resultados. Las reglas de recarga en caliente de ESLint no dejan exportarlos desde un archivo de componentes.
- `LeagueSimulatorView.tsx`, `CareerSupercopa.tsx` y `FinalSummary.tsx`: importan desde los módulos nuevos. `LeagueSimulatorView.tsx` pasa de 1087 a 871 líneas.
- `scripts/qaMatchSequence.ts`: comprueba que `CareerSupercopa` y `FinalSummary` no vuelvan a importar de `LeagueSimulatorView`.

## Qué no cambia

**Estilos.** El CSS de camisetas y secuencia sigue en `LeagueSimulatorView.css`, y los dos módulos nuevos importan ese archivo. Las reglas de camisetas están repartidas por el archivo y algunas dependen del orden. Separarlas es otro cambio y no aporta nada ahora.

**Orden de carga del CSS.** Vite mueve `LeagueSimulatorView.css` al chunk compartido, así que ahora se carga antes que `EuropeanMatchEvent.css` y `SeasonLuckWheelModal.css`. Se ha comprobado que no hay selectores repetidos entre esas hojas. El único elemento que mezcla clases de ambas es el botón "Saltar" europeo (`secondary-league-button` + `european-match-sequence-skip`), y sus reglas no comparten propiedades.

**Juego.** No cambian las reglas, los ratings, el simulador ni los textos.

## Tamaños de build

| Chunk | Antes | Después |
|---|---|---|
| `LeagueSimulatorView.js` | 52,0 kB | 45,7 kB |
| `MatchSequence.js` (nuevo) | — | 3,8 kB |
| `TeamKitIcon.js` (nuevo) | — | 2,7 kB |
| CSS de `LeagueSimulatorView.css` | 33,7 kB | 15,8 kB (compartido) + 17,9 kB (resto del simulador) |

La Supercopa y la pantalla final ya no descargan el chunk del simulador.

## Validación

- `npm run typecheck` y `npx eslint src scripts` pasan sin errores.
- `npm test`, `npm run qa:ci` y `npx playwright test` terminan en verde.
- Capturas de la liga, la Supercopa y la pantalla final, iguales que antes.
