# v0.25.17 — Portada reordenada

## Problema

Los botones de la portada estaban mezclados en un solo bloque, "Continuar" aparecía deshabilitado sin partida guardada, la dificultad quedaba lejos de "Jugar carrera" y el objetivo de la carrera no se veía hasta leer la portada completa.

## Cambios

- `src/components/GameHome.tsx`: tres bloques de botones (empezar, explorar, compartir). "Continuar" se oculta sin partida guardada. La dificultad pasa encima de "Jugar carrera". Se añade la línea de objetivo en la cabecera y los iconos de competición en las tarjetas de pasos.
- `src/components/GameHome.css`: fondo con marcas de campo (decorativo, sin imágenes), botones con anchos iguales en cada bloque y el icono de cada botón en la misma posición.

## Qué no cambia

- Textos que comprueban las pruebas de la portada (`scripts/qaPublicReleaseUx.ts`): siguen presentes.
- Balance, reglas, ranking y analítica: sin cambios.

## Validación

- `npm run typecheck`, `npm run lint:src`, `npm test`, `npm run qa:public-release-ux` y `npm run test:e2e`.
- Revisión visual en escritorio y en móvil (ancho 375 px).
