# v0.25.2 — P1 Low Cost

Primer bloque del informe por roles (`docs/INFORME_ROLES_v0_25_1.md`): los cambios de prioridad P1 que no requieren rediseño. No cambia gameplay, balance, simulación, reparto europeo, premios ni la fórmula del ranking.

## Cambios

- **Idioma:** `index.html` declara `lang="es"`. Antes `lang="en"`, lo que afectaba a lectores de pantalla, traducción automática y SEO.
- **Vista previa en redes:** Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) y Twitter Cards con imagen de 1200×630 (`public/og-image.png`). La imagen es una vista previa neutra de franjas de color; no usa escudo, logos ni texto del club.
- **Dependabot:** actualizaciones semanales de npm (agrupadas en minor y patch) y de GitHub Actions (`.github/dependabot.yml`).
- **Privacidad:** `public/privacidad.html` describe qué se guarda en el navegador, qué se envía al ranking global, qué no se hace (analítica, cookies propias, publicidad) y cómo pedir la retirada de una entrada. Enlazada desde el ranking global.
- **Foco visible:** `:focus-visible` global en `src/index.css` con contorno dorado de 3 px y halo oscuro, para que se vea sobre fondos claros y oscuros.
- **Moderación del ranking global:** nueva columna `oculto` al final de `HEADERS` en `apps-script/globalRankingBackend.gs`. Las filas con `SÍ`, `TRUE` o `1` en esa columna se excluyen de la lectura del ranking sin borrar sus datos. Las filas vacías y las filas antiguas siguen visibles.

## Paso manual (propietario)

El backend lo despliega el propietario en Google Apps Script. Para activar la columna `oculto`:

1. Abre el proyecto de Apps Script del ranking y sustituye el contenido de `globalRankingBackend.gs` por la versión de este repositorio.
2. Despliega una nueva versión de la aplicación web, con el mismo endpoint (`/exec`).
3. La primera escritura o lectura reescribe la fila de cabeceras y añade `oculto`. No hace falta migrar filas: las antiguas quedan visibles.
4. Para ocultar una entrada, escribe `SÍ` en su columna `oculto` de la hoja.

El cliente no cambia: la URL del endpoint y el formato de respuesta siguen igual.

## Validación

- `qa:p1-low-cost` pasa.
- `qa:global-ranking-backend-migration` y `qa:global-ranking-europa-fields` pasan con la columna nueva.
- `node --check` sobre el script de Apps Script (sintaxis válida).
- `typecheck`, `lint` y `qa:tech-debt` completo pasan con `VITE_GLOBAL_RANKING_ENDPOINT=""`.

## Pendiente

- Imagen de vista previa con el título del juego: se puede preparar cuando haya una tipografía elegida.
- Revisión de la nota de privacidad por el propietario antes de darla por definitiva.
