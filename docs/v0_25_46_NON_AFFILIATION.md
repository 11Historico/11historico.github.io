# v0.25.46 — Nota de no afiliación y frase de portada sin el nombre del club

## Decisión

Tras el análisis legal de la fase 16, el usuario elige la opción A: mantener las referencias históricas al club con una nota explícita de proyecto de aficionados sin afiliación.

## Cambio

- `src/components/GameHome.tsx`:
  - Frase de portada: "temporadas reales del Athletic" pasa a "temporadas reales de la historia del club".
  - Pie de la portada: nota "Proyecto de aficionados. No está afiliado ni respaldado por el Athletic Club, LaLiga, la RFEF ni la UEFA."
- `public/privacidad.html`: el apartado "Responsable" incluye la misma nota.

## Lo que no cambia

- Nombres de época del club real ("Athletic clásico/moderno/actual") y el nombre del club en la revelación de temporada.
- Datos reales de plantillas, temporadas, rivales y calendario (`src/data/*`).
- Nombres de jugadores y entrenadores reales. No hay fotos ni imágenes de personas en el proyecto.
- Escudos y colores: no se usan en el proyecto.

## Pendiente antes de ampliar el alcance

- Buscar en OEPM y EUIPO las marcas del club, de UEFA y de LaLiga.
- Revisar cómo se obtuvieron los datos de `src/data` y las condiciones de uso de cada fuente.
- Revisar cualquier cambio de monetización: si se añaden anuncios o pagos, el análisis de uso referencial hay que repetirlo.

## Validación

- `npm run typecheck` y `npx eslint src scripts`: sin errores.
- `npm test`: 99/99.
- `npm run qa:ci`: 30 scripts en verde.
- `npx playwright test`: 12/12.
- Revisión visual del pie de la portada en escritorio (1280) y móvil (375), sin desbordamiento horizontal.
