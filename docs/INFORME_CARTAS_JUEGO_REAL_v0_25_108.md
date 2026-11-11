# Las cartas en el juego real (v0.25.108)

El usuario pidió: «mide las cartas en el juego real».

**No cambia el juego.**

## Resultado en una frase

**Las cartas del juego dan lo que prometía la medición: con un uso sensato, las Copas suben de 0,15 a 0,22 por temporada y la puntuación un 18 %, sin ninguna carrera rechazada.** Pero la Remontada real casi no hace nada; la auditoría anterior la sobrevaloraba.

## Método

**Script:** `npm run audit:game-cards`, en `scripts/auditGameCards.ts`.

**Qué es del juego real:**
- **Las cartas:** salen de `src/career/matchCards.ts`, lo mismo que usa el juego. Eso incluye el mazo, los sorteos con su semilla, el efecto de cada carta según el partido y lo que pasa después: gastar la carta, Revancha, Remontada, Doble o nada, las cartas ganadas y la mano llena.
- **El motor:** el del juego. La Remontada juega la segunda parte con +12, sin aproximaciones.
- **La previa de Liga:** la del juego (`getNextUserMatchInfo`), con la forma de temporada del rival, para el Clásico y el Efecto San Mamés.

**Lo que decide el jugador de la auditoría:**
- **En los sorteos:** coge una carta a ciegas. Si el Ojeador le enseña una que vale más que la media, se queda esa.
- **Uso sensato:**
  - en las eliminatorias, juega la mejor carta;
  - en Liga, solo gasta las que le sobran y empieza por la que menos vale en una eliminatoria;
  - desde la jornada 36, gasta lo que le quede.
- **En el siguiente partido:** juega la mejor carta que valga en cada partido, mientras le queden.

**Carreras:** las de siempre.
- Dificultad Normal y Fácil, con draft de mejor media y al azar.
- 300 carreras por caso: 3.600 en total, contando las de sin cartas.
- La Copa y Europa se deciden bien, como en las otras auditorías.

## Resultados

Media de los cuatro casos:

| Cartas | Temporadas superadas | Puntos en la 1.ª | Copas por temporada | Títulos por temporada | Puntuación | Frente a sin cartas |
| --- | --- | --- | --- | --- | --- | --- |
| Sin cartas (hoy) | 2,19 | 58,4 | 0,15 | 0,38 | 28,0 | - |
| **Cartas del juego, uso sensato** | 2,44 | 58,8 | **0,22** | **0,51** | 33,1 | **+18 %** |
| Cartas del juego, en el siguiente partido | 2,40 | 59,5 | 0,16 | 0,42 | 31,0 | +11 % |

Ninguna carrera queda rechazada por la regla de plausibilidad.

**Comparado con lo que se midió antes** (mazo retocado, `docs/INFORME_TIPOS_CARTAS_v0_25_107.md`):

| | Puntuación con uso sensato | Puntuación en el siguiente partido |
| --- | --- | --- |
| Medido antes | +18 % | +21 % |
| **Juego real** | **+18 %** | **+11 %** |

**Cartas por temporada** (uso sensato):
- 4 al empezar;
- 0,6 al llegar a cuartos de Copa y 0,3 al llegar a la final;
- 0,7 por ganar al líder;
- 0,8 por rachas;
- 0,6 de Europa.

Unas 1,6 vuelven a la mano cada temporada: la Remontada que no se activa y la Revancha. Casi nunca se pierden por tener la mano llena ni por Doble o nada (0,1 y 0,06 por temporada).

**Qué cartas se usan** (uso sensato, por temporada):

| Carta | Usadas | Ganados con ella | Perdidos con ella |
| --- | --- | --- | --- |
| Mediocampo | 0,72 | 65 % | 27 % |
| +2 | 0,70 | 56 % | 27 % |
| Ataque total | 0,67 | 60 % | 28 % |
| Revancha | 0,63 | 66 % | 24 % |
| Ojeador | 0,61 (en sorteos) | - | - |
| Defensa total | 0,53 | 73 % | 23 % |
| +4 | 0,52 | 73 % | 24 % |
| Portero inspirado | 0,51 | 75 % | 25 % |
| Remontada | 0,38 | **10 %** | **67 %** |
| Clásico | 0,37 | 45 % | 38 % |
| +6 | 0,31 | 75 % | 24 % |
| Fortín fuera | 0,28 | 71 % | 27 % |
| Doble o nada | 0,27 | 76 % | 22 % |
| Efecto San Mamés | 0,14 | 48 % | 23 % |

## Lo que dicen los datos

1. **Con un uso sensato, el juego da lo medido.** La puntuación sube un 18 %, las Copas un 47 % (de 0,15 a 0,22) y los títulos de 0,38 a 0,51 por temporada, igual que en el informe de los retoques.
2. **Gastarlas en el siguiente partido rinde menos de lo que se midió:** un 11 % en vez de un 21 %. La diferencia la explica sobre todo la Remontada (punto 3), que en ese uso se juega mucho.
3. **La Remontada real casi no hace nada.**
   - Medido aparte, con 6.000 partidos por caso entre tu media y la del rival (igual o +4), en casa y fuera: en los partidos que ibas perdiendo al descanso, sin carta sacas 0,13-0,48 puntos y con la Remontada, 0,19-0,50. Es casi lo mismo.
   - Con +24 en vez de +12 sube algo más, a 0,41-0,55.
   - **La auditoría anterior la sobrevaloraba.** Repetía el partido entero con más media, así que a menudo ya no ibas perdiendo al descanso: era como volver a tirar el partido. Así salía entre 0,32 y 0,85.
   - En el juego, cuando se activa, se gana el 10 % de esos partidos y se pierde el 67 %.
4. **Hay decisión:** guardarlas para las eliminatorias da Copas (0,22 frente a 0,16); gastarlas en el siguiente partido da más puntos de Liga (59,5 frente a 58,8).
5. **Las demás cartas se comportan como se esperaba.** Las que más ganan son las fuertes (+4, +6, Defensa total, Doble o nada y Fortín fuera). Clásico y San Mamés ganan menos porque solo se usan contra rivales mejores.

## Propuesta (no aplicada)

**Arreglar la Remontada.** Así no vale ni lo de una común, y la carta dice algo que en la práctica no se nota. Dos opciones, para medir antes de decidir:
- **A: «Si vas perdiendo al descanso, marcas un gol en la segunda parte».** Es claro y fácil de ver en la crónica. Casi siempre convierte una derrota por un gol en un empate.
- **B: una segunda parte de verdad más fuerte**, por ejemplo +30. El número sería grande y raro de leer en una carta.

Recomiendo medir la A.

## Limitaciones

- **El jugador de la auditoría usa reglas fijas.** Una persona que mire la tabla o el cuadro de Copa sacaría algo más de las cartas.
- **Lo que vale cada carta para decidir** sale de la sonda del informe anterior, que daba a la Remontada un valor de +1,5 que en el juego no tiene. Con el valor real la usaría menos, y el uso sensato rendiría algo más.
