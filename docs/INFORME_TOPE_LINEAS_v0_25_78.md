# Estudio del tope de las líneas (v0.25.78)

Mide si conviene relajar `capRatingBySquadAverage` para que el draft cambie cómo juega el equipo. No cambia el juego: las alternativas solo existen dentro de la auditoría.

Se repite con `npm run audit:linecap`, y es reproducible. Son 19.800 carreras y unos 8.000 drafts simulados.

## Conclusiones

1. **Relajar el tope no da lo que buscábamos, y no propongo tocarlo.** La auditoría anterior lo señalaba como el arreglo con más potencial para el draft. Esta medición lo desmiente: subir el tope hace al equipo más fuerte, no más distinto.
2. **El tope no es el freno principal: lo es el motor.** Con la misma fuerza, separar ataque y defensa 16 puntos (el doble de lo que permite hoy el tope) solo mueve unos 4 goles a favor y 4 en contra por temporada, sin cambiar la posición en Liga.
3. **El tope actúa en todos los drafts.** Con el tope, un once extremo solo separa ataque y defensa unos 2 puntos, y 1 en carrera. Sin él serían 6,5.
4. **Hay un error real: el 4-6-0.** Al no tener delanteros, su ataque se hunde y esa formación es unas cinco veces peor que las demás, sin aviso.
5. **Hay una etiqueta que no informa:** el 92 % de los equipos sale como «Equipo dominador de mediocampo».

## Por qué existe el tope

- **v0.12.16:** el resumen podía mostrar «Media del once: 85, Valoración: 96», porque las habilidades internas son mucho más altas que la media de los jugadores. El tope resolvió eso.
- **v0.21.0e:** además, en carrera todo lo que pasa de 80 se comprime (`80 + (rating - 80) * 0.55`), porque ganar Liga y Copa seguidas era demasiado fácil.

Son dos decisiones de balance deliberadas, y siguen haciendo su trabajo. Los números lo muestran: el peor portero del juego (media 68) sale con portería 92,7 sin tope.

## Método

Se simulan drafts con las reglas del juego: una temporada al azar por ronda, y un jugador que encaje en un hueco libre. Hay seis estilos: mejor media, al azar, prefiere ataque, prefiere defensa, ataque extremo y defensa extrema. Los extremos cogen a los mejores de una parte del campo y a los peores de la otra.

Después se juegan carreras completas, con 300 por casilla, con el mismo draft y las mismas semillas en cada alternativa.

| Alternativa | Qué hace |
| --- | --- |
| Actual (+8) | El juego tal como está |
| Tope +12 | Ataque, defensa y control pueden llegar a media + 12 |
| Sin tope | Sin límite en esas tres líneas |
| Reparto x1, comprimido | Misma fuerza que hoy, con las líneas repartidas según la plantilla |
| Reparto x1, sin comprimir | Igual, pero la compresión de carrera no reduce el reparto |
| Reparto x2, sin comprimir | Igual, con el doble de separación |

### Limitaciones

- **El 4-6-0 se mide aparte.** Incluirlo distorsiona las medias y las comparaciones por estilo. Un primer cálculo con él dentro daba conclusiones falsas.
- **El once no cambia entre temporadas** y la ruleta siempre se rechaza.
- **Los estilos «prefiere ataque» y «prefiere defensa» casi no se distinguen:** solo cambian el orden en que se llenan los huecos.
- **La Supercopa usa las líneas sin el reparto.** Es un partido suelto y apenas pesa.
- **Mucha variación entre carreras:** hay que mirar los márgenes.
- **Es un jugador simulado:** no mide lo que se siente al jugar.

## Resultados

### Cómo salen las líneas

Parte de los equipos que llegan al tope, y separación entre ataque y defensa:

