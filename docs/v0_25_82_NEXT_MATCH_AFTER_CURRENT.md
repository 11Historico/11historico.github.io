# v0.25.82 — El siguiente partido espera a que acabe el actual

Al probar el juego, en el descanso de unos cuartos de Copa ya se veía la previa de la jornada siguiente de Liga. Es solo un cambio de lo que se muestra.

## Qué cambia

Mientras se juega un partido de Liga, Copa o Europa:

- **Previa oculta:** no aparece la previa del siguiente partido, con sus probabilidades y su planteamiento. La tarjeta de acciones se titula «Partido en juego».
- **Tarjetas de Copa y Europa ocultas:** tanto las de «Próximo» como las del partido pendiente. Antes, la de Copa decía «Próximo» sobre el partido que se estaba jugando.
- **La frase de la temporada no se adelanta:** usa la clasificación de antes del partido, como la posición y los puntos. Antes podía delatar el resultado o decir «Toca Copa del Rey» durante un partido de Liga.
- **Los botones de jugar Copa y Europa esperan:** «Simular partido de Copa», «Simular Copa y terminar temporada» y «Simular partido europeo» se desactivan hasta que acaba el partido actual. Así no se puede empezar uno sin ver su previa ni elegir planteamiento. El botón «Saltar» del partido sigue disponible.

En la simulación automática, la previa y esas tarjetas siguen ocultas también entre jornadas, para que la página no dé un salto en cada una. Vuelven al pararla o cuando se detiene sola.

## Qué no cambia

- **La simulación:** no se toca ningún archivo de simulación, ni el orden de los partidos, ni los resultados.
- **El descanso:** la pausa y sus tres opciones siguen igual.
- **«Simular» y «Saltar hasta próximo evento»:** se pueden pulsar durante un partido de Liga, como hasta ahora.
- **La Supercopa:** tiene su propia pantalla.

## Comprobación

- `tests/e2e/europe-supercopa.spec.ts` comprueba que, en el descanso de Copa, no aparecen la previa ni la tarjeta de Copa, y que la previa vuelve al acabar el partido. También que, en Europa, la tarjeta de «Próximo» no sale durante la simulación automática y vuelve al pararla.
- En el navegador, un partido de Liga con Copa pendiente oculta la previa, oculta la tarjeta y desactiva los botones de Copa. Durante el partido de Copa y su descanso tampoco hay previa, y al acabar aparece la de la jornada siguiente.
