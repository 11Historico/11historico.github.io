# v0.25.106 — Semifinales y finales europeas sin rival fijo

Es el «sesgo del sorteo europeo» apuntado en la auditoría de la v0.25.97 (`docs/INFORME_RIVALES_EUROPEOS_v0_25_97.md`). El usuario dio permiso con «arregla el sorteo».

## Qué se encontró

### 1. La fase inicial ya era justa

Con semillas como las del juego (`${gameId}_${temporada}`, con `gameId = game_<fecha>_<hex>`), cada club sale en su parte justa de los torneos:

| Bombo | Esperado | Más frecuente | Menos frecuente |
| --- | --- | --- | --- |
| Champions (6 de 20) | 30 % | 31,6 % | 28,8 % |
| Europa League (6 de 20) | 30 % | 31,6 % | 28,8 % |
| Conference (6 de 10) | 60 % | 61,9 % | 58,8 % |

El 52 % del Stuttgart de la v0.25.97 salía con las semillas cortas y seguidas de la auditoría (`audit_1_…`, `audit_2_…`), con las que el generador del sorteo se repite. El juego no usa esas semillas.

### 2. La semifinal y la final sí tenían un rival casi fijo

`createFollowUpMatch` (`src/europe/europeanTournament.ts`) sorteaba el rival con la semilla `${temporada}_${competición}_${fase}`, igual para todos los jugadores. Solo variaba al excluir a los 6 rivales de la fase inicial. Rival de semifinal en la primera temporada, con 3.000 partidas:

| Competición | Rival más frecuente | Siguientes |
| --- | --- | --- |
| Champions | Sporting CP, 70 % | Manchester City 22 %, Arsenal 6 % |
| Europa League | Olympique de Lyon, 70 % | Olympiacos 21 %, Slavia Praga 7 % |
| Conference | Valletta FC, 40 % | Qarabağ 25 %, Zimbru 17 % |

En las demás temporadas pasaba lo mismo con otros clubes: en la tercera de Champions, el Dortmund salía en el 69 %.

## El cambio

- **`EuropeanTournamentState.drawSeed`:** la semilla con la que se sortea el torneo. Se guarda al crearlo, y `normalizeEuropeanTournament` la conserva al cargar la partida.
- **`createFollowUpMatch`:** sortea la semifinal y la final con `${drawSeed}_${fase}`, sin repetir ningún rival del torneo.
- **Torneos guardados antes, sin `drawSeed`:** siguen con la semilla de antes, así que su semifinal no cambia.
- **Sin cambios:**
  - el sorteo de la fase inicial: la misma partida da los mismos 6 rivales;
  - el generador del sorteo, las medias y los estilos.

## Medición

### Media del rival de semifinal

2.000 partidas por 6 temporadas, ganando la fase inicial:

| Competición | Antes | Ahora |
| --- | --- | --- |
| Champions | 87,5 (15 clubes distintos) | 87,9 (los 20) |
| Europa League | 83,9 (16 clubes) | 81,8 (los 20) |
| Conference | 75,6 (9 clubes) | 76,0 (los 10) |

Ahora el rival tiene la media de su competición. La semifinal de Europa League sale algo más fácil, porque antes tocaban más a menudo el Lyon y la Roma.

### Carreras completas

`npm run audit:rating -- --careers=600 --only=1`, con las mismas semillas que en la v0.25.105. Son 2.400 carreras y ninguna rechazada.

| Dificultad y draft | Temporadas superadas | Títulos por temporada | Puntuación |
| --- | --- | --- | --- |
| Normal, mejor media | 2,23 → 2,24 | 0,34 → 0,35 | 27,25 → 27,38 |
| Normal, al azar | 0,91 → 0,90 | 0,18 → 0,18 | 10,62 → 10,56 |
| Fácil, mejor media | 3,65 → 3,63 | 0,48 → 0,48 | 46,51 → 46,27 |
| Fácil, al azar | 1,81 → 1,80 | 0,31 → 0,31 | 22,00 → 21,84 |

Todo dentro del margen.

## Comprobación

- **Tests nuevos** en `tests/unit/europeanDraw.test.ts`:
  - con semillas como las del juego, cada club de la fase inicial sale a menos de 3 puntos de su parte justa;
  - el rival de semifinal más frecuente queda a menos de 6 puntos del reparto justo (antes, 70 %);
  - un torneo guardado sin `drawSeed` conserva su rival de semifinal.
- `npm run typecheck`, `npx eslint src scripts`, `npm test` y `npm run qa:ci` pasan.
