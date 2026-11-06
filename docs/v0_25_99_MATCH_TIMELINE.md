# v0.25.99 — Línea de tiempo del partido

Fase 17 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`, de la ola 6 (gráficos 2D). El roadmap la adelanta porque refuerza la ola 3: hacer visible dónde influiste.

Solo cambia cómo se ve el partido: no toca el simulador, los ratings ni ningún resultado.

## Qué cambia

La barra de progreso de la secuencia del partido pasa a ser una línea de tiempo de 0' a 90':

- **Goles en su minuto:** los tuyos arriba (círculo lleno) y los del rival abajo (círculo hueco). Aparecen a medida que se marcan, así que la línea no adelanta el resultado. En los partidos entre rivales de la Supercopa, arriba va el local.
- **El descanso, marcado a los 45':** mientras el partido está parado para decidir, la marca parpadea. Después pone «Arriesgaste» o «Cerraste», y se ve qué goles llegaron en la segunda parte.
- **Prórroga:** cuando el reloj pasa de 90', la escala se alarga a 120' y aparece una marca en «90'». Antes de ese momento la escala es de 90', para no delatar que habrá prórroga.
- **Color de cada competición:** la barra conserva las clases de siempre (`match-sequence-progress` y `european-match-sequence-progress`), así que Copa, Champions, Europa League y Conference mantienen su color.
- **Accesibilidad:**
  - la posición y la forma distinguen tus goles de los del rival, no solo el color;
  - una leyenda lo explica;
  - la línea tiene un texto para lectores de pantalla, por ejemplo «Línea de tiempo, minuto 90 de 90. Tus goles: 12', 67'. Goles del rival: 30'. En el descanso arriesgaste.».

## Qué no hace, y por qué

- **«Seguir igual» se queda en «Descanso»:** esa decisión no deja rastro en el resultado guardado, porque no recalcula nada. Guardarla sería cambiar el formato del resultado, y no hacía falta.
- **No hay dominio por tramos:** el motor calcula los goles esperados del partido entero, no por minutos. Pintar un dominio por tramos sería inventarlo. La barra de dominio de la v0.25.76 se queda como está.

## Archivos

- `src/components/MatchTimeline.tsx` y `MatchTimeline.css`: el componente, nuevo.
- `src/components/matchSequenceTimeline.ts`, con lógica pura:
  - `getTimelinePercent`;
  - `getTimelineHalfTimeLabel`;
  - `getMatchTimelineLabel`.
- `src/components/MatchSequence.tsx` (Liga, Copa y Supercopa) y `src/components/EuropeanMatchEvent.tsx` (Europa): usan la línea en vez de la barra.
- `tests/unit/matchTimeline.test.ts`, nuevo, con 5 tests:
  - la escala de 90' y 120';
  - los límites;
  - la etiqueta del descanso;
  - el texto accesible.

## Comprobación

- `npm run typecheck`, `npx eslint src scripts`, `npm test` y `npm run qa:ci` pasan.
- `npx playwright test` pasa.
- **En el navegador, con la partida de prueba:**
  - **Liga:** el gol del rival al 75' sale abajo, en el 83 % de la línea.
  - **Copa:** el partido se para a los 45' con la marca parpadeando y la barra en el color de la Copa. Al elegir «Arriesgar», la marca pone «Arriesgaste». El partido fue a la prórroga, la línea pasó a 120' con la marca de «90'» y el gol del 110' quedó en su sitio.
  - **Móvil (375 px):** las etiquetas no se pisan y la página no se desplaza de lado.
