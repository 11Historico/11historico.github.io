# Cartas más fuertes y cartas en el descanso (v0.25.109)

**El contexto:** el usuario jugó una carrera con cartas y dijo «usé, pero no modificaron los resultados». Se propusieron dos cosas:
- **A:** enseñar en la crónica qué habría pasado sin la carta;
- **B:** cartas más fuertes.

El usuario pidió las dos y añadió jugar cartas en medio partido. Decidió:
- en el descanso, solo en Copa y Europa, que ya tienen esa pausa;
- una carta por partido, antes o en el descanso;
- medir antes de construir.

**No cambia el juego.**

## Resultado en una frase

**Una carta +4 solo cambia el resultado de 1 de cada 7 partidos; por eso no se nota.** Al doble de fuerza (×2) lo cambia en 2 de cada 7, y jugada en el descanso añade un gol que se ve en la segunda parte. Con las dos cosas, la puntuación sube un 37 % frente a jugar sin cartas (hoy, un 20 %), las Copas pasan de 0,15 a 0,24 por temporada y ninguna carrera queda rechazada.

## 1) Por qué no se notan: cuántas veces cambia el resultado

Es el mismo partido, con las mismas tiradas, jugado con la carta y sin ella. Equipo de 84 contra rivales de 84 y 88, en casa y fuera, 16.000 partidos por carta.

| Carta | Cambia el resultado |
| --- | --- |
| +2 | 8 % |
| **+4** | **14 %**: en 6 de cada 7 partidos habría salido lo mismo |
| +6 | 22 % |
| Defensa total | 22 % |
| Remontada | 23 % |
| +4 al doble (+8) | 28 % |
| +6 al doble (+12) | 41 % |
| Defensa total al doble | 43 % |

Cuando cambia, casi siempre es a mejor. Lo que da la carta es real, pero en un partido suelto casi nunca se ve, y el juego no enseña qué habría pasado sin ella. Eso es lo que arregla la propuesta A.

## 2) Carreras

**Script:** `npm run audit:game-cards -- "--only=hoy|uso sensato"`, en `scripts/auditGameCards.ts`.

> **Desde la v0.25.110** la fuerza ×2 y el descanso ya están en el juego, y la auditoría mide el juego real. Las filas de este informe se reproducen con el commit `135cd5d`.
- Usa las cartas del juego (`matchCards.ts`, v0.25.109) y el motor del juego.
- 300 carreras por caso: dificultad Normal y Fácil, con draft de mejor media y al azar.
- 8.400 carreras en total.

**La fuerza (B)** multiplica:
- las cartas de media: +2, +4, +6, Clásico, Revancha, Doble o nada y Mediocampo;
- Ataque total y Defensa total: con ×2, Ataque total da goles ×1,8 y Defensa total deja al rival en ×0,2.

No cambian el Efecto San Mamés (iguala medias), el Fortín fuera, el Portero inspirado ni la Remontada.

**En el descanso** (solo en auditoría, con un gancho del motor). La carta actúa sobre los goles de la segunda parte:
- **las cartas de media:** un 6 % de marcar un gol más por cada punto de media equivalente; un +4 da un 24 %;
- **Defensa total:** cada gol del rival en la segunda parte tiene un 50 % de no llegar;
- **Portero inspirado:** lo mismo que antes, en la prórroga o los penaltis;
- **la Remontada no se puede jugar en el descanso:** allí ya sabes que vas perdiendo, así que sería un gol seguro.

Con la fuerza, la probabilidad sube igual que las cartas (hasta un 90 %).

**El jugador de la auditoría en el descanso:** en Copa y Europa guarda la carta y la juega en el descanso solo si no va ganando. Fuera de las eliminatorias, solo si le sobran cartas.

Media de los cuatro casos:

