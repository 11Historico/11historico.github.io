# v0.25.42 — Tope de la progresión de rivales: +3

## Decisión

Baja el tope acumulado de la progresión de rivales de +5 a +3 (`getRivalDifficultyBonus` en `src/career/careerRules.ts`). Lo aprobó el usuario tras la simulación de la fase 9. La curva por temporada no cambia: 0,5 en las tres primeras, 1 en las tres siguientes y 1,5 después, y ahora se alcanza el tope en la temporada 5.

## Motivo

Simulación de carreras de diez temporadas (`tests/e2e/fixtures/career-strong.json`, semillas 1 a 30, con premios de ruleta y de entrenador aceptados):

| Tope | Media de temporadas superadas | Llegan a 10 |
|---|---|---|
| +5 (semillas 1 a 8) | 3,0 | 0 de 8 |
| +3 | 4,53 | 6 de 30 (20 %) |
| +2 | 4,47 | 5 de 30 (17 %) |

Con +3 y +2 el resultado es prácticamente igual dentro del ruido, así que se eligió +3 como punto medio. Con +5 no se midió todo el conjunto de 30 semillas.

## Limitaciones de la simulación

- Acepta la ruleta de temporada y el cambio de entrenador, pero rechaza el cambio de jugador, porque exige colocar cartas en el campo.
- Elige siempre la primera carta de entrenador, sin criterio.
- Cuatro semillas (7, 8, 10 y 22) pierden en la primera temporada con los tres topes. No depende de la progresión, así que queda fuera de esta fase.

## Validación

- `npm test`: pruebas del tope actualizadas (`tests/unit/rivalBonusCap.test.ts`).
- `npm run typecheck` y `npx eslint src scripts`.
- `npm run qa:ci`.
- `npx playwright test`.

## Lo que no cubre

- No cambia Liga, Copa, Europa ni el balance de equipos. Solo la progresión de rivales de la carrera.
- No hay una carrera real de diez temporadas jugada a mano. Es la prueba que queda por hacer.
