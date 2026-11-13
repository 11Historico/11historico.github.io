# Las medias de tu equipo (v0.25.114)

Sale de la observación 3 de la temporada de prueba de la v0.25.113. El equipo enseñaba cuatro medias distintas: 84 de media actual, 87 de rating de temporada y base visible, 83,9 de fuerza en LaLiga y 83 en Copa. El usuario pidió «mide las medias».

**Es solo una auditoría:** no cambia el juego, ninguna media ni el balance.

## De dónde sale cada número

El ejemplo es el de la prueba: carrera en Normal (la dificultad interna `dificil`, sin modificador), 4-3-3, sin premio de entrenador.

| # | Dónde se ve | Ejemplo | Cómo se calcula | ¿Se juega con él? |
| --- | --- | --- | --- | --- |
| 1 | Tablero del once, «media actual» (`SelectedTeamBoard.tsx`) | 84 | La media del `overall` de los 11 jugadores, redondeada. | **No.** Es solo un dato. |
| 2 | Resumen del equipo, «Rating de temporada» (`TeamSummary.tsx`) | 87 | `calculateTeamRating` (jugadores, formación y el bonus base del entrenador, de +1 a +3) más el premio de entrenador de la carrera. | **Solo en la Supercopa**, con la dificultad (v0.25.101). |
| 3 | El mismo cuadro, «Base visible» | 87 | El número 2 sin el premio de entrenador. Si no hay premio, es igual que el 2. | No. |
| 4 | Resumen del equipo, «Tu fuerza en LaLiga» (v0.25.94) | 83,9 | La compresión de carrera, 80 + (87 − 80) × 0,55, más la dificultad: Fácil +2, Normal 0, Leyenda −4. | **Sí:** es la base de la Liga, la Copa y Europa. |
| 5 | Previa de Liga, tu media | 84 | El número 4, redondeado. Con carta: «84 → 88». | Sí. Se juega con la décima, 83,9. |
| 6 | Previa de Copa, tu media | 83 | El número 4 con el contexto de Copa (`applyCupRivalContext`): −1 si eres favorito fuera y el rival se crece 3 o más; +1 en mentalidad, y a veces en la media, si eres inferior en casa. Más +1 si el entrenador tiene Copa 86+. | Sí. |
| 7 | Previa de Europa | 84 o 85 | El número 4 más +1 si el entrenador tiene Europa 86+. | Sí. |
| 8 | Previa de la Supercopa | 87 | El número 2 con la dificultad, sin compresión. | Sí. |
| 9 | Resumen de la temporada (`CareerSeasonOutcome.tsx`) | «Media XI actual: 84 · Rating visible equipo: 87» | Los números 1 y 2. | No sale la fuerza con la que jugaste (el 4). |
| 10 | Resumen completo, desglose del entrenador (`FinalSummary.tsx`) | «Liga 88 · +1 especialista», «Copa 87», «Europa futura 87» | El número 2 más el +1 de especialista de cada competición. | **No.** En carrera la Liga se juega con 83,9, y además ese +1 de Liga no existe (ver más abajo). |

**En resumen:** en una temporada normal de carrera se juega con tres números, 83,9 en Liga, Copa y Europa, 83 a 84 en la Copa según el partido, y 87 en la Supercopa. Se enseñan siete u ocho.

## Hallazgo: el «+1 solo en Liga» del entrenador no se aplica

- **Lo que se promete:** si el entrenador tiene Gestión 86 o más, el juego dice «+1 solo en Liga» en tres sitios:
  - la ronda del entrenador (`CoachRound.tsx`, la píldora «Liga»);
  - el resumen del equipo («Bonus específico: Liga +1»);
  - el resumen completo («Liga 88 · +1 especialista»).
- **Lo que pasa:** `getCoachCompetitionBoost(context, "league")` no se llama en ningún sitio. La Copa y Europa sí aplican su +1 (`"cup"` y `"europe"`). La Liga no.
- **Desde cuándo:** la v0.18.3 describió el +1 de Liga, y la v0.21.0d arregló solo el de Copa («Bonus de entrenador en Copa funcional»). En el historial de git no hay ninguna llamada con `"league"`.
- **A quién afecta:** 10 de los 85 entrenadores tienen Gestión 86+. Uno de ellos es Pentland, el de la partida de prueba `career-strong`, con Gestión 92.

