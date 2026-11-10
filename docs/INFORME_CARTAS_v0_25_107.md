# Cartas de partido (idea del usuario, v0.25.107)

**La idea del usuario (2026-11-10):**
- tienes X cartas por temporada y ganas más ganando partidos importantes;
- aparecen 6 cartas boca abajo y eliges 1 o 2;
- cada carta da un bonus para un partido, por ejemplo +4 de media.

Después pidió: «las cartas tienen que tener un impacto real, mide las cartas».

**No cambia el juego.** Las cartas solo existen dentro de la auditoría.

## Resultado en una frase

**Es la primera idea que se nota de verdad: usadas en las eliminatorias, las cartas fuertes dan un 60 % más de Copas.** Además hay una decisión real: la carta salva la Liga o gana títulos, según dónde la uses. Cuesta un +17-26 % de puntuación y no hace que el ranking rechace ninguna carrera.

## Método

**Script:** `npm run audit:cards`, en `scripts/auditCards.ts`.
- Las cartas entran en el simulador de carreras de las auditorías (`scripts/auditCareerRunner.ts`) con un gancho opcional.
- Sin cartas, las carreras son exactamente las de antes.

**Carreras:** 300 por caso, con las funciones reales del juego.
- Cuatro casos: dificultad normal y fácil, con el draft de mejor media y con el draft al azar.
- En la Copa y en Europa, el jugador decide bien el planteamiento y el descanso, como el de hoy.
- Las cifras de abajo son la media de los cuatro casos, comparada con el jugador sin cartas.

**Las cartas:**
- **Efecto:** suman lo mismo a todas las líneas del rating de simulación durante un partido. Ese rating ya está comprimido: +1 equivale a unos +1,8 visibles.
- **Al empezar la temporada:** 2 cartas.
- **Para ganar más:** +1 por cada eliminatoria superada, de Copa o europea.
- **Límite:** 3 en la mano. Caducan al acabar la temporada.
- **Robo:** común al 50 %, rara al 35 % y épica al 15 %.
  - **Opción B:** eliges 2 boca abajo y te quedas la mejor.
  - **Opción A:** eliges 1.
- **Uso:** como mucho una carta por partido, siempre la mejor que tengas.

**Mazos:**

| Mazo | Común | Rara | Épica | Bonus medio con la opción B |
| --- | --- | --- | --- | --- |
| Normal | +1 | +2 | +4 | +2,3 |
| Fuerte | +2 | +4 | +6 | +4,1 |
| Muy fuerte | +3 | +5 | +8 | +5,3 |

Los valores son de simulación. En rating visible, el mazo fuerte equivale a +4, +7 y +11.

**Formas de usarlas:**
- en el siguiente partido;
- solo en eliminatorias;
- en eliminatorias, y las que sobren en las últimas jornadas de Liga (de la 36 a la 38, cuando ya se han jugado la final de Copa y la europea);
- en eliminatorias y contra los grandes de Liga;
- al azar.

**Sin cartas**, el jugador de hoy:
- supera 2,19 temporadas;
- gana 0,15 Copas por temporada;
- gana 0,38 títulos por temporada;
- tiene una puntuación media de 28.

## Resultados

| Cartas | Ganadas por temporada | Usadas en eliminatorias | Temporadas superadas | Puntos de Liga en la 1.ª | Copas por temporada | Títulos por temporada | Puntuación |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Fuertes:** en el siguiente partido | 4,5 | 0,1 | +0,22 | +0,8 | −0,01 | −0,02 | +6 % |
| **Fuertes:** solo en eliminatorias | 5,1 | 4,1 | +0,26 | 0,0 | +0,08 | +0,11 | +17 % |
| **Fuertes:** eliminatorias y lo que sobre en Liga | 5,1 | 4,1 | +0,27 | +0,4 | +0,09 | +0,11 | +18 % |
| **Fuertes:** eliminatorias y grandes de Liga | 4,5 | 0,4 | +0,26 | +0,9 | +0,02 | +0,02 | +12 % |
| **Fuertes:** al azar | 4,4 | 0,3 | +0,21 | +0,8 | 0,00 | −0,01 | +6 % |
| **Normales:** en el siguiente partido | 4,5 | 0,1 | +0,05 | +0,5 | −0,02 | −0,02 | 0 % |
| **Normales:** eliminatorias y lo que sobre | 4,9 | 4,0 | +0,16 | +0,2 | +0,06 | +0,07 | +10 % |
| **Normales:** al azar | 4,5 | 0,3 | +0,13 | +0,6 | 0,00 | 0,00 | +5 % |
| **Muy fuertes:** en el siguiente partido | 4,5 | 0,1 | +0,28 | +1,0 | −0,01 | −0,01 | +11 % |
| **Muy fuertes:** eliminatorias y lo que sobre | 5,2 | 4,2 | +0,41 | +0,5 | +0,12 | +0,17 | +26 % |
| **Fuertes, opción A** (1 de 6 boca abajo) | 5,0 | 4,1 | +0,17 | +0,2 | +0,07 | +0,09 | +13 % |
| **Fuertes, sin ganar cartas** (solo 2 por temporada) | 2,0 | 1,9 | +0,03 | +0,1 | +0,02 | +0,01 | +1 % |
| **Fuertes, con carta de consolación** al quedar eliminado | 6,1 | 4,1 | +0,34 | +0,6 | +0,09 | +0,14 | +22 % |
| **Fuertes, también al ganar a un grande de Liga** | 6,2 | 4,1 | +0,41 | +0,6 | +0,10 | +0,15 | +26 % |

