# La Remontada nueva (v0.25.108)

El usuario pidió: «mide la Remontada nueva».

**No cambia el juego.**

## Resultado en una frase

**«Si vas perdiendo al descanso, marcas un gol en la segunda parte» funciona, pero si la carta solo se gasta al activarse es demasiado fuerte: vale como un +16 por carta gastada. Si se gasta siempre, vale como un +5, lo de una rara.** En carreras, la puntuación sube un 21 % en vez del 19 % de la Remontada de ahora, y ninguna carrera queda rechazada.

## Por qué

La Remontada del juego (+12 en la segunda parte) casi no hace nada (`docs/INFORME_CARTAS_JUEGO_REAL_v0_25_108.md`). La propuesta A del informe era cambiarla por un gol.

## Método

**Script:** `npm run audit:game-cards -- "--only=hoy|Remontada"`, en `scripts/auditGameCards.ts`.

> **Desde la v0.25.109** la Remontada con gol que se gasta siempre ya está en el juego, y la auditoría deja de tener las variantes. Estos números se reproducen con el commit `e758e04`.

- **Las variantes nuevas** solo existen en la auditoría, con un gancho en el motor (`comebackGoal` en `scripts/auditCardTypes.vite.ts`). Si vas perdiendo al descanso, se añade un gol tuyo en la segunda parte, con goleador y minuto. Sin el gancho, el partido es el de siempre.
- **Las filas de los informes anteriores salen idénticas.**

**Sonda:**
- 12 equipos del draft de mejor media, en dificultad Normal;
- 250 partidos por equipo y caso;
- rivales de tu media −4, igual, +4 y +8, en casa y fuera.

Mide la Liga en puntos y las eliminatorias en probabilidad de pasar, con prórroga y penaltis.

**Carreras:** las cartas del juego (`matchCards.ts`).
- Cuatro casos: dificultad Normal y Fácil, con draft de mejor media y al azar.
- 300 carreras por caso; 8.400 en total.
- Para decidir qué carta juega, el jugador de la auditoría da a la Remontada lo que vale según la sonda.

## 1) Cuánto vale cada Remontada en un partido

Vas perdiendo al descanso en el 30 % de los partidos.

| Remontada | Liga: equivale a | Liga: puntos si se activa | Eliminatoria: equivale a | Eliminatoria: pasar si se activa | Por carta gastada (Liga · eliminatoria) |
| --- | --- | --- | --- | --- | --- |
| +12 la segunda parte (la del juego) | +0,3 | +0,10 | 0,0 | −0,3 pts | +1,2 · −0,1 |
| +24 la segunda parte | +0,6 | +0,19 | +0,5 | +4,4 pts | +2,2 · +1,5 |
| **Un gol; solo se gasta si se activa (A)** | +4,5 | **+0,92** | +5,5 | **+36,8 pts** | **+16,1 · +17,5** |
| **Un gol; se gasta siempre** | +4,5 | +0,92 | +5,5 | +36,8 pts | **+4,5 · +5,5** |
| 50 % de marcar el gol; solo se gasta si se activa | +1,9 | +0,41 | +1,9 | +13,6 pts | +6,9 · +5,9 |

«Equivale a» es por partido en que la llevas, se active o no. «Por carta gastada» divide por las veces que se gasta.

**Comparadas con el resto del mazo:** una común vale unos +2, una rara unos +4-5 y una épica unos +6.

## 2) Carreras

Media de los cuatro casos:

| Remontada | Temporadas superadas | Copas por temporada | Títulos por temporada | Puntuación | Frente a sin cartas |
| --- | --- | --- | --- | --- | --- |
| Sin cartas | 2,19 | 0,15 | 0,38 | 28,0 | - |
| +12 la segunda parte (la del juego) | 2,45 | 0,22 | 0,52 | 33,2 | +19 % |
| +24 la segunda parte | 2,41 | 0,22 | 0,51 | 32,6 | +17 % |
| Un gol; solo se gasta si se activa | 2,57 | 0,22 | 0,52 | 35,0 | +25 % |
| Un gol; solo se gasta si se activa, en el siguiente partido | 2,56 | 0,16 | 0,41 | 32,9 | +18 % |
| **Un gol; se gasta siempre** | 2,50 | 0,22 | 0,51 | 33,9 | **+21 %** |
| 50 % de marcar el gol | 2,55 | 0,23 | 0,53 | 34,7 | +24 % |

Salvo en una fila, todas con uso sensato. El margen de la puntuación es de unos ±1,5 en la media de los cuatro casos. Ninguna carrera queda rechazada por plausibilidad.

**Cuando la carta se juega** (uso sensato, los cuatro casos):

| Remontada | Usada por temporada | Ganados con ella | Perdidos con ella |
| --- | --- | --- | --- |
| +12 (la del juego) | 0,35 | 7 % | 67 % |
| +24 | 0,38 | 12 % | 62 % |
| Un gol; solo se gasta si se activa | 0,45 | 43 % | 25 % |
| Un gol; se gasta siempre | 0,49 | 71 % | 23 % |
| 50 % de marcar el gol | 0,38 | 24 % | 42 % |

En las variantes que solo se gastan al activarse, la tabla cuenta los partidos en que ibas perdiendo al descanso. En la que se gasta siempre cuenta todos los partidos en que la jugaste, por eso gana tantos.

## Lo que dicen los datos

1. **Subir la media de la segunda parte no sirve, ni con +24.** Ganar media mueve poco los goles en 45 minutos.
2. **El gol sí cambia el partido:** si vas perdiendo al descanso, casi un punto más en Liga y un 37 % más de pasar una eliminatoria.
3. **Que solo se gaste al activarse la hace demasiado fuerte.** Juegas la carta en cada partido hasta que te hace falta, y entonces vale como un +16. Es más que cualquier épica, y la puntuación sube hasta el +25 %.
4. **Si se gasta siempre, vale lo de una rara (+4,5 en Liga, +5,5 en eliminatoria)** y la puntuación queda en el +21 %. Además hay una decisión de verdad: la juegas cuando crees que vas a ir perdiendo, contra un rival mejor o fuera de casa, y si al descanso vas ganando o empatando, la has gastado.
5. **El 50 % de marcar** queda entre medias (+6-7 por carta gastada), pero es una lotería dentro de otra.

## Propuesta

**Remontada: «Si vas perdiendo al descanso, marcas un gol en la segunda parte. La carta se gasta aunque no vayas perdiendo».**
- Sigue siendo rara.
- En el juego, el gol se añade a la segunda parte del partido con su goleador, como el gol de la decisión «Arriesgar» en el descanso.
- La crónica lo cuenta: «Remontada: gol en la segunda parte».

**Permiso:** construirlo toca el motor de partidos, el texto de la carta y su regla de gasto en `matchCards.ts`. Sería una versión nueva, la v0.25.109.

## Limitaciones

- **El gol se añade sin quitar ninguno de los que ya había.** Si el partido ya iba a acabar en remontada, la carta suma uno más.
- **El jugador de la auditoría no sabe si va a ir perdiendo.** Una persona juega la carta contra rivales mejores, donde rinde más, así que la sacaría algo más de partido.
