# v0.25.35 — Cambio de formación y validación fuera de App

Fase 13 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`), tercer corte.

## Cambio

- `src/app/careerRewardFlow.ts`:
  - `startCareerFormationChange(currentFormation)`: transición pura del cambio de formación elegido entre temporadas. Guarda la formación actual para poder cancelar.
  - `checkCareerFormationChange({ isPlayerFormationFlow, formation, remappedPlayers })`: validación pura. En el cambio de formación de la carrera exige exactamente un hueco para el sustituto; en el resto de flujos basta con que el equipo sea válido.
- `src/App.tsx`: `handleChooseCareerFormationChange` usa la transición; `handleConfirmCareerFormationChange` usa la validación. `App.tsx` pasa de 1.705 a 1.683 líneas.
- `tests/unit/careerFormationChange.test.ts`: 6 pruebas. `teamValidation` se simula para aislar la regla del hueco.

## Qué no se mueve

- La copia de seguridad (`ensureCareerRewardSnapshot`), el recálculo de la valoración, el guardado y la selección de jugadores: siguen en `App.tsx`.
- `handleCancelPlayerReplacement` y `handleSelectReplacementPlayer` no cambian. Repiten un bloque de reinicio de estado, que se podría extraer en otra fase.

## Verificación

- Comparación campo a campo de la transición nueva con la antigua: coinciden.
- Pruebas unitarias: 87 en verde.
- `qa:ci`, `qa:tech-debt` y Playwright (7 pruebas): en verde.

## Lo que las pruebas automáticas no cubren

Ni el cambio de formación ni el reemplazo de jugador tienen prueba E2E. Antes de dar la fase por cerrada, probar a mano en una carrera:

1. Cambio de formación desde la pantalla entre temporadas: elegir una formación distinta, poner jugadores, comprobar que el hueco del sustituto se valida y que cancelar vuelve a la formación anterior.
2. Reemplazo de jugador tras ganar un premio de la ruleta.
