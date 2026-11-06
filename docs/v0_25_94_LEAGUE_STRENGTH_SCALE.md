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

Temporadas superadas, posición en la 1.ª y puntuación del ranking. Las mismas semillas que en v0.25.90:

| Dificultad y draft | Antes (entero) | Ahora (décima) |
| --- | --- | --- |
| Normal, mejor media | 2,31 ± 0,27 · 4,79.º · 27,6 | 2,37 ± 0,27 · 4,91.º · 28,9 |
| Normal, al azar | 0,94 ± 0,16 · 7,67.º · 11,0 | 0,88 ± 0,16 · 7,67.º · 10,2 |
| Fácil, mejor media | 3,73 ± 0,43 · 3,46.º · 47,7 | 3,73 ± 0,44 · 3,52.º · 47,1 |
| **Fácil, al azar** | **1,66 ± 0,21 · 5,72.º · 19,8** | **2,06 ± 0,28 · 5,54.º · 24,6** |

- **Normal, en las dos casillas, y Fácil con el mejor draft:** sin cambios, todo dentro del margen.
- **Fácil con draft al azar: +0,40 temporadas y +24 % de puntuación, en el límite del margen.** Por eso se repitió la medición con más carreras.

### Confirmación con 600 carreras por casilla

`npm run audit:rating -- --careers=600 --only=2` compara en la misma ejecución el juego nuevo (décima) con la variante «Entero (antes de v0.25.94)», el redondeo anterior:

| Dificultad y draft | Entero (antes) | Décima (ahora) |
| --- | --- | --- |
| Normal, mejor media | 2,25 ± 0,15 · 4,78.º · 27,1 | 2,24 ± 0,15 · 4,87.º · 27,1 |
| Normal, al azar | 0,97 ± 0,10 · 7,70.º · 11,3 | 0,91 ± 0,10 · 7,82.º · 10,7 |
| Fácil, mejor media | 3,94 ± 0,27 · 3,57.º · 49,7 | 3,69 ± 0,27 · 3,69.º · 46,4 |
| Fácil, al azar | 1,70 ± 0,12 · 5,54.º · 20,3 | 1,79 ± 0,14 · 5,43.º · 21,5 |

**Conclusión:** las diferencias van en las dos direcciones y todas quedan dentro del margen. El +24 % de la primera medición era ruido. El equilibrio no cambia. Son 4.800 carreras, ninguna rechazada por la regla de plausibilidad.

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

## Auditoría

`scripts/auditSimulationRating.ts`:
- La primera variante pasa a llamarse «Hoy: comprimido a una décima».
- Se añade la variante «Entero (antes de v0.25.94)».
- Se añade la opción `--only=N`, que mide solo las N primeras variantes. Las propuestas sin compresión son las lentas.

## Comprobación

- **Test nuevo,** `tests/unit/careerSimulationRating.test.ts`: 87 → 83,9, 88 → 84,4, Fácil 88 → 86,4, y la partida rápida en enteros.
- `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` (incluye `qaTeamPower`) y Playwright pasan.
- **Navegador**, con la partida `career-strong` en el resumen del equipo:
  - sale la tarjeta con 88.1, los tres rivales, las cinco líneas y la línea donde más te sacan;
  - en móvil (375 px) cabe sin desbordar la página.
