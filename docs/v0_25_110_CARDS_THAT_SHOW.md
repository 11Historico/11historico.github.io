# v0.25.110 — Cartas que se notan

Es la propuesta de `docs/INFORME_CARTAS_FUERZA_DESCANSO_v0_25_109.md`.

**Por qué:** el usuario jugó una carrera con cartas y dijo «usé, pero no modificaron los resultados». Un +4 solo cambiaba el resultado en 1 de cada 7 partidos, y nada le enseñaba lo que había hecho la carta.

**Lo que pidió el usuario:**
- las dos propuestas: enseñar qué cambia la carta y cartas más fuertes;
- jugar cartas en medio partido, solo en Copa y Europa, una por partido;
- medir antes de construir.

Con «haz las cartas v0.25.110» y «sí» al plan aprobó también bajar San Mamés y Fortín fuera a raras y resaltar la carta en uso.

## Lo que cambia para el jugador

**1. Las cartas valen el doble**

| Carta | Antes | Ahora |
| --- | --- | --- |
| +2 / +4 / +6 | +2 / +4 / +6 | +4 / +8 / +12 |
| Clásico | +5 | +10 |
| Revancha | +3 | +6 |
| Doble o nada | +6 | +12 |
| Mediocampo | +6 en el control y +2 en el resto | +12 en el control y +4 en el resto |
| Ataque total | goles esperados ×1,4 (rival ×1,1) | ×1,8 (rival ×1,2): unos +50 % de goles tuyos y +10 % del rival |
| Defensa total | goles esperados del rival ×0,6 | ×0,2: el rival marca un 55 % menos |

- **No cambian:** Fortín fuera, Portero inspirado, Efecto San Mamés, Remontada y Ojeador.
- **Rarezas:** San Mamés y Fortín fuera, que no se duplican, pasan de épicas a raras. Las épicas quedan en +12 y Doble o nada.
- **Las cartas guardadas:** los nombres internos no cambian, así que las que ya tengas en la mano pasan a valer el doble.

**2. Cartas en el descanso (Copa y Europa)**
- **Cuándo:** en la pausa del descanso, junto a «Seguir igual / Arriesgar / Cerrar el partido», aparecen tus cartas si no jugaste ninguna antes del partido. Eliges una (o ninguna) y después la decisión del descanso.
- **Cartas de media:** un 6 % de probabilidad de marcar un gol más en la segunda parte por cada punto de media equivalente, hasta un 90 %.
  - +8: 48 %;
  - +12: 72 %;
  - Clásico: 60 %;
  - Ataque total: 25 %;
  - Fortín fuera (fuera de casa): 38 %.
- **Defensa total:** cada gol del rival en la segunda parte tiene un 90 % de no llegar.
- **Portero inspirado:** la prórroga de Copa o los penaltis europeos, como antes del partido.
- **La Remontada no se puede jugar en el descanso:** allí ya sabes que vas perdiendo, así que sería un gol seguro.
- **El orden:** la carta se aplica después de la decisión del descanso.

**3. La crónica dice qué hizo la carta**
- **Ejemplos:**
  - «Tu carta cambió el partido: sin ella habrías empatado 1-1 a los 90 minutos»;
  - «Tu carta no cambió el marcador…»;
  - «Tu carta del descanso cambió el marcador, pero no el resultado…».
- **Cómo se calcula:** es el mismo partido sin la carta y con las mismas tiradas, como la comparación del planteamiento. Antes del partido se compara a los 90 minutos; en el descanso, la segunda parte.
- **Cuándo no sale:** si la decisión del descanso cambia el marcador, no se enseña la comparación de una carta jugada antes del partido. Ya no se podría comparar con la misma suerte.

**4. La carta en uso se ve:** lleva la etiqueta «EN USO» en dorado, con el mismo color en todas las rarezas, y las demás se apagan.

## Qué cambia en el código

