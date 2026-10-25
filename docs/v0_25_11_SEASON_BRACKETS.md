# v0.25.11 — Cuadros de Copa y Europa al final de temporada

Muestra los cuadros de eliminatorias en columnas por ronda, en lugar de listas, en el resumen de fin de temporada.

## Qué se muestra

- **Copa del Rey:** una columna por ronda (Dieciseisavos, Octavos, Cuartos, Semifinal y Final). Cada columna muestra el partido del Athletic si lo jugó, o el partido simulado de la ronda si no lo jugó. Las rondas sin datos quedan como "Sin datos de esta ronda".
- **Torneo europeo:** columna de fase inicial (con el marcador de cada partido y el resultado), columna de semifinal y columna de final. Si no se llegó a una eliminatoria, la columna lo indica. La decisión del partido (prórroga o tanda) aparece cuando la hubo.

## Qué no muestra

- El juego no guarda todos los partidos de las rondas tempranas de la Copa, solo los del Athletic y los simulados posteriores. Por eso el cuadro muestra el camino del Athletic y no el cuadro completo de la Copa.
- La tanda de penaltis no se muestra tiro a tiro: el juego no guarda el orden de los lanzamientos.

## Cambios

- `src/career/seasonBrackets.ts`: lógica pura (orden de rondas, estado de cada ronda, ganador por marcador, columnas europeas).
- `src/components/SeasonBrackets.tsx` y `SeasonBrackets.css`: vista en columnas, con una columna por ronda que se apila en móvil.
- `src/components/FinalSummary.tsx`: la sección de Copa usa el cuadro; se añade la sección "Torneo europeo" con el torneo de la carrera. Se eliminan las listas antiguas y dos helpers que ya no se usaban.
- `src/App.tsx`: pasa el torneo europeo al resumen final, solo en modo carrera.

## Validación

- `tests/unit/seasonBrackets.test.ts` (7 pruebas) y `tests/unit/seasonBracketsView.test.tsx` (3 pruebas de renderizado).
- Comprobado en la app: el cuadro de la Copa en columnas, con los partidos del Athletic, los ganadores resaltados y las rondas simuladas.
- El distintivo de la noche europea con su icono se ha visto en la app. El cuadro europeo no se ha podido revisar completo en captura, porque la cabecera fija de la app lo tapaba; su contenido lo cubren las pruebas de renderizado.
- `npm test`, `typecheck`, `lint`, `qa:tech-debt` completo y `npm run test:e2e` pasan.
