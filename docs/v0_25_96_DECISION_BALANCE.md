# v0.25.96 — Balance de tus decisiones

Fase 6 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`, con el alcance corregido.

## Por qué cambia la fase

El roadmap proponía una línea tras cada partido con el efecto de tu decisión. **Esa línea ya existía:**
- **Planteamiento,** desde la v0.25.75: «Tu planteamiento ofensivo cambió el partido: con uno equilibrado habrías perdido 1-2».
- **Descanso,** desde la v0.25.78: «Arriesgar cambió el partido: sin tocar nada habrías empatado 1-1».

El usuario eligió sustituirla por un **balance de la temporada**. Partido a partido, la influencia se pierde; sumada, se ve.

## Cambio

Una línea cuenta lo que han cambiado tus decisiones esta temporada en Copa, Europa y Supercopa:

- «Tus decisiones esta temporada: decidiste en 5 partidos y cambiaste 3 resultados: 2 a favor y 1 en contra.»
- «Tus decisiones esta temporada: decidiste en 10 partidos y ningún resultado habría sido distinto sin tocar nada.»

**Dónde sale:**
- En la Liga, bajo el rango esperado, en la tarjeta de la clasificación.
- En «Temporada superada» y en «Game Over», bajo la nota de la temporada.

Si no has decidido en ningún partido, no sale.

## Cómo se cuenta (`src/simulation/decisionBalance.ts`)

- **Partido decidido:** el que tiene planteamiento ofensivo o defensivo (`approachEffect`) o un cambio en el descanso (`halfTimeEffect`). Los partidos ya guardan las dos comparaciones.
- **Resultado cambiado:** el resultado a los 90 minutos con tus decisiones (victoria, empate o derrota) frente al de no tocar nada (equilibrado y seguir igual). Si es mejor, cuenta a favor; si es peor, en contra.
- **Si el descanso cambió el marcador:** el partido ya no guarda la comparación del planteamiento (`applyHalfTimeChoice` la quita), así que se compara con el marcador antes del descanso.
- **Datos:**
  - Copa: `cupState.results`.
  - Europa: los partidos jugados del torneo.
  - Supercopa: los partidos de `careerCurrentSupercopaResult`, que App pasa a la Liga y a la pantalla de fin de temporada.
- **En la Liga,** con lo que se ve: mientras se juega un partido, no lo delata.

## Archivos

- `src/simulation/decisionBalance.ts`: nuevo.
- `src/components/LeagueSimulatorView.tsx`: la línea bajo el rango esperado; prop `supercopaResults`.
- `src/components/CareerSeasonOutcome.tsx`: la línea al cerrar la temporada; prop `supercopaResults`.
- `src/App.tsx`: pasa los partidos de la Supercopa.
- `docs/ROADMAP_MEJORAS_v0_25_91.md`: fase 6 corregida.

## Comprobación

- `tests/unit/decisionBalance.test.ts`:
  - partidos decididos y resultados a favor o en contra;
  - planteamiento y descanso juntos;
  - los textos, también sin decisiones.
- **Navegador**, con la partida `career-strong` en Europa League:
  - tras 1, 2 y 3 partidos europeos en defensivo, la línea sube de 1 a 3 partidos decididos;
  - al cerrar la temporada, «decidiste en 10 partidos y ningún resultado habría sido distinto sin tocar nada».
- `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` y Playwright.
