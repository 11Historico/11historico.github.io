# v0.25.81 — El descanso avisa de que te espera

Al probar el juego, la pausa del minuto 45 parecía un bloqueo: el reloj se paraba y nada indicaba que el partido esperaba una decisión. Es solo un cambio visual.

## Qué cambia

- **Lo dice con palabras:** el título «Descanso: el partido está en pausa» y la frase «Elige cómo jugar la segunda parte para continuar».
- **Se ve que hay que actuar:** el aviso va en un recuadro dorado con un pulso suave, y las tres opciones destacan más. Con «reducir movimiento» activado en el dispositivo, el pulso no se muestra.
- **En Copa y Europa:** las dos usan el mismo control (`MatchHalfTimeControl`).

## Qué no cambia

- **Las opciones y sus efectos:** seguir igual, arriesgar y cerrar el partido funcionan igual.
- **La simulación:** no se toca ningún archivo de simulación, ni Liga ni ratings.

## Comprobación

- `tests/e2e/europe-supercopa.spec.ts` comprueba que el aviso aparece en Copa.
- En el navegador, en Copa con pantalla de móvil y en Europa con pantalla de ordenador: el recuadro cabe sin desbordar. En Copa, al elegir «Arriesgar», el aviso desaparece y el partido sigue hasta el final.
