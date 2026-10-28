# Roadmap de aplicación — Auditoría v0.25.22

Plan para aplicar todos los puntos de `docs/INFORME_AUDITORIA_ROLES_v0_25_22.md`. Cada fase es un PR con su versión, changelog y documento de fase, siguiendo el flujo del proyecto: rama → PR → CI en verde → confirmación tuya → fusión → etiqueta solo si la pides.

Leyenda de bloqueos:
- **[TÚ]** necesita una acción tuya fuera del código.
- **[DECISIÓN]** necesita tu decisión de balance, producto o marca antes de implementar.
- **[AUTO]** lo puedo hacer yo solo con las pruebas existentes.

---

## Ola 1 — Correcciones de bajo coste (ya)

### Fase 1 · v0.25.23 — Texto de carrera (hecha)
- **Qué:** texto "Carrera" en vez de "Partida rápida" en la pantalla de liga (`LeagueSimulatorView.tsx`). El foco visible ya era global desde v0.25.2, así que no hace falta cambiarlo.
- **Archivos:** `src/components/LeagueSimulatorView.tsx`, `src/App.css`, `tests/e2e/career-league-copy.spec.ts`.
- **Riesgo:** bajo. No toca lógica.
- **Cierre:** typecheck, lint, unitarias, QA de portada, Playwright con la nueva prueba, revisión visual en escritorio y móvil.
- **Bloqueos:** [AUTO].

### Fase 2 · Spike — Prueba intermitente `career-full-flow`
- **Qué:** reproducir el fallo ejecutando la suite completa varias veces, revisar la traza y eliminar esperas fijas. No es una versión; si hay cambio de código, va en la fase siguiente que lo toque.
- **Cierre:** 10 ejecuciones completas seguidas sin fallo, o causa identificada y documentada.
- **Bloqueos:** [AUTO].

### Fase 3 · Dependabot #33 (menores y parches)
- **Qué:** revisar el PR agrupado de 9 actualizaciones menores y de parche con CI en verde. No es una versión de juego.
- **Cierre:** CI en verde y fusión con tu confirmación.
- **Bloqueos:** [TÚ] confirmar la fusión ("fusiona el #33").

---

## Ola 2 — Base de trabajo y medición

### Fase 4 · v0.25.24 — Consolidar los QA de CI en un solo runner
- **Qué:** un único script que compila una vez y ejecuta los 43 QA de texto y de comportamiento. Conserva todas las comprobaciones: el número de pruebas que pasan debe ser el mismo antes y después.
- **Archivos:** `package.json`, `.github/workflows/deploy.yml`, scripts `qa*` (sin cambiar su contenido).
- **Riesgo:** medio. Un QA omitido sin darse cuenta. Se mitiga con un recuento antes y después.
- **Cierre:** mismo número de QA ejecutados, CI más corto y registro del tiempo antes y después.
- **Bloqueos:** [AUTO].

### Fase 5 · v0.25.25 — Versión en una sola fuente
- **Qué:** `APP_VERSION` y la versión de los QA se derivan de `package.json` en build. Reduce los fallos de versión que se han repetido.
- **Archivos:** `src/config/appVersion.ts`, `vite.config.ts`, `scripts/qa*` (versión).
- **Dependencia:** fase 4 (los QA ya están consolidados).
- **Cierre:** `qa:version` pasa sin editar 8 archivos en una subida de versión; prueba de que un cambio en `package.json` se refleja en la app.
- **Bloqueos:** [AUTO].

### Fase 6 · v0.25.26 — Analítica de crecimiento
- **Qué:** tres eventos sin propiedades: `global_ranking_submit`, `challenge_copy` y `challenge_open`. Actualizar la nota de privacidad en el mismo PR (sección "Medición de uso"). Ver `docs/PRIVACIDAD_REVISION_PROPUESTA.md`.
- **Archivos:** `src/services/analytics.ts` (sin cambios), componentes de envío y reto, `public/privacidad.html`, `scripts/qaP1LowCost.ts` (texto de la nota).
- **Riesgo:** bajo técnico; alto de cumplimiento si la nota no coincide con los eventos. Por eso la nota va en el mismo PR.
- **Bloqueos:** [TÚ] confirmar antes que las visitas de GoatCounter ya llegan al panel (fase 0 pendiente). Si no llegan, no tiene sentido añadir eventos.

---

## Ola 3 — Backend y reglas

### Fase 7 · v0.25.27 — Backend: plausibilidad, errores y caché
- **Qué:**
  1. Comprobaciones de plausibilidad en `normalizePayload_`: el palmarés no puede superar lo que permiten las temporadas declaradas (un título de Liga por temporada como máximo, etc.).
  2. Mensaje de error genérico al cliente y registro interno con `console.error`.
  3. Caché del top con `CacheService` durante unos minutos.
