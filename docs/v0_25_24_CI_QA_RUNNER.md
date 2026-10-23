# v0.25.24 — QA de CI en una sola compilación

Fase 4 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`).

## Problema

El workflow de despliegue tenía 29 pasos de QA. Cada uno ejecutaba `vite build --ssr` para su propio script, y cada `npm run` arrancaba un proceso nuevo. Eso alargaba el CI.

## Cambio

- `scripts/runQaSuite.mjs`: compila los 29 scripts en una sola pasada de Vite (`build` de la API, con varias entradas) y los ejecuta en secuencia. Cada script es el mismo fichero de antes.
- `package.json`: `qa:ci` ejecuta el runner.
- `.github/workflows/deploy.yml`: los 29 pasos se sustituyen por "Run QA suite" (`npm run qa:ci`), en el mismo sitio.
- 14 QA (`scripts/qa*.ts`) comprobaban por texto que su paso estaba en `deploy.yml`. Ahora comprueban que su script está registrado en `runQaSuite.mjs`, y que el workflow ejecuta `qa:ci` antes del build.

## Qué no cambia

- Los QA que corren en CI son los mismos 29. Ninguno se ha eliminado.
- Los scripts `qa:*` de `package.json` siguen existiendo para ejecutarlos uno a uno.

## Pendiente (decisión tuya)

Hay 14 scripts `qa:*` de `package.json` que no están en CI, entre ellos `qa:version`, `qa:global-ranking`, `qa:team-power` o `qa:season-luck-wheel`. Se podrían añadir al runner, pero eso puede hacer fallar CI por comprobaciones que hoy no se ejecutan. Lo dejo fuera de esta fase.

## Validación

- Paridad: las 166 líneas de comprobación (`✓`) son idénticas antes y después, ordenadas.
- Línea base: los 29 QA por separado, 38 s en local, sin fallos.
- Con el runner: 1 s, sin fallos.
- Prueba negativa: quitar `qaEuropeanBalance` del runner hace fallar `qa:european-balance` con el mensaje "runQaSuite debe ejecutar qaEuropeanBalance."
- `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci`, y los 14 QA adaptados.
