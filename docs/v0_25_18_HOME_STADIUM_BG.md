# v0.25.18 — Fondo de estadio en la portada

## Cambio

- `src/assets/home-stadium.svg`: ilustración vectorial original (estadio visto desde arriba, en tonos rojo, blanco y negro). No reproduce ningún estadio real ni usa material con licencia de terceros.
- `src/components/GameHome.css`: `.game-home-hero::before` muestra la ilustración con un velo oscuro. Sustituye a las marcas de campo de `v0.25.17`.

## Qué no cambia

- Textos, botones, lógica de la portada y resto de la aplicación.

## Validación

- `npm run typecheck`, `npm run lint:src`, `npm test`.
- QA de versión y de portada (`qa:version`, `qa:public-release-ux`).
- `npx playwright test`.
- Revisión visual en escritorio, tablet (900 px) y móvil (375 px).
