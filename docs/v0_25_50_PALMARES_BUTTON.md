# v0.25.50 — Ver el palmarés desde la pantalla de liga

## Problema

En mitad de temporada no se puede consultar el palmarés: solo aparece al terminar una temporada o al final de la partida.

## Cambio

- `src/components/LeagueSimulatorView.tsx`: en la fila de acciones de la liga, en modo carrera, aparece el botón "Ver palmarés". Al pulsarlo se muestra el palmarés debajo de la tarjeta de acciones, y el mismo botón lo oculta.
- `src/App.tsx`: pasa `careerTrophyCounts` a la pantalla de liga, solo en modo carrera.
- `src/components/PalmaresTrophyCase.tsx`: `summary` pasa a ser opcional. En modo carrera basta con `trophyCounts`. Las partidas sueltas siguen igual.

## Validación

- `npm run typecheck` y `npx eslint src scripts`: sin errores.
- `npm test`: 99/99.
- `npm run qa:ci`: 30 scripts en verde.
- `npx playwright test`: 12/12.
- Pendiente: comprobación visual del botón y del panel en una carrera.
