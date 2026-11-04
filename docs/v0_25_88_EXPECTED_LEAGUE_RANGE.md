# v0.25.88 — Rango esperado en Liga

Al jugar una carrera, el usuario sintió que no podía hacer nada para mejorar su posición en Liga. Las auditorías (`docs/INFORME_PARTIDOS_GRANDES_v0_25_84.md` y `docs/INFORME_PESO_DECISIONES_v0_25_87.md`) mostraron dos cosas:

- Lo que más mueve el puesto es el once y el nivel de los rivales.
- Dar más peso a las decisiones en los partidos no lo arreglaría sin romper el equilibrio.

Esta versión no cambia el juego. Hace visible lo que se puede esperar, para que acabar 6.º se lea como «dentro de lo esperado» y no como «no he podido hacer nada».

## Qué se ve

Encima de la clasificación, en la pantalla de Liga:

- **Desde el principio:** «Lo normal con este once y estos rivales: acabar entre el 5.º y el 8.º.»
- **Desde la jornada 10**, se añade el puesto actual: «Vas 4.º, por encima de lo esperado», «dentro de lo esperado» o «por debajo de lo esperado». Antes de esa jornada la clasificación se mueve demasiado para compararla: tras una jornada se puede ir 17.º con un equipo de arriba.
- **Al acabar la Liga**, la misma línea dice si el puesto final estuvo dentro de lo esperado.

## Cómo se calcula

`src/simulation/expectedLeagueRange.ts`:

- **Simula 100 Ligas enteras** con la misma función del juego (`simulateFullUserLeague`), con tu once, tu media efectiva (con dificultad y ruleta), el calendario y los rivales de la temporada en curso.
- **El rango es la mitad central:** los puestos entre los que acaba la mitad de esas Ligas (percentiles 25 y 75).
- **Cada Liga usa otra forma de los rivales.** En el juego, los partidos entre rivales de una temporada ya están decididos por su semilla. Con la de esta temporada, el cálculo se aprovecharía de resultados que el jugador no conoce.
- **Sin Copa:** la Liga se juega de corrido, y la Copa no cambia sus resultados.
- **No gasta azar de la partida.** No crea una temporada nueva (eso tiraría de `Math.random`): parte del calendario actual con la tabla a cero, y todas las tiradas van con semilla. Para el mismo once y los mismos rivales, el rango es siempre el mismo.
- **Se calcula después de pintar la pantalla:** unos 0,4 s en Node y alrededor de 1 s en el navegador en modo desarrollo. Solo se repite si cambian el once, la media (por la ruleta), el calendario o los rivales, no con cada partido.

## Lo que no cambia

- Resultados, reglas, equilibrio y azar de la partida.
- Las auditorías y los tests e2e, que fijan el azar, siguen dando lo mismo.

## Comprobación

- `tests/unit/expectedLeagueRange.test.ts`:
  - Mismo resultado dos veces y sin llamar a `Math.random`.
  - Un equipo mejor espera acabar más arriba.
  - Tarda menos de 3 s.
  - Los textos con y sin puesto actual.
- `tests/e2e/europe-supercopa.spec.ts`: al abrir la Liga se ve la línea, sin comparar todavía.
- En el navegador:
  - Con la partida de prueba fuerte, la línea sale al abrir la Liga («entre el 2.º y el 4.º») y no cambia al jugar.
  - Desde la jornada 10 añade el puesto («Vas 10.º, por debajo de lo esperado»).
