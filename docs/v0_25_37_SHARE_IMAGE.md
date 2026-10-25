# v0.25.37 — Imagen para compartir la carrera (fase 15)

Fase 15 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`). Depende de la fase 6, ya fusionada.

## Decisiones de producto

- **Contenido:** temporadas superadas, puntos, palmarés, mejor posición en Liga, última temporada y mejor hito europeo. Son los mismos datos que el texto de compartir que ya existía.
- **Sin datos personales:** no incluye el nick ni identificadores de partida. El fichero se llama `futbol11-carrera-<temporadas>-temporadas.png`.
- **Sin analítica nueva:** no se añade ningún evento, para no tener que cambiar otra vez la nota de privacidad.

## Cambio

- `src/career/shareCard.ts`: función pura `getShareCardContent` y `getShareCardFileName`.
- `src/career/shareCardImage.ts`: dibuja el PNG en un canvas (1200×630) con la API del navegador. Sin dependencias ni servidor. El titular se reduce de tamaño hasta caber.
- `src/components/CareerSeasonOutcome.tsx`: botón "Compartir imagen". Si el dispositivo permite compartir ficheros, abre la hoja de compartir; si no, descarga el PNG.

## Dos errores que corregí

- El titular de la imagen se salía del canvas. Ahora se reduce el tamaño de letra hasta que cabe.
- La URL del blob se liberaba justo después de disparar la descarga, lo que puede cancelarla en algunos navegadores. Ahora se libera un segundo después.

## Validación

- `tests/unit/shareCard.test.ts`: 5 pruebas (plural y singular, hito europeo, ausencia de nick y nombre del fichero).
- E2E de Game Over: pulsa "Compartir imagen" y comprueba el estado.
- Imagen generada y revisada en una descarga real de prueba.
- `npm run typecheck`, `npx eslint src scripts`, `npm test` (92 pruebas).
- `npm run qa:ci` y `npm run qa:tech-debt` en verde.
- `npx playwright test`: 7 pruebas en verde.

## Pendiente

- Probar en un móvil real que la hoja de compartir aparece y que la imagen se ve bien en WhatsApp u otra app.
