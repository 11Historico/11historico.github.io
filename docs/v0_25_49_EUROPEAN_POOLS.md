# v0.25.49 — Rivales europeos reales y más variados

## Problema

Cada competición europea tenía 10 rivales. Cada temporada se eligen entre 6 y 8, así que los rivales se repetían a menudo entre temporadas.

## Cambio

- `src/europe/europeanOpponents.ts`: cada pool (Champions League, Europa League y Conference League) tiene 20 clubes reales, con su país. Los nombres son solo de texto: no se usan escudos ni equipaciones.
  - Champions League: Bayern München, Manchester City, Inter de Milán, Paris Saint-Germain, Arsenal, Liverpool, Chelsea, Napoli, Benfica, FC Porto, Ajax, PSV Eindhoven, Celtic, Galatasaray, Fenerbahçe, Club Brugge, Red Bull Salzburgo, Borussia Dortmund, RB Leipzig y Sporting CP.
  - Europa League: AS Roma, Lazio, Olympique de Marsella, Olympique de Lyon, LOSC Lille, Eintracht Fráncfort, Bayer Leverkusen, VfB Stuttgart, Aston Villa, Tottenham Hotspur, West Ham United, Rangers, Anderlecht, Ferencváros, Slavia Praga, Lech Poznań, Dinamo Zagreb, Estrella Roja, Olympiacos y PAOK.
  - Conference League: sin cambios desde v0.25.48.
- La selección sigue siendo determinista por temporada (`${seasonNumber}_${competition}`), así que los rivales cambian entre temporadas.
- Los rangos de valoración y la lógica de selección no cambian. Los clubes españoles no están en estos pools, para no duplicar a los rivales de la Liga 25/26.

## Decisión registrada

El usuario indica que solo se usan los nombres de los clubes, sin escudos ni equipaciones, y que no hay problema legal. La asesoría de la fase 16 tenía este punto pendiente; lo dejo anotado para que se revise con el resto de referencias al club.

## Validación

- `npm run typecheck` y `npx eslint src scripts`: sin errores.
- `npm test`: 99/99.
- `npm run qa:ci`: 30 scripts en verde.
- `npx playwright test`: 12/12.
