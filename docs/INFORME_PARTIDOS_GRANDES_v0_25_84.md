# Partidos grandes en la Liga (v0.25.84)

Sigue a `docs/INFORME_DECISIONES_LIGA_v0_25_80.md`. Al jugar, el usuario sintió que no podía hacer nada para mejorar su posición en Liga. Aquí se mide cuánto ayudaría decidir en los partidos grandes antes de construirlo. No cambia el juego: las decisiones solo existen dentro de la auditoría.

Se repite con `npm run audit:league`. Para medir solo una parte hay que llamar directamente al script, porque npm se queda con `--only`: `node .audit-dist/auditLeagueDecisions.js --only=texto`. Las tablas reúnen 22.800 carreras, con 300 por casilla. Las filas «Partidos grandes» y «con descanso» coinciden con las del informe anterior.

## Conclusiones

1. **Decidir en los partidos grandes mueve poco la posición en Liga:** entre decidir bien y mal hay 0,7 puestos y 1,6 puntos por temporada con el mejor draft, y 1 puesto y 1,9 puntos con un draft al azar. Es un máximo: lo hace un jugador simulado que casi siempre elige lo mejor.
2. **Sí mueve la supervivencia:** de 2,06 a 2,69 temporadas superadas, con 2,24 hoy. Es poco en la tabla, pero importa porque la plaza europea depende de pocos puntos.
3. **En dificultad Fácil, con el mejor draft, la posición casi no se mueve** (3,45 frente a 3,51), aunque la supervivencia sí (3,63 a 4,69).
4. **Hacen falta las dos decisiones:** solo el planteamiento queda dentro del margen, y solo el descanso da aproximadamente la mitad de efecto en la supervivencia que los dos juntos.
5. **Elegir importa, pero decidir mal apenas se castiga:** entre decidir bien y mal hay 0,63 temporadas, más que el margen. Pero decidir mal, con 2,06 temporadas, queda dentro del margen de las 2,24 de hoy: lo que se nota es acertar.
6. **Lo que más mueve la posición sigue siendo otra cosa:** el draft mueve 3 puestos (4,8 frente a 7,8), y decidir en los 38 partidos, 4,3 (3,0 frente a 7,3). Por partido, decidir en los grandes da unos 0,2 puntos entre acertar y fallar, frente a 0,3 en el conjunto de la Liga. No se ha medido por qué.
7. **El número de paradas crece con las temporadas y es mayor para los equipos flojos,** que son los que más rivales grandes tienen.

## Método

Mismas carreras que el informe anterior. En Copa y Europa el jugador siempre decide bien, para aislar el efecto de la Liga.

Un partido es grande si la media del rival llega, como mínimo, a la del equipo menos un margen. El margen +1 es el del informe anterior: con +3 entran más partidos, y con -1 y -3 solo rivales claramente mejores.

La columna principal es la **1.ª temporada**, porque compara en igualdad: en las siguientes, quien sobrevive más se enfrenta a rivales mejores, y eso empeora su posición media aunque juegue mejor.

### Limitaciones

- **El jugador simulado elige casi siempre lo mejor o lo peor:** una persona quedará en medio.
- **No mide cómo se siente:** una decisión con poco efecto en la tabla puede dar más sensación de control de la que dicen estos números, o cansar.
- **Las temporadas 3.ª y 5.ª solo cuentan a quien llega:** con draft al azar son pocas carreras.
- **El once no cambia entre temporadas** y la ruleta siempre se rechaza.

## Resultados

Referencia de hoy, sin decisiones en Liga:

| Dificultad y draft | Posición en la 1.ª | Puntos en la 1.ª | Temporadas superadas | Pasa la 1.ª |
| --- | --- | --- | --- | --- |
| Normal, mejor media | 4,79 ±0,35 | 59,5 | 2,24 ±0,22 | 82 % |
| Normal, al azar | 7,80 ±0,50 | 52,7 | 1,01 ±0,14 | 54 % |
| Fácil, mejor media | 3,50 ±0,26 | 64,0 | 3,74 ±0,31 | 94 % |
| Fácil, al azar | 5,64 ±0,41 | 57,7 | 1,79 ±0,19 | 76 % |

Posición en la 1.ª temporada, decidiendo bien → mal, con planteamiento y descanso:

| Cuándo se decide | Normal, mejor media | Normal, al azar | Fácil, mejor media | Fácil, al azar |
| --- | --- | --- | --- | --- |
| Margen +3 | 4,46 → 5,25 | 6,73 → 8,47 | 3,21 → 3,56 | 4,88 → 6,08 |
| Margen +1 | 4,47 → 5,15 | 7,08 → 8,09 | 3,45 → 3,51 | 5,07 → 5,97 |
| Margen -1 | 4,53 → 4,92 | 7,44 → 8,30 | 3,54 → 3,52 | 5,22 → 5,77 |
| Margen -3 | 4,63 → 4,79 | 7,67 → 7,82 | 3,48 → 3,53 | 5,29 → 5,58 |
| Todos los partidos | 3,04 → 7,34 | 5,50 → 10,59 | 2,20 → 6,09 | 3,42 → 8,69 |

