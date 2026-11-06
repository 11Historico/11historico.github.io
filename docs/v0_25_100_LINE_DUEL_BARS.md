# v0.25.100 — Duelo de líneas en la previa

Fase 16 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`, de la ola 6 (gráficos 2D). Como la fase 17, se adelanta porque refuerza la ola 3: entender por qué ganas o pierdes y qué conviene decidir.

Solo cambia cómo se ve la previa: no toca el simulador, los ratings ni ningún resultado.

## Qué cambia

La línea de texto de la previa, por ejemplo «Tu ataque 91 contra su defensa 89 · Tu defensa 90 contra su ataque 85», pasa a ser un duelo en dos filas (`MatchLineDuelBars`):

- **Arriba,** los nombres y las medias: «Tu ataque 91», «Su defensa 89». En el centro va tu ventaja en corto: «+2», «−3» o «=».
  - En amarillo, si es a tu favor.
  - En gris, si es a favor del rival.
- **Abajo,** dos barras que se encuentran justo bajo la ventaja: la tuya crece hacia la izquierda y la del rival hacia la derecha. Usan los colores de la barra de dominio.
- **La escala de las barras empieza en 60** para que se vean las diferencias, porque casi todas las medias están entre 70 y 92. Una barra nunca baja del 4 %, para que no desaparezca.
- **Dónde sale:** en la previa de Liga y Copa, en la previa europea y en la de la Supercopa.
- **En Europa** el rival solo tiene una media, así que su lado dice «Nivel del rival» en las dos filas. Con la fase 10, si se aprueba, se verían sus líneas.
- **Accesibilidad:**
  - los números van siempre en texto;
  - cada fila tiene un texto para lectores de pantalla, por ejemplo «Tu defensa 90 contra su ataque 85: 5 a tu favor».

## Archivos

- `src/components/MatchLineDuelBars.tsx` y `MatchLineDuelBars.css`: el componente, nuevo.
- `src/components/matchSequenceTimeline.ts`:
  - `getLineDuelSummary`, la línea de texto, se sustituye por `getLineDuelRows`;
  - se añaden `getLineDuelEdgeLabel` y `getLineDuelBarPercent`.
- `src/components/LeagueSimulatorView.tsx` y `src/components/CareerSupercopa.tsx`: usan las barras.
- `src/components/LeagueSimulatorView.css`: se quita `.next-match-lines`, que ya no se usa.
- **Tests:**
  - `tests/unit/matchVisuals.test.ts`: las filas, la ventaja y el largo de las barras.
  - `tests/unit/europeanProfile.test.ts`: con un rival de una sola media.

## Comprobación

- `npm run typecheck`, `npx eslint src scripts`, `npm test` y `npm run qa:ci` pasan.
- `npx playwright test` pasa. La prueba de Europa sigue encontrando «Nivel del rival» en la previa.
- **En el navegador, con la partida de prueba,** en la previa de Liga:
  - sale «Tu ataque 91 +2 Su defensa 89» y «Tu defensa 90 +5 Su ataque 85»;
  - las barras se encuentran justo bajo la ventaja.
- **En móvil (375 px):** cada fila cabe en una línea y la página no se desplaza de lado.
