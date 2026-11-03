# Peso de las decisiones en los partidos grandes (v0.25.87)

Sigue a `docs/INFORME_PARTIDOS_GRANDES_v0_25_84.md`. Esa fase mostró que decidir planteamiento y descanso en los partidos grandes de Liga mueve menos de 1 puesto. Aquí se mide cuánto tendrían que pesar esas decisiones para mover unos 2 puestos, y qué le pasaría al equilibrio de la carrera. No cambia el juego.

Se repite con `npm run audit:league`. Solo esta fase: `node .audit-dist/auditLeagueDecisions.js "--only=Solo Copa y Europa (hoy),Peso"`. 22.800 carreras, 300 por casilla, y ninguna rechazada por la regla de plausibilidad del ranking.

## Conclusiones

1. **Con un equipo bueno no se llega a 2 puestos con ningún peso.** En Normal y con el mejor draft, decidir bien se estanca en el 4,1.º-4,2.º desde ×3, frente al 4,8.º de hoy: 0,6 puestos. En Fácil son 0,3. Arriba mandan los rivales: decidir bien sobre todo hace encajar menos (de 0,76 a 0,69 goles por partido con ×4, sin marcar más) y suma unos 2 puntos por temporada.
2. **Con un equipo flojo sí, a partir de ×4.** En Normal y con draft al azar, decidir bien pasa del 7,8.º de hoy al 5,7.º con ×4 (2,1 puestos). En Fácil, 1,4 puestos con ×6.
3. **Decidir al azar queda cerca de hoy con cualquier peso,** a 0,6 puestos como mucho, así que el peso no castiga a quien elige sin pensar. Lo que se castiga es decidir mal, cada vez más. Entre decidir bien y mal hay 1,5 puestos con ×4 y el mejor draft, y 3,7 con draft al azar.
4. **El precio es el equilibrio de la carrera.** Con ×3 y el mejor draft, decidir bien sube las temporadas superadas un 51 % (de 2,24 a 3,39) y la puntuación del ranking un 52 %. Con ×4 y draft al azar suben un 82 % y un 81 %. Las partidas jugadas antes del cambio quedarían muy por debajo en el ranking.
5. **La decisión deja de serlo.** Entre ×1,5 y ×4, «decidir bien» es defender en el 66-79 % de los partidos grandes, con cualquier dificultad y draft. Con más peso, la mejor jugada acaba siendo una regla fija, «en los grandes, defiende», en vez de una elección.

## Qué propongo

**No construir decisiones con más peso en los partidos grandes.** No da control a quien tiene un buen equipo, y a quien tiene uno flojo solo se lo da con un peso que infla el ranking alrededor de un 80 % y reduce la elección a «defiende».

Si se busca más sensación de control en Liga, tendría que venir de otra palanca, y medirse antes con el mismo método. Este informe no propone cuál.

## Método

- Mismas carreras, semillas y draft que la fase 2. Los partidos grandes son los de margen +1: el rival tiene, como mínimo, la media del equipo menos 1. En ellos se deciden el planteamiento y el descanso. En Copa y Europa el jugador simulado siempre decide bien.
- **El peso multiplica el efecto de las decisiones respecto a no hacer nada,** y solo en los partidos de Liga en que se decide:
  - En el planteamiento, cuánto cambian los goles esperados de cada equipo.
  - En el descanso, la probabilidad de gol de más al arriesgar y la de anular un gol al cerrar.
- **Se aplica solo en la compilación de la auditoría** (`scripts/auditLeagueDecisions.vite.ts`). El gancho no altera nada por sí solo: con ×1 salen exactamente los números de la fase 2.
- **Los jugadores simulados:**
  - «Decide bien» elige el planteamiento con más puntos esperados, ya con el peso aplicado, y en el descanso arriesga si va perdiendo y cierra si va ganando.
  - «Decide mal» hace lo contrario.
  - «Al azar» elige las dos cosas sin mirar.
  - Una persona quedaría entre «bien» y «al azar».

### Limitaciones

- **No mide cómo se siente:** las mismas limitaciones de la fase 2.
- **Multiplicar el efecto es solo una de las formas de hacer que pese más.** Por ejemplo, una que diera más ventaja al planteamiento acertado sin subir el riesgo daría otros números.

## Resultados

Posición en la 1.ª temporada, decide bien / al azar / mal:

