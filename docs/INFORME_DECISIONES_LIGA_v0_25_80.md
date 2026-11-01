# Decisiones en la Liga (v0.25.80)

Mide cuánto cambiaría la carrera con decisiones en Liga, que hoy se juega sin ninguna. No cambia el juego: las decisiones solo existen dentro de la auditoría.

Se repite con `npm run audit:league`, y es reproducible. Con `--only=texto` se mide solo una parte. Las tablas reúnen tres ejecuciones, con 20.400 carreras en total entre todas; cada carrera tiene su propia semilla, así que las filas repetidas salen idénticas.

## Conclusiones

1. **La Liga es lo primero que mueve mucho la supervivencia sin subir la fuerza del equipo.** Las decisiones en Copa y Europa y el reparto de las líneas apenas lo hacían. Entre decidir mal y bien en todos los partidos hay de 0,83 a 4,51 temporadas superadas.
2. **Decidir en todos los partidos no es viable:** son 38 decisiones por temporada, 76 con el descanso. Además, choca con el botón «Simular» y dobla la puntuación.
3. **Un plan de temporada no sería una decisión.** Atacar siempre gana a defender siempre en todos los casos, y el plan «elegido según el nivel» acaba siendo atacar en todas las casillas. Sería una mejora gratis de hasta un 66 % más de temporadas.
4. **Decidir en el tramo final tampoco es una elección real:** el ataque es lo mejor en el 60-85 % de esos partidos.
5. **Los partidos grandes sí lo son.** Contra rivales de tu nivel o mejores, defender es lo mejor en el 59-64 % de los partidos, atacar en el 21-30 % y mantener el equilibrio en el 8-15 %.
6. **El planteamiento solo mueve poco; lo que pesa es el descanso.** Y el descanso en Liga se descartó en la v0.25.78, así que incluirlo es una decisión del usuario.

## Método

Mismas carreras que `audit:career` y `audit:linecap`: 300 por casilla, con drafts simulados en todas las formaciones. Salvo «Nunca decide», el jugador decide bien en Copa y Europa. En Liga elige el planteamiento con más puntos esperados según 60 partidos de prueba por opción, menos que los 300 de la previa del juego, porque se calcula en cada partido de cada carrera.

Un partido es grande si la media del rival es, como mínimo, la del equipo menos 1 punto.

### Limitaciones

- **Es un jugador simulado que elige casi siempre lo mejor:** es un máximo, no lo que hará una persona.
- **Solo «todos los partidos» tiene el caso de decidir mal:** no se ha medido en los partidos grandes.
- **El once no cambia entre temporadas** y la ruleta siempre se rechaza.
- **Mucha variación entre carreras:** hay que mirar los márgenes.

## Resultados

Temporadas superadas, con margen al 95 %:

| Jugador | Decisiones en Liga por temporada | Normal, mejor media | Normal, al azar | Fácil, mejor media | Fácil, al azar |
| --- | --- | --- | --- | --- | --- |
| Nunca decide | 0 | 2,13 ±0,21 | 0,89 ±0,13 | 3,52 ±0,32 | 1,63 ±0,18 |
| Solo Copa y Europa (hoy) | 0 | 2,24 ±0,22 | 1,01 ±0,14 | 3,74 ±0,31 | 1,79 ±0,19 |
| Plan de temporada: siempre defensa | 1 | 1,77 ±0,20 | 0,70 ±0,11 | 2,91 ±0,28 | 1,33 ±0,16 |
| Plan de temporada: siempre ataque | 1 | 3,11 ±0,30 | 1,25 ±0,16 | 6,22 ±0,54 | 2,38 ±0,23 |
| Últimas 5 jornadas | 5 | 2,30 ±0,21 | 1,03 ±0,14 | 4,53 ±0,38 | 2,08 ±0,22 |
| Últimas 5, con descanso | 10 | 2,28 ±0,21 | 0,95 ±0,13 | 4,79 ±0,44 | 2,05 ±0,23 |
| Últimas 10 jornadas | 10 | 2,35 ±0,22 | 1,04 ±0,14 | 5,08 ±0,47 | 2,00 ±0,20 |
| Últimas 10, con descanso | 20 | 2,78 ±0,26 | 1,14 ±0,15 | 5,17 ±0,47 | 2,35 ±0,25 |
| Partidos grandes | 7-12 | 2,32 ±0,22 | 1,05 ±0,14 | 3,82 ±0,34 | 2,03 ±0,21 |
| Partidos grandes, con descanso | 14-24 | 2,69 ±0,26 | 1,29 ±0,16 | 4,69 ±0,45 | 2,30 ±0,24 |
| Todos los partidos | 38 | 3,37 ±0,32 | 1,27 ±0,15 | 6,22 ±0,58 | 2,57 ±0,26 |
| Todos, con descanso | 76 | 4,51 ±0,36 | 2,05 ±0,25 | 9,59 ±0,82 | 3,57 ±0,34 |
| Todos, decide mal | 76 | 0,83 ±0,10 | 0,32 ±0,07 | 1,27 ±0,15 | 0,62 ±0,10 |

Dificultad Normal, draft de mejor media:

| Jugador | Pasa la 1.ª | Posición media | Títulos por temporada | Puntuación |
| --- | --- | --- | --- | --- |
| Solo Copa y Europa (hoy) | 82 % | 6,7 | 0,31 | 26,8 |
| Partidos grandes | 83 % | 6,6 | 0,33 | 27,9 |
| Partidos grandes, con descanso | 87 % | 6,4 | 0,34 | 32,6 |
| Plan de temporada: siempre ataque | 89 % | 6,0 | 0,37 | 37,9 |
| Todos los partidos | 90 % | 5,9 | 0,36 | 40,9 |
| Todos, con descanso | 95 % | 5,3 | 0,41 | 55,2 |

Qué planteamiento resulta mejor, en % de los partidos en que se decide:

| Cuándo se decide | Ataque | Equilibrado | Defensa |
| --- | --- | --- | --- |
| Últimas 5 jornadas | 72-85 % | 11-15 % | 3-13 % |
| Últimas 10 jornadas | 60-82 % | 11-21 % | 7-18 % |
| Partidos grandes | 21-30 % | 8-15 % | 59-64 % |

**Por qué gana el ataque:** el planteamiento favorece más al equipo mejor, y el usuario es mejor que la mayoría de los rivales de la Liga. Es una consecuencia coherente de la regla de la v0.25.75, no un error.

**Ranking:** ninguna carrera se rechaza con la regla de plausibilidad. Con los partidos grandes y el descanso, la puntuación sube entre un 22 % y un 28 % con respecto a hoy, así que las entradas antiguas quedarían en desventaja.

## Qué propongo

1. **Si se añade una decisión en Liga, que sea en los partidos grandes:** son pocos, la elección no es obvia y son los partidos que más apetece jugar. «Simular» se detendría en ellos, igual que ya hace con la Copa. No cambia el orden de los partidos.
2. **Incluir el descanso en esos partidos** es lo que le da efecto real, pero reabre lo decidido en la v0.25.78. Sin él, el efecto queda dentro del margen en casi todos los casos.
3. **Descartar** el plan de temporada, el tramo final y decidir en todos los partidos.
4. **Antes de publicar, medir** el caso de decidir mal y si conviene subir el margen para que haya menos partidos, porque los rivales suben con las temporadas.
