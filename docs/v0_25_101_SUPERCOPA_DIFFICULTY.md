# v0.25.101 — La dificultad cuenta en la Supercopa

Es la fase 11 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`, opción B del informe `docs/INFORME_MEDIA_SUPERCOPA_v0_25_100.md`, elegida por el usuario.

## El problema

La Liga, la Copa y Europa juegan con la dificultad: Fácil +2, Normal 0 y Leyenda −4. La Supercopa recibía la media visible tal cual. En Leyenda se jugaba igual que en Fácil: con media visible 88, un 22 % de títulos en las tres dificultades.

## El cambio

- **`src/career/teamPower.ts`:** nueva función `applyDifficultyModifier(teamRating, difficulty)`.
  - Suma el modificador de dificultad (`getDifficultyRatingModifier`) a las seis líneas y a la media. Se queda dentro de 40-99.
  - En Normal devuelve el mismo objeto, sin tocar nada.
- **`src/App.tsx`:** `supercopaTeamRating = applyDifficultyModifier(teamRating, difficulty)`. Lo usan la semifinal, la final y sus dos previas, así que las barras de líneas y las probabilidades que ves antes de jugar son las del partido.
- **`src/components/TeamSummary.tsx`:** la nota «Ratings que influyen en la temporada» dice ahora «La Supercopa los usa con la dificultad» en lugar de «tal cual».

**Sin cambios:**
- Sigue usando la media visible, sin la compresión de carrera de la Liga.
- Los rivales siguen sin la progresión de carrera.
- Las opciones A y C del informe quedan descartadas.
- No cambian el formato, los cruces, el premio ni el motor de partido de la Supercopa.

## Medición: la Supercopa

`npm run audit:supercopa`: 10.000 Supercopas por casilla, la partida `career-strong` movida a cada media visible, contra Barça 91, Madrid 91 y Atlético 87, con el planteamiento equilibrado y en la primera temporada. Muestra la probabilidad de título, y entre paréntesis la de llegar a la final:

| Media visible | Antes (todas) | Fácil | Normal | Leyenda |
| --- | --- | --- | --- | --- |
| 84 | 16 % (39 %) | 20 % (44 %) | 16 % (39 %) | 11 % (32 %) |
| 86 | 20 % (44 %) | 22 % (47 %) | 20 % (44 %) | 13 % (35 %) |
| 88 | 22 % (47 %) | 29 % (53 %) | 22 % (47 %) | 16 % (39 %) |
| 90 | 29 % (53 %) | 31 % (56 %) | 29 % (53 %) | 20 % (44 %) |

Normal no cambia por construcción. Fácil gana entre 2 y 7 puntos y Leyenda pierde entre 5 y 9.

## Medición: carreras completas

`npm run audit:rating -- --careers=600 --only=1`, con las mismas semillas antes y después del cambio. Son 2.400 carreras y ninguna rechazada por la regla de plausibilidad.

| Dificultad y draft | Temporadas superadas | Títulos por temporada | Puntuación |
| --- | --- | --- | --- |
| Normal, mejor media | 2,22 ± 0,15 → 2,22 ± 0,15 | 0,34 → 0,34 | 26,98 → 26,98 |
| Normal, al azar | 0,92 → 0,92 | 0,19 → 0,19 | 10,78 → 10,78 |
| Fácil, mejor media | 3,65 → 3,65 | 0,46 → 0,48 | 46,25 → 46,45 |
| Fácil, al azar | 1,81 → 1,81 | 0,29 → 0,31 | 21,93 → 22,01 |

- **Normal:** idéntico, como se esperaba.
- **Fácil:** +0,02 títulos por temporada y la puntuación sube menos de un 1 %, dentro del margen. La Supercopa no cambia cuántas temporadas se superan.
- **Leyenda:** esta auditoría no la mide. Por la tabla de la Supercopa, se pierden unos 6 puntos de título por Supercopa jugada, sin efecto en seguir en el banquillo.

## Comprobación

- **Tests nuevos** en `tests/unit/careerSimulationRating.test.ts`:
  - Fácil 88 → 90 y Leyenda 88 → 84.
  - En Normal se devuelve el mismo objeto, con decimales incluidos.
  - Los límites 99 y 40.
- **`scripts/auditCareerRunner.ts`:** la Supercopa de la auditoría de carreras usa la misma media que el juego.
- **`scripts/auditSupercopaRating.ts`:** las columnas pasan a «Antes (v0.25.100)» y «Solo la dificultad (v0.25.101)», y esta última usa la función del juego.
- `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` y Playwright pasan.