| Cartas | Temporadas superadas | Copas por temporada | Títulos europeos por temporada | Títulos por temporada | Puntuación | Frente a sin cartas |
| --- | --- | --- | --- | --- | --- | --- |
| Sin cartas | 2,19 | 0,15 | 0,10 | 0,38 | 28,0 | - |
| **El juego de hoy (v0.25.109)** | 2,47 | 0,22 | 0,11 | 0,52 | 33,5 | +20 % |
| Fuerza ×1,5 | 2,70 | 0,24 | 0,13 | 0,58 | 37,3 | +33 % |
| Fuerza ×2 | 2,71 | 0,27 | 0,13 | 0,64 | 38,3 | +37 % |
| En el descanso | 2,57 | 0,20 | 0,12 | 0,49 | 34,3 | +23 % |
| En el descanso y fuerza ×1,5 | 2,71 | 0,21 | 0,12 | 0,52 | 36,5 | +30 % |
| **En el descanso y fuerza ×2** | 2,80 | 0,24 | 0,12 | 0,58 | 38,3 | **+37 %** |

Ninguna carrera queda rechazada por la regla de plausibilidad.

**Con el descanso**, unas 2,4 cartas por temporada se juegan en el descanso; antes del partido en las eliminatorias pasan de 4,2 a unas 2,8.

## Lo que dicen los datos

1. **El problema que notó el usuario es real.** Un +4 no cambia el resultado en 6 de cada 7 partidos, y nada le enseña que la carta ayudó.
2. **La fuerza ×2 hace que se note:** cambia el resultado de 2 a 3 veces más. La puntuación pasa del +20 % al +37 %. ×1,5 se queda a medio camino (+33 %).
3. **El descanso vale más o menos lo mismo que jugarla antes** (+23 % frente a +20 %), pero se ve más. La juegas sabiendo cómo va el partido y, si funciona, aparece un gol en la segunda parte. En Copa da algo menos que jugarla antes (0,20 frente a 0,22 por temporada), porque el gol de más llega con menos frecuencia que lo que da una carta durante 90 minutos.
4. **Juntas (descanso y ×2)** dan +37 %, 0,24 Copas y 0,58 títulos por temporada, con más supervivencia (2,80 temporadas).
5. **Inflación:** subir del +20 % al +37 % es lo que cuesta que las cartas se noten. El usuario dijo que aún no hay ranking real.

## Propuesta

Construir las tres cosas en la v0.25.110:
- **A, la crónica:** «Con la carta: 2-1 · Sin la carta: 1-1». Es el mismo partido sin la carta, con las mismas tiradas, como ya se hace con el planteamiento.
- **B, la fuerza ×2:**
  - las cartas de media pasan a +4, +8 y +12, Clásico a +10, Revancha a +6, Doble o nada a +12 y Mediocampo a +12 en el control y +4 en el resto;
  - Ataque total y Defensa total se duplican;
  - el resto no cambia.
- **El descanso en Copa y Europa:**
  - junto a «Seguir igual / Arriesgar / Cerrar el partido», puedes jugar una carta si no la has jugado antes del partido;
  - las cartas de media dan un 6 % de gol por punto (con ×2, un +8 daría un 48 %);
  - Defensa total anula cada gol del rival con un 50 % (con ×2, un 90 %);
  - el Portero inspirado vale para la prórroga o los penaltis;
  - la Remontada no se puede jugar en el descanso.

**Antes de construir conviene revisar dos cosas:**
- **Los textos de las cartas en el descanso:** «+8: 48 % de marcar un gol en la segunda parte» se entiende, pero hay que verlo en pantalla.
- **La fuerza ×2 en Fortín fuera y Portero inspirado:** no cambian, así que quedan relativamente más flojas. Con ×2 habría que recolocar las rarezas con una sonda nueva.

**Permiso:** construirlo toca el motor (el gol del descanso), las cartas, la previa, el descanso de Copa y Europa, la crónica y el balance. Sería la versión v0.25.110.

## Limitaciones

- **El jugador de la auditoría usa reglas fijas.** En el descanso juega si no va ganando; una persona elegiría mejor qué partidos merecen la carta.
- **El 6 % por punto en el descanso** es una propuesta de diseño; se puede afinar.
- **El gancho del descanso solo existe en la auditoría** (`scripts/auditCardTypes.vite.ts`). En el juego habría que construirlo de verdad.
