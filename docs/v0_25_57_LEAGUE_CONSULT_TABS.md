# v0.25.57 — Pantalla de liga: acciones de juego y pestañas de consulta

## Problema

La fila de acciones de la liga llegaba a tener cinco botones: Simular partido europeo, Simular, Saltar hasta próximo evento, Ver clasificación europea y Ver palmarés. Mezclaba acciones de juego con consultas y en móvil ocupaba mucho.

## Decisión

Prioridad 3 del análisis por roles. Por decisión del usuario, las consultas pasan a pestañas.

## Cambio

- `src/components/LeagueSimulatorView.tsx`:
  - La fila de acciones queda solo con las acciones de juego: Simular partido europeo (si hay noche europea), Simular y Saltar hasta próximo evento.
  - Debajo de la tarjeta de acciones aparecen las pestañas "Jornada", "Clasificación europea" (si hay torneo europeo) y "Palmarés" (en modo carrera). Son excluyentes: "Jornada" no abre ningún panel extra, y las otras dos muestran su panel justo debajo.
  - Las pestañas están también disponibles cuando hay un partido de Copa pendiente, cosa que antes no pasaba con los botones.
  - Usa `role="tablist"`, `role="tab"` con `aria-selected` y `role="tabpanel"`.
- `src/components/LeagueSimulatorView.css`: estilos de las pestañas y del foco visible.
- `tests/e2e/europe-supercopa.spec.ts`: usa las pestañas y comprueba que son excluyentes.

## Validación

- `npm run typecheck` y `npx eslint src scripts`: sin errores.
- `npm test`: 107/107.
- `npm run qa:ci`: 30 scripts en verde.
- `npx playwright test`: 15/15.
- Capturas en escritorio (1280) y móvil (375): sin desbordamiento horizontal; en móvil las pestañas ocupan dos líneas.
