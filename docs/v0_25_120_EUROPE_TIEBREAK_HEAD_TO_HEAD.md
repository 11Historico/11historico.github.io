# v0.25.120 — El desempate europeo, a enfrentamiento directo

Sale de `docs/INFORME_DESEMPATE_EUROPEO_v0_25_119.md` («mide el desempate»). El usuario pidió «haz la b» y aprobó el plan con «adelante». **Cambia una regla de Europa** con su permiso: solo el último desempate de la fase de liga.

## La regla

| Paso | Hasta la v0.25.119 | Ahora |
| --- | --- | --- |
| 1-3 | Puntos, diferencia de goles y goles a favor | Igual |
| 4 | El nombre: el tuyo, para la regla, es `"user"` | El enfrentamiento directo entre los empatados: puntos, diferencia y goles en esos partidos, mirado una sola vez |
| 5 | — | Un sorteo fijo para cada torneo, con la semilla del sorteo de rivales |

## Lo que cambia para el jugador

- **Empates totales:** antes perdías entre el 72 y el 100 %; ahora ganas más o menos la mitad.
- **Cuánto se nota:** pasa en 2-4 de cada 100 torneos. Tu puesto cambia en 1-2 de cada 100 y la probabilidad de llegar a semifinales sube entre 0 y 0,5 puntos.
- **La nota de la tabla** dice cómo se desempata: «Con empate a puntos, diferencia y goles, decide el enfrentamiento directo y, si sigue, un sorteo.»
- **Al empezar la fase de liga,** con todos a cero, la tabla sale en el orden del sorteo. Antes salía por orden alfabético.
- **Partidas guardadas:** si en la temporada en curso ya terminó la fase de liga, en 1 o 2 torneos de cada 100 la tabla puede reordenarse respecto a lo que ya se jugó. El cuadro y las eliminatorias no cambian.

## Código

- **`src/europe/europeanLeagueTable.ts`:**
  - `sortEuropeanLeagueRows` sustituye a `compareRows`. Ordena con la regla nueva y usa `recordResult` para la tabla de los partidos entre empatados.
  - `getEuropeanLeaguePhaseResults` devuelve los partidos que cuentan: los tuyos jugados y los de los rivales en jornadas ya jugadas.
  - `getEuropeanLeagueTieSeed` da la semilla del sorteo.
  - La tabla vuelve a llevar tu nombre desde el principio: el arreglo de la v0.25.119 ya no hace falta, porque el nombre no decide.
  - La regla de quién pasa, la previa, el prestigio y el resumen usan esta tabla, así que cambian solos.
- **`src/europe/europeanSemifinalChance.ts`:** la probabilidad de semifinales ordena sus tablas simuladas con la misma regla, con los resultados reales y los simulados.
- **`src/components/EuropeanLeagueTable.tsx`:** la nota de las reglas.
- **`scripts/auditEuropeTiebreak.ts`:** la regla «nombre» se calcula aparte, y el script comprueba que la regla «directo» da el mismo puesto que el juego.

## Comprobación

- **`npm run audit:europe-tiebreak`:** las mismas tablas que el informe. La regla «directo» del script coincide con el juego en los 45.000 torneos.
- **Tests nuevos:**
  - gana el directo aunque el otro equipo vaya antes por nombre;
  - con el directo empatado, decide el sorteo, que es fijo por torneo y no sigue el nombre;
  - en 900 torneos simulados ganas la mitad de los empates totales (12 de 24);
  - la tabla sigue coincidiendo con la regla;
  - el e2e comprueba la nota.
- **En el navegador,** con la partida de prueba `career-strong` y un caso real de la Conference: acabas empatado con el APOEL en todo (10 puntos, +2, 5 goles) y le ganaste 1-0.
  - La tabla te pone 2.º, en verde, y al APOEL 3.º, en ámbar.
  - El cuadro va directo a la semifinal, contra el Qarabağ. Con la regla de antes habrías sido 3.º y habrías jugado la previa.
  - Sale la nota nueva y no hay errores en la consola.
- Pasan `npm run typecheck`, `npx eslint src scripts`, `npm test` (272), `npm run qa:ci` y `npm run test:e2e` (22 pasan, 2 se saltan).