| Peso | Normal, mejor media | Normal, al azar | Fácil, mejor media | Fácil, al azar |
| --- | --- | --- | --- | --- |
| Hoy | 4,79 | 7,80 | 3,50 | 5,64 |
| ×1 | 4,47 / 5,15 / 5,15 | 7,08 / 7,34 / 8,09 | 3,45 / 3,48 / 3,51 | 5,07 / 5,39 / 5,97 |
| ×1,5 | 4,30 / 5,05 / 5,20 | 7,11 / 7,74 / 8,87 | 3,45 / 3,30 / 3,66 | 4,92 / 5,54 / 6,20 |
| ×2 | 4,39 / 5,08 / 5,52 | 6,73 / 7,62 / 8,94 | 3,32 / 3,48 / 3,80 | 4,73 / 5,50 / 6,01 |
| ×3 | 4,21 / 4,84 / 5,56 | 6,27 / 7,43 / 9,23 | 3,30 / 3,46 / 3,91 | 4,81 / 5,29 / 6,43 |
| ×4 | 4,13 / 4,71 / 5,62 | 5,66 / 7,37 / 9,36 | 3,27 / 3,52 / 3,94 | 4,52 / 5,35 / 6,19 |
| ×6 | 4,22 / 4,68 / 5,63 | 5,59 / 7,20 / 9,66 | 3,22 / 3,57 / 3,79 | 4,20 / 5,31 / 6,19 |

Los márgenes son de ±0,25 a ±0,5 puestos.

Temporadas superadas, decide bien / al azar / mal:

| Peso | Normal, mejor media | Normal, al azar | Fácil, mejor media | Fácil, al azar |
| --- | --- | --- | --- | --- |
| Hoy | 2,24 | 1,01 | 3,74 | 1,79 |
| ×1 | 2,69 / 2,14 / 2,06 | 1,29 / 0,95 / 0,77 | 4,69 / 3,81 / 3,63 | 2,30 / 1,87 / 1,58 |
| ×1,5 | 3,00 / 2,23 / 1,84 | 1,17 / 0,93 / 0,73 | 4,62 / 3,83 / 3,61 | 2,28 / 1,88 / 1,54 |
| ×2 | 3,12 / 2,35 / 1,82 | 1,45 / 0,92 / 0,60 | 4,79 / 4,19 / 3,37 | 2,68 / 1,79 / 1,60 |
| ×3 | 3,39 / 2,20 / 1,75 | 1,71 / 1,01 / 0,59 | 5,45 / 4,13 / 3,10 | 2,76 / 1,83 / 1,34 |
| ×4 | 3,42 / 2,36 / 1,54 | 1,84 / 0,98 / 0,56 | 5,80 / 4,20 / 3,06 | 3,19 / 2,00 / 1,26 |
| ×6 | 4,26 / 2,46 / 1,65 | 2,42 / 1,12 / 0,57 | 6,27 / 4,50 / 3,39 | 3,55 / 1,80 / 1,28 |

Puntuación del ranking decidiendo bien, y cambio frente a hoy:

| Peso | Normal, mejor media | Normal, al azar | Fácil, mejor media | Fácil, al azar |
| --- | --- | --- | --- | --- |
| Hoy | 26,8 | 11,8 | 47,1 | 21,5 |
| ×1 | 32,6 (+22 %) | 15,0 (+28 %) | 59,3 (+26 %) | 27,3 (+27 %) |
| ×2 | 37,4 (+40 %) | 16,8 (+42 %) | 60,5 (+29 %) | 31,8 (+48 %) |
| ×3 | 40,6 (+52 %) | 19,9 (+69 %) | 68,5 (+45 %) | 33,1 (+54 %) |
| ×4 | 41,6 (+55 %) | 21,3 (+81 %) | 73,4 (+56 %) | 37,3 (+74 %) |
| ×6 | 51,4 (+92 %) | 27,7 (+135 %) | 79,5 (+69 %) | 41,5 (+93 %) |

Planteamiento elegido al decidir bien, en Normal con el mejor draft:

| Peso | Ataque | Equilibrado | Defensa |
| --- | --- | --- | --- |
| ×1 | 28 % | 14 % | 58 % |
| ×1,5 | 11 % | 16 % | 73 % |
| ×2 | 9 % | 12 % | 79 % |
| ×3 | 6 % | 17 % | 77 % |
| ×4 | 5 % | 23 % | 72 % |
| ×6 | 12 % | 21 % | 67 % |