Los márgenes de cada cifra son de ±0,3 a ±0,5 puestos.

Temporadas superadas, decidiendo bien → mal, con planteamiento y descanso:

| Cuándo se decide | Normal, mejor media | Normal, al azar | Fácil, mejor media | Fácil, al azar |
| --- | --- | --- | --- | --- |
| Margen +3 | 2,97 → 1,93 | 1,30 → 0,84 | 4,80 → 3,44 | 2,33 → 1,39 |
| Margen +1 | 2,69 → 2,06 | 1,29 → 0,77 | 4,69 → 3,63 | 2,30 → 1,58 |
| Margen -1 | 2,71 → 2,16 | 1,06 → 0,78 | 4,54 → 3,80 | 2,05 → 1,64 |
| Margen -3 | 2,43 → 2,21 | 1,01 → 0,86 | 4,26 → 3,92 | 1,96 → 1,76 |
| Todos los partidos | 4,51 → 0,83 | 2,05 → 0,32 | 9,59 → 1,27 | 3,57 → 0,62 |

Qué decisión hace falta, con margen +1, decidiendo bien → mal:

| Decisión | Medida | Normal, mejor media | Normal, al azar | Fácil, mejor media | Fácil, al azar |
| --- | --- | --- | --- | --- | --- |
| Solo planteamiento | Temporadas | 2,32 → 2,21 | 1,05 → 0,89 | 3,82 → 3,86 | 2,03 → 1,68 |
| Solo descanso | Temporadas | 2,44 → 2,21 | 1,07 → 0,81 | 4,25 → 3,66 | 2,20 → 1,80 |
| Los dos | Temporadas | 2,69 → 2,06 | 1,29 → 0,77 | 4,69 → 3,63 | 2,30 → 1,58 |
| Solo planteamiento | Posición en la 1.ª | 4,70 → 4,92 | 7,57 → 8,13 | 3,45 → 3,45 | 5,30 → 5,55 |
| Solo descanso | Posición en la 1.ª | 4,56 → 5,10 | 7,52 → 7,91 | 3,39 → 3,54 | 5,30 → 5,67 |
| Los dos | Posición en la 1.ª | 4,47 → 5,15 | 7,08 → 8,09 | 3,45 → 3,51 | 5,07 → 5,97 |

Partidos grandes por temporada, en las temporadas 1.ª · 3.ª · 5.ª. Con planteamiento y descanso, cada uno pide dos decisiones:

| Margen | Normal, mejor media | Normal, al azar | Fácil, mejor media | Fácil, al azar |
| --- | --- | --- | --- | --- |
| +3 | 9,9 · 10,7 · 14,4 | 16,4 · 16,0 · 20,3 | 7,5 · 8,3 · 10,5 | 11,2 · 12,4 · 15,6 |
| +1 | 7,5 · 8,4 · 11,1 | 11,2 · 11,8 · 16,0 | 5,3 · 6,4 · 8,3 | 8,3 · 9,1 · 11,7 |
| -1 | 5,3 · 6,4 · 8,3 | 8,3 · 9,3 · 11,1 | 2,9 · 4,0 · 6,3 | 6,3 · 7,0 · 8,9 |
| -3 | 2,9 · 3,9 · 6,3 | 6,3 · 6,8 · 9,3 | 0,6 · 1,5 · 4,2 | 3,8 · 4,9 · 6,8 |

Qué planteamiento resulta mejor, decidiendo bien:

| Margen | Ataque | Equilibrado | Defensa |
| --- | --- | --- | --- |
| +3 | 29-36 % | 13-23 % | 47-52 % |
| +1 | 22-30 % | 9-15 % | 58-63 % |
| -1 | 13-23 % | 10-17 % | 66-72 % |
| -3 | 7-18 % | 17-22 % | 62-76 % |

**Ranking:** ninguna de las 22.800 carreras se rechaza con la regla de plausibilidad. En Normal con el mejor draft y margen +1, la puntuación pasa de 26,8 hoy a 32,6 decidiendo bien (+22 %) y a 25,1 decidiendo mal (-6 %).

## Qué propongo

1. **Si se construye tal cual, margen +1 con planteamiento y descanso.** Con +3 hay más efecto, pero también hasta 20-32 paradas por temporada. Con -1 y -3, la respuesta suele ser defender.
2. **No esperar que esto arregle por sí solo la sensación del usuario:** son menos de 1 puesto en un draft bueno, incluso con un jugador perfecto.
3. **Antes de construirlo, medir si esas decisiones deberían pesar más.** Es otra medición sin cambios en el juego, con el mismo método. Aplicarlo después sería un cambio de balance, y pediría aprobación aparte.
