# v0.25.48 — Rivales reales en la Conference League y botón de partido europeo en la fila de acciones

## Cambios

- **Rivales de la Conference League:** el pool de `src/europe/europeanOpponents.ts` usa nombres reales de clubes de esos países, sin escudos ni equipaciones:
  - KF Tirana (Albania), Zimbru Chișinău (Moldavia), Víkingur Reykjavík (Islandia), APOEL (Chipre), FC Vaduz (Liechtenstein), Pyunik (Armenia), Dinamo Tbilisi (Georgia), Qarabağ (Azerbaiyán), Budućnost Podgorica (Montenegro), Valletta FC (Malta).
  - Los rangos de valoración, el orden del pool y la lógica de selección no cambian.
- **Botón "Simular partido europeo":** se mueve de la tarjeta del partido europeo a la fila de acciones de la liga, junto a "Simular" y "Saltar hasta próximo evento". Aparece cuando hay un partido europeo pendiente (`pendingEuropeanMatch`). El botón "Continuar temporada" de la tarjeta sigue ahí tras jugar el partido.

## Decisión a revisar

El pool de rivales europeos se diseñó en v0.24.1a con nombres genéricos y sin datos protegidos. Este cambio reemplaza esos nombres en la Conference League por clubes reales. Es coherente con los rivales reales de la Liga 25/26, pero reabre el criterio de nombres genéricos para torneos europeos. Debe revisarlo la asesoría (ver `docs/FASE16_MARCA.md`).

Champions League y Europa League siguen con nombres genéricos.

## Validación

- `npm run typecheck` y `npx eslint src scripts`: sin errores.
- `npm test`: 99/99.
- `npm run qa:ci`: 30 scripts en verde.
- `npx playwright test`: 12/12.
