# v0.25.105 — Rivales europeos con estilo

Es la fase 10 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`. Aplica la opción B del informe `docs/INFORME_ESTILOS_EUROPEOS_v0_25_104.md`, elegida por el usuario: estilos de ±3.

## El cambio

### Datos (`src/europe/europeanOpponents.ts` y `europeanTypes.ts`)

- Los 50 clubes de los tres bombos tienen un `style` fijado a mano: 16 ofensivos, 17 equilibrados y 17 defensivos. El sorteo no cambia, porque el estilo no consume tiradas.
- `EuropeanOpponent.style` es opcional: las partidas guardadas antes de esta versión no lo tienen.

| Bombo | Ofensivos | Equilibrados | Defensivos |
| --- | --- | --- | --- |
| Champions | Bayern, PSG, Liverpool, Dortmund, Leipzig, Ajax, PSV | Man City, Arsenal, Napoli, Benfica, Sporting, Fenerbahçe, Salzburgo | Inter, Chelsea, Porto, Celtic, Galatasaray, Club Brugge |
| Europa League | Leverkusen, Tottenham, Marsella, Eintracht, Lyon, Dinamo Zagreb | Aston Villa, Lazio, Stuttgart, Rangers, Anderlecht, Lech, Estrella Roja | Roma, Lille, West Ham, Olympiacos, Ferencváros, Slavia, PAOK |
| Conference | Qarabağ, Pyunik, Valletta | Dinamo Tbilisi, Víkingur, Zimbru | APOEL, Tirana, Budućnost, Vaduz |

Es un reparto genérico para dar variedad, no un análisis táctico. Se puede cambiar club a club sin tocar nada más.

### Motor (`src/europe/europeanMatchEngine.ts`)

- `buildUniformRivalTeam` pasa a ser `buildEuropeanRivalTeam`. Con estilo, el ataque y la defensa se mueven en sentidos contrarios `EUROPEAN_STYLE_SHIFT` (3 puntos):
  - ofensivo: ataque +3 y defensa −3;
  - defensivo: al revés.
- La media ponderada del motor no cambia: ataque y defensa pesan lo mismo, 0,22.
- `simulateEuropeanMatch`, `estimateEuropeanMatchOdds` y `getEuropeanLineDuel` aceptan `opponentStyle`.
- Sin estilo, el rival es el de antes y `rivalHasOnlyOverall` sigue a `true`. Con cualquier estilo, también equilibrado, la previa enseña sus líneas.

### Pantalla (`LeagueSimulatorView.tsx`)

- **Previa europea:** la cabecera dice «Rival de Hungría, de estilo defensivo».
- **Duelo de líneas:** «Tu ataque 88 · Su defensa 81» y «Tu defensa 87 · Su ataque 75», en lugar de «Nivel del rival».
- Las probabilidades, la simulación del partido y la probabilidad de pasar a semifinales usan el estilo.

**Sin cambios:**
- La media de cada club y el sorteo.
- El motor de partidos (`matchEngine.ts`) y la regla del planteamiento, que sigue dependiendo de la diferencia de medias, no de las líneas.
- Los partidos entre rivales de la tabla europea, que siguen sin estilo. Así, la tabla de un torneo ya empezado no se recalcula distinta.

## Medición

### Fase inicial

`npm run audit:european-styles -- --matches=20000 --tournaments=2000`, con las mismas semillas. Primero comprueba que el rival de la auditoría, sin estilo y con los dos estilos, da el mismo marcador que el juego: **2000 de 2000**.

Probabilidad de pasar a semifinales y puntos medios de la fase inicial. «Decide bien» elige el planteamiento que más puntos da contra cada rival.

| Competición | Tu media | Decisiones | Sin estilos (v0.25.104) | Juego (v0.25.105) |
| --- | --- | --- | --- | --- |
| Champions | 84 | No decide | 10 % · 5,5 | 11 % · 5,6 |
| | 84 | Decide bien | 11 % · 5,8 | 11 % · 5,8 |
| | 86 | No decide | 13 % · 6,1 | 13 % · 6,1 |
| | 86 | Decide bien | 14 % · 6,3 | 14 % · 6,3 |
| Europa League | 84 | No decide | 28 % · 8,0 | 27 % · 8,0 |
| | 84 | Decide bien | 30 % · 8,2 | 29 % · 8,2 |
| | 86 | No decide | 35 % · 8,8 | 36 % · 8,8 |
| | 86 | Decide bien | 40 % · 9,1 | 40 % · 9,1 |
| Conference | 84 | No decide | 54 % · 10,2 | 54 % · 10,3 |
| | 84 | Decide bien | 61 % · 10,7 | 61 % · 10,7 |
| | 86 | No decide | 63 % · 11,0 | 63 % · 11,0 |
| | 86 | Decide bien | 68 % · 11,5 | 70 % · 11,5 |

Todas las casillas quedan a 2 puntos o menos de antes.

### Carreras completas

`npm run audit:rating -- --careers=600 --only=1`, con las mismas semillas que en la v0.25.101. `scripts/auditCareerRunner.ts` pasa el estilo del rival como el juego. Son 2.400 carreras, ninguna rechazada.

| Dificultad y draft | Temporadas superadas | Títulos por temporada | Puntuación |
| --- | --- | --- | --- |
| Normal, mejor media | 2,22 → 2,23 | 0,34 → 0,34 | 26,98 → 27,25 |
| Normal, al azar | 0,92 → 0,91 | 0,19 → 0,18 | 10,78 → 10,62 |
| Fácil, mejor media | 3,65 → 3,65 | 0,48 → 0,48 | 46,45 → 46,51 |
| Fácil, al azar | 1,81 → 1,81 | 0,31 → 0,31 | 22,01 → 22,00 |

Todo dentro del margen.

## Comprobación

- **Tests nuevos** en `tests/unit/europeanProfile.test.ts`:
  - ofensivo y defensivo mueven ±3 el ataque y la defensa, y la previa deja de usar el «solo número»;
  - equilibrado da el mismo marcador que el rival de antes en 200 partidos;
  - los 50 clubes tienen estilo y hay de los tres tipos.
- **E2E** (`europe-supercopa.spec.ts`): la previa europea enseña «Su defensa» y el estilo. Las 9 pruebas europeas pasan en local con el Chrome instalado.
- **Navegador:** previas de Europa League (Ferencváros, defensivo: ataque 75 y defensa 81) y de Champions en el móvil (PSV, ofensivo: ataque 89 y defensa 83). Sin errores y sin desbordar la página a 375 px.
- `npm run typecheck`, `npx eslint src scripts`, `npm test` y `npm run qa:ci` pasan.
