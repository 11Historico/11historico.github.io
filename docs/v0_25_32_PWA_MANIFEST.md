# v0.25.32 — Instalable en el móvil (manifiesto web)

Fase 14 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`), sin service worker.

## Cambios

- `public/manifest.webmanifest`: nombre, `display: standalone`, colores `#16070b` y `#b00020`, y dos iconos PNG (192 y 512), con `purpose: any maskable`. El dibujo cabe en la zona segura de un icono adaptable.
- `public/app-icon.svg`: icono original (pelota sobre fondo oscuro). Los PNG se generaron desde este SVG.
- `index.html`: `<link rel="manifest">`, `<meta name="theme-color">` y `<link rel="apple-touch-icon">`.
- `scripts/qaPublicReleaseUx.ts`: comprueba que el manifiesto está enlazado y que lista los dos iconos.

## Supuesto

No hay service worker, porque el juego depende de la conexión (ranking global y analítica). Sin él:

- Android (Chrome): "Añadir a la pantalla de inicio" funciona desde el menú.
- iOS (Safari): "Añadir a inicio" usa `apple-touch-icon`.
- El aviso automático de instalación de Chrome puede no aparecer, porque suele requerir un service worker.

Si quieres un modo sin conexión, sería una fase aparte con su propio diseño de caché.

## Validación

- `npm run typecheck`, `npx eslint src scripts`, `npm test` (73 pruebas).
- `npm run qa:tech-debt` en verde (build sin endpoint local).
- `npx playwright test`: 7 pruebas en verde.
- Comprobación en el navegador: el manifiesto y los dos iconos responden con 200 desde la build de preview.

## Pendiente

- Probar la instalación en un móvil real.
