# v0.25.107 — Previa europea del 3.º contra el 4.º

Es la fase 13 del roadmap (`docs/ROADMAP_MEJORAS_v0_25_91.md`), opción B del informe `docs/INFORME_ELIMINATORIA_PREVIA_v0_25_106.md`. El usuario dio permiso con «haz la B».

## La regla

En la fase inicial europea hay una tabla de 7 equipos y cada uno juega 6 partidos.

| Puesto | Antes | Ahora |
| --- | --- | --- |
| 1.º y 2.º | Semifinal | Semifinal |
| 3.º y 4.º | Eliminado | Previa a partido único por entrar en semifinales |
| 5.º a 7.º | Eliminado | Eliminado |

Cómo es la previa:
- **Rival:** el otro club del 3.º y el 4.º de tu tabla, sin sorteo.
- **Campo:** juega en casa el 3.º.
- **Jornada:** la 27 de Liga, entre la última de la fase inicial (24) y la semifinal (30). Con ligas de otro tamaño, al 72 % de la temporada.
- **Desempate:** como la semifinal y la final; si hay empate a los 90', prórroga y penaltis.
- **Después:** ganarla lleva a la semifinal, sorteada como antes y sin repetir ningún rival del torneo. Perderla elimina.

## Qué cambia en el código

- **`europeanTypes.ts`:** la fase `playoff`, para el torneo y para el partido.
- **`europeanTournament.ts`:**
  - `EUROPEAN_LEAGUE_PHASE_PLAYOFF_POSITIONS = 4` y `advanceToPlayoff`;
  - en `applyEuropeanMatchResult`, el paso a la previa y lo que pasa al ganarla o perderla;
  - `isEuropeanKnockoutMatch` y `isEuropeanKnockoutPhase` incluyen la previa, así que se juega con prórroga y penaltis;
  - las etiquetas («Previa») y los textos de estado y de lo que te juegas.
- **`europeanCalendar.ts`:** el hueco `playoff` (jornada 27). El normalizador da jornada a una previa guardada sin ella.
- **`europeanSemifinalChance.ts`:**
  - la probabilidad de pasar a semifinales simula también la previa cuando quedas 3.º o 4.º;
  - el cierre de temporada dice «caíste en la previa» en vez de «en la fase inicial».
- **`europeanPrestige.ts`:** el nivel `playoff`, sin bonus, con su propio texto.
- **Pantallas:**
  - la tabla europea marca el 3.º y el 4.º en ámbar y explica la previa;
  - el panel europeo, el partido europeo y los carteles de resultado;
  - el cuadro de la temporada añade la columna «Previa» solo si se jugó;
  - el resumen final y la ayuda de la portada.
- **Auditorías:** la previa simulada de `audit:european-playoff` se retira junto con su código en `auditCareerRunner.ts`. Desde ahora `audit:rating` mide el juego con la previa.

## Partidas guardadas

- **Torneo terminado o eliminado** antes de esta versión: no cambia.
- **Torneo a mitad de fase inicial:** al acabarla, si quedas 3.º o 4.º, juegas la previa. Siempre se llega a tiempo, porque la fase inicial acaba en la jornada 24 y un partido europeo pendiente bloquea la Liga.
- **Previa guardada sin jornada:** el normalizador le pone la 27.

## Medición

**Carreras completas.** `npm run audit:rating -- --careers=600 --only=1`, 2.400 carreras y ninguna rechazada por plausibilidad. Los números coinciden exactamente con la variante «3.º contra 4.º» del informe de la fase 13.

| Dificultad y draft | Temporadas superadas | Títulos por temporada | Puntuación |
| --- | --- | --- | --- |
| Normal, mejor media | 2,25 → 2,23 | 0,35 → 0,38 | 27,56 → 27,79 ±1,91 |
| Normal, al azar | 0,91 → 0,91 | 0,19 → 0,21 | 10,76 → 11,03 ±1,18 |
| Fácil, mejor media | 3,50 → 3,57 | 0,47 → 0,51 | 44,38 → 46,23 ±3,26 |
| Fácil, al azar | 1,82 → 1,83 | 0,31 → 0,33 | 22,07 → 22,69 ±1,80 |

Las temporadas superadas y la puntuación quedan dentro del margen. Los títulos europeos por temporada suben entre un 30 % y un 42 %; el detalle está en el informe.

**Probabilidad de llegar a semifinales sin decidir.** `npm run audit:european-opponents`, 300 torneos por casilla. Ya cuenta la previa.

| Competición | Rating 84 | Rating 86 | Rating 88 |
| --- | --- | --- | --- |
| Champions | 9 % → 14 % | 12 % → 19 % | 16 % → 26 % |
| Europa League | 25 % → 40 % | 33 % → 51 % | 42 % → 60 % |
| Conference | 53 % → 71 % | 62 % → 78 % | 68 % → 83 % |

## Comprobación

- **Tests nuevos** en `tests/unit/europeanPlayoff.test.ts`:
  - el 3.º juega en casa y el 4.º fuera, contra el otro de la tabla, en la jornada 27;
  - del 5.º en adelante, eliminado y sin previa;
  - ganar la previa lleva a una semifinal sin rivales repetidos; perderla elimina;
  - los carteles, el prestigio y el cierre de temporada hablan de la previa;
  - el cuadro solo enseña la previa si se jugó;
  - una previa guardada se recupera, y sin jornada recibe la 27;
  - con ligas de otro tamaño, la previa cae entre la fase inicial y la semifinal.
- **e2e** en `europe-supercopa.spec.ts`:
  - la tabla marca 2 puestos en ámbar;
  - una partida guardada que acaba 3.º juega la previa en San Mamés, con prórroga y penaltis, y termina clasificada o eliminada en la previa.
- `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` y `npm run test:e2e` pasan.
