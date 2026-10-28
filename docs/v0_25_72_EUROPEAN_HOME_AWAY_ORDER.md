# v0.25.72 — Local y visitante en los partidos europeos

## Problema

En la tarjeta del partido europeo, la previa mostraba siempre «Athletic Club Histórico VS rival», jugara en casa o fuera. El marcador del resultado, en cambio, va en orden local-visitante. Fuera de casa, el primer número era el del rival aunque debajo de él estuviera el Athletic, y una victoria 1-2 parecía una derrota.

## Cambio

- **`src/components/EuropeanMatchEvent.tsx`:** la previa pone a la izquierda al equipo local y a la derecha al visitante, en el mismo orden que el marcador. La tarjeta del rival indica «Local» o «Visitante» junto a su país.

El resto ya iba en orden local-visitante con la sede indicada: el panel europeo, el cuadro de la temporada y el resumen final.

## Qué no cambia

Simulación europea, calendario, sedes, reglas y balance.

## Pruebas

- **`tests/e2e/europe-supercopa.spec.ts`:** antes de jugar el partido europeo, el primer equipo de la previa es el local y el segundo, el visitante.
- **Comprobación temporal en el navegador:** con la partida europea de prueba, el primer partido (en San Mamés) muestra «Athletic Club Histórico VS KF Tirana» con 1-0. El segundo (fuera) muestra «Zimbru Chișinău VS Athletic Club Histórico» con 1-2 y la etiqueta Victoria.

## Validación

- `npm run typecheck` y `npx eslint src scripts` sin errores.
- `npm test` y `npm run qa:ci` en verde.
- `npx playwright test`: 15 tests en verde y 2 saltados.
