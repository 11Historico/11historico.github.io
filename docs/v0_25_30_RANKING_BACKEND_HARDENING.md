# v0.25.30 — Ranking global: plausibilidad, errores y caché

Fase 7 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`).

## Problemas

- El servidor recalcula la puntuación, pero a partir de números que manda el cliente. Un envío podía declarar cualquier palmarés sin coherencia con las temporadas.
- Los errores internos devolvían el mensaje técnico al cliente.
- Cada consulta del top leía la hoja entera.

## Cambios

`apps-script/globalRankingBackend.gs`:

- `checkTrophyPlausibility_`: como mucho un título de cada competición nacional por temporada (Liga, Copa, Supercopa) y un único torneo europeo (Champions, Europa League o Conference). Se admite una temporada extra, la de Game Over. Ejemplo: con 3 temporadas superadas, hasta 4 títulos de cada tipo.
- Los errores de validación se devuelven con `status: "invalid_payload"` y su mensaje. El cliente ya lo trata (`src/services/globalRankingService.ts`).
- `toErrorResponse_`: registra el error con `console.error` y devuelve un mensaje genérico.
- `getCachedTopEntries_`: caché de script de 300 s para el top de 100 entradas. Se borra al enviar una carrera nueva. Si el valor no cabe en la caché, se sirve sin ella.

`scripts/qaGlobalRankingPlausibility.ts`: extrae la función del `.gs` y la prueba en Node con casos límite. Está en el runner de CI.

## Lo que no cambia

- Formato de envío y de respuesta del top.
- Los QA de backend existentes siguen comprobando las mismas cadenas.

## Despliegue (tuyo)

1. Abre el proyecto de Apps Script del ranking.
2. Pega el contenido de `apps-script/globalRankingBackend.gs`.
3. Implementar → Gestionar implementaciones → editar la implementación activa → Versión: nueva versión → Implementar.

La URL del endpoint no cambia.

## Limitaciones

- Un envío con palmarés coherente pero falso sigue siendo aceptado. La plausibilidad reduce los casos imposibles, no garantiza que la carrera exista.
- Si moderas una fila editando la hoja (columna `oculto`), el top puede seguir mostrándola hasta 5 minutos.

## Validación

- `qaGlobalRankingPlausibility`: 8 casos límite en verde.
- `apps-script/globalRankingBackend.gs` se comprueba como JavaScript válido.
- `npm run qa:ci` (30 QA) y `npm run qa:tech-debt` en verde.
- `npm run typecheck`, `npx eslint src scripts`, `npm test` (73 pruebas).
