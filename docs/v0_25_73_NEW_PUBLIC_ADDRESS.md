# v0.25.73 — Nueva dirección: 11historico.github.io

## Petición

Que la dirección de la web no lleve el usuario de GitHub (`ikeritu.github.io/11Historico/`).

## Decisión

Organización gratuita de GitHub en lugar de otro alojamiento. Se descartó Cloudflare Pages (PR #114, cerrado), porque necesitaba otra cuenta, un token y un segundo despliegue.

## Pasos fuera del código

- El usuario creó la organización `11Historico`, con su pertenencia privada, y le transfirió el repositorio.
- El repositorio se renombró a `11historico.github.io`, así que GitHub Pages lo publica en la raíz: `https://11historico.github.io/`.
- Se comprobó que Pages sigue con GitHub Actions y que se conservan las variables `VITE_GLOBAL_RANKING_ENDPOINT` y `VITE_ANALYTICS_HOST`.
- La copia local apunta al repositorio nuevo: `git remote set-url origin https://github.com/11Historico/11historico.github.io.git`.

## Cambio

- **`index.html`:** `og:url`, `og:image` y `twitter:image`.
- **`src/components/GameHome.tsx`:** `PUBLIC_GAME_URL`.
- **`src/career/shareCard.ts`:** pie de la imagen para compartir.
- **`README.md`:** enlace online.
- **`public/privacidad.html`:** el responsable aparece como el autor a través de la organización `11Historico`, con enlace al repositorio nuevo. El correo de contacto no cambia.
- **`tests/unit/challengeLink.test.ts`:** dirección base del enlace de reto.

`vite.config.ts` ya usaba `base: './'`, así que la web funciona en la raíz sin más cambios.

## Avisos

- **Dirección antigua:** `ikeritu.github.io/11Historico/` da 404. GitHub no redirige las direcciones de Pages tras una transferencia.
- **Partidas guardadas:** se guardan en el navegador, por dirección. Las carreras y el ranking local de la dirección antigua no pasan a la nueva.
- **Datos que siguen visibles:** el correo de contacto de la página de privacidad y el enlace de PayPal del botón de apoyo.

## Qué no cambia

El juego, el ranking global, la analítica y el despliegue.

## Validación

- `npm run typecheck` y `npx eslint src scripts` sin errores.
- `npm test` y `npm run qa:ci` en verde.
- `npx playwright test`: 15 tests en verde y 2 saltados.
