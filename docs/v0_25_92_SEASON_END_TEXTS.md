# v0.25.92 — Textos de fin de temporada más claros

Es la fase 1 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`. Corrige los textos que el usuario fue apuntando al superar temporadas en su carrera de prueba. Solo cambian textos: no se tocan reglas, premios ni equilibrio.

## Cambios

### Pantalla «Temporada superada» (`src/components/CareerSeasonOutcome.tsx`)

| Dónde | Antes | Ahora |
| --- | --- | --- |
| Tarjeta Liga, si la ganas | «68 puntos» | «Campeón · 68 puntos» |
| Tarjeta Copa del Rey, con el objetivo cumplido por la Liga | «No salva la temporada» | «Objetivo ya cumplido por la Liga» |
| Reto | «40 puntos y 3 temporadas superadas» | «40 puntos de ranking y 3 temporadas superadas» |

- **En el Game Over,** la tarjeta de Copa sigue diciendo «No salva la temporada»: ahí es correcto.
- **Si el objetivo está cumplido y no ganaste la Copa,** es siempre por la Liga: la única otra vía es ganar la Copa.

### Línea de objetivo (`src/career/careerRules.ts`)

Sale en «Temporada superada» y en la pantalla entre temporadas.

| Caso | Antes | Ahora |
| --- | --- | --- |
| Campeón de Liga | «Objetivo cumplido: clasificación a Champions League.» | «Objetivo cumplido: campeón de Liga y clasificación a Champions League.» |
| Campeón de Liga y de Copa | «Objetivo cumplido: campeón de Copa del Rey.» | «Objetivo cumplido: campeón de Liga y de Copa del Rey.» |

### Pantalla entre temporadas (`src/components/CareerInterseasonReward.tsx`, `src/career/europeanPrestige.ts`)

| Dónde | Antes | Ahora |
| --- | --- | --- |
| Nota de la recompensa europea | «…pero no desbloquea premio extra en esta versión.» | «…pero no da premio extra.» |
| Tarjeta Palmarés | «10 pts» | «10 pts de palmarés» |
| Prestigio europeo al caer en la fase inicial | «Participación europea en Europa League: la campaña se queda en la fase inicial, sin prestigio adicional…» | «Eliminado en la fase inicial de Europa League (4.º de 7): sin prestigio adicional…» |

**Corrección al roadmap:** el apunte decía que «fase inicial» salía también al caer en cuartos u octavos. El formato europeo no tiene esas rondas, solo fase inicial, semifinal y final. Así que el texto era correcto. Se mejora con el puesto en la tabla, que dice lo cerca que te quedaste de semifinales.

## Sin cambios

- La tarjeta de Supercopa sigue diciendo «No salva la temporada» si la pierdes, aunque la temporada esté superada.
- Las partidas guardadas conservan el texto de prestigio que ya tenían, porque se guarda al concederlo.

## Comprobación

- **Test nuevo,** `tests/unit/seasonOutcomeTexts.test.ts`: la línea de objetivo con Liga, con Liga y Copa, y sin títulos; y el prestigio con el puesto.
- `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` y Playwright.
- **Navegador:** las dos pantallas con una partida guardada.
