# Europa, recorrido a recorrido (v0.25.118)

Las dos últimas versiones (v0.25.117 y v0.25.118) arreglaron fallos de Europa que solo se veían jugando. El usuario pidió «mide Europa»: jugar en el navegador los recorridos que aún no había visto y apuntar lo que falle.

**Es solo una auditoría:** no cambia el juego.

## Cómo se ha medido

- **En el navegador,** con la partida de prueba `career-strong` y la Conference League. El torneo se deja en el estado de cada recorrido con `applyEuropeanMatchResult`, que es la misma función que usa el juego. Luego se juega el resto de la temporada hasta el resumen y la pantalla de entre temporadas.
- **En cada recorrido se mira:** la pestaña de Europa, el cuadro, la tabla, la tarjeta «Próximo», el resumen de la temporada, el resumen completo y el prestigio europeo.
- **Los desempates, con una simulación:** 2.000 torneos por casilla (3 competiciones × medias de 82, 85 y 88), con el motor europeo y semilla fija.
- **No hubo errores en la consola** en ningún recorrido.

## Lo que se ve en cada recorrido

| Recorrido | Pestaña de Europa | Resumen de la temporada | Prestigio (entre temporadas) |
| --- | --- | --- | --- |
| Fuera en la fase de liga (7.º) | «Clasificación europea», solo la tabla. Nada dice que estás fuera. | «Europa: caíste en la fase inicial (7.º de 7).» | No hay bonus. |
| Previa pendiente (3.º) | «Cuadro europeo», con la previa y la tabla. **La tabla te pone 2.º, en verde.** | — | — |
| Fuera en la previa | El cuadro, bien. **La tabla sigue poniéndote 2.º.** | «caíste en la previa (3.º de 7)». | No hay bonus. |
| Fuera en la semifinal | El cuadro, bien. | «Europa: pasaste a semifinales.» | «Semifinalista de Conference League…», sin bonus. |
| Final pendiente | El cuadro, con la final «Visitante · vs Dinamo Tbilisi». | — | — |
| Final perdida | El cuadro, bien. | **«Europa: pasaste a semifinales.»** | «Subcampeón» en el resumen completo. |
| Campeón | El cuadro, bien. | **«Europa: pasaste a semifinales.»** | «Campeón de Conference League…», con bonus. |

## Hallazgos

### 1. La tabla europea y la regla deshacen los empates de forma distinta (fallo)

- **Qué pasa:** el último desempate de la tabla es el nombre (`compareRows`, en orden alfabético).
  - La regla que decide quién pasa (`getEuropeanLeaguePhaseUserPosition`) te llama `"user"`.
  - La tabla que ves te llama «Athletic Club Histórico».
  - Si empatas en puntos, diferencia de goles y goles a favor, la «A» te pone delante de casi todos en la tabla, mientras que la «u» de la regla te pone detrás.
- **En el navegador:**
  - Athletic, Vaduz y Víkingur acaban con 9 puntos, diferencia de goles 0 y los mismos goles.
  - La tabla te pone 2.º, en verde, que sería pasar directo a semifinales.
  - El juego te manda a la previa como 3.º. Después de perderla, el resumen dice «caíste en la previa (3.º de 7)», y la tabla sigue diciendo 2.º.
- **Cuánto pasa** (2.000 torneos por casilla):

| Competición | Media | Empate total, decidido por el nombre | De esos, los ganas | La tabla no coincide con la regla | La tabla te pone en otra zona |
| --- | --- | --- | --- | --- | --- |
| Conference | 82 / 85 / 88 | 4,7 / 3,4 / 2,4 % | 24 / 25 / 23 % | 3,0 / 2,0 / 1,6 % | 1,2 / 1,1 / 0,8 % |
| Europa League | 82 / 85 / 88 | 3,5 / 4,2 / 4,0 % | 13 / 16 / 7 % | 2,6 / 2,9 / 3,1 % | 0,8 / 1,1 / 1,4 % |
| Champions | 82 / 85 / 88 | 1,9 / 2,4 / 3,5 % | 0 / 0 / 0 % | 1,6 / 2,1 / 2,9 % | 0,3 / 0,7 / 1,1 % |

  - **Zona** quiere decir semifinales (1.º-2.º), previa (3.º-4.º) o fuera (5.º-7.º). En 1 de cada 100 torneos, más o menos, la tabla te enseña en una zona y el juego te trata como si estuvieras en otra.
  - **Además, el desempate te perjudica:** con `"user"` pierdes casi todos los empates totales, entre el 75 % y el 100 %. Contra los rivales que empiezan por A a T, siempre.

### 2. El resumen de la temporada no cuenta cómo acabó Europa

- **El resumen de la temporada** (`getEuropeanSeasonBalanceText`) solo habla de la fase de liga. Si pasas a semifinales, dice «Europa: pasaste a semifinales» y ya está.
- **No dice nada de lo que pasó después:** ni que caíste en la semifinal, ni que perdiste la final, ni que eres campeón.
- La tarjeta «Europa» del resumen habla de la plaza para la próxima temporada, no de esta.
- **Ganar la Conference solo se ve** en la pantalla de la final, en el prestigio de entre temporadas y en el palmarés. En el resumen de la temporada, no.

### 3. Fuera en la fase de liga, la pestaña no lo dice (detalle)

Con la fase de liga acabada y fuera de Europa, la pestaña sigue llamándose «Clasificación europea». Debajo del título sigue la nota de las reglas en futuro («Pasan a semifinales los 2 primeros…»), y nada dice que ya estás fuera. Lo único que lo indica es tu fila, la 7.ª.

### 4. El resumen completo no dice qué competición jugaste (detalle)

El bloque del cuadro se titula «Fase inicial, previa, semifinal y final · Torneo europeo», sin decir si fue la Conference, la Europa League o la Champions. Además nombra la previa aunque no la jugaras.

### Visto y sin tocar (reglas)

- **La final se juega en casa de uno de los dos** («Visitante · vs Dinamo Tbilisi»), no en campo neutral. Es una regla del torneo, no un fallo de pantalla.
- **El desempate por nombre en sí** (punto 1) también es una regla. Cambiarlo, por ejemplo al enfrentamiento directo, cambia quién pasa en el 2-5 % de los torneos.

## Opciones

- **A. Que la tabla diga lo mismo que la regla** (solo pantalla). `buildEuropeanLeaguePhaseTable` ordena con el nombre interno y pone el tuyo después de ordenar. La tabla pasa a coincidir siempre con lo que decide el juego. No cambia quién pasa.
- **B. Un desempate justo** (cambia la regla de Europa: necesita permiso). Por ejemplo, el enfrentamiento directo y, si sigue el empate, sorteo con semilla. Dejas de perder casi todos los empates totales. Cambia quién pasa en el 2-5 % de los torneos; antes habría que medirlo con `audit:rating`.
- **C. El resumen cuenta Europa entera** (solo texto). Por ejemplo, «Europa: pasaste a semifinales y caíste ante el Qarabağ», «… y perdiste la final» o «Campeón de la Conference League».
- **D. Los detalles** (solo pantalla):
  - fuera en la fase de liga, la pestaña lo dice: «Quedaste 7.º: fuera de Europa esta temporada»;
  - el resumen completo nombra la competición, y la previa solo si la hubo.

## Qué propongo

- **A y C.** La A arregla una contradicción que se ve y la C cuenta lo más importante de la temporada europea. Las dos son solo pantalla.
- **D,** si quieres, en la misma versión: es poco.
- **B solo si decides tocar la regla.** Con la A, al menos la tabla dirá la verdad.
