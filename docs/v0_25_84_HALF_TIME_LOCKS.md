# v0.25.84 — El descanso ya no puede bloquear la carrera

Al probar el juego, la carrera se quedó parada con los botones apagados y sin ninguna decisión a la vista. Al revisarlo aparecieron dos fallos más del mismo descanso. No cambia ningún resultado.

## Los fallos

| Fallo | Qué se veía | Dónde |
| --- | --- | --- |
| **La simulación automática seguía tras empezar un partido europeo** | El partido desaparecía sin decidir en el descanso, y la Liga seguía sola hasta que todos los botones se apagaban | Reproducido en v0.25.80. Desde v0.25.82 ya no ocurría en la prueba, porque el botón europeo espera a que acabe el partido |
| **Cambiar a Rápido en el descanso europeo** | Desaparecían las opciones y no salía «Continuar temporada»: bloqueo permanente | Reproducido en v0.25.83 |
| **Cambiar a Rápido en el descanso de Copa** | Se veía el resultado final antes de decidir | Reproducido en v0.25.83 |

Recargar la página desbloquea la partida: el descanso pendiente no se guarda, y el partido europeo ya jugado cuenta como «Seguir igual».

## Qué cambia

- **La velocidad ya no mueve el partido:** el tiempo del partido se cuenta a velocidad normal, y la velocidad solo decide lo rápido que avanza. Antes, al cambiarla, el mismo tiempo caía en otro punto del partido: podía saltar al final o volver atrás. Vale para Liga, Copa, Europa y Supercopa.
- **Empezar un partido europeo para la simulación automática,** como ya hacía la Copa.
- **La simulación automática espera también al partido europeo,** no solo a los de Liga y Copa. Antes, pulsar «Simular» durante la segunda parte europea podía cortar ese partido.

## Qué no cambia

- **Partidos y resultados:** no se toca ningún archivo de simulación. Esto solo afecta a cómo se reproducen en pantalla.
- **La duración a cada velocidad:** es la misma que antes.

## Comprobación

- `tests/e2e/europe-supercopa.spec.ts` cubre los tres casos.
- Un bot que pulsa botones al azar, también los de velocidad, jugó 9 temporadas sin bloqueos ni errores. En v0.25.80 el mismo bot se bloqueó en 1 de 6 partidas, con los mismos síntomas, así que sabe detectarlo; pero al ser poco frecuente, no demuestra por sí solo que no quede ningún bloqueo. El bot no se añade al repositorio.
