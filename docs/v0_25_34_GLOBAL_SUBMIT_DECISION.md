# v0.25.34 — Decisión explícita de envío al ranking global

## Problema

El envío de una carrera al ranking global estaba al final de la pantalla de Game Over, detrás de la vitrina de palmarés. Era un formulario pequeño sin una pregunta clara: no había forma explícita de decir "no lo quiero enviar". Por eso casi nadie llegaba a enviar carreras.

## Cambios

- `src/components/CareerSeasonOutcome.tsx`: el panel se muestra justo después del motivo del resultado.
- `src/components/CareerGlobalSubmitPanel.tsx`:
  - Pregunta explícita: "¿Enviar esta carrera al ranking global?".
  - Dos acciones: "Sí, enviar al ranking global" (principal) y "No enviar" (secundaria).
  - Tras "No enviar": "Esta carrera no se envía al ranking global. Queda solo en tu ranking local." con la opción de cambiar de opinión.
  - Tras enviar: confirmación y acceso al ranking global.
  - Textos sin "futuro Top global". Sin endpoint, el jugador ve que el ranking global no está disponible, sin mensajes de desarrollo.
- `src/components/CareerGlobalSubmitPanel.css`: el panel destaca con un borde dorado.
- `tests/e2e/career-full-flow.spec.ts`: al llegar a Game Over comprueba la pregunta y la opción de no enviar.

## Qué no cambia

- El envío, la validación del nick, el formato de la carrera y el backend.

## Validación

- Capturas con endpoint configurado (de prueba) y sin él.
- `npm run typecheck`, `npx eslint src scripts`, `npm test` (81 pruebas).
- `npm run qa:ci` y `npm run qa:tech-debt` en verde.
- `npx playwright test`: 7 pruebas en verde.
