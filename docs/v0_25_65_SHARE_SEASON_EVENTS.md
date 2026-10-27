# v0.25.65 — Eventos de analítica: imagen compartida y temporada superada

## Decisión

El usuario eligió dos eventos nuevos, sin propiedades, como los cinco que ya existían:

- `share_image`: completa el embudo de difusión, junto a `challenge_copy` y `challenge_open`.
- `season_complete`: junto a `career_start` y `game_over`, permite estimar cuántas temporadas dura una carrera.

Se descartaron `supercopa_play` y `consult_tab`.

## Cambio

- **`src/services/analytics.ts`:** `AnalyticsEvent` admite `share_image` y `season_complete`. El comentario de cabecera ("Solo dos eventos") estaba desfasado; ahora remite a la nota de privacidad.
- **`src/components/CareerSeasonOutcome.tsx`:** `share_image` se envía cuando la imagen de la carrera se comparte con la hoja nativa o se descarga. No cuenta si se cancela la hoja de compartir ni si falla la creación de la imagen.
- **`src/App.tsx`:** `season_complete` se envía al pulsar "Continuar carrera" tras superar una temporada (`handleContinueCareerAfterSeason`). Si después se cancela la recompensa, el evento no se deshace: la instantánea ya guarda la temporada siguiente.
- **`public/privacidad.html`:**
  - "Medición de uso" pasa de cinco a siete acciones y añade "superar una temporada" y "compartir o descargar la imagen de la carrera".
  - Nueva fecha de actualización: 27 de octubre de 2026.
- **`scripts/qaP1LowCost.ts`:** comprueba que la nota de privacidad habla de tantas acciones como eventos tiene `AnalyticsEvent`. Si se añade un evento sin actualizar la nota, la QA falla.

## Qué no se envía

Ningún evento lleva propiedades: ni nick, ni puntuación, ni temporada, ni identificadores de carrera.

## Validación

- **Comprobaciones:** `npm run typecheck`, `npx eslint src scripts` y `npm test` (108 tests) sin errores.
- **QA y E2E:** `npm run qa:ci` (incluye la comprobación nueva) y `npx playwright test` (15 tests) en verde.
- **Eventos en el navegador:** una spec temporal compiló con un host de analítica ficticio, bloqueó el script de GoatCounter y sustituyó `window.goatcounter` por un registro en memoria. No se envió nada fuera.
  - Partida débil: `game_over` y, al descargar la imagen, `share_image`.
  - Partida fuerte: ningún evento hasta "Continuar carrera"; al pulsarlo, `season_complete`.

## Pendiente (tuyo)

Comprobar en el panel de GoatCounter que aparecen `season_complete` y `share_image` tras usarlos en la web publicada.
