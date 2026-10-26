# v0.25.43 — Imagen de vista previa neutra

## Problema

La vista previa de los enlaces (WhatsApp y otras apps) usaba `public/og-image.png`, un fondo de franjas rojas y negras de la versión 0.25.2. No mostraba nada del juego y tenía el estilo visual de un club concreto.

## Cambio

- `public/og-image.png`: imagen nueva de 1200×630, creada desde HTML y renderizada con Playwright. Muestra el nombre "Futbol11", un texto breve y un campo dibujado con una alineación 4-3-3 en dorado. No tiene escudos, colores de equipo ni el nombre del club.
- No cambian `og:image` ni `twitter:image` en `index.html`; siguen apuntando al mismo fichero.

## Lo que no cubre

- El título y la descripción de `index.html` siguen usando "Athletic Club". Dependen de la decisión de la fase 16 (marca y monetización).
- Las apps que guardan la vista previa en caché pueden seguir mostrando la imagen antigua hasta que la actualicen.

## Validación

- `npm run qa:ci`: 30 scripts en verde, incluido `qaP1LowCost`, que comprueba que el PNG mide 1200×630.
- `npm test`: 99/99.
