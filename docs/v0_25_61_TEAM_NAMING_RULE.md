# v0.25.61 — Regla de nombres del equipo en los textos

## Problema

En la interfaz se mezclaban cuatro nombres:

- "Once Histórico" para la marca;
- "Athletic Club Histórico" para el equipo;
- "Tu equipo" en algunos textos de estado;
- "el Athletic" en narrativa, objetivos y estados.

Un mismo tipo de texto podía usar cualquiera de ellos. Por ejemplo, la tarjeta de clasificación europea decía "Tu equipo jugará…", mientras que la previa del partido europeo decía "El Athletic jugará…".

## Decisión

Es la prioridad 7 del análisis por roles. El usuario eligió la regla mixta.

## Regla

| Tipo de texto | Nombre | Ejemplos |
|---|---|---|
| Titulares, marcadores y tablas | "Athletic Club Histórico" (`USER_TEAM_NAME`) | Resumen del equipo, estadísticas de liga, marcador de la previa europea, clasificaciones |
| Estado y objetivos | "Tu equipo" | "Tu equipo lidera la Liga.", "Objetivo cerrado: tu equipo está eliminado de Europa." |
| Narrativa | "el Athletic" (se permite) | Ruleta ("La suerte sonríe al Athletic"), crónica europea ("El Athletic ha conquistado Europa"), etiquetas de época ("Athletic clásico") |

Fuera de la regla:

- **Marca y textos para compartir:** "Once Histórico", "Mi Athletic Histórico" y "¿Serías capaz de crear un Athletic mejor?".
- **Etiqueta de modo:** "Carrera Athletic · temporada".
- **Nota legal de la portada:** nombra al Athletic Club real.
- **Panel interno de auditoría de balance.**
- **Mensajes de error internos.**

## Cambio

| Archivo | Antes | Después |
|---|---|---|
| `src/simulation/leagueSimulator.ts` (diagnóstico de Liga, 5 textos) | "El Athletic Club Histórico lidera la Liga." … | "Tu equipo lidera la Liga." … |
| `src/career/supercopaRules.ts` (motivo, 2 textos) | "Athletic clasificado para Supercopa…" / "Athletic no juega Supercopa…" | "Tu equipo se clasifica para la Supercopa…" / "Tu equipo no juega la Supercopa…" |
| `src/components/EuropeanMatchEvent.tsx` | "El Athletic jugará como local/visitante" | "Tu equipo jugará como local/visitante" |
| `src/components/EuropeanMatchEvent.tsx` | "Victoria: Athletic a la final europea" | "Victoria: tu equipo pasa a la final europea" |
| `src/components/EuropeanMatchEvent.tsx` (marcador de la previa) | "Athletic Club" | `USER_TEAM_NAME` ("Athletic Club Histórico") |
| `src/components/EuropeanProgressPanel.tsx` | "Objetivo cerrado: el Athletic está eliminado de Europa." | "Objetivo cerrado: tu equipo está eliminado de Europa." |

## Qué no cambia

- **Lógica:** solo cambian textos. Las reglas, los ratings, la simulación y el balance siguen igual.
- **Narrativa:** la de la ruleta y de Europa se queda como estaba.

## Validación

- `npm run typecheck` y `npx eslint src scripts` sin errores.
- `npm test`, `npm run qa:ci` y `npx playwright test` en verde.
- Captura de la previa europea con el nombre largo en el marcador.
