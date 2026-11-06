# v0.25.98 — Rivales europeos con su nivel

Fase 9 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`. Cambia datos de Europa, que están protegidos, **con permiso explícito del usuario**, que eligió:

- **Niveles fijos ±1** para la media de cada club.
- **Techo de 91 en la Champions**, el nivel del Barça y el Real Madrid.
- **Sin progresión con la carrera:** los rivales europeos no suben con las temporadas, como hasta ahora.

## Por qué

`docs/INFORME_RIVALES_EUROPEOS_v0_25_97.md` midió dos problemas:
- **La media no dependía del club:** se sorteaba en el rango de la competición (Champions 82-94, Europa League 76-88, Conference 70-82). El Celtic tenía la misma media que el Bayern.
- **La Champions superaba a los grandes:** cualquier club pasaba de 91 en una de cada cinco apariciones.

## Cambio (`src/europe/europeanOpponents.ts`)

Cada club tiene una media fija según su nivel. En cada torneo, la tirada que antes sorteaba la media en el rango ahora solo decide la variación de la temporada: −1, 0 o +1.

| Competición | Nivel alto | Nivel medio | Nivel bajo | Media de la competición |
| --- | --- | --- | --- | --- |
| Champions | 90: Bayern, City, Inter, PSG, Arsenal, Liverpool | 88: Chelsea, Napoli, Dortmund, Benfica, Porto, Leipzig, Sporting | 86: Ajax, PSV, Celtic, Galatasaray, Fenerbahçe, Brugge, Salzburgo | 87,9 (antes 88) |
| Europa League | 86: Leverkusen, Tottenham, Roma, Aston Villa, Lazio, Marsella | 82: Fráncfort, Stuttgart, Lyon, Lille, West Ham, Rangers, Olympiacos | 78: Anderlecht, Ferencváros, Slavia, Lech Poznań, Dinamo Zagreb, Estrella Roja, PAOK | 81,8 (antes 82) |
| Conference | 79: Qarabağ, APOEL, Dinamo Tbilisi | 76: Víkingur, Pyunik, Tirana, Budućnost | 73: Zimbru, Vaduz, Valletta | 76,0 (antes 76) |

- **Rangos posibles:** Champions de 85 a 91, Europa League de 77 a 87 y Conference de 72 a 80.
- **La media de cada competición se mantiene a propósito.** El cambio es de reparto, de quién es fuerte, no de dificultad.
- **El sorteo de los rivales no cambia:** la misma semilla da los mismos clubes que antes, solo cambian sus medias. Por eso sigue el pequeño sesgo del barajado que señaló la auditoría (el Stuttgart sale en el 52 % de los torneos). No entraba en lo elegido.
- **Partidas guardadas:** el torneo en curso conserva sus rivales y medias. Lo nuevo se aplica desde el siguiente torneo.

## Medición

### Probabilidad de pasar la fase de liga

`npm run audit:european-opponents`, 300 torneos por casilla, sin decidir:

| Competición | Tu rating europeo | Antes | Ahora |
| --- | --- | --- | --- |
| Champions | 84 / 86 / 88 | 9 / 12 / 15 % | 9 / 13 / 16 % |
| Europa League | 84 / 86 / 88 | 24 / 32 / 41 % | 24 / 33 / 42 % |
| Conference | 84 / 86 / 88 | 53 / 60 / 67 % | 53 / 62 / 68 % |

Prácticamente igual, como se buscaba: la media de cada competición no cambia.

### Carreras completas

`npm run audit:rating -- --careers=600 --only=1`: 600 carreras por casilla, las mismas semillas que la medición de la v0.25.94, con el jugador que decide bien en Copa y Europa.

| Dificultad y draft | Temporadas superadas: antes → ahora | Títulos por temporada | Puntuación del ranking |
| --- | --- | --- | --- |
| Normal, mejor media | 2,24 → 2,22 (± 0,15) | 0,33 → 0,34 | 27,1 → 27,0 |
| Normal, al azar | 0,91 → 0,92 (± 0,10) | 0,18 → 0,19 | 10,7 → 10,8 |
| Fácil, mejor media | 3,69 → 3,65 (± 0,27) | 0,45 → 0,46 | 46,4 → 46,3 |
| Fácil, al azar | 1,79 → 1,81 (± 0,14) | 0,28 → 0,29 | 21,5 → 21,9 |

La posición y los puntos en la 1.ª temporada son idénticos. Son 2.400 carreras, ninguna rechazada por la regla de plausibilidad. **El equilibrio de la carrera no cambia:** cambia quién es fuerte en Europa, no lo difícil que es.

## Archivos

- `src/europe/europeanOpponents.ts`: medias por club.
- `scripts/qaEuropeanTournamentSkeleton.ts`: los rangos que comprueba pasan a 85-91, 77-87 y 72-80.
- `scripts/auditEuropeanOpponents.ts`: sin la escala alternativa de ejemplo, que ya no aplica; añade el rival medio.
- `tests/unit/europeanOpponents.test.ts`, nuevo:
  - cada club con su media ±1;
  - el Bayern por encima del Celtic;
  - techo de 91;
  - las medias por competición;
  - determinismo.

## Comprobación

- `npm run typecheck`, `npx eslint src scripts`, `npm test` (206; 4 nuevos) y `npm run qa:ci` pasan.
- `npx playwright test` pasa: 21 y 2 omitidos.
