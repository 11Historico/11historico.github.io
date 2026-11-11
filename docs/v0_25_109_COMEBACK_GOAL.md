# v0.25.109 — Remontada con gol

Es la propuesta de `docs/INFORME_REMONTADA_v0_25_108.md`. El usuario la pidió con «haz la Remontada nueva».

## Por qué

La Remontada de la v0.25.108 subía +12 la media de la segunda parte si ibas perdiendo al descanso, y casi no hacía nada. Cuando se activaba, solo se ganaba el 7 % de esos partidos (`docs/INFORME_CARTAS_JUEGO_REAL_v0_25_108.md`).

## La regla

**Remontada (rara):** «Si vas perdiendo al descanso, marcas un gol en la segunda parte. Se gasta aunque no vayas perdiendo».
- **El gol:** lleva goleador y minuto (del 46' al 90'). El resto del partido no cambia.
- **El gasto:** la carta se gasta siempre. Así vale lo de una rara, como un +4,5 de media en Liga y un +5,5 en eliminatorias. Si solo se gastara al activarse valdría como un +16, más que cualquier épica.
- **Cuándo jugarla:** cuando crees que vas a ir perdiendo, contra un rival mejor o fuera de casa.
- **En la Copa y en Europa:** la decisión del descanso («Arriesgar» o «Cerrar el partido») se aplica después, como siempre, sobre la segunda parte con el gol.

## Qué cambia en el código

- **`src/simulation/matchEngine.ts`:**
  - `MatchCardEffect.comebackGoal` sustituye a `comeback` (la media de más en la segunda parte);
  - `addComebackGoal` añade el gol con tiradas propias, así que no mueven las del partido;
  - se retiran `addToAllLines` y `mergeComebackSecondHalf`.

  Sin carta, el partido es exactamente el de antes.
- **`src/career/matchCards.ts`:**
  - el efecto de la Remontada y su texto;
  - la carta se gasta siempre;
  - la nota de la crónica dice si marcaste o si se gastó sin activarse.
- **Auditorías:**
  - en `audit:game-cards`, la Remontada vale +4,5 / +5,5 para decidir cuándo jugarla;
  - se retiran las variantes y su gancho del motor; los números del informe se reproducen con el commit `e758e04`.

## Partidas guardadas

Una Remontada que ya estuviera en la mano funciona con la regla nueva.

## Medición en el juego real

`npm run audit:game-cards`: 3.600 carreras con las cartas y el motor del juego, ninguna rechazada por plausibilidad.

| Cartas (media de los 4 casos) | Temporadas superadas | Copas por temporada | Títulos por temporada | Puntuación |
| --- | --- | --- | --- | --- |
| Sin cartas | 2,19 | 0,15 | 0,38 | 28,0 |
| Uso sensato | 2,47 | 0,22 | 0,52 | 33,5 (+20 %) |
| En el siguiente partido | 2,45 | 0,15 | 0,42 | 31,6 (+13 %) |

**Con la Remontada anterior** eran +18 % y +11 %. El informe de la Remontada preveía +21 % para esta regla; la pequeña diferencia viene de las tiradas del gol, que en la auditoría eran otras.

**La Remontada con uso sensato:** se juega 0,53 veces por temporada, y en esos partidos se gana el 73 % y se pierde el 24 %.

## Comprobación

- **`tests/unit/matchCards.test.ts`:**
  - la Remontada se gasta siempre, con la nota de la crónica correcta;
  - en el motor, si vas perdiendo al descanso hay un gol tuyo más en la segunda parte, con goleador; si no, el partido es idéntico.
- **`audit:league`:** la fila «(hoy)» sale idéntica.
- `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` y `npm run test:e2e` pasan.
