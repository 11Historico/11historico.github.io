# Fase 13: eliminatoria previa en Europa (medida sobre v0.25.106)

Solo es una auditoría: el juego no cambia y no hay versión nueva. La fase 13 del roadmap (`docs/ROADMAP_MEJORAS_v0_25_91.md`) necesita [PERMISO], porque toca las reglas europeas y el balance.

## Qué se mide

Hoy pasan a semifinales los 2 primeros de la fase inicial (7 equipos, 6 partidos), y quedar 3.º o 4.º elimina.

Con la previa, el 3.º y el 4.º juegan un partido único, con prórroga y penaltis como la semifinal, por entrar en semifinales. El 3.º juega en casa. Se juega en la jornada 27 de Liga, entre la última de la fase inicial (24) y la semifinal (30).

Dos variantes:
- **3.º contra 4.º:** el usuario juega contra el otro club de esos dos puestos de su tabla.
- **Club nuevo:** un club de la competición que no estaba en la fase inicial, sorteado con la semilla del torneo.

Lo demás no cambia: la semifinal y la final, el sorteo de sus rivales, el prestigio (+1 / +0,75 / +0,5 al campeón y +0,25 al finalista) y la puntuación del ranking.

Reproducible con `npm run audit:european-playoff` en el commit 159392a. Opciones: `--tournaments=N` (2000 por defecto) y `--careers=N` (600 por defecto; 0 para medir solo los torneos). Se tarda unos 12 minutos.

La previa existía solo en `scripts/auditCareerRunner.ts`: `getEuropeanPlayoff`, `advanceAfterEuropeanPlayoff` y `Policy.europeanPlayoff`. Sin esa opción, las carreras daban exactamente los números de `audit:rating`. Comprobado: 2,25 / 0,91 / 3,50 / 1,82 temporadas y 27,56 / 10,76 / 44,38 / 22,07 puntos.

**Desde la v0.25.107** el juego juega la previa 3.º contra 4.º (opción B), así que esta auditoría y su código en el runner se retiraron. `audit:rating` mide ya el formato nuevo (`docs/v0_25_107_EUROPEAN_PLAYOFF.md`).

## Torneos sueltos (2000 por fila, semillas como las del juego)

El rating es el de simulación en Europa, ya comprimido y con el +1 del entrenador. Un once de 88 visible juega con unos 85.

**Llegar a semifinales:**

| Competición | Rating · decisiones | Hoy | Con previa (las dos variantes) |
| --- | --- | --- | --- |
| Champions | 84 · no decide | 9 % | 14 % |
| Champions | 86 · no decide | 12 % | 19 % |
| Champions | 86 · decide bien | 15 % | 27 % |
| Champions | 88 · decide bien | 20 % | 34 % |
| Europa League | 84 · no decide | 23 % | 37–38 % |
| Europa League | 86 · no decide | 32 % | 47–48 % |
| Europa League | 86 · decide bien | 43 % | 61 % |
| Europa League | 88 · decide bien | 53 % | 70 % |
| Conference | 84 · no decide | 52 % | 69 % |
| Conference | 86 · no decide | 61 % | 76 % |
| Conference | 86 · decide bien | 73 % | 84 % |
| Conference | 88 · decide bien | 78 % | 89 % |

**Ganar el título:**

| Competición | Rating · decisiones | Hoy | Con previa |
| --- | --- | --- | --- |
| Champions | 86 · no decide | 1 % | 2–3 % |
| Champions | 88 · decide bien | 4 % | 7 % |
| Europa League | 86 · no decide | 8 % | 13 % |
| Europa League | 88 · decide bien | 20 % | 27 % |
| Conference | 86 · no decide | 26 % | 32–33 % |
| Conference | 88 · decide bien | 46 % | 52 % |

- Quedan 3.º o 4.º entre el 14 % y el 32 % de los torneos.
- La previa la gana desde un tercio de los que la juegan (Champions, 84, sin decidir) hasta unos cuatro de cada cinco (Conference, 88, decidiendo bien).
- Las dos variantes dan lo mismo, con 1 punto de diferencia como mucho. Con el club nuevo, el rival de la previa es 0,2–0,4 más fuerte en Champions (unos 88,0 contra 87,8), 0,2–0,6 más débil en Europa League (unos 82,0 contra 82,3) y casi igual en Conference.
- Decidir bien gana más con la previa: es un partido más donde el planteamiento y el descanso cuentan.