Las filas de los tres mazos usan la opción B, eligen 2 y se quedan la mejor. La opción A, sin ganar cartas, la carta de consolación y ganar contra un grande se probaron con el mazo fuerte, usando las cartas en eliminatorias y gastando las que sobren en las últimas jornadas de Liga.

**El margen:**
- en cada caso, ±0,2 temporadas y ±0,9 puntos;
- en la media de los cuatro casos, más o menos la mitad;
- en las Copas por temporada, unas ±0,01-0,02.

**Ninguna carrera queda rechazada** por la regla de plausibilidad del ranking: 18.000 simuladas.

## Lo que dicen los datos

1. **El impacto se ve en los títulos.** Con las cartas fuertes en las eliminatorias, las Copas pasan de 0,15 a 0,24 por temporada, un 60 % más. Los títulos totales suben de 0,38 a 0,49 por temporada.
   - Una carta de +4 en una ronda de Copa son unos 7 puntos más de pasarla. Encadenadas en cuartos, semifinal y final, se notan.
   - En Liga la misma carta vale unas 0,2 puntos (sondeo previo).
2. **Hay una decisión de verdad.**
   - Usadas en Liga suman puntos (+0,8 por temporada) y ayudan a sobrevivir (+0,22 temporadas), pero no dan títulos.
   - Usadas en eliminatorias dan títulos y casi lo mismo en supervivencia (+0,26), pero no suman puntos de Liga.
   - Si vas mal en la tabla, la carta salva la temporada. Si vas bien, gana la Copa. La mejor opción depende de cómo va la temporada, y eso es lo que no tenían las ideas I2 e I3.
3. **Lo que da el impacto es ganar cartas, no tenerlas.**
   - Sin ganar cartas, con solo 2 por temporada, casi no se nota (+1 % de puntuación).
   - Pasar una eliminatoria da otra carta para la siguiente, y eso hace que una buena racha de Copa se refuerce.
   - La carta de consolación compensa un poco a quien queda eliminado.
4. **Elegir 2 y quedarte con una (opción B) vale más que elegir 1 (opción A):** +4,1 frente a +3,3 de bonus medio. La puntuación sube un 18 % frente a un 13 %.
5. **El mazo normal se queda corto** para que se note en Liga: +0,05 temporadas usándolas en el siguiente partido. El fuerte es el primero en que se nota en todas partes.
6. **Inflación:** usando bien las fuertes, la puntuación sube un 17-18 %. Se queda en +26 % con lo más generoso. Comparado con lo que ya se midió:
   - los comodines sin tope inflaban un 53 % (v0.25.107);
   - las decisiones con más peso, hasta un 80 % (v0.25.87).

## Propuesta de diseño

Partiendo de los datos:

| Parte | Propuesta |
| --- | --- |
| Mazo | **Fuerte:** +2, +4 y +6 en simulación; en rating visible, +4, +7 y +11 |
| Cuántas | 2 al empezar la temporada, como máximo 3 en la mano, y caducan al acabar la temporada |
| Cómo se ganan | +1 al pasar una eliminatoria (Copa o europea) |
| Carta de consolación | Al quedar eliminado de la Copa o de Europa. Es opcional: cuesta unos 4 puntos más de inflación, y recomiendo dejarla fuera de la primera versión |
| Cómo se roba | Opción B: 6 boca abajo, eliges 2, se dan la vuelta y te quedas con 1 |
| Cuándo se usa | En la previa de cualquier partido de Liga, Copa o Europa, como mucho una por partido. Se aplica antes de simular, así que «nada delata el resultado» se cumple. El orden de los partidos no cambia |

**Lo que queda por decidir antes de construir:**
- **Cómo se enseña el bonus:**
  - con el valor visible (+4, +7, +11), aplicado antes de la compresión;
  - o con el valor de simulación (+2, +4, +6).

  El efecto es el mismo; lo que cambia es lo que lee el jugador.
- **La Supercopa:** en la auditoría no se usan cartas en ella.
- **El ranking:** la puntuación sube un 17-18 %. Las carreras jugadas con cartas no serían comparables con las de antes.
  - Se puede aceptar.
  - Se puede compensar en la fórmula, lo que toca la fórmula del ranking.
  - Se pueden separar las carreras con cartas.

**Permiso:** construirlo toca el modo carrera, la entrada del simulador, las recompensas y el guardado de la partida. Sería una fase nueva con su versión.

## Limitaciones

- **El jugador de la auditoría usa reglas fijas.** No mira la tabla: no gasta la carta en Liga solo cuando peligra el objetivo. Una persona que mezcle las dos cosas sacaría algo más que cualquiera de las filas.
- **Sin cartas en la Supercopa.**
- **El bonus se aplica después de la compresión de carrera.** Si en el juego se aplicara antes, habría que multiplicar los valores por 1,8 para tener el mismo efecto.
- **No mide cómo se siente:** robar boca abajo y la animación de las cartas son cosa de la interfaz.
