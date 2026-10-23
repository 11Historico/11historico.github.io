# v0.25.27 — Barra de fases y foco en la ruleta

Fase 11 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`).

## Cambios

- `src/components/PhaseProgress.tsx` y `.css`: el pill de versión sale de la cuadrícula de fases y va como hermano en la barra. Así, en escritorio las 6 fases caben en una fila (antes había 7 elementos en 6 columnas y "Resultado" bajaba). En móvil, el borde derecho del desplazamiento se desvanece como pista de que hay más pasos.
- `src/components/SeasonLuckWheelModal.tsx` y `.css`: el diálogo recibe el foco al abrirse y en cada cambio de etapa. Tab y Shift+Tab se quedan dentro del diálogo. No se enfoca "Parar flecha": una pulsación de Enter sostenida no detiene la flecha por accidente. Se quita el contorno del propio diálogo.
- `tests/e2e/season-challenge.spec.ts`: ver "Prueba inestable" abajo.

## Corrección a la auditoría

El informe decía que la tarjeta europea era un modal. No lo es: es una tarjeta dentro del resumen. Solo la ruleta es un diálogo, así que el punto de foco se aplica a ella.

## Prueba inestable

`season-challenge` fallaba a veces, incluso con el componente de `main`. Dos causas:

1. El encabezado "Temporada superada" coincide con dos pantallas: la de resultado (con el reto) y la de decisiones entre temporadas (que empieza igual). La prueba podía parar en la segunda.
2. `advanceOnce` busca botones uno a uno con `await`. Si la pantalla de resultado aparecía durante la búsqueda, podía pulsar su "Continuar carrera" y saltarse el resultado.

Arreglo: encabezado con `exact: true` y ningún clic en "Continuar carrera" en esta prueba. Seis ejecuciones seguidas en verde.

## Validación

- `npm run typecheck`, `npx eslint src scripts`, `npm test` (73 pruebas).
- `npm run qa:ci` (29 QA) y `npm run qa:tech-debt` en verde.
- `npx playwright test`: 7 pruebas, tres ejecuciones seguidas en verde.
- Capturas: barra de fases en escritorio (una fila) y en móvil (desvanecido en el borde).
- Comprobación de foco en la ruleta: al abrirse, el foco está en el diálogo; Tab no sale de él.
