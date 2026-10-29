# v0.25.73 — Copia de la web en Cloudflare Pages

## Petición

Alojar la web en un dominio gratuito. Opción elegida: Cloudflare Pages, con una dirección `nombre.pages.dev` sin la carpeta `/11Historico/`.

## Decisión

- **Mismo build que GitHub Pages:** Cloudflare no compila por su cuenta. El job `deploy-cloudflare` descarga el `dist` que ya generó el job `build` (typecheck, QA, lint, unitarias y Playwright) y lo sube con `wrangler pages deploy`. Así el ranking global y la analítica usan las mismas variables de repositorio y no hay que duplicarlas en Cloudflare.
- **Solo `main` publica**, igual que GitHub Pages. Los PR no despliegan.
- **GitHub Pages sigue activo.** Las dos direcciones sirven la misma versión.
- **Desactivado hasta configurarlo:** el job solo se ejecuta si existe la variable de repositorio `CLOUDFLARE_PAGES_PROJECT`.

## Cambio

- **`.github/workflows/deploy.yml`:** nuevo job `deploy-cloudflare` (`needs: build`), con `actions/download-artifact@v8` y `wrangler@4`.

## Configuración (la hace el usuario)

1. **Cuenta:** crear una cuenta gratuita en Cloudflare.
2. **Proyecto:** en Workers & Pages, Create → Pages → «Use direct upload» (o «Upload assets»). El nombre del proyecto es la dirección: `once-historico` da `once-historico.pages.dev`, si está libre. Si pide subir algo para crearlo, se puede subir cualquier carpeta; el workflow la sustituye en el primer despliegue.
3. **Token:** en My Profile → API Tokens → Create Token, plantilla «Edit Cloudflare Workers» o un token personalizado con el permiso Account · Cloudflare Pages · Edit.
4. **ID de cuenta:** se ve en la página de inicio de la cuenta (Account ID).
5. **En GitHub,** Settings → Secrets and variables → Actions:
   - Secret `CLOUDFLARE_API_TOKEN`: el token.
   - Secret `CLOUDFLARE_ACCOUNT_ID`: el ID de cuenta.
   - Variable `CLOUDFLARE_PAGES_PROJECT`: el nombre del proyecto (por ejemplo `once-historico`).
6. **Primer despliegue:** relanzar el workflow en `main` (Actions → Deploy → Run workflow) o fusionar el siguiente PR.

## Pendiente tras configurarlo

- **Dirección principal:** cambiar a la nueva dirección las URL fijas: `index.html` (Open Graph), `PUBLIC_GAME_URL` en `src/components/GameHome.tsx`, el pie de la imagen en `src/career/shareCard.ts` y el README. Va en una fase aparte, cuando la dirección esté confirmada.
- **Partidas guardadas:** se guardan en el navegador, por dirección. Una carrera empezada en `ikeritu.github.io` no aparece en `pages.dev`, y al revés. Lo mismo con el ranking local.

## Qué no cambia

El juego, GitHub Pages, el ranking global y la analítica.

## Validación

- `npm run typecheck` y `npx eslint src scripts` sin errores.
- `npm test` y `npm run qa:ci` en verde.
- CI del PR: el job `deploy-cloudflare` se omite en los PR.
