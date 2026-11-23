# Por qué `audit:balance:100` no es determinista (v0.25.121)

El usuario pidió medir por qué `npm run audit:balance:100` da resultados distintos cada vez. En el informe del #178, en dos ejecuciones seguidas, el Athletic ganó 14 y 8 ligas de 100.

**Es solo una auditoría:** no cambia el juego ni los scripts.

## Cómo se ha medido

- **Leyendo** `scripts/balanceAuditCli.ts` y las funciones del juego que usa.
- **Ejecutando** la auditoría compilada con una precarga de Node que cuenta desde dónde se llama a `Math.random`. En una segunda prueba, la precarga fija `Date.now` y da a `Math.random` una semilla fija.
- **Repitiendo** la auditoría tal como está hoy: 30 veces con 100 temporadas, y una vez con 10.000 como referencia.

## Resultados

### 1. De dónde sale el azar

En una ejecución de 20 temporadas, `Math.random` se llama desde cuatro sitios:

| Dónde | Qué decide | Llamadas |
| --- | --- | --- |
| `runBalanceAudit` (script) | La semilla de los partidos: `Date.now() + Math.random()` | 1 |
| `main` (script) | La semilla del once automático | 1 |
| `createLeagueSeasonSalt` (juego) | La forma de temporada de cada rival (tabla v0.15.7) | 1 por temporada |
| `createCupPathSeed` (juego) | El cuadro de Copa: qué rivales te tocan | 1 por temporada |

A estas se suma `SIMULATION_SESSION_SALT`, que se calcula una vez al cargar el módulo y que la auditoría no usa, porque cada temporada trae su propia sal.

- **El script pasa una semilla a los partidos,** pero esa semilla sale de la hora.
- **Además, `createUserLeagueSimulation` no admite semilla.** La forma de los rivales y el cuadro de Copa salen siempre de `Math.random` y `Date.now`. En el juego está bien así, porque cada temporada debe ser distinta.
- **La semilla del once no influye con el perfil `balanced`,** el que usa `audit:balance:100`. Solo la usa el perfil `random`. Con `balanced`, el once sale siempre igual: media 83.
- **Afecta a los cuatro comandos que usan este script:** `audit:balance`, `audit:balance:100`, `audit:balance:json` y `audit:copa:100`.

### 2. Con el azar fijado, sale siempre lo mismo

Con `Date.now` fijo y `Math.random` con semilla, dos ejecuciones de 100 temporadas dan **exactamente la misma salida**, línea a línea. No hay otra fuente de azar.

Es lo mismo que ya hacen las auditorías de carrera y del Oviedo con `scripts/auditCareerRunner.ts` (`seedCareer`), sin tocar el juego.

### 3. Con 100 temporadas, el ruido es grande

Las mismas 100 temporadas, 30 veces, con el azar de hoy:

| Dato | Mínimo | Máximo | Desviación | Con 10.000 temporadas |
| --- | --- | --- | --- | --- |
| Puesto medio del Athletic | 3,4.º | 4,0.º | 0,14 | 3,63.º |
| Puntos | 62,2 | 63,5 | 0,29 | 62,86 |
| Top 4 | 64 | 78 | 3,1 | 72,9 % |
| **Ligas del Athletic** | **6** | **16** | **2,8** | **11,5 %** |
| Copas del Athletic | 9 | 21 | 2,7 | 16,2 % |
| Descensos del Villarreal | 0 | 8 | 1,8 | 2,8 % |
| Copas de la élite | 19 | 32 | 3,8 | 26,1 % |

- **El 14 y el 8 del informe del #178 son ruido normal.** Con 100 temporadas, las ligas del Athletic van de 6 a 16 sin cambiar nada.
- **Fijar la semilla da reproducibilidad, no precisión.** Con la semilla de la prueba salieron 18 ligas de 100, lejos del 11,5 % real. Una semilla fija repite siempre la misma muestra de 100, con su error.
- **Es barato simular más:** 100 temporadas tardan 1 segundo, 2.000 unos 10 segundos. Con 2.000, la desviación de las ligas del Athletic baja a unos 0,7 puntos, frente a los 2,8 de ahora.

## Opciones

- **A. Fijar la semilla en el script,** sin tocar el juego.
  - `scripts/balanceAuditCli.ts` llamaría a `seedCareer` de `auditCareerRunner` al empezar, con `--seed=N` (por defecto, 1).
  - Las semillas de partidos y del once saldrían de ahí, no de la hora.
  - Así, los cuatro comandos darían siempre lo mismo. Si cambia algo de la simulación, la salida cambia, y si no, sale idéntica byte a byte, como ya pasa con `audit:europe` o `audit:oviedo`.
  - Los números no se pueden comparar con ejecuciones anteriores, que eran al azar.
- **B. A, y además subir el número de temporadas** de `audit:balance` y `audit:copa:100` a 2.000.
  - Tarda unos 10 segundos en vez de 1, y el error baja a una cuarta parte.
  - Pero los comandos se llaman `:100`, así que habría que renombrarlos o dejar el nombre con un número que ya no es el real.

## Qué propongo

**A.** Es un cambio solo en el script y sigue el patrón que ya usan las otras auditorías.

Para medir si cambia el balance entre versiones, no basta con 100 temporadas: hay que usar `-- --sims=2000`. Lo dejaría escrito en la ayuda del script, sin renombrar comandos.

## Visto de paso (sin tocar)

- **En `src/simulation/` hay una copia antigua:** `leagueSimulator.ts.backup_before_v0_12_25_cleanup`. No se compila ni entra en el bundle, pero aparece en las búsquedas.
- **El panel de auditoría del juego** (`src/components/BalanceAuditPanel.tsx`) también usa la hora como semilla. Es una herramienta interna del juego y no se ha medido.