La tabla completa, con la final y las 54 filas, sale de la auditoría.

## Carreras completas (600 por casilla, «decide bien»)

| Caso | Formato | Temporadas superadas | Títulos por temporada | Títulos europeos por temporada | Puntuación |
| --- | --- | --- | --- | --- | --- |
| Normal, mejor media | Hoy | 2.25 ±0.15 | 0.35 | 0.078 | 27.56 ±1.93 |
| | 3.º contra 4.º | 2.23 ±0.15 | 0.38 | 0.103 | 27.79 ±1.91 |
| | Club nuevo | 2.24 ±0.15 | 0.38 | 0.103 | 27.96 ±1.93 |
| Normal, al azar | Hoy | 0.91 ±0.09 | 0.19 | 0.046 | 10.76 ±1.13 |
| | 3.º contra 4.º | 0.91 ±0.09 | 0.21 | 0.062 | 11.03 ±1.18 |
| | Club nuevo | 0.91 ±0.09 | 0.21 | 0.062 | 11.02 ±1.18 |
| Fácil, mejor media | Hoy | 3.50 ±0.24 | 0.47 | 0.098 | 44.38 ±3.03 |
| | 3.º contra 4.º | 3.57 ±0.25 | 0.51 | 0.127 | 46.23 ±3.26 |
| | Club nuevo | 3.58 ±0.26 | 0.51 | 0.127 | 46.38 ±3.33 |
| Fácil, al azar | Hoy | 1.82 ±0.14 | 0.31 | 0.064 | 22.07 ±1.73 |
| | 3.º contra 4.º | 1.83 ±0.14 | 0.33 | 0.091 | 22.69 ±1.80 |
| | Club nuevo | 1.83 ±0.14 | 0.33 | 0.090 | 22.69 ±1.81 |

- **Títulos europeos:** suben entre un 30 % y un 42 %. Es lo que el roadmap llamaba «riesgo»: hay más copas europeas.
- **Temporadas superadas:** no cambian. Europa no decide si sigues; solo el bonus del campeón o del finalista mejora un poco la temporada siguiente.
- **Puntuación del ranking:** sube entre 0,2 y 2 puntos, siempre dentro del margen. El ranking no se dispara.
- **Plausibilidad:** ninguna carrera rechazada en 7200.

## Opciones

- **A. Dejarlo como está.** Europa sigue siendo exigente: en Champions, con 86 y sin decidir, el 12 % llega a semifinales.
- **B. Previa 3.º contra 4.º (recomendada si se quiere hacer).**
  - Por qué: el rival ya está en tu tabla, no hace falta otro sorteo, y la última jornada importa más, porque ser 3.º da el partido en casa.
  - Qué da: llegar a semifinales sube entre 5 y 18 puntos y los títulos europeos un tercio, con la puntuación dentro del margen.
- **C. Previa contra un club nuevo.** Los mismos números que B. Añade un rival nuevo a la temporada, pero obliga a otro sorteo y a explicar de dónde sale.

## Qué tocaría hacerla en el juego (B o C)

Es un cambio de reglas europeas con partidas guardadas, más grande que las fases anteriores:

- **`europeanTypes.ts`:** una fase nueva, `playoff`, en el torneo y en el partido. Las partidas guardadas a mitad de torneo siguen con el formato de antes.
- **`europeanTournament.ts`:**
  - crear la previa al acabar 3.º o 4.º;
  - avanzar a semifinales al ganarla;
  - que la previa cuente como eliminatoria: prórroga y penaltis, sin empate.
- **`europeanCalendar.ts`:** el hueco de la jornada 27, y un hueco proporcional con ligas de otro tamaño.
- **`europeanSemifinalChance.ts` (fase 5):** la probabilidad de pasar debe contar la previa.
- **Pantallas:**
  - la tabla europea, con la zona del 3.º y el 4.º marcada como «Previa»;
  - la previa y el partido europeo;
  - el panel de progreso, el cuadro de la temporada y los veredictos y textos que hoy dicen «los 2 primeros».
- **Tests:** unitarios de la regla y de la carga de partidas antiguas, más el e2e de Europa.

## Validar

```powershell
npm run typecheck
npx eslint scripts
npm run audit:european-playoff
npm run audit:rating -- --careers=600 --only=1   # debe dar lo mismo que la fila «Hoy»
```
