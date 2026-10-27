# v0.25.62 — Camisetas en el cuadro de la Copa

## Problema

La secuencia de partido, los últimos resultados y la tabla final ya muestran la camiseta de cada equipo. El cuadro de la Copa del Rey de la pantalla final solo mostraba los nombres.

## Cambio

- `src/components/SeasonBrackets.tsx`: cada línea de equipo del cuadro de Copa muestra `TeamKitIcon` junto al nombre.
- `src/components/SeasonBrackets.css`:
  - **Camiseta:** se muestra a escala con `zoom: 0.75`, que mantiene las proporciones. Se descartó reducir cada pieza, como en los últimos resultados, porque a ese tamaño la camiseta pierde la forma.
  - **Nombres:** van a 0,9 rem y los largos pasan a dos líneas. En escritorio, con cinco columnas de ~158 px, una palabra larga como "Deportivo" más la camiseta y los goles debe caber.
  - **Huecos:** el hueco entre nombre y goles baja de 8 a 6 px y el relleno lateral de la tarjeta de 10 a 8 px.
  - **Columnas:** llevan `min-width: 0` y la cabecera puede pasar a dos líneas. Antes, la cabecera de "Dieciseisavos" con su etiqueta de estado invadía la columna de Octavos.
- `tests/unit/seasonBracketsView.test.tsx`: comprueba que el cuadro de Copa lleva camisetas y que el europeo no.

## Qué no cambia

- **Cuadro europeo:** sigue sin camisetas. Los rivales europeos son clubes reales que se muestran solo con su nombre, "sin escudos ni equipaciones" (`src/europe/europeanOpponents.ts`). Además, la tarjeta europea no tiene líneas de equipo: muestra "Local · vs Rival".
- **Últimos resultados:** mantiene su camiseta reducida pieza a pieza. Cambiarla queda fuera de esta versión.
- **Juego:** no cambian reglas, simulación ni datos.

## Validación

- `npm run typecheck` y `npx eslint src scripts` sin errores.
- `npm test` (108 tests), `npm run qa:ci` y `npx playwright test` (15 tests) en verde.
- Capturas temporales del cuadro de Copa al final de una carrera con la partida de prueba:
  - **1280 px:** 10 camisetas, ningún elemento sale del cuadro y cada tarjeta respeta el relleno de su columna.
  - **375 px:** columnas en filas y sin desbordamiento horizontal.
