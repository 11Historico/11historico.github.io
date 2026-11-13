# v0.25.116 — La crónica de la carta, con el resultado bien puesto

Sale de la observación 6 de la temporada de prueba de la v0.25.113. El usuario pidió «haz la 6».

**Lo que confundía:** la crónica decía «sin ella habrías perdido 0-1», con tus goles delante. El marcador del partido pone primero al local, así que, jugando fuera, se leía al revés. Los otros dos textos de este tipo, el del planteamiento y el del descanso, ya ponían primero los goles del que gana: «habrías perdido 1-0».

**Ahora** la carta va igual que ellos (`getMatchCardEffectText`, en `matchSequenceTimeline.ts`):
- **Primero los goles del que gana:** «sin ella habrías perdido 1-0» y «sin ella habrías ganado 1-0».
- **Si la carta no cambió el marcador,** ya no sale el resultado: «Tu carta no cambió el marcador: sin ella habría sido el mismo.» Es lo que ya hacía el planteamiento.
- **Los empates, y las cartas que cambian el marcador pero no el resultado,** no cambian.

Vale para Liga, Copa, Europa y Supercopa, antes del partido y en el descanso. No cambia nada del juego.

## Comprobación

- **`tests/unit/matchCards.test.ts`:** los textos actualizados, y dos casos nuevos: perder sin la carta y que la carta salga cara.
- Pasan `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` y `npm run test:e2e`.
