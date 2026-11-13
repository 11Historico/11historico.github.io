# v0.25.115 — Tus medias, claras, y el entrenador gestor cuenta en Liga

Sale de `docs/INFORME_MEDIAS_EQUIPO_v0_25_114.md` (la observación 3 de la temporada de prueba de la v0.25.113). El usuario pidió «haz la A y la B1» y, ya con la B1 medida, «adelante con la 1».

## B1. El +1 de Liga del entrenador gestor se aplica

**Lo que fallaba:** desde la v0.18.3, el juego decía «+1 solo en Liga» para los entrenadores con Gestión 86 o más, en la ronda del entrenador y en los dos resúmenes. Pero `getCoachCompetitionBoost(context, "league")` no se llamaba en ningún sitio. La v0.21.0d arregló solo el de Copa.

**Ahora:** en Liga, un entrenador con Gestión 86+ suma +1 a todas tus líneas, después de la compresión de carrera y la dificultad. Es lo mismo que ya hacían la Copa (`cup`) y Europa (`europe`). Se aplica:
- en el partido (`simulateNextUserLeagueMatch`), también en la comparación «sin la carta»;
- en la previa (`getNextUserMatchPreview`) y en lo que ven las cartas (`getNextUserMatchInfo`);
- en el rango esperado de la Liga (`estimateExpectedLeagueRange` recibe el entrenador).

### Medición

`npm run audit:rating -- --careers=600 --only=1`, antes y después, con las mismas semillas: 4.800 carreras, ninguna rechazada por la regla de plausibilidad. El script tiene una columna nueva con las carreras con gestor, que son las únicas que cambian:

| Dificultad y draft | Carreras con gestor | Temporadas superadas con gestor, antes → ahora | Media de todas | Puntuación del ranking |
| --- | --- | --- | --- | --- |
| Normal, mejor media | 45 % | 2,38 ± 0,23 → 2,75 ± 0,28 | 2,23 → 2,39 | 27,8 → 29,7 |
| Normal, al azar | 43 % | 0,96 ± 0,15 → 1,41 ± 0,19 | 0,91 → 1,11 | 11,0 → 13,1 |
| Fácil, mejor media | 45 % | 3,73 ± 0,37 → 5,13 ± 0,49 | 3,57 → 4,20 | 46,2 → 54,6 |
| Fácil, al azar | 43 % | 1,83 ± 0,22 → 2,41 ± 0,25 | 1,83 → 2,08 | 22,7 → 25,5 |

- **Con un gestor, la carrera dura entre un 16 % y un 47 % más.**
- **La puntuación media del ranking sube entre un 7 % y un 19 %.**
- **Por qué hay tantos gestores:** el draft se queda con el entrenador de más media entre tres, y muchos de los mejores son gestores. Son 10 de los 85 entrenadores.

El usuario eligió aplicarlo tal cual (opción 1) frente a un +0,5 o a quitar la promesa.

## A. Las medias, claras (solo interfaz)

1. **La previa explica tu media,** como ya explicaba la del rival. Debajo salen los ajustes del partido:
   - en Liga, «entrenador +1»;
   - en Copa, «fuera de favorito −1», «inferior en casa +N» o «entrenador +1»;
   - en Europa, «entrenador +1».
   - Al pasar el ratón: «Tu fuerza en LaLiga es 88.1; en este partido, fuera de favorito −1 y entrenador +1.»
2. **Resumen de la temporada:** «Media del once: 88 · Rating histórico: 91 · Fuerza en LaLiga: 88.1». Antes no salía la fuerza con la que juegas.
3. **Desglose del entrenador, en el resumen completo:** Liga, Copa y Europa salen con la media con la que se juegan. En carrera, en la escala de LaLiga con su décima («Liga 89.1 · +1 especialista»). En la partida rápida, con la dificultad. Antes salía el rating histórico más el +1, que no se jugaba en ninguna de las dos.
4. **Los mismos nombres en todas partes:**
   - «media del once» en el tablero y en los resúmenes;
   - en carrera, «rating histórico» en vez de «rating de temporada» o «rating visible equipo»;
   - la tarjeta «Tu fuerza en LaLiga» dice «En Liga, tu entrenador suma +1 por su Gestión» cuando toca.

**Lo que no cambia:** la compresión de carrera, la dificultad, el contexto de Copa, el +1 de Copa y de Europa, la Supercopa, las cartas y los ratings.

## En el código

- **`leagueSimulator.ts`:**
  - el +1 de Liga en `simulateNextUserLeagueMatch`, `getNextUserMatchInfo` y `getNextUserMatchPreview`;
  - `UserMatchPreview.userAdjustments` (`MatchRatingAdjustment`) y `getUserAdjustments`.
- **`expectedLeagueRange.ts`:** `selectedCoach`.
- **`LeagueSimulatorView.tsx`:** `PreviewTeams` recibe `userStrength` y `userAdjustments`; el rango esperado recibe el entrenador.
- **`CareerSeasonOutcome.tsx`, `FinalSummary.tsx` y `App.tsx`:** la fuerza en LaLiga y el desglose en la escala con la que se juega (`difficulty` e `isCareerMode`).
- **`TeamSummary.tsx` y `SelectedTeamBoard.tsx`:** los nombres y la frase del gestor.
- **`scripts/auditSimulationRating.ts`:** la columna «Con gestor 86+».
- **`tests/unit/matchApproach.test.ts`:** el gestor suma en la previa y gana más partidos de Liga; la Copa explica el −1 de jugar fuera de favorito.

## Comprobación

**En el navegador,** con la partida de prueba `career-strong` (Pentland, Gestión 92 y Copa 86+):
- **Liga, jornada 1:** «89 · entrenador +1», con «Tu fuerza en LaLiga es 88.1; en este partido, entrenador +1.»
- **Copa, en Zaragoza:** «88 · fuera de favorito −1 · entrenador +1». Bien a 1.024 y a 375 px; nada se sale de la pantalla.
- **Final de temporada:** «Media del once: 88 · Rating histórico: 91 · Fuerza en LaLiga: 88.1».
- **Resumen completo:** «Liga 89.1 · Copa 89.1 · Europa futura 88.1».
- **Sin errores en la consola.**

**Comprobaciones:** pasan `npm run typecheck`, `npx eslint src scripts`, `npm test` (265), `npm run qa:ci` y `npm run test:e2e` (22 pasan, 2 se saltan).