| Draft | Media del once | Ataque | Defensa | Control | Mentalidad y portería | Ataque - defensa visible, valor absoluto | En carrera | Sin tope |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Mejor media | 84,4 | 64 % | 88 % | 92 % | 100 % | 1,0 | 0,5 | 5,1 |
| Al azar | 79,7 | 64 % | 99 % | 97 % | 100 % | 0,8 | 0,4 | 6,6 |
| Ataque extremo | 80,5 | 87 % | 90 % | 100 % | 100 % | 0,4 | 0,2 | 5,2 |
| Defensa extrema | 79,4 | 36 % | 100 % | 77 % | 100 % | 2,1 | 1,1 | 8,4 |

Comparando los dos drafts extremos, sus plantillas se separan 13,9 puntos (delanteros frente a defensas). Con el tope, eso son 2,1 puntos de ataque menos defensa, y 1,1 en carrera. Sin tope serían 6,5.

Sin tope, además, la defensa sale siempre más alta que el ataque: +12,2 frente a +8,9 sobre la media del once. Quitar el tope sin más inclinaría a todos los equipos hacia la defensa.

**Portería y mentalidad:** llegan al tope en todos los drafts. Cambiar al peor portero (68) por el mejor (90) sube la portería 2,4 puntos, casi solo porque sube la media del once. Un portero pesa como cualquier otro jugador.

### Carreras con cada alternativa

Temporadas superadas, con margen al 95 %, y goles por partido en Liga:

| Alternativa | Normal, mejor media | Goles a favor y en contra | Normal, al azar | Fácil, mejor media | Fácil, al azar |
| --- | --- | --- | --- | --- | --- |
| Actual (+8) | 2,11 ±0,22 | 0,92 y 0,77 | 0,88 ±0,13 | 3,47 ±0,32 | 1,74 ±0,18 |
| Tope +12 | 2,28 ±0,20 | 0,94 y 0,74 | 1,19 ±0,15 | 4,17 ±0,36 | 2,20 ±0,22 |
| Sin tope | 2,53 ±0,26 | 0,94 y 0,74 | 1,27 ±0,15 | 4,49 ±0,42 | 2,39 ±0,22 |
| Reparto x1, comprimido | 2,09 ±0,21 | 0,93 y 0,77 | 0,96 ±0,13 | 3,62 ±0,32 | 1,87 ±0,21 |
| Reparto x1, sin comprimir | 2,24 ±0,23 | 0,94 y 0,77 | 0,89 ±0,12 | 3,79 ±0,35 | 1,60 ±0,18 |
| Reparto x2, sin comprimir | 2,10 ±0,21 | 0,94 y 0,78 | 0,87 ±0,13 | 3,47 ±0,34 | 1,75 ±0,19 |

- **Subir el tope es bajar la dificultad:** la fuerza efectiva sube entre 1 y 2 puntos y se superan más temporadas, sobre todo con drafts flojos. Pasar la primera temporada en Normal con un draft al azar sube del 53 % al 67 % sin tope. La separación entre líneas apenas llega a 2 o 3 puntos en los mejores drafts.
- **El reparto no cambia el balance:** las temporadas superadas quedan dentro del margen o muy cerca, también con los drafts extremos. Tampoco aparece una estrategia dominante.
- **Con todas las alternativas, el estilo del once casi no se nota en los goles.** Con un draft de mejor media, los tercios más ofensivo y más defensivo de las plantillas se diferencian como mucho en 0,02 goles por partido.

### Cuánto reacciona el motor

Equipos de mejor media en 4-3-3, dificultad Normal, con la misma fuerza. Solo cambia la diferencia entre ataque y defensa, ya en valores efectivos:

| Ataque - defensa | Goles a favor por partido | En contra | Posición media | Temporadas superadas |
| --- | --- | --- | --- | --- |
| -16 | 0,82 | 0,67 | 6,9 | 1,98 ±0,20 |
| -8 | 0,87 | 0,71 | 6,8 | 2,04 ±0,20 |
| 0 | 0,93 | 0,76 | 6,7 | 2,28 ±0,23 |
| +8 | 0,99 | 0,81 | 6,6 | 2,29 ±0,22 |
| +16 | 1,04 | 0,86 | 6,7 | 2,10 ±0,21 |

