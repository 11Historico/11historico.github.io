# v0.25.94 — Tu fuerza en la escala de LaLiga

Son las fases 3 y 4 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`. El usuario veía tres números que no casaban: once 85, temporada 88 y simulación 84. Además, la simulación parecía usar «siempre 84, tenga el equipo que tenga».

## Fase 3 — Rating de simulación con una décima (`src/career/teamPower.ts`)

- **Antes:** la compresión de carrera, 80 + (visible − 80) × 0,55, se redondeaba a entero en cada línea y en la media. 87 y 88 visibles daban 84 los dos.
- **Ahora:** se redondea a una décima. 87 → 83,9 y 88 → 84,4. Con la dificultad Fácil, +2: 88 → 86,4.
- **Sin cambios:**
  - la fórmula, el factor 0,55 y los modificadores de dificultad;
  - la partida rápida, que sigue en enteros;
  - el motor europeo, que ya redondeaba la media por su cuenta;
  - la Supercopa, que sigue usando el rating visible.

### Medición

Se ha repetido `npm run audit:rating` con el juego ya cambiado: 200 carreras por casilla, con el jugador que decide bien en Copa y Europa.

| Dificultad y draft | Antes (v0.25.90, entero) | Ahora (décima) |
| --- | --- | --- |
| Normal, mejor media: temporadas superadas | 2,31 | 2,37 ± 0,27 |
| Normal, mejor media: posición en la 1.ª | 4,8 | 4,91 ± 0,45 |
| Normal, mejor media: puntuación | 27,6 | 28,89 ± 3,44 |
| Normal, al azar: temporadas superadas | 0,94 | 0,88 ± 0,16 |
| Normal, al azar: puntuación | 11,0 | 10,21 ± 1,91 |

Todas las diferencias quedan dentro del margen, como ya mostró `INFORME_RATING_SIMULACION_v0_25_90.md` («Comprimido sin redondeo»). El equilibrio no cambia.

## Fase 4 — Tu fuerza en LaLiga (`src/components/TeamSummary.tsx`)

En carrera, el resumen del equipo añade la tarjeta **«Tu fuerza en LaLiga»**:

- **La fuerza con la que juegas Liga y Copa,** con una décima, junto a los tres rivales más fuertes de la temporada, ya con la progresión de carrera. Por ejemplo: «88.1 · FC Barcelona 92.5 · Real Madrid 92.5 · Atlético de Madrid 88.5».
- **Tus líneas frente a los rivales:**
  - Ataque, defensa, control, portería y mentalidad, comparados con el rival más fuerte y con la media de LaLiga.
  - El físico no aparece porque los rivales no lo tienen.
  - El control se compara con su medio campo.
- **Dónde más te sacan:** por ejemplo, «Donde más te saca FC Barcelona: ataque (5.7 puntos)». Ayuda a decidir a quién cambiar entre temporadas.

**Otros textos:**
- La tarjeta «Rating de temporada» deja de mostrar «Rating que usará la simulación». Ahora explica: «Es la media histórica del once. En Liga y Copa juegas con tu fuerza en LaLiga.»
- **Nota de «Ratings que influyen en la temporada»** en carrera: «Valores históricos del once… La Supercopa los usa tal cual; Liga y Copa, en la escala de LaLiga.»

La partida rápida no cambia. La tarjeta solo sale en carrera.

Los rivales salen de App (`careerLeagueRivals` con `applyCareerRivalProgression`), los mismos que usa la simulación de la Liga.

## Comprobación

- **Test nuevo,** `tests/unit/careerSimulationRating.test.ts`: 87 → 83,9, 88 → 84,4, Fácil 88 → 86,4, y la partida rápida en enteros.
- `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` (incluye `qaTeamPower`) y Playwright pasan.
- **Navegador**, con la partida `career-strong` en el resumen del equipo:
  - sale la tarjeta con 88.1, los tres rivales, las cinco líneas y la línea donde más te sacan;
  - en móvil (375 px) cabe sin desbordar la página.
