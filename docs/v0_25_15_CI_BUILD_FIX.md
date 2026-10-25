# v0.25.15 — Corrección del build de despliegue

## Problema

Desde v0.25.4, `playwright.config.ts` ejecutaba `npm run build` antes de servir `dist/`. En CI eso ocurría después del paso de build del despliegue, así que `dist/` se reconstruía sin las variables de producción (`VITE_GLOBAL_RANKING_ENDPOINT` y `VITE_ANALYTICS_HOST`). El artefacto que se publicaba tenía el endpoint y la analítica vacíos.

Detectado al comprobar la analítica tras fusionar v0.25.14: el log del build tenía el host de GoatCounter, pero el bundle publicado no.

## Solución

- En CI (`CI=1`) el servidor de pruebas solo sirve `dist/`, sin construir.
- En local, sigue construyendo antes de servir, con el endpoint vacío para que las pruebas no dependan del ranking.

## Validación

- Build con `VITE_ANALYTICS_HOST` y `VITE_GLOBAL_RANKING_ENDPOINT` definidos, luego `CI=1 npm run test:e2e`: las 5 pruebas pasan y `dist/` conserva ambos valores.

## Efecto en producción

Los despliegues desde v0.25.4 se publicaron sin el endpoint del ranking global. La siguiente publicación tras fusionar este PR los restaura.
