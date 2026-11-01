# v0.25.79 — El 4-6-0 ya no se hunde

Corrige un error hallado en `docs/INFORME_TOPE_LINEAS_v0_25_78.md`. Toca el rating con aprobación expresa del usuario, solo para el 4-6-0.

## Qué cambia

- **Los medios hacen de delanteros:** el 4-6-0 no tiene línea de ataque, y `calculateBaseRatings` usaba 50 como valor de esa línea vacía. Ahora usa a los centrocampistas, tanto en el ataque como en el control.
- **Las carreras ya empezadas:** el rating se corrige al volver a pasar por el resumen del equipo.

## Qué no cambia

- **Las demás formaciones:** la regla mira si la formación tiene línea de ataque, no si ya hay delanteros elegidos. Un test lo comprueba.
- **Ratings y plantillas, tope de las líneas, compresión de carrera, motor de partidos, Liga, Copa y Europa:** sin tocar.
- **Modificadores del 4-6-0:** siguen siendo los mismos.

## Medición

Sale de `npm run audit:linecap`: draft de mejor media, 300 carreras por casilla, jugador que nunca decide.

| Dificultad Normal | Fuerza efectiva | Temporadas superadas | Pasa la 1.ª | Goles a favor por partido | En contra |
| --- | --- | --- | --- | --- | --- |
| 4-6-0 antes | 79,9 | 0,42 ±0,08 | 32 % | 0,69 | 0,75 |
| 4-6-0 ahora | 86,5 | 2,18 ±0,22 | 80 % | 0,92 | 0,77 |
| 4-3-3, como referencia | 86,9 | 2,25 ±0,23 | 82 % | 0,93 | 0,76 |

En dificultad Fácil, el 4-6-0 ahora supera 3,27 ±0,30 temporadas y el 4-3-3, 3,72 ±0,33. Ahí queda algo por debajo, cerca del margen, así que el 4-6-0 no pasa a ser una formación mejor que las demás.

Ninguna carrera se rechaza con la regla de plausibilidad del ranking.

## Cómo se ha comprobado que solo cambia el 4-6-0

- **`npm run audit:linecap`, antes y después:** en más de 19.000 carreras y unos 8.000 drafts, solo cambian las filas del 4-6-0.
- **`npm run audit:career`:** resultado idéntico en una prueba de 360 carreras en 4-3-3.

## Tests

`tests/unit/teamRating.test.ts` comprueba que el ataque de un 4-6-0 no se hunde y que un 4-3-3 sin delanteros todavía elegidos sigue contando esa línea como vacía.