No lo he cambiado. Aplicarlo cambia el balance de la Liga, y quitar la promesa cambia lo que el juego dice del entrenador. Las dos cosas necesitan que decidas.

## Por qué se ven tantos números

- **La escala doble es intencionada.** El once histórico vive en 85-95, y los rivales de LaLiga en 74-91. Quitar la compresión hace la carrera de 3 a 5 veces más fácil (`INFORME_RATING_SIMULACION_v0_25_90.md`). Por eso la v0.25.94 añadió «Tu fuerza en LaLiga» en vez de cambiarla.
- **Pero la escala histórica sigue mandando en casi todo lo que se ve:** el rating de temporada, las barras de «Ratings que influyen en la temporada», el resumen de la temporada y el desglose del resumen completo. La fuerza en LaLiga solo sale en una tarjeta del resumen del equipo y en las previas.
- **La Copa añade su ajuste sin decirlo.** El −1 de favorito fuera o el +1 del entrenador hacen que la previa enseñe 83 o 85 sin explicar por qué. Al rival ya se le explica la forma (v0.25.113) y que se crece (v0.25.114).

## Opciones

### A. Solo textos (no toca el juego)

1. **Previa de Copa:** explicar tu ajuste como el del rival. Por ejemplo, en el `title` de tu media: «83,9 en LaLiga; −1 por jugar fuera de favorito» o «+1 por tu entrenador de Copa».
2. **Resumen de la temporada:** añadir la fuerza con la que jugaste. Por ejemplo, «Media XI: 84 · Rating histórico: 87 · Fuerza en LaLiga: 83,9».
3. **Desglose del resumen completo, en carrera:** enseñar Liga, Copa y Europa en la escala con la que se jugó (83,9, 83,9 + Copa, 83,9 + Europa) o quitar esas tres casillas en carrera. En la partida rápida están bien, porque allí no hay compresión.
4. **Nombres:** llamar al 1 «media del once» en todas partes (hoy es «media actual» y «Media XI actual») y al 2 «rating histórico», para que se vea que no es con el que se juega en Liga.

### B. El +1 de Liga del entrenador (elige una)

- **B1. Aplicarlo**, como en Copa y Europa: +1 en la escala comprimida en Liga para los entrenadores con Gestión 86+. Cambia el balance de la Liga, así que antes habría que medirlo con `npm run audit:rating`. Es más o menos lo mismo que ya da la Copa.
- **B2. Quitar la promesa:** borrar «+1 solo en Liga» de la ronda del entrenador y de los dos resúmenes. No cambia ningún partido.

### C. Quedarse con dos números

En carrera, enseñar como número principal la fuerza en LaLiga, y dejar el rating histórico como dato secundario (por ejemplo, «87 histórico»). Es lo que pedía la v0.25.90 y la v0.25.94 hizo a medias. Toca más pantallas que la A.

## Qué propongo

- **A entera.** Es lo que más ayuda y no toca nada del juego.
- **Para la B, decide tú.** Si quieres que el entrenador «gestor» valga algo en Liga, primero mido la B1. Si no, la B2 es la opción segura.
- **La C solo si, después de la A, siguen sobrando números.**

## Cómo se ha medido

- Leyendo el código de cada pantalla: `SelectedTeamBoard.tsx`, `TeamSummary.tsx`, `career/teamPower.ts`, `leagueSimulator.ts` (`getNextUserMatchPreview`, `applyCupRivalContext`, `getCoachCompetitionBoost`), `LeagueSimulatorView.tsx`, `App.tsx` (la Supercopa), `CareerSeasonOutcome.tsx` y `FinalSummary.tsx`.
- **Las cifras de la prueba cuadran:**
  - 80 + 7 × 0,55 = 83,85, que se ve como 83,9 (lo comprueba `tests/unit/careerSimulationRating.test.ts`) y como 84 en la previa;
  - 83,9 − 1 por jugar fuera de favorito en Copa da 83, la previa de la semifinal con el Betis.
- **Para el +1 de Liga:** se ha buscado en `src` y en el historial de git (`git log -G`) cualquier llamada a `getCoachCompetitionBoost` con `"league"`. No hay ninguna.