- **`src/career/matchCards.ts`:**
  - los valores al doble, los textos y las rarezas;
  - `getMatchCardHalftimePlay`: el efecto y el texto de cada carta en el descanso.
- **`src/simulation/matchEngine.ts`:**
  - `teamRatingWithoutCard`: con él, `simulateMatch` juega también el partido sin la carta, con las mismas tiradas, y devuelve `cardEffect`;
  - `applyHalftimeCard`: la carta del descanso sobre la segunda parte, con tiradas propias;
  - `applyHalfTimeChoice` borra `cardEffect` si cambia el marcador.

  Sin carta, el partido es el de siempre.
- **`leagueSimulator.ts`, `supercopaRules.ts` y `europeanMatchEngine.ts`:** el rating sin la carta. En Europa, además, `halftimeCard`.
- **`europeanTournament.ts` y `europeanTypes.ts`:** el partido europeo guarda `cardEffect`.
- **`MatchCards.tsx` y `MatchCards.css`:** la mano en el descanso (`halftime`) y la carta en uso.
- **`MatchHalfTimeControl.tsx`, `MatchSequence.tsx` y `EuropeanMatchEvent.tsx`:** las cartas en el descanso y el texto de la crónica (`getMatchCardEffectText`).
- **`LeagueSimulatorView.tsx`:**
  - la carta del descanso en Copa y en Europa;
  - el rating sin la carta en todos los partidos con carta;
  - las notas de las cartas ya no se borran si «Saltar» no juega ningún partido.
- **`App.tsx`:** el rating sin la carta en la Supercopa.
- **Auditorías:** `audit:game-cards` mide el juego real, con el descanso jugado con las funciones del juego. Se retiran las filas de fuerza y su gancho; se reproducen con el commit `135cd5d`.

## Medición en el juego real

`npm run audit:game-cards`: 4.800 carreras, ninguna rechazada por plausibilidad.

| Cartas (media de los 4 casos) | Temporadas superadas | Copas por temporada | Títulos por temporada | Puntuación |
| --- | --- | --- | --- | --- |
| Sin cartas | 2,19 | 0,15 | 0,38 | 28,0 |
| Antes del partido, uso sensato | 2,77 | 0,28 | 0,65 | 39,2 (+40 %) |
| Antes del partido, en el siguiente partido | 2,81 | 0,15 | 0,47 | 36,6 (+31 %) |
| **Con el descanso, uso sensato** | 2,95 | 0,27 | 0,63 | 41,3 (**+48 %**) |

**Comparado con la v0.25.109** (+20 % con uso sensato), la puntuación sube bastante más. El informe preveía un +37 % para el descanso con ×2. En el juego sale algo más porque la carta del descanso va después de la decisión del descanso, y Defensa total anula el 90 % de los goles del rival en vez del 50 % de la medición. **Con el descanso**, unas 2,6 cartas por temporada se juegan en el descanso.

## Comprobación

- **`tests/unit/matchCards.test.ts`** (22 tests):
  - los valores y las rarezas;
  - las cartas en el descanso: el 6 % por punto, Defensa total, Portero inspirado y la Remontada no permitida;
  - `applyHalftimeCard` no cambia la primera parte;
  - la comparación con y sin carta, y que se borra si cambia el descanso;
  - los textos de la crónica.
- **Probado en el navegador:**
  - la carta en uso;
  - una carta en el descanso de Copa: un +8 marcó y la crónica lo cuenta;
  - Defensa total en el descanso europeo anuló el gol del rival;
  - sin errores en la consola.
- **`audit:league`:** la fila «(hoy)» sale idéntica.
- `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` y `npm run test:e2e` pasan.

## Observación (sin cambiar)

«Ganar al líder» cuenta desde la jornada 2, cuando el líder es cualquiera que ganara la jornada 1. En el navegador salió una carta por ganar al Osasuna en la jornada 2. Se podría pedir que cuente desde la jornada 5, por ejemplo. Queda para que el usuario decida.
