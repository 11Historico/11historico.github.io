# Auditoría conjunta de las decisiones de partido (v0.25.78)

Mide el efecto acumulado de las fases anteriores en carreras completas: planteamiento y entrenador (v0.25.75), Europa con el equipo real (v0.25.77) y descanso (v0.25.78). No cambia el juego.

Se repite con `npm run audit:career`, y es reproducible. Con 300 carreras por casilla tarda unos 15 minutos.

## Conclusiones

1. **El juego no se ha roto.** Decidir bien da más títulos y algo más de puntuación, sin disparar nada. No propongo ajustar los valores.
2. **Las decisiones sí importan, pero en los títulos.** Quien decide bien gana entre un 30 % y un 60 % más de títulos por temporada que quien nunca decide, y quien decide mal gana entre la mitad y tres cuartas partes.
3. **La supervivencia casi no cambia.** La posición media en Liga es prácticamente la misma en todos los casos, y es lo que más decide el Game Over. La carrera se sigue jugando sobre todo en la Liga, donde no hay decisiones.
4. **El ranking no se ve afectado por la regla de plausibilidad:** 0 rechazos en 18.000 carreras.
5. **Hallazgo aparte: en los onces probados, las líneas del equipo salen casi planas,** aunque la plantilla esté muy desequilibrada. Ver la sección «Las líneas del equipo». Esto corrige lo que dije de la fase 4.

## Método

Carreras completas con las funciones reales del juego: Liga, Copa, Europa, Supercopa, ascensos y descensos, subida de rivales, premio de prestigio europeo, objetivo de temporada y puntuación. Hay 300 carreras por casilla, con dos dificultades, cinco equipos y seis tipos de jugador: 18.000 carreras en total.

| Jugador | Planteamiento | Descanso |
| --- | --- | --- |
| Como antes | Europa solo con la media, sin el +1 del entrenador | No |
| Nunca decide | Equilibrado | Sigue igual |
| Decide bien | El de mejores probabilidades en la previa | Arriesga si pierde y cierra si gana. Si empata, cierra siendo inferior |
| Decide mal | El de peores probabilidades en la previa | Lo contrario |

También se han medido «solo planteamiento» y «solo descanso».

### Limitaciones

- **El once no cambia entre temporadas:** sin premios de plantilla ni cambios de formación, y siempre en 4-3-3.
- **La ruleta de temporada siempre se rechaza.**
- **Tope de 25 temporadas por carrera:** lo alcanza como mucho un 4 % de las carreras, solo del equipo Élite en Fácil.
- **Mucha variación entre carreras:** cada carrera usa su propio azar y las políticas se separan enseguida, así que hay que mirar los márgenes. Las diferencias menores que el margen no son concluyentes.
- **Es un jugador simulado que sigue reglas fijas:** no sustituye a jugar de verdad.

## Resultados

Las tablas comparan «Nunca decide», «Decide bien» y «Decide mal». El margen es al 95 %. El resultado completo, con todos los tipos de jugador, sale del comando.

### Títulos por temporada

| Equipo (media inicial) | Normal: nunca | Bien | Mal | Fácil: nunca | Bien | Mal |
| --- | --- | --- | --- | --- | --- | --- |
| Flojo (78) | 0,10 | 0,13 | 0,05 | 0,13 | 0,17 | 0,07 |
| Medio (82) | 0,12 | 0,19 | 0,06 | 0,20 | 0,28 | 0,12 |
| Desequilibrado (83) | 0,13 | 0,21 | 0,07 | 0,23 | 0,33 | 0,13 |
| Bueno (84) | 0,18 | 0,27 | 0,09 | 0,27 | 0,40 | 0,16 |
| Élite (91) | 0,37 | 0,53 | 0,29 | 0,55 | 0,71 | 0,38 |

El mayor salto es la Copa, que casi se duplica. Copas por carrera en dificultad Normal: Medio, de 0,12 a 0,23; Bueno, de 0,20 a 0,41; Élite, de 0,52 a 1,00.

### Temporadas superadas

| Equipo | Normal: nunca | Bien | Mal | Fácil: nunca | Bien | Mal |
| --- | --- | --- | --- | --- | --- | --- |
| Flojo | 0,54 ±0,09 | 0,54 ±0,09 | 0,43 ±0,08 | 1,13 ±0,14 | 1,35 ±0,16 | 1,15 ±0,14 |
| Medio | 0,99 ±0,13 | 1,03 ±0,15 | 0,81 ±0,12 | 1,91 ±0,20 | 2,25 ±0,21 | 1,80 ±0,18 |
| Desequilibrado | 0,99 ±0,13 | 1,02 ±0,13 | 0,84 ±0,12 | 1,93 ±0,20 | 2,13 ±0,21 | 1,89 ±0,20 |
| Bueno | 1,50 ±0,16 | 1,81 ±0,18 | 1,38 ±0,15 | 2,79 ±0,25 | 3,06 ±0,29 | 2,60 ±0,22 |
| Élite | 3,82 ±0,36 | 4,35 ±0,38 | 3,60 ±0,36 | 7,15 ±0,61 | 7,01 ±0,62 | 6,28 ±0,61 |

