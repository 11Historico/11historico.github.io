# v0.25.87 — Cuadro de la Copa del Rey

Durante la temporada faltaba una forma de ver cómo iba la Copa. Ahora hay una pestaña «Cuadro de Copa», junto a «Clasificación europea», con el cuadro completo en espejo: dieciseisavos a cada lado y la final en el centro.

## Qué había antes

La Copa solo guardaba tu camino: un rival sorteado por ronda y, si caías, los partidos de quien te eliminó contra rivales nuevos (`pickCupRival` con horquillas de media altas). No existían los otros 15 cruces, así que no se podía dibujar el cuadro.

## Qué cambia

- **Los 16 cruces de dieciseisavos.** 32 equipos: tú, tus cinco rivales sorteados y 26 más. Entran antes los de Primera y luego los de la lista extra de Copa. Los cruces que no son el tuyo se simulan con la misma función que ya simulaba los partidos entre rivales (`simulateCupTeamVsTeam`).
- **Tu cruce siempre es el de arriba a la izquierda.** Usa los resultados guardados: el cuadro no simula ningún partido tuyo.
- **Tus rivales salen de su lado del cuadro.** El rival sorteado para la ronda r está en el bloque de dieciseisavos que lleva hasta ti, y gana sus cruces hasta llegar. Si uno de esos cruces no lo gana al simularlo, se repite (hasta 40 veces) y, como último recurso, se le da la vuelta al marcador.
- **Favorito de cada lado.** En cuartos, semifinal y final hay además un favorito en la otra mitad del bloque, con la misma horquilla de media que el rival que se elegía antes (70-86, 78-90 y 82-94). El sorteado y el favorito se cruzan justo antes de llegar a ti. Si sigues vivo gana el sorteado, y si ya has caído, el favorito.
- **Si caes, el que te eliminó juega contra quien gana el otro lado del cuadro.** Es el único cambio en la simulación (`simulateRemainingCupAfterUserElimination`). Antes se elegía un equipo nuevo, y el cuadro no habría cuadrado.
- **Siempre el mismo cuadro.** La semilla sale de los ids del sorteo, así que recargar la partida da el mismo cuadro. No se guarda nada nuevo en la partida.
- **Sin adelantos.** Una ronda se enseña cuando has jugado tu cruce o, si ya caíste, cuando la Liga llega a la jornada de esa ronda. Los cruces de la ronda siguiente aparecen cuando acaba la anterior. Mientras se juega tu partido, el cuadro sigue como antes de jugarlo.

## Lo que no cambia

- Tus rivales, los campos, cómo se simulan tus partidos y la prórroga.
- El orden estricto de partidos (un cruce de Copa pendiente bloquea la Liga).
- El resumen final sigue con su cuadro por columnas.

## Medición: campeón de Copa cuando caes antes de la final

4.000 Copas por caso, con tu equipo a 74 y a 86 de media.

| Caso | Campeón de Primera | Media del campeón (Primera) | Los cinco que más ganan |
| --- | --- | --- | --- |
| Antes, equipo 74 | 88,6 % | 85,2 | Villarreal 13,3 · Betis 12,6 · Barça 12,3 · Atlético 12,3 · Real Madrid 12,0 |
| Ahora, equipo 74 | 86,6 % | 85,0 | Villarreal 12,7 · Real Madrid 12,0 · Atlético 11,6 · Barça 11,2 · Betis 11,1 |
| Antes, equipo 86 | 88,8 % | 85,1 | Villarreal 13,1 · Real Madrid 12,6 · Atlético 12,4 · Betis 12,3 · Barça 11,7 |
| Ahora, equipo 86 | 87,0 % | 84,8 | Atlético 13,0 · Villarreal 12,4 · Betis 11,3 · Real Madrid 11,2 · Barça 10,6 |

Hubo dos intentos que se descartaron:

- **Usar los rivales ya sorteados como rivales tras la eliminación.** El campeón quedaba repartido: Levante, el que más ganaba, con un 4,6 %.
- **Dejar libre el resto del cuadro.** El campeón era de Primera solo el 64,5 % de las veces.

Los favoritos de cada lado mantienen el reparto de antes. Esto importa porque el campeón y el subcampeón de Copa juegan la Supercopa del año siguiente.

## Partidas guardadas

- Si una partida guardada antes de v0.25.87 ya había caído de la Copa en la temporada en curso, el rival guardado de las rondas siguientes puede no coincidir con el ganador del otro lado. Desde la siguiente Copa el cuadro cuadra.
- No hace falta migrar nada.

## Archivos

- `src/simulation/leagueSimulator.ts`:
  - `simulateCupBracketSides`: los cruces que no son el tuyo.
  - `buildCupBracket`: el cuadro con tu camino y qué se enseña.
  - `simulateRemainingCupAfterUserElimination`: el rival tras caer es el ganador del otro lado.
- `src/components/SeasonBrackets.tsx` y `.css`: `CupMirrorBracket`. En el móvil el cuadro se desplaza dentro de la tarjeta, sin mover la página.
- `src/components/LeagueSimulatorView.tsx`: la pestaña.

## Comprobación

- `tests/unit/cupBracket.test.ts`:
  - 32 equipos distintos y tú en el primer cruce.
  - El mismo cuadro para la misma Copa.
  - En 150 Copas, cada cruce sale de los dos ganadores de los que vienen y el campeón es el que guarda la Copa.
  - Lo ya enseñado no cambia cuando te eliminan.
  - Antes de jugar solo se ven los dieciseisavos.
  - Tras caer, la ronda siguiente espera a su jornada de Liga.
- `tests/e2e/europe-supercopa.spec.ts`: la pestaña muestra 9 columnas con 8 cruces de dieciseisavos por lado y la página no se ensancha en un móvil de 375 px.
- En el navegador:
  - Tras jugar dieciseisavos se ven sus resultados y los cruces de octavos, con tu rival sorteado.
  - Recargar da el mismo cuadro.
