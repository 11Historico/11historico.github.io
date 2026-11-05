# Rating de simulación en carrera (v0.25.90)

## Qué se ha medido

Al jugar una carrera, el usuario se encontró con una pantalla así:

| Dato en pantalla | Valor |
| --- | --- |
| Media del once («Completo») | 85 |
| Rating de temporada (once + entrenador) | 88 |
| Rating que usa la simulación | 84 |

Propuso que la simulación no use un número más bajo que los otros dos: un rating variable por partido, entre 85 (si el entrenador no aporta) y 88 (si aporta), con valores intermedios en otros partidos.

Esta auditoría mide qué pasaría. No cambia el juego. Se repite con `npm run audit:rating`.

- **Carreras:** 4.000, 200 por casilla. Ninguna rechazada por la regla de plausibilidad del ranking.
- **Jugador simulado:** el de hoy, que decide bien en Copa y Europa.

## De dónde sale el 84

- **Compresión de carrera** (v0.21.0e, `src/career/teamPower.ts`): 80 + (rating − 80) × 0,55, redondeado a entero, en cada línea y en la media.
- **Por qué existe:** los jugadores son leyendas históricas, con medias de 85 a 95, y los rivales de LaLiga están en otra escala. El Barcelona y el Real Madrid tienen 91; el Atlético y el Villarreal, 87; los últimos, 74-75.
- **Qué hace:** pone tu equipo en esa escala.
- **No es solo la media:** la compresión también baja las líneas (ataque, defensa, control…), que son las que deciden los duelos. Un ataque de 96 pasa a 89.

## Resultados

Normal, mejor draft (visible 86,9 de media):

| Rating de simulación | Media en la simulación | Temporadas superadas | Pasa la 1.ª | Posición en la 1.ª | Ligas por temporada | Llegan al tope de 25 temporadas | Puntuación del ranking |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hoy, comprimido y redondeado | 83,7 | 2,31 | 83 % | 4,8 | 0,03 | 0 % | 27,6 |
| Comprimido sin redondeo | 83,8 | 2,35 | 82 % | 4,9 | 0,03 | 0 % | 28,6 |
| Once sin entrenador (propuesta, mínimo) | 84,7 | 10,05 | 98 % | 2,2 | 0,12 | 12 % | 136,4 |
| Entre los dos (propuesta, media) | 85,9 | 11,60 | 98 % | 2,1 | 0,14 | 19 % | 159,0 |
| Temporada con entrenador (propuesta, máximo) | 87,2 | 10,98 | 99 % | 1,9 | 0,14 | 17 % | 153,5 |

Temporadas superadas en todas las casillas (hoy → propuesta, en su media entre el once y la temporada):

| Dificultad y draft | Hoy | Propuesta | Puntuación hoy → propuesta |
| --- | --- | --- | --- |
| Normal, mejor media | 2,31 | 11,60 | 27,6 → 159,0 |
| Normal, al azar | 0,94 | 2,98 | 11,0 → 36,0 |
| Fácil, mejor media | 3,73 | 15,78 (38 % llegan al tope) | 47,7 → 229,6 |
| Fácil, al azar | 1,66 | 5,32 | 19,8 → 66,7 |

## Conclusiones

1. **Quitar solo el redondeo no cambia nada medible.** Todas las cifras quedan dentro del margen. La mejora de «que cuente cada décima» no se nota en los resultados.
2. **La propuesta, quitar la compresión, hace la carrera de 3 a 5 veces más fácil.** Con un buen draft en Normal se pasa de 2,3 a unas 11 temporadas, de quedar 4,8.º a 2,1.º en la 1.ª, y casi 1 de cada 5 carreras llega al tope de 25 temporadas. La puntuación del ranking se multiplica por 5 o 6: las entradas de antes quedarían muy atrás.
3. **No es la media, son las líneas.** Con draft al azar, la media del once sin entrenador (79,8) es más baja que la de hoy (81,2), y aun así se sobreviven tres veces más temporadas. La compresión baja sobre todo las líneas altas, y eso es lo que más pesa en los partidos.
4. **El entrenador es lo de menos.** Entre «once sin entrenador» y «temporada con entrenador» la diferencia está casi siempre dentro del margen. Lo que cambia la carrera es quitar la compresión, no cómo pese el entrenador.

## Qué propongo

- **No quitar la compresión tal cual.** Rompe el equilibrio y el ranking. Si se quisiera, habría que compensarlo por otro lado (rivales más fuertes u objetivos más exigentes), y eso es un rediseño.
- **Atacar lo que molesta: que se vean tres números que no casan.** Mostrar la fuerza del equipo en la misma escala que los rivales. Por ejemplo, «Tu fuerza en LaLiga: 84 · Real Madrid y Barcelona 91 · Atlético 87», y dejar 85 y 88 como datos del once histórico. Es solo visual.
- **Si se quiere que el entrenador varíe por partido,** se puede hacer dentro de la escala comprimida (por ejemplo, 83-84,4). Habría que medirlo aparte, pero por lo visto aquí, el efecto sería pequeño.

## Otro hallazgo

**La Supercopa no usa la compresión:** recibe el rating visible (88), mientras la Liga y la Copa usan el comprimido (84). Eso ya pasa hoy en el juego y no se ha cambiado aquí. Habría que decidir si es intencionado.
