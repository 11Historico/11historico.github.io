# v0.25.67 — Botón «Saltar» y método de valoración en español

Dos fallos visibles encontrados al hacer las capturas del README (v0.25.66).

## 1. Botón «Saltar» sin estilo

### Problema

Los dos botones «Saltar» de la secuencia de partido salían con el borde gris y la letra del navegador:

- el de Liga, Copa y Supercopa (`MatchSequence.tsx`), desde la v0.24.9i;
- el de Europa (`EuropeanMatchEvent.tsx`), desde la v0.24.9j.

Usan `.secondary-league-button`, que solo tiene estilo completo dentro de `.league-buttons`. Fuera de ese contenedor solo pone el fondo y el color.

### Cambio

En `src/components/LeagueSimulatorView.css`, una regla para `.match-sequence-skip` y `.european-match-sequence-skip`:

- sin borde y en forma de píldora;
- la letra del juego en negrita;
- cursor de enlace y altura mínima de 40 px.

El color sigue saliendo de `.secondary-league-button`.

No se toca la regla general de `.secondary-league-button`. El botón «Continuar temporada» europeo ya tenía estilo propio y así no cambia.

## 2. Etiqueta `mixed` en las tarjetas

### Problema

Las tarjetas del draft y del entrenador mostraban tal cual el campo interno `ratingMethod`. Como `makePlayer` y `makeCoach` (`src/data/athletic/seasons.ts`) lo fijan siempre en `"mixed"`, todas las tarjetas decían `mixed`, en inglés.

### Cambio

- **`src/data/sources.ts`:** `RATING_METHOD_LABELS`, el texto visible de cada método:

  | Valor | Texto |
  |---|---|
  | `official` | Valoración oficial |
  | `stats` | Por estadísticas |
  | `mixed` | Estadísticas + estimación |
  | `manual_estimate` | Estimación manual |

- **`src/components/PlayerRound.tsx` y `src/components/CoachRound.tsx`:** muestran ese texto.

La etiqueta se mantiene en vez de quitarse porque informa de cómo se calcularon las valoraciones. Los datos no cambian. El bundler descarta el resto de `sources.ts`: en el paquete no aparece ninguna URL de fuentes.

## Capturas del README

`docs/screenshots/draft.jpg` se ha regenerado porque mostraba `mixed`. Las otras tres no cambian.

## Validación

- `npm run typecheck`, `npx eslint src scripts` y `npm test` sin errores.
- `npm run qa:ci` y `npx playwright test` en verde.
- Capturas temporales a escala 2x:
  - los dos «Saltar» a mitad de partido. El europeo también se capturó sin el cambio y salía con el borde del navegador.
  - la tarjeta del draft con «Dato medio · Estadísticas + estimación · Media: 86».
- La tarjeta del entrenador usa el mismo texto y solo se comprobó con el typecheck: no se capturó.
