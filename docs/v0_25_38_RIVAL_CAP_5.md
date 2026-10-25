# v0.25.38 — Tope de la progresión de rivales: +5

Fase 9 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`). Cambio de balance autorizado por el propietario.

## Cambio

- `src/career/careerRules.ts`: `getRivalDifficultyBonus` devuelve como máximo +5 (antes +10). La curva no cambia: +0,5 en las temporadas 1 a 3, +1 en la 4 a la 6 y +1,5 después.

## Por qué

Simulación de carreras desde el fixture fuerte (`tests/e2e/fixtures/career-strong.json`), con las mismas semillas en todas las pruebas, 4 semillas y hasta 8 temporadas.

| Versión | Semilla 1 | Semilla 2 | Semilla 3 | Semilla 4 |
|---|---|---|---|---|
| Control (sin progresión) | 9 temporadas, sin Game Over | Game Over en la 2.ª | 9 temporadas, sin Game Over | 9 temporadas, sin Game Over |
| Tope +10 (anterior) | Game Over en la 9.ª | Game Over en la 4.ª | Game Over en la 6.ª | Game Over en la 4.ª |
| Tope +5 (este cambio) | Game Over en la 6.ª | Game Over en la 4.ª | 9 temporadas, sin Game Over | Game Over en la 4.ª |

## Lectura

- El tope de +5 reduce la dificultad en las temporadas 8 a 10, pero no la elimina: la curva llega a +4,5 en la temporada 6 y el tope solo recorta lo que pasa de ahí.
- Muestra pequeña (4 semillas). Antes de dar el balance por cerrado, conviene jugar una carrera real.
- Con la progresión desactivada, las mismas semillas sobreviven casi siempre. Si la dificultad sigue alta, la siguiente palanca es reducir la curva, no solo el tope.

## Validación

- `tests/unit/rivalBonusCap.test.ts`: el bonus no pasa de +5 y la curva inicial no cambia.
- `npm run typecheck`, `npx eslint src scripts`, `npm test` (94 pruebas).
- `npm run qa:ci` y `npm run qa:tech-debt` en verde.
- `npx playwright test`: 8 pruebas en verde.

## Pendiente

- Jugar una carrera real de diez temporadas con este tope y comparar con la simulación.
- Decidir si se reduce también la curva de crecimiento.
