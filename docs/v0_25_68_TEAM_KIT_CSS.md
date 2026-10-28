# v0.25.68 — CSS de las camisetas en su propio archivo

## Problema

Las reglas de las camisetas (forma y colores de cada equipo) estaban en `LeagueSimulatorView.css`, repartidas en dos zonas del archivo. `TeamKitIcon.tsx` importaba esa hoja entera. Por eso la pantalla final y los cuadros de Copa, que solo necesitan las camisetas, cargaban también todos los estilos de la Liga.

## Cambio

- **`src/components/TeamKitIcon.css` (nuevo):** las dos zonas de reglas de camisetas, en el mismo orden que tenían. Algunas reglas de color pisan a otras anteriores ("Contraste extra para camisetas claras de Copa"), así que el orden importa.
- **`src/components/LeagueSimulatorView.css`:** ya no tiene esas reglas.
  - La regla compartida `.team-with-kit, .recent-result-scoreline` se parte en dos con las mismas propiedades: `.team-with-kit` va al archivo nuevo y `.recent-result-scoreline` se queda.
  - Los tamaños según el contexto (marcador, lista de goles, últimos resultados) se quedan en la hoja de la Liga.
- **`src/components/TeamKitIcon.tsx`:** importa `./TeamKitIcon.css` en vez de la hoja de la Liga.
- **`scripts/qaMatchSequence.ts`:** comprueba que `TeamKitIcon` carga su propia hoja, no la de la Liga, y que `LeagueSimulatorView.css` no define reglas `.team-kit-*`.

## Efecto en el build

| CSS | Antes | Después |
|---|---|---|
| Trozo `TeamKitIcon` (lo cargan la pantalla final y los cuadros) | 15,68 kB: toda la hoja de la Liga | 5,80 kB: solo camisetas |
| Trozo `MatchSequence` (Liga, Copa, Supercopa) | — | 9,94 kB: el resto de la hoja de la Liga |

Con esto la pantalla final deja de cargar unos 10 kB de estilos de la Liga que no usa.

## Qué no cambia

Ninguna regla cambia de contenido. Una comparación automática de todas las reglas, antes y después, solo encuentra la regla compartida partida en dos.

## Validación

- `npm run typecheck`, `npx eslint src scripts` y `npm test` (108 tests) sin errores.
- `npm run qa:ci` (con la comprobación nueva) en verde.
- `npx playwright test`: 15 tests en verde y 2 saltados.
- Capturas temporales con el código de `main` y con este cambio, idénticas byte a byte:
  - secuencia de partido con goles;
  - últimos resultados;
  - cuadro de la Copa de la pantalla final (30 camisetas en esa pantalla).
