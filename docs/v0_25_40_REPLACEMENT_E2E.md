# v0.25.40 — Pruebas del cambio de formación y del reemplazo al recargar

## Problema

La fase 13 tenía tres cortes de código ya fusionados, pero dos comprobaciones seguían solo a mano:

1. Confirmar un cambio de formación ("Solo cambiar jugador") debe llevar al sorteo del sustituto.
2. Recargar la página durante ese sorteo debe conservar el jugador que sale.

## Cambio

Sin cambios en la app. Solo pruebas E2E:

- `tests/e2e/formation-change.spec.ts`: "confirmar lleva al sorteo del sustituto y sobrevive a recargar".
- `tests/e2e/reward-flow-resume.spec.ts`: "recargar con el sorteo del sustituto en curso conserva el jugador que sale".

## Validación

- `npx playwright test`: 12 pruebas en verde en local (las 2 nuevas incluidas).
- Los dos specs existentes del flujo de formación y de reanudación siguen en verde.

## Lo que no cubre

- Comprobación en móvil y en producción (fases 14 y 15 del roadmap).
- No se ha comprobado con una prueba que falle sin el código de v0.25.39; el flujo de reanudación ya estaba en `main`.
