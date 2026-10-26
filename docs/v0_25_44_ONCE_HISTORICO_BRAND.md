# v0.25.44 — Marca del producto: Once Histórico

## Decisión

Tras la fase 16 (marca y monetización), el usuario elige "Once Histórico" como marca visible del producto, en sustitución de "Futbol11" y de "Athletic Club Histórico" en la cabecera del producto. La decisión sobre el uso del nombre del club con asesoría jurídica sigue abierta y no la sustituye.

## Cambio

Solo marca del producto:

- `index.html`: título, `og:title`, `twitter:title`, `og:site_name` y descripción (sin mencionar al club).
- `public/manifest.webmanifest`: `name`, `short_name` y descripción.
- `public/privacidad.html`: título y frase de presentación del proyecto.
- `src/career/shareCard.ts`: pie de la imagen para compartir.
- `src/components/SupportButton.tsx`: texto y etiquetas de apoyo.
- `src/components/GameHome.tsx`: texto superior de la portada y texto para compartir.
- Etiquetas de modo "Modo carrera Athletic" pasan a "Modo carrera" en `App.tsx` y en los componentes de carrera, y en `appVersion.ts`.
- Tests y QA que comprobaban esos textos (`tests/e2e/smoke.spec.ts`, `scripts/qaPublicReleaseUx.ts`).

## Lo que no cambia

- Nombre del equipo del usuario dentro del juego: "Athletic Club Histórico" en `TeamSummary.tsx`, `LeagueSimulatorView.tsx`, `leagueTable.ts` y en los mensajes del simulador. Es una decisión de juego pendiente.
- Datos reales: plantillas, temporadas, rivales de la Liga 25/26, calendario y fuentes (`src/data/*`). Quedan para la asesoría.
- Scripts de auditoría de consola (`scripts/balanceAuditCli.ts`) y la cuenta de pruebas de la QA del ranking.

## Validación

- `npm run typecheck` y `npx eslint src scripts`: sin errores.
- `npm test`: 99/99.
- `npm run qa:ci`: 30 scripts en verde.
- `npx playwright test`: 12/12.