- **Archivos:** `apps-script/globalRankingBackend.gs`, `scripts/qaGlobalRankingBackendMigration.ts` y QA relacionados.
- **Riesgo:** medio. Las entradas ya publicadas no se deben invalidar: la plausibilidad solo aplica a envíos nuevos.
- **Cierre:** QA de backend en verde, prueba con payloads inválidos, y prueba del top con caché.
- **Bloqueos:** [TÚ] redesplegar Apps Script tras fusionar (y la columna `oculto` si aún no está).

### Fase 8 · v0.25.28 — Textos de juego: plaza de Copa y motivo de temporada
- **Qué:**
  1. Frase en "Cómo funciona" sobre la reasignación de la plaza de Copa.
  2. Motivo principal al final de temporada (objetivo fallido o descenso).
- **Archivos:** `src/components/GameHome.tsx` (o su config), `src/components/CareerSeasonOutcome.tsx`, `FinalSummary.tsx` si aplica.
- **Riesgo:** bajo si es solo texto; revisar contra las reglas de `src/europe/europeanQualification.ts` antes de escribir.
- **Bloqueos:** [TÚ] revisar el texto final de la regla de Copa.

### Fase 9 · Decisión de balance — tope de progresión y `getCupDifficultyBonus`
- **Qué:** tras jugar una carrera de diez temporadas (ver fase 0), decidir: (a) mantener la curva, (b) bajar el tope de +10, o (c) cambiar la pendiente. Y decidir si `getCupDifficultyBonus` se conecta o se elimina.
- **Archivos (si se aprueba un cambio):** `src/career/careerRules.ts`, `tests/unit/careerRivalProgression.test.ts`.
- **Riesgo:** alto. Cambia el balance de la liga en modo carrera.
- **Bloqueos:** [DECISIÓN] [TÚ] informe de la carrera de prueba y aprobación explícita del ajuste.

---

## Ola 4 — Frontend y experiencia

### Fase 10 · v0.25.29 — Carga diferida de pantallas pesadas
- **Qué:** `React.lazy` para `LeagueSimulatorView`, `FinalSummary` y la UI europea. Objetivo: reducir el bundle inicial de 498 kB de forma medible.
- **Archivos:** `src/App.tsx` (imports), `vite.config.ts` si hace falta.
- **Riesgo:** bajo-medio. Requiere `Suspense` con un estado de carga que no rompa las pruebas de carrera.
- **Cierre:** bundle inicial medido antes y después, Playwright completo en verde.
- **Bloqueos:** [AUTO].

### Fase 11 · v0.25.30 — Accesibilidad y UX de fases
- **Qué:**
  1. Indicador de desplazamiento en la barra de fases móvil.
  2. Foco inicial y orden de tabulación en la ruleta y la tarjeta europea.
  3. Barra de fases en escritorio sin partir en dos filas.
- **Dependencia:** fase 1 (foco global).
- **Archivos:** `src/components/PhaseProgress.tsx` y `.css`, componentes modales.
- **Cierre:** revisión con teclado completa del flujo de temporada, capturas en 375 px y 1280 px.
- **Bloqueos:** [AUTO].

### Fase 12 · v0.25.31 — Fondo y pantalla de carrera
- **Qué:** reutilizar `home-stadium.svg` en la pantalla de entrada a la carrera, con el mismo velo.
- **Archivos:** `src/App.css` (`.career-preview-screen`).
- **Riesgo:** bajo.
- **Bloqueos:** [AUTO].

### Fase 13 · v0.25.32 — Refactor de `App.tsx` por dominios
- **Qué:** extraer hooks: `useCareer`, `useSavedGame`, `useLuckWheel`. Un hook por versión, cada uno con las pruebas de carrera completa en verde.
- **Dependencias:** fase 10 y fase 11 cerradas; fase 2 resuelta (si no, el refactor esconde o empeora la intermitencia).
- **Riesgo:** alto. Es el archivo más sensible del proyecto. Sin cambio de comportamiento.
- **Cierre:** cada hook extraído en su PR, con QA y e2e verdes y diff que solo mueve código.
- **Bloqueos:** [AUTO], con revisión tuya de cada PR.

---

## Ola 5 — Producto, marca y crecimiento

### Fase 14 · v0.25.33 — Instalable en móvil (PWA mínima)
- **Qué:** `manifest.webmanifest` con iconos PNG 192 y 512 (normales y maskable), generados desde `favicon.svg`.
- **Archivos:** `public/manifest.webmanifest`, `public/icon-192.png`, `public/icon-512.png`, `index.html`.
- **Riesgo:** bajo. Sin service worker en esta fase (no hay modo offline).
- **Cierre:** Lighthouse o inspección del manifiesto en Chrome; instalación en móvil.
- **Bloqueos:** [TÚ] confirmar que no quieres service worker todavía.

### Fase 15 · v0.25.34 — Imagen y textos para compartir
- **Qué:** imagen de vista previa de una temporada superada (puntos, palmarés y clasificación) y textos de compartir según contexto: portada, reto y fin de carrera.
- **Dependencia:** fase 6 (eventos de compartir medidos).
- **Riesgo:** medio. Generación de imagen; el texto no puede incluir datos personales.
- **Bloqueos:** [AUTO].

