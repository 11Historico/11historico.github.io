# v0.25.64 — Ranking global: límites del palmarés por competición

## Problema

Desde la v0.25.30, `checkTrophyPlausibility_` (`apps-script/globalRankingBackend.gs`) admitía `temporadas superadas + 1` títulos de cada tipo: uno por temporada más la de Game Over. Pero el juego no permite tanto. El backend aceptaba palmarés imposibles, por ejemplo:

- una Champions sin ninguna temporada superada (+10 puntos);
- una Liga o una Supercopa en la temporada de Game Over.

## Reglas del juego comprobadas

Una carrera juega `completedSeasons + 1` temporadas; la última termina en Game Over. El envío al ranking solo se crea en el Game Over (`App.tsx`, `buildCareerLocalRankingEntry`).

| Título | En la temporada de Game Over | En la primera temporada | Máximo |
|---|---|---|---|
| Liga | No: ganarla clasifica para Champions y salva la temporada (`evaluateCareerObjective`) | Sí | `completedSeasons` |
| Copa | Sí: Copa + descenso es Game Over | Sí | `completedSeasons + 1` |
| Supercopa | Sí | No: se clasifica al pasar de temporada (`handleContinueCareerAfterSeason`, desde v0.22.0a) | `completedSeasons` |
| Europa (Champions + Europa League + Conference) | Sí | No: el torneo se crea al pasar de temporada (desde v0.24.1c) | `completedSeasons` |

Se revisó el historial: en ninguna versión anterior hubo Supercopa o torneo europeo en la primera temporada. En la v0.21 la Supercopa existía en el palmarés, pero nunca se ganaba.

## Cambio

- **`apps-script/globalRankingBackend.gs`:** `checkTrophyPlausibility_` aplica los máximos de la tabla.
- **`scripts/qaGlobalRankingPlausibility.ts`:**
  - **Casos límite:** 15 casos, frente a los 8 de antes.
  - **Reglas del juego:** comprueba con `evaluateCareerObjective` que ganar la Liga salva la temporada y que Copa + descenso es Game Over. Si esas reglas cambian, la QA falla y avisa de que el backend debe cambiar también.

## Qué no cambia

- **Puntuación:** el servidor la sigue recalculando igual.
- **Formato:** el de envío y el de respuesta no cambian.
- **Cliente:** sin cambios.
- **Entradas ya publicadas:** no se revalidan. La regla solo se aplica a los envíos nuevos.

## Despliegue (tuyo)

El cambio no tiene efecto hasta que redespliegues el backend:

1. Abre el proyecto de Apps Script del ranking.
2. Pega el contenido de `apps-script/globalRankingBackend.gs`.
3. Implementar → Gestionar implementaciones → editar la implementación activa → Versión: nueva versión → Implementar.

La URL del endpoint no cambia.

## Limitaciones

Un palmarés coherente pero falso se sigue aceptando. Por ejemplo, ganar la Liga todas las temporadas, o Supercopa y Copa en una temporada en la que no se clasificó para la Supercopa. Sin datos por temporada, el servidor no puede comprobarlo.

## Validación

- `npm run qa:ci` (30 QA, con `qaGlobalRankingPlausibility` ampliado) en verde.
- `apps-script/globalRankingBackend.gs` se comprueba como JavaScript válido.
- `npm run typecheck`, `npx eslint src scripts`, `npm test` y `npx playwright test` en verde.