El efecto existe y es limpio, pero es pequeño: 8 puntos de separación son unos 2 goles a favor y 2 en contra por temporada de 38 partidos. La causa está en `calculateExpectedGoals`: cada punto de ataque vale unas 0,015 goles esperados, y después los goles se redondean a un número entero. Son pocos goles por partido, y eso deja poco margen para que se note un estilo.

Tampoco conviene exagerar el reparto: a ±16 ya se superan algo menos de temporadas, aunque la diferencia queda cerca del margen.

### Formaciones

- **El modificador de defensa casi nunca actúa, porque la defensa ya está en el tope.** En formaciones como 5-3-2, 4-5-1 o 5-4-1 cambia la defensa solo en el 0-6 % de los equipos.
- **El coste en ataque sí se paga.** El ataque de un 5-4-1 queda 5,2 puntos sobre la media del once, y el de un 4-3-3, 7,9.
- **El efecto en carreras es pequeño:**

| Formación | Actual: temporadas | Goles a favor y en contra | Reparto x1, sin comprimir: temporadas | Goles a favor y en contra |
| --- | --- | --- | --- | --- |
| 5-4-1 | 2,07 ±0,20 | 0,91 y 0,76 | 2,09 ±0,21 | 0,88 y 0,72 |
| 5-3-2 | 2,32 ±0,23 | 0,92 y 0,76 | 2,21 ±0,21 | 0,91 y 0,75 |
| 4-3-3 | 2,25 ±0,23 | 0,93 y 0,76 | 2,38 ±0,24 | 0,96 y 0,79 |
| 3-3-4 | 2,21 ±0,23 | 0,93 y 0,77 | 2,23 ±0,22 | 1,00 y 0,82 |

Hoy, entre 5-4-1 y 3-3-4 hay menos de un gol por temporada. Con el reparto serían unos 4,6 a favor y 3,8 en contra, sin que ninguna formación supere claramente a las demás. Es la única alternativa que da un estilo apreciable sin mover el balance, aunque sigue siendo modesto.

### El caso del 4-6-0

No tiene delanteros, y `calculateBaseRatings` usa 50 como valor de una línea vacía. Su ataque queda 12,9 puntos por debajo de la media del once, cuando en las demás formaciones queda entre 5 y 8 por encima.

| 4-6-0, dificultad Normal | Fuerza efectiva | Temporadas superadas | Pasa la 1.ª | Goles a favor |
| --- | --- | --- | --- | --- |
| Actual | 79,9 | 0,42 ±0,08 | 32 % | 0,69 |
| Prueba: los medios hacen de delanteros | 86,5 | 2,18 ±0,22 | 80 % | 0,92 |

Las otras formaciones comparadas superan entre 2,07 y 2,32 temporadas. La prueba coloca al 4-6-0 a su altura y no afecta a ninguna otra formación, porque es la única sin delanteros.

### Etiquetas

`detectProfileLabel` comprueba el control antes que la mayoría de los casos, y el control casi siempre llega a 86 o más. En los drafts realistas:

- Equipo dominador de mediocampo: 92 %
- Once histórico de nivel campeón: 8 %
- Equipo físico e intenso: 1 %

### Ranking

Ninguna de las 19.800 carreras se rechaza con la regla de plausibilidad, en ninguna alternativa.

## Qué propongo

1. **No tocar el tope ni la compresión.** Subirlos solo baja la dificultad.
2. **Corregir el 4-6-0** como fase propia: los medios hacen de delanteros cuando no hay ninguno. Cambia ratings, así que necesita aprobación, pero solo afecta a esa formación.
3. **Hacer que la etiqueta del equipo informe:** es un cambio solo de texto, sin efecto en los resultados.
4. **Valorar el reparto solo si, al jugar, echas en falta que el once cambie cómo juega.** Sería una fase propia: no mueve el balance y da unos 4 o 5 goles por temporada entre formaciones extremas.
5. **La supervivencia no se arregla por aquí.** Ninguna alternativa del mismo nivel de fuerza mueve la posición en Liga, así que la posible decisión en Liga sigue siendo la palanca pendiente.