La mejora es de unas décimas como mucho, y casi siempre cae dentro del margen o muy cerca.

### Puntuación media de ranking

| Equipo | Normal: nunca | Bien | Mal | Fácil: nunca | Bien | Mal |
| --- | --- | --- | --- | --- | --- | --- |
| Flojo | 6,1 | 6,4 | 4,6 | 12,6 | 15,4 | 12,3 |
| Medio | 11,0 | 12,0 | 8,6 | 21,9 | 26,9 | 19,6 |
| Desequilibrado | 11,1 | 12,2 | 9,0 | 22,4 | 26,0 | 20,8 |
| Bueno | 17,0 | 21,7 | 14,7 | 32,6 | 38,2 | 28,7 |
| Élite | 45,8 | 55,7 | 42,0 | 91,4 | 95,5 | 75,6 |

Decidir bien sube la puntuación entre un 5 % y un 27 %. Las entradas antiguas del ranking quedan algo en desventaja, sin que eso exija reiniciarlo.

### Posición media en Liga

Nunca decide frente a decide bien, en dificultad Normal: Flojo, 10,1 y 10,2; Medio, 8,8 y 8,8; Bueno, 7,5 y 7,3; Élite, 5,6 y 5,6. En dificultad Fácil es igual: Medio, 7,0 y 6,9; Bueno, 6,2 y 6,1; Élite, 4,7 y 4,8.

## Quien no decide no sale perjudicado ni beneficiado

«Como antes» y «Nunca decide» dan casi lo mismo en todas las casillas. Las fases 2 a 4 no han cambiado la dificultad para quien no toca nada.

Hay dos motivos, y por eso esta comparación no mide todo el efecto de esas fases:

- Ningún equipo de la prueba tiene un entrenador con habilidad europea de 86 o más. Son muy pocos en los datos.
- Las líneas de los onces probados son casi planas, como explica la sección siguiente.

## Las líneas del equipo

`calculateTeamRating` limita cada línea a la media de la plantilla más 8 puntos (`capRatingBySquadAverage`, en `src/simulation/teamRating.ts`), y en los casos probados ese tope se alcanza casi siempre.

Onces en 4-3-3 con los mismos centrocampistas y entrenador:

| Plantilla | Media | Ataque | Defensa | Control | En carrera: ataque y defensa |
| --- | --- | --- | --- | --- | --- |
| Todo medio | 82 | 88 | 88 | 88 | 84 y 84 |
| Ataque de élite, peor defensa | 78 | 84 | 84 | 84 | 82 y 82 |
| Mejor defensa, peor ataque | 82 | 86 | 88 | 88 | 83 y 84 |
| Ataque alto, defensa baja | 80 | 86 | 86 | 86 | 83 y 83 |
| Defensa alta, ataque bajo | 82 | 86 | 88 | 88 | 83 y 84 |

Consecuencias:

- **Elegir delanteros o defensas apenas cambia el estilo del equipo:** lo que pesa es la media. Afecta a Liga, Copa, Europa y Supercopa, y conecta con la queja inicial sobre el control del juego.
- **Corrección de la fase 4:** la v0.25.77 dice que, con la misma media, un once ofensivo marca y encaja más que uno defensivo. La medición usaba líneas de prueba muy separadas (+8 y -8). En los onces probados, las líneas apenas se separan 2 puntos y el efecto es muy pequeño. Lo que sí funciona son los goleadores y el mini campo.
- **Etiquetas del equipo:** puntos fuertes y debilidades se calculan con estas líneas, así que tienden a salir parecidos.

Son cinco plantillas de ejemplo, no un estudio de todos los drafts posibles.

No lo he cambiado: las reglas de rating y el balance de Liga necesitan aprobación, y es un cambio de mucho alcance.

## Qué propongo

1. **No ajustar los valores** del planteamiento ni del descanso.
2. **Jugar una o dos temporadas de verdad.** Ninguna simulación dice si se siente control.
3. **Estudiar el tope de las líneas antes que nada más.** Es el arreglo que más puede devolver sentido al draft, pero toca ratings y Liga, y debe medirse como fase propia.
4. **Decidir después si la Liga necesita alguna decisión,** porque es donde se juega la supervivencia.
