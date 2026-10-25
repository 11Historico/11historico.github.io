# v0.25.36 — Analítica de crecimiento (fase 6)

Fase 6 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`).

## Condición de entrada

GoatCounter recibe visitas y el evento `career_start` desde un móvil con datos (panel comprobado el 25/10/2026: 6 visitas en la última semana, `career_start` con 2 eventos).

## Cambio

- `src/services/analytics.ts`: el tipo `AnalyticsEvent` admite tres eventos nuevos. `trackEvent` no cambia.
- `src/components/CareerGlobalSubmitPanel.tsx`: `global_ranking_submit` cuando el envío es aceptado (`result.ok`). Un envío duplicado no cuenta.
- `src/components/CareerSeasonOutcome.tsx`: `challenge_copy` cuando el enlace de reto se copia con éxito.
- `src/App.tsx`: `challenge_open` cuando la página se carga con un enlace de reto válido. Al cerrar el aviso, `challenge` pasa a `null` y no cuenta.
- `public/privacidad.html`: la sección "Medición de uso" lista las cinco acciones que se cuentan. Se actualiza en el mismo PR que los eventos, como exige el diseño.

## Qué no se envía

Ningún evento lleva propiedades: no hay nick, puntuación, identificadores de carrera, ni el enlace de reto.

## Validación

- `npm run typecheck`, `npx eslint src scripts`, `npm test` (87 pruebas).
- `npm run qa:ci` y `npm run qa:tech-debt` (incluye la comprobación de la nota de privacidad) en verde.
- `npx playwright test`: 7 pruebas en verde.

## Pendiente

- Confirmar en el panel de GoatCounter que aparecen `global_ranking_submit`, `challenge_copy` y `challenge_open` tras usarlos en la web publicada.
- La fase 15 (imagen para compartir) queda desbloqueada por esta fase.
