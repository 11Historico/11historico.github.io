# v0.24.9j — Secuencia de partido, Fase B (Europa)

## Qué cambia

- El resultado de un partido europeo se reproduce como secuencia: previa (1 s), 90' (2,4 s), prórroga 91'-120' (1,4 s, solo si la hubo) y tanda de penaltis (1,6 s, solo si la hubo), y después el resultado final.
- El marcador se revela al terminar cada tramo: 90' al cerrar la fase de juego, tras la prórroga al cerrar la prórroga, y el definitivo al final.
- Botón "Saltar" para ir al resultado final.
- El resultado final conserva el texto de prórroga y penaltis de la Fase de v0.24.9f.
- El acento de la barra de progreso sigue la competición: Champions azul, Europa League naranja, Conference verde.

## Lo que no cambia

- El motor europeo, los resultados, las probabilidades, la tabla europea y los premios.
- Liga y Copa (Fase A).

## Limitación conocida

El motor europeo no guarda minutos de gol, así que la secuencia europea no muestra goles por minuto. La tanda tampoco revela tiro a tiro: solo el marcador final de la tanda, porque el juego no guarda el orden de los lanzamientos. Guardar esos datos cambiaría el modelo de partido europeo y queda fuera de esta fase.

## Archivos

- `src/components/europeanMatchSequenceTimeline.ts`: lógica pura de tramos, reloj y marcador revelado.
- `src/components/EuropeanMatchEvent.tsx`: componente `EuropeanMatchSequence` sustituye al bloque de resultado estático.
- `src/components/EuropeanMatchEvent.css`: estilos de la secuencia y acentos por competición.
- `scripts/qaEuropeanMatchSequence.ts`: QA de tramos, reloj, marcador revelado y cableado.

## Validación

- `npm run qa:european-match-sequence` pasa.
- `typecheck` y `lint` pasan.
- `qa:tech-debt` completo pasa con `VITE_GLOBAL_RANKING_ENDPOINT=""`.
- En la app local: se recorren previa, 90', prórroga, penaltis y final con el marcador revelado en cada tramo, y el resultado final muestra "Penaltis: 8-9 (90' 0-0, prórroga 0-0)". Sin errores de consola.

## Pendiente (Fase C)

- Velocidad configurable (Lento / Normal / Rápido) guardada por navegador.
- Revisión de contraste de los acentos y de `prefers-reduced-motion`.
