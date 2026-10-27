# v0.25.56 — Pruebas E2E de las novedades de Europa, Supercopa y pantalla final

## Problema

Las novedades de v0.25.50 a v0.25.55 no tenían pruebas de navegador: solo unitarias y QA de texto.

## Cambio

Solo pruebas. La app no cambia de comportamiento.

- `tests/e2e/europe-supercopa.spec.ts` (nuevo):
  - **Clasificación europea y palmarés desde la liga:** con un torneo de Conference en curso, "Ver clasificación europea" muestra la tabla de 7 equipos y la nota "Pasan a semifinales los 2 primeros". "Ver palmarés" muestra la vitrina.
  - **Partido europeo en directo:** avanza la liga hasta la noche europea, simula el partido y comprueba que, durante "Partido en juego", el marcador muestra números (antes de v0.25.51 mostraba "–") y que al final aparece "Resultado europeo".
  - **Supercopa en directo:** desde el resumen del equipo con una Supercopa pendiente, comprueba que se ve "Supercopa en directo" sin veredicto ni botón para seguir, y que el veredicto y "Jugar Liga" aparecen al terminar.
- `tests/e2e/career-full-flow.spec.ts`: al final, "Ver resumen completo" abre la pantalla final con el palmarés visible.

## Lo que no cubre

- No se añaden capturas automáticas (`toHaveScreenshot`). Las referencias dependen del sistema operativo: las generadas en Windows no coinciden con las de Linux en el CI.

## Validación

- `npx playwright test`: 15/15 (3 nuevas).
- `npm test`, `npm run qa:ci`, `npm run typecheck` y `npx eslint src scripts`: sin cambios en el resultado.
