# El desempate de la fase de liga europea (v0.25.119)

La auditoría de recorridos (`docs/INFORME_EUROPA_RECORRIDOS_v0_25_118.md`) vio que, con empate total en la fase de liga, el último desempate es el nombre. En la regla que decide quién pasa, tu equipo se llama `"user"`, así que pierdes casi todos esos empates. La v0.25.119 hizo que la tabla diga lo mismo que la regla, pero la regla sigue igual. El usuario pidió «mide el desempate».

**Es solo una auditoría:** no cambia el juego.

## Cómo se ha medido

- **Script:** `npm run audit:europe-tiebreak` (`scripts/auditEuropeTiebreak.ts`), con semillas fijas, así que es reproducible.
- **Torneos:** 5.000 por casilla. Son las 3 competiciones con ratings de simulación de 82, 85 y 88, los mismos que en la auditoría de recorridos.
  - Se usan el sorteo de rivales, el motor y las semillas del juego.
  - En todos los partidos se juega «equilibrado» y sin cambios en el descanso.
- **Reglas comparadas:** cada torneo se juega una vez y su tabla final se ordena con cuatro reglas. Todas empiezan por los puntos.

| Regla | Después de los puntos |
| --- | --- |
| **Nombre** (la de hoy) | Diferencia de goles, goles a favor y el nombre (el tuyo es `"user"`). |
| **Directo** | Diferencia de goles y goles a favor. Si sigue el empate, el enfrentamiento directo entre los empatados (puntos, diferencia y goles en esos partidos) y, al final, un sorteo con la semilla del torneo. Solo sustituye al nombre. |
| **Sorteo** | Diferencia de goles, goles a favor y el sorteo. Sirve de referencia neutral. |
| **Directo primero** | Con empate a puntos, primero el enfrentamiento directo y luego la diferencia y los goles de toda la fase; al final, el sorteo. Así lo hacía la UEFA en la antigua fase de grupos. |

- **Controles del script:** la regla «nombre» da el mismo puesto que `getEuropeanLeaguePhaseUserPosition` en todos los torneos. Los resultados recalculados cuadran con la tabla del juego.
- **Semifinales:** se cuenta pasar entre los 2 primeros, o ser 3.º o 4.º y ganar la previa. La previa se juega con la misma semilla en todas las reglas, así que solo cambia si cambia el rival o el campo.

## Resultados

### Los empates totales

| Competición | Rating | Empate total contigo | Entre 3 o más | Los ganas: nombre / directo / sorteo | El directo lo resuelve |
| --- | --- | --- | --- | --- | --- |
| Conference | 82 / 85 / 88 | 3,3 / 3,0 / 2,3 % | 3 % | 23-28 % / 39-47 % / 44-49 % | 48-57 % |
| Europa League | 82 / 85 / 88 | 3,7 / 3,5 / 3,3 % | 2-3 % | 7-10 % / 49-54 % / 50-54 % | 53-55 % |
| Champions | 82 / 85 / 88 | 2,2 / 2,7 / 3,1 % | 3 % | 0 % / 44-45 % / 41-52 % | 50-56 % |

- **Hay empate total contigo en 2-4 de cada 100 torneos.** Casi siempre es entre dos equipos.
- **Con el nombre, ganas el 0-28 % de esos empates.** En la Champions, ninguno: todos los rivales van antes que la «u». En la Conference ganas algunos porque hay rivales que empiezan por V o Z.
- **Con el directo, ganas cerca de la mitad,** casi lo mismo que con el sorteo puro. Es decir, el directo es justo.
- **El directo resuelve la mitad de los empates.** La otra mitad acaba en sorteo, porque el partido entre los dos terminó en empate.

### Lo que cambia para ti

| Competición | Rating | Directo: cambia tu puesto | Directo: cambia tu zona (mejor / peor) | Directo: rival de la previa distinto | Semifinales: nombre → directo |
| --- | --- | --- | --- | --- | --- |
| Conference | 82 | 1,5 % | 0,4 / 0,3 % | 0,3 % | 61,4 → 61,4 % |
| Conference | 85 | 1,4 % | 0,3 / 0,1 % | 0,3 % | 74,4 → 74,6 % |
| Conference | 88 | 1,1 % | 0,3 / 0,1 % | 0,2 % | 82,4 → 82,6 % |
| Europa League | 82 | 1,8 % | 0,7 / 0,0 % | 0,3 % | 31,1 → 31,4 % |
| Europa League | 85 | 1,9 % | 0,8 / 0,1 % | 0,4 % | 43,7 → 44,0 % |
| Europa League | 88 | 1,8 % | 0,6 / 0,1 % | 0,3 % | 58,2 → 58,7 % |
| Champions | 82 | 1,0 % | 0,3 / 0,0 % | 0,1 % | 10,5 → 10,6 % |
| Champions | 85 | 1,2 % | 0,4 / 0,0 % | 0,1 % | 15,6 → 15,8 % |
| Champions | 88 | 1,4 % | 0,6 / 0,0 % | 0,2 % | 24,9 → 25,1 % |

