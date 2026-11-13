# v0.25.118 — El cuadro europeo, en la temporada

El usuario llegó a semifinales de la Conference y en la pestaña de Europa seguía viendo la clasificación de la fase de liga. Pidió además los dos detalles del resumen de la temporada que se vieron en su captura: «haz los dos y añade lo siguiente». Plan aprobado con «adelante».

Todo es interfaz: no cambia nada del juego.

## 1. El cuadro europeo durante la temporada

**Lo que pasaba:** la pestaña de Europa (`LeagueSimulatorView.tsx`) solo tenía `EuropeanLeagueTable`. El cuadro (`EuropeanBracket`) solo salía en el resumen completo, al acabar la temporada.

**Ahora:**
- En cuanto hay previa, semifinal o final, la pestaña se llama «Cuadro europeo». Enseña arriba el cuadro (fase inicial, previa si la hubo, semifinal y final) y, debajo, la tabla de la fase de liga.
- Mientras dura la fase de liga, todo sigue igual: la pestaña es «Clasificación europea» y solo tiene la tabla.
- `EuropeanBracket` recibe `inProgress`: mientras el torneo sigue, lo que falta dice «Por decidir.» en vez de «No llegó a la final.». En el resumen completo no cambia.

## 2. El resumen de la temporada (`CareerSeasonOutcome.tsx`)

- **Sin «Temporada salvada por Europa»:** clasificarse para Europa es el objetivo normal, y el titular ya dice «Temporada superada · Objetivo cumplido: clasificación a…». La nota queda en «Elige cambiar 1 jugador o cambiar entrenador antes de seguir.» Con la Supercopa ganada: «Supercopa ganada. Premio especial desbloqueado.»
- **No cambia «Temporada salvada por Copa»:** ahí la Copa sí puede ser lo que salva la temporada.
- **Tarjeta de Copa:** el titular se queda con lo tuyo («Eliminado en Octavos», «Subcampeón») y el campeón baja a la línea pequeña: «Campeón: Real Betis · Objetivo ya cumplido por la Liga». Antes ocupaba cuatro líneas en el titular.

## Comprobación

- **En el navegador,** con la partida de prueba `career-strong`:
  - fase inicial ganada y semifinal pendiente: pestaña «Cuadro europeo», con la semifinal contra el Budućnost «Sin jugar», la final «Por decidir.» y la tabla debajo;
  - a 1.024 px el cuadro va en tres columnas; a 375 px, en una, sin salirse de la pantalla;
  - jugada la temporada hasta el final, la tarjeta de Copa dice «Subcampeón» y debajo «Campeón: Unión Deportiva Las Palmas · Objetivo ya cumplido por la Liga»;
  - sin errores en la consola.
- **`tests/e2e/europe-supercopa.spec.ts`:** el test de la previa abre ahora la pestaña «Cuadro europeo» y comprueba que la previa sale sin jugar.
- Pasan `npm run typecheck`, `npx eslint src scripts`, `npm test` (267), `npm run qa:ci` y `npm run test:e2e` (22 pasan, 2 se saltan).