### Fase 16 · Decisión de marca y monetización
- **Qué:** revisar el uso del nombre "Athletic Club" y de elementos de marca de terceros, con asesoría. Sin código hasta tener la decisión.
- **Bloqueos:** [DECISIÓN] [TÚ] asesoría jurídica. Ningún cambio de código hasta entonces.

### Fase 17 · Ranking semanal (opcional)
- **Qué:** ranking semanal con reinicio, sin tocar el histórico.
- **Bloqueos:** [DECISIÓN] [TÚ] decidir si se quiere. Implica cambios en el backend y en la nota de privacidad.

---

## Ola 6 — Dependencias mayores (una fase por PR)

Cada salto mayor va en su propia fase, con CI en verde antes de fusionar. No se mezclan.

| Fase | PR | Riesgo | Validación |
|---|---|---|---|
| 18 · v0.25.35 | #34 TypeScript 6→7 | Alto: puede romper el typecheck y el build | `npm run typecheck`, build, todos los QA |
| 19 · v0.25.36 | #35 `@types/node` 24→26 | Medio | typecheck, build, Playwright |
| 20 · v0.25.37 | #32 `actions/checkout` 4→7 | Medio: afecta a todo el pipeline | CI completo y despliegue de prueba |
| 21 · v0.25.38 | #31 `upload-pages-artifact` 3→5 | Medio: despliegue | Despliegue en GitHub Pages y comprobación de la web publicada |
| 22 · v0.25.39 | #30 `deploy-pages` 4→5 | Medio: despliegue | Igual que la fase 21 |

- **Bloqueos:** [TÚ] confirmar cada fusión. Para las fases 20–22, comprobar que la web publicada sigue funcionando tras el despliegue.

---

## Fase 0 — Acciones tuyas, en paralelo y sin código

Estas acciones bloquean fases concretas, pero no requieren código:

1. **GoatCounter:** comprobar desde un móvil con datos que llegan visitas al panel. Bloquea la fase 6.
2. **Apps Script:** redesplegar `apps-script/globalRankingBackend.gs` (columna `oculto`). Bloquea la fase 7.
3. **Carrera de prueba de diez temporadas:** jugarla y describir el ritmo de los rivales. Bloquea la fase 9.
4. **Texto de la regla de Copa:** revisar la frase antes de la fase 8.
5. **Service worker:** decidir si el juego debe funcionar sin conexión. Bloquea la fase 14.

---

## Resumen de dependencias

```
Ola 1:  F1 (texto + foco)   F2 (spike)   F3 (Dependabot #33)
           │                   │
Ola 2:  F4 (QA runner) ── F5 (versión)        F6 (analítica) ← [TÚ] GoatCounter
                                  │
Ola 3:  F7 (backend) ← [TÚ] redespliegue     F8 (textos de juego) ← [TÚ] regla Copa
        F9 (balance) ← [TÚ] carrera de 10 temporadas y aprobación
           │
Ola 4:  F10 (lazy) ── F11 (UX fases) ── F12 (fondo carrera) ── F13 (refactor App)
Ola 5:  F14 (PWA) ── F15 (compartir) ── F16 (marca) ── F17 (ranking semanal)
Ola 6:  F18–F22 (dependencias mayores, una por PR)
```

## Criterios generales para cada fase

- Rama nueva desde `main`, con commit y PR en español.
- Versión, CHANGELOG y documento de fase, según el patrón del proyecto.
- Ficheros explícitos al commitear (nunca comodines). `dist/` no se commitea.
- Pruebas: typecheck, lint, unitarias, QA afectados, Playwright completo y revisión visual si hay cambio de interfaz.
- Ningún cambio de balance, ratings, probabilidades o reglas sin aprobación explícita (fases 9 y 16).
- Fusión solo cuando CI esté en verde y tú lo pidas. Etiqueta solo cuando la pidas.

## Orden sugerido para empezar

1. Fase 1 (texto de carrera y foco): cambio pequeño, valor inmediato.
2. Fase 2 (spike) y fase 3 (Dependabot #33) en paralelo.
3. Fase 0.1 (GoatCounter) mientras tanto: decide si la fase 6 va.
4. Fase 4 (QA runner): reduce el coste de todas las fases siguientes.

## Hallazgos cerrados

### Semillas que pierden en la primera temporada (cerrado: comportamiento esperado)

- **Qué:** 4 de 30 semillas (7, 8, 10 y 22) pierden en 2028/29 con los topes +3 y +2, y no dependen de la progresión de rivales.
- **Causa:** la posición en Liga de la primera temporada cae fuera de la plaza europea (13.º, 8.º, 8.º y 7.º sin campeón de Copa entre los seis primeros). En las 30 semillas, 26 terminan dentro de zona europea.
- **Fuerza inicial:** el equipo de prueba tiene valoración 91, empata en primer puesto de la Liga y supera a 17 de 19 rivales (media 80,4).
- **Decisión:** no se cambia el balance de Liga, que está cerrado. Cambiarlo requeriría aprobación explícita.
