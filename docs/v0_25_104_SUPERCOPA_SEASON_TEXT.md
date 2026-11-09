# v0.25.104 — La Supercopa ya no «hunde» una temporada superada

Pendiente apuntado desde la fase 1 del roadmap (`docs/ROADMAP_MEJORAS_v0_25_91.md`). En la v0.25.92 se corrigió la tarjeta de la Copa, pero la de la Supercopa seguía diciendo «No salva la temporada» con la temporada superada. Solo cambian textos.

## Cambios

### `src/components/CareerSeasonOutcome.tsx`, tarjeta «Supercopa» del resultado de la temporada

| Caso | Antes | Ahora |
| --- | --- | --- |
| Campeón | +2 palmarés | +2 palmarés |
| No clasificado | No clasificado | No clasificado |
| Sin título, temporada superada | No salva la temporada | **Objetivo ya cumplido** |
| Sin título, Game Over | No salva la temporada | No salva la temporada |

Usa «Objetivo ya cumplido», sin decir con qué competición, porque la temporada puede salvarse por la Liga o por la Copa.

### `src/components/CareerInterseasonReward.tsx`, recompensa con la Supercopa ganada y sin objetivo europeo

Esta pantalla solo sale con la temporada superada, así que hablar de salvarla confundía.
- **Descripción:** «Has ganado la Supercopa: suma palmarés, pero sin objetivo europeo no mejora la recompensa.»
- **Nota:** «La Supercopa sola no da premio táctico: hace falta además el objetivo europeo, o ganar la Copa.» Así funcionaba ya la recompensa: la Copa sola da premio táctico, y la Supercopa solo con objetivo europeo.

**Sin cambios:**
- El aviso de la Supercopa que viene: «No salva la temporada, pero suma palmarés si la ganas». Describe la regla antes de jugarla.
- Las reglas, las recompensas y los premios.

## Comprobación

- **E2E** (`tests/e2e/season-challenge.spec.ts`): con la temporada superada, no aparece «No salva la temporada» en ninguna parte.
- **Navegador:** una partida con Supercopa jugada y la temporada entera, tres veces, con Chrome.
  - Ganada: «Campeón · +2 palmarés».
  - Perdida en la final con la temporada superada: «Sin título · Objetivo ya cumplido».
  - La Copa sigue diciendo «Objetivo ya cumplido por la Liga» u «Objetivo cumplido».
  - Sin errores.
- `npm run typecheck`, `npx eslint src scripts`, `npm test` y `npm run qa:ci` pasan.