| Competición | Rating | Directo primero: cambia tu puesto | Directo primero: cambia tu zona (mejor / peor) | Semifinales: nombre → directo primero |
| --- | --- | --- | --- | --- |
| Conference | 82 / 85 / 88 | 12,8 / 12,1 / 10,1 % | 3,1 / 2,3 · 2,6 / 2,4 · 1,9 / 1,8 % | 61,4 → 61,8 · 74,4 → 74,8 · 82,4 → 82,5 % |
| Europa League | 82 / 85 / 88 | 14,1 / 14,6 / 14,4 % | 3,0 / 2,2 · 3,6 / 2,8 · 3,8 / 2,7 % | 31,1 → 31,2 · 43,7 → 43,8 · 58,2 → 58,9 % |
| Champions | 82 / 85 / 88 | 10,2 / 11,9 / 13,0 % | 1,7 / 1,4 · 2,2 / 1,7 · 2,6 / 2,1 % | 10,5 → 10,5 · 15,6 → 15,8 · 24,9 → 25,3 % |

## Hallazgos

### 1. El desempate de hoy te perjudica, pero cuesta poco

- Pierdes casi todos los empates totales, cuando lo justo sería perder la mitad.
- **Aun así, cambiarlo al directo apenas mueve la probabilidad de llegar a semifinales:** entre 0 y 0,5 puntos.
  - Cambia tu puesto en 1-2 de cada 100 torneos.
  - Cambia tu zona en menos de 1 de cada 100 (semifinales, previa o fuera). Casi siempre es a mejor.
- **Corrección al informe anterior:** decía que cambiar el desempate cambiaría quién pasa en el 2-5 % de los torneos. Medido, tu zona cambia en el 0,3-0,9 %, y tu puesto, en el 1-2 %.

### 2. El directo primero es más realista, pero mueve mucho la tabla

- Reordena tu puesto en 1 de cada 8 torneos (10-15 %) y tu zona en el 3-6,5 %, unas veces a mejor y otras a peor.
- La probabilidad de semifinales queda casi igual: entre 0 y 0,7 puntos más.
- **La tabla dejaría de ir en el orden de las columnas.** Solo enseña puntos y diferencia de goles, así que un equipo con peor diferencia podría salir por delante sin que se vea por qué. Habría que explicarlo en la tabla.

### Visto y sin tocar

- **La Liga del juego** (`sortLeagueTable`) también acaba en el nombre. Ahí la tabla y la regla usan el mismo nombre, así que no se contradicen. No se ha medido aquí.

## Opciones

- **A. Dejarlo así.** Desde la v0.25.119 la tabla dice la verdad. La desventaja existe, pero cuesta menos de medio punto de probabilidad de semifinales.
- **B. El directo en lugar del nombre** (cambia la regla de Europa: necesita permiso). Es el cambio mínimo: el nombre se sustituye por el enfrentamiento directo y, si sigue el empate, por el sorteo con semilla.
  - Ganas la mitad de los empates totales.
  - Cambia tu puesto en el 1-2 % de los torneos.
  - Además, la nota de la tabla diría cómo se desempata.
- **C. El directo primero** (cambia la regla: necesita permiso). Es el más realista, pero reordena 1 de cada 8 tablas y necesita explicarse en pantalla.

**Qué habría que tocar con B o C:**

| Dónde | Qué |
| --- | --- |
| `src/europe/europeanLeagueTable.ts` | `compareRows` solo compara filas. El nuevo orden necesita los resultados entre los empatados, así que `buildEuropeanLeaguePhaseTable` ordenaría con ellos. La regla (`getEuropeanLeaguePhaseUserPosition`) y la previa (`advanceToPlayoff`) ya usan esa tabla. |
| `src/europe/europeanSemifinalChance.ts` | La probabilidad ordena sus tablas simuladas con `compareRows`. Tendría que usar la misma regla. |
| Partidas guardadas | Si al actualizar el torneo de esta temporada ya ha pasado la fase de liga, su tabla podría reordenarse a toro pasado. Por ejemplo, podría salir 2.º alguien que jugó la previa. Solo afecta a esa temporada. |
| Comprobaciones | Tests de la tabla y de la probabilidad, y otra vez `npm run audit:europe-tiebreak`. |

## Qué propongo

- **B,** si quieres que el desempate sea justo. Es el cambio pequeño, se explica en una línea y apenas mueve la probabilidad de semifinales.
- **A,** si prefieres no tocar la regla. Con la v0.25.119 la tabla ya no engaña, y el coste real es pequeño.
- **C no lo recomiendo:** mueve mucho la tabla para el mismo resultado.

## Decisión

El usuario eligió «la b». Está hecha en la v0.25.120 (`docs/v0_25_120_EUROPE_TIEBREAK_HEAD_TO_HEAD.md`). Al volver a ejecutar `npm run audit:europe-tiebreak` con la regla nueva salen las mismas tablas, y la regla «directo» del script da el mismo puesto que el juego en los 45.000 torneos.
