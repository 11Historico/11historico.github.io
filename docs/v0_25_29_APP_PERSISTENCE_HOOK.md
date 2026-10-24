# v0.25.29 — Guardado de partida en un hook

Fase 13 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`), primer corte.

## Cambio

- `src/app/useGamePersistence.ts`: hook `useGamePersistence(snapshot, enabled)` con el efecto que llama a `saveGameState`. Exporta el tipo `GameSnapshot`.
- `src/App.tsx`: la instantánea se construye con `useMemo` (misma lista de 31 dependencias que el efecto anterior) y se pasa al hook. `enabled` es `false` en el inicio y en la entrada a la carrera, como antes.

## Por qué es un corte pequeño

`App.tsx` sigue con 1.738 líneas. Este corte aísla el guardado, pero no reduce el archivo. El estado de la ruleta, de las recompensas y de la carrera está entrelazado (ver `handleSeasonLuckWheel*` y `careerRewardFlow`), así que los siguientes cortes necesitan diseño propio antes de moverse.

## Diferencia de comportamiento

Antes, el efecto también se ejecutaba cuando cambiaba la pantalla entre dos pantallas guardables. Ahora solo se ejecuta si cambia la instantánea o si la pantalla pasa de no guardable a guardable. La instantánea no incluye la pantalla, así que el contenido guardado es el mismo.

## Validación

- `npm run typecheck`, `npx eslint src`, `npm test` (73 pruebas).
- `npm run qa:ci` y `npm run qa:tech-debt` en verde (build sin endpoint local).
- `npx playwright test`: 7 pruebas en verde.
- Comprobación directa: al pulsar "Simular" en la liga, la partida guardada cambia (`savedAt` se actualiza).
