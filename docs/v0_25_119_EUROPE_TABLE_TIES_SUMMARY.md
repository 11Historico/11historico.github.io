# v0.25.119 — Europa, contada entera

Sale de `docs/INFORME_EUROPA_RECORRIDOS_v0_25_118.md` («mide Europa»). El usuario pidió «haz la a, c y d» y aprobó el plan con «adelante».

Todo es pantalla y texto. No cambia ninguna regla ni quién pasa. El desempate por nombre (la opción B del informe) se queda como estaba.

## A. La tabla europea dice lo mismo que la regla

- **Lo que fallaba:** el último desempate de la tabla es el nombre (`compareRows`).
  - La regla de quién pasa (`getEuropeanLeaguePhaseUserPosition`) te llama `"user"`.
  - La tabla que ves te llamaba «Athletic Club Histórico».
  - Con empate total, la tabla podía ponerte 2.º, en verde, mientras el juego te mandaba a la previa como 3.º.
  - En la auditoría pasaba en el 2-3 % de los torneos, y en cerca del 1 % la zona era distinta.
- **Ahora:** `buildEuropeanLeaguePhaseTable` ordena con el nombre interno, como la regla, y pone tu nombre después de ordenar.

## C. El resumen de la temporada cuenta Europa entera

`getEuropeanSeasonBalanceText`:

| Cómo acabó | Antes | Ahora |
| --- | --- | --- |
| Fuera en la semifinal | «Europa: pasaste a semifinales.» | «Europa: pasaste a semifinales y caíste ante Qarabağ.» |
| Final perdida | «Europa: pasaste a semifinales.» | «Europa: llegaste a la final y la perdiste ante Dinamo Tbilisi.» |
| Campeón | «Europa: pasaste a semifinales.» | «Europa: campeón de la Conference League.» |
| Fase inicial o previa | «caíste en la fase inicial / en la previa (N.º de 7)» | Igual |

La coletilla dice ahora «lo normal era pasar **a semifinales** 8 de cada 10 veces», para que se entienda también cuando hablas de la final.

## D. Los detalles

- **Fuera en la fase de liga** (`EuropeanLeagueTable.tsx`): la nota de las reglas se cambia por «Quedaste 7.º: fuera de Europa esta temporada.».
- **Resumen completo** (`FinalSummary.tsx`): el bloque europeo se titula con la competición y, encima, cómo acabó, como el de la Copa.
  - El resultado es uno de estos: «Campeón», «Subcampeón», «Eliminado en semifinal», «Eliminado en la previa» o «Eliminado en la fase inicial (7.º de 7)».
  - Antes ponía «Torneo europeo · Fase inicial, previa, semifinal y final».

## Comprobación

- **Tests:**
  - `europeanLeagueTable.test.ts`: tu puesto en la tabla es el de la regla en 900 torneos simulados de las tres competiciones. Con el código anterior, el test fallaba en 17.
  - `europeanSemifinalChance.test.ts`: los textos de la semifinal perdida, la final perdida y el campeón, y la coletilla nueva.
- **En el navegador,** con la partida de prueba `career-strong`, los recorridos de la auditoría:
  - **previa con triple empate:** la tabla te pone 3.º, en ámbar, igual que el juego (antes, 2.º en verde); resumen completo: «Eliminado en la previa / Conference League»;
  - **fuera en la fase de liga:** «Quedaste 7.º: fuera de Europa esta temporada.»; «Eliminado en la fase inicial (7.º de 7)»;
  - **semifinal perdida:** «pasaste a semifinales y caíste ante Qarabağ»; «Eliminado en semifinal»;
  - **final perdida:** «llegaste a la final y la perdiste ante Dinamo Tbilisi»; «Subcampeón»;
  - **campeón:** «campeón de la Conference League»; «Campeón»;
  - sin errores en la consola.
- Pasan `npm run typecheck`, `npx eslint src scripts`, `npm test` (269), `npm run qa:ci` y `npm run test:e2e` (22 pasan, 2 se saltan).
