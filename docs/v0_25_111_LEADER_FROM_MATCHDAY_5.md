# v0.25.111 — Ganar al líder, desde la jornada 5

**Por qué:** al probar la v0.25.110 en el navegador salió una carta por ganar al Osasuna en la jornada 2. El Osasuna era el líder solo por haber ganado la jornada 1. Con la regla de antes, «ganar al líder» contaba desde la jornada 2, cuando el líder es cualquiera, y la carta salía casi regalada.

**Lo que pidió el usuario:** «sí, desde la jornada 5».

## La regla

- **Cuándo da carta:** ganar en Liga al líder (si el líder no eres tú) da carta solo **desde la jornada 5**.
- **Lo demás no cambia.**

## Qué cambia en el código

- **`src/career/matchCards.ts`:** la constante `MATCH_CARD_LEADER_FROM_MATCHDAY = 5` y el dato `leagueMatchday` en lo que pasa después del partido.
- **`src/simulation/leagueSimulator.ts`:** `getNextUserMatchInfo` da la jornada de Liga.
- **`LeagueSimulatorView.tsx`:** pasa la jornada al resolver las cartas.
- **Textos:** la portada y la mano vacía dicen «al ganar al líder (desde la jornada 5)».
- **`audit:game-cards`:** pasa la jornada.

## Medición en el juego real

`npm run audit:game-cards`: 4.800 carreras, ninguna rechazada por plausibilidad.

| Cartas (media de los 4 casos) | Puntuación en la v0.25.110 | Puntuación ahora | Copas por temporada |
| --- | --- | --- | --- |
| Antes del partido, uso sensato | +40 % | +37 % | 0,28 |
| Antes del partido, en el siguiente partido | +31 % | +25 % | 0,15 |
| Con el descanso, uso sensato | +48 % | +43 % | 0,26 |

Las cartas por ganar al líder bajan de unas 0,7-0,8 por temporada a 0,5-0,6. Las Copas apenas cambian.

## Comprobación

- **`tests/unit/matchCards.test.ts`:** la carta por ganar al líder sale en la jornada 5 y no en la 4.
- `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` y `npm run test:e2e` pasan.
