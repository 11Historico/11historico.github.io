# v0.25.63 — Camisetas pequeñas a escala

## Problema

En los últimos resultados y en la lista de goles de la secuencia de partido, la camiseta se reducía cambiando a mano el tamaño y la posición de cada pieza (cuerpo y mangas). El borde de 2 px y los redondeos (6–7 px en el cuerpo, 4 px en las mangas) no se reducían, así que a 24 × 22 px el cuerpo quedaba casi redondo y las mangas parecían orejas. En la lista de goles (27 × 25 px) pasaba lo mismo, algo menos marcado.

## Cambio

En `src/components/LeagueSimulatorView.css`, las reglas que redimensionaban cuerpo y mangas se sustituyen por `zoom` sobre la camiseta entera. El zoom escala también bordes y redondeos, así que la forma es la misma que la de la camiseta grande. Es el mismo método que usa el cuadro de Copa desde la v0.25.62.

| Lugar | Antes | Después |
|---|---|---|
| Últimos resultados (`.recent-result-scoreline`) | 24 × 22 px, reducción pieza a pieza | `zoom: 0.7` (≈ 24 × 22 px) |
| Lista de goles (`.goal-events-list`) | 27 × 25 px, reducción pieza a pieza | `zoom: 0.8` (≈ 27 × 25 px) |

El tamaño que ocupa cada camiseta es prácticamente el mismo, así que la maquetación no cambia.

## Qué no cambia

- **Camiseta de tamaño normal y compacta:** sin cambios.
- **Colores de los equipos:** sin cambios.
- **Juego:** no cambian reglas, simulación ni datos.

## Validación

- `npm run typecheck` y `npx eslint src scripts` sin errores.
- `npm test` (108 tests), `npm run qa:ci` y `npx playwright test` (15 tests) en verde.
- Capturas temporales a escala 3x, antes y después, de los últimos resultados y de la lista de goles con la partida de prueba.
