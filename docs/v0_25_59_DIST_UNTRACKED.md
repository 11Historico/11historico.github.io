# v0.25.59 — `dist/` fuera de git

## Problema

`dist/` está en `.gitignore`, pero había 5 archivos que se commitearon antes de ignorar la carpeta:

- `dist/index.html`
- `dist/favicon.svg`
- `dist/icons.svg`
- `dist/assets/index-CQPk-EnQ.css`
- `dist/assets/index-DzrXwXqb.js`

Git seguía comparándolos con cada build local. Por eso `git status` mostraba siempre cambios en `dist/` que no se debían commitear (regla de `AGENTS.md`).

## Decisión

Es la prioridad 5 del análisis por roles y el usuario la confirmó.

## Cambio

- `git rm -r --cached dist`: los archivos salen del repositorio pero la copia local se conserva.
- `.gitignore` no se toca, porque ya tenía `dist/`.

## Qué no cambia

- **Web publicada:** el CI ejecuta `npm run build` y publica `dist` en Pages en cada push a `main`.
- **`qaReleaseStabilization`:** sigue revisando `dist` si existe en local y lo omite si no existe.
- **Builds locales:** `npm run build` genera `dist/` igual que antes, pero ya no aparece en `git status`.

## Validación

- `git status -sb` después del cambio: `dist/` ya no aparece tras `npm run build`.
- `npm run qa:ci` en verde.
- CI del PR y despliegue al fusionar.
