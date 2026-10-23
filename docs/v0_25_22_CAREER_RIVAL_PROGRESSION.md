# v0.25.22 — Progresión de los rivales en la carrera

## Decisión

El usuario pidió que la progresión de la carrera se endurezca con el tiempo, de forma progresiva y lenta. Esta fase conecta la curva que ya existía en el código.

## Cambio

- `src/career/careerRules.ts`: `applyCareerRivalProgression(rivals, completedSeasons)` suma `getRivalDifficultyBonus(completedSeasons)` a las valoraciones de los rivales (máximo 99). Devuelve copias.
- `src/components/LeagueSimulatorView.tsx`: al crear el contexto de temporada, aplica la progresión a `leagueRivals`. Recibe `careerCompletedSeasons`.
- `src/App.tsx`: pasa `careerCompletedSeasons` a la vista de liga.

## Curva

- Temporadas 1–3 superadas: +0,5 por temporada.
- Temporadas 4–6: +1 por temporada.
- Temporada 7 en adelante: +1,5 por temporada.
- Tope acumulado: +10, que se alcanza tras la décima temporada superada.

La primera temporada no cambia. Los rivales de la Copa salen de la misma lista, así que también se ven afectados; `getCupDifficultyBonus` sigue sin usarse.

## Riesgo y revisión

- Cambia el balance de la liga en modo carrera, que estaba marcado como cerrado en `APP_STATUS`. Por eso es una fase propia y requiere autorización explícita del propietario, que se ha dado.
- No se ha ajustado ningún número. Si el ritmo resulta demasiado rápido, se toca solo `getRivalDifficultyBonus`.
- La lista guardada de rivales no cambia. El contexto de temporada guardado conserva los valores que se usaron.

## Validación

- `tests/unit/careerRivalProgression.test.ts`: sin cambio en la primera temporada, subida según la curva, sin mutar la lista original y tope de 99.
- `npm run typecheck`, `npx eslint src scripts`, `npm test`.
- QA de versión y de portada, `npx playwright test`.
- Pendiente: partida completa de varias temporadas para comprobar el ritmo.
