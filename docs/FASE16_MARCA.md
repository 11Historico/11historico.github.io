# Fase 16 — Marca y uso del nombre del club

Documento de trabajo para la asesoría jurídica. Resume qué referencias al club hay en el proyecto, qué se ha cambiado, qué búsquedas de marcas se han hecho y qué preguntas quedan abiertas. No es un dictamen legal.

## 1. Estado de la decisión

- **Marca del producto:** "Once Histórico" (v0.25.44). Sustituye a "Futbol11" y a "Athletic Club Histórico" en título, metadatos, manifiesto, privacidad, imagen para compartir y portada.
- **Equipo del usuario dentro del juego:** "Athletic Club Histórico" otra vez desde v0.25.47. La versión 0.25.45 lo cambió a "Once Histórico" y la 0.25.47 lo revierte, por decisión del usuario. Con el nombre del club vuelve la camiseta roja y blanca, que es la equipación del club real. Esto reabre el punto de imagen de esta fase y debe revisarlo la asesoría.
- **Nota de no afiliación** en el pie de la portada y en la página de privacidad (v0.25.46). Texto: "Proyecto de aficionados. No está afiliado ni respaldado por el Athletic Club, LaLiga, la RFEF ni la UEFA."
- **Opción elegida:** A. Mantener las referencias históricas al club con la nota de no afiliación.

## 2. Referencias al club que se mantienen

- **Nombres de época del club real:** "Athletic clásico", "Athletic moderno", "Athletic actual" (`src/components/SeasonReveal.tsx`).
- **Nombre del club en la revelación de temporada:** "Athletic Club" (`src/components/SeasonReveal.tsx`).
- **Portada:** "temporadas reales de la historia del club" (ya sin el nombre del club).
- **Datos reales** en `src/data/`:
  - Plantillas y temporadas del Athletic, con nombres reales de jugadores y entrenadores (`src/data/athletic/`, `src/data/athleticSeasons.ts`).
  - Rivales reales de la Liga 25/26 y calendario (`src/data/laliga2526Teams.ts`, `src/data/laliga2526Calendar.ts`).
  - Fuentes citadas (`src/data/sources.ts`): oficial del club, ESPN, Transfermarkt, BDFutbol y worldfootball.net.
- **Panel de auditoría de balance** (`src/components/BalanceAuditPanel.tsx`): herramienta de desarrollo con etiquetas "Athletic".

## 3. Búsquedas de marcas (orientativas)

Hechas con búsqueda web. No se ha consultado directamente la base de datos de OEPM ni la de EUIPO. Hay que confirmar todo en las bases oficiales.

| Nombre | Hallazgo | Fuente |
|---|---|---|
| ATHLETIC CLUB BILBAO (OEPM) | Dos marcas mixtas: M-0779606 (clase 34, figura vigente) y M-0779591 (clase 18). El titular que aparece en el agregador parece ser una persona física; hay que verificar la titularidad. | [empresia, M-0779606](https://www.empresia.es/distintivo/athletic-club-bilbao/oepm/m-0779606/), [empresia, M-0779591](https://www.empresia.es/distintivo/athletic-club-bilbao/oepm/m-0779591/) |
| Escudo del club | En uso desde 1972, según el club. | [athletic-club.eus, escudo](https://www.athletic-club.eus/club/datos-institucionales/escudo/) |
| ATHLETIC CLUB en EUIPO | No se encontró ningún registro. No descartado. | — |
| CHAMPIONS LEAGUE (UEFA) | Decisión de la OMPI de 2000 sobre una marca internacional de UEFA para productos. Antigua; no confirma el estado actual en EUIPO. | [OMPI, d2000-0710](https://www.wipo.int/amc/en/domains/decisions/html/2000/d2000-0710.html) |
| LaLiga | Solo se encontró el caso "El Clásico": el Tribunal General desestimó el recurso de LaLiga (T-809/19) porque la expresión se lee como rivalidad deportiva. Estado de la marca "LaLiga" no confirmado. | [Cuatrecasas, T-809/19](https://www.cuatrecasas.com/es/spain/articulo/gc-la-liga-red-card-appeal-registering-el-clasico-trademark?lang=en) |

**Punto clave:** no se ha confirmado si las marcas del club cubren la clase 9 (software) ni la clase 41 (entretenimiento y servicios deportivos). Son las clases relevantes para un videojuego. Las dos que aparecen son las clases 18 y 34.

## 4. Riesgos según el análisis previo (orientativo)

- **Marca del club:** riesgo medio. Depende de las clases de registro y de si el nombre aparece como nombre del producto, con escudos o sugiriendo respaldo oficial. Ya no se da ninguno de esos casos en la versión actual, salvo las referencias históricas.
- **Nombres de época:** riesgo bajo. Son etiquetas genéricas.
- **Datos reales:** riesgo medio en la forma de obtención. Los hechos (resultados, fechas, plantillas) no tienen protección por derecho de autor, pero la compilación puede estar protegida por el derecho sui generis de bases de datos (arts. 133 y siguientes del TRLPI). Hay que revisar si la extracción fue masiva y si se respetaron las condiciones de uso de cada fuente.
- **Nombres de jugadores y entrenadores reales:** riesgo bajo-medio. Protección del honor, la intimidad y la propia imagen (Ley Orgánica 1/1982). No hay fotos en el proyecto.
- **Competiciones:** riesgo bajo mientras sean nombres de texto. No se usan logotipos de UEFA ni de LaLiga.
- **Monetización:** el análisis parte de un proyecto sin ánimo de lucro. El botón de apoyo (Ko-fi, PayPal) se trata como donación. Anuncios, pagos o funciones de pago cambian el análisis.

## 5. Preguntas para la asesoría

1. ¿Las marcas de "Athletic Club" en clases 9 y 41 existen y a quién pertenecen?
2. ¿Es suficiente el uso referencial para las plantillas y temporadas reales, con la nota de no afiliación?
3. ¿Cómo afecta el derecho sui generis de bases de datos a los datos de `src/data`, y qué hay que revisar en las condiciones de uso de Transfermarkt, BDFutbol y worldfootball.net?
4. ¿Hay riesgo con los nombres reales de jugadores y entrenadores si no hay imágenes y las notas son deportivas?
5. ¿Qué cambios de monetización reabrirían el análisis?
6. ¿La nota de no afiliación actual es suficiente, o recomiendan otra redacción?

## 6. Pasos para comprobar antes de la reunión

- [ ] Buscar "ATHLETIC CLUB" en la [consulta de OEPM](https://consultas2.oepm.es/), filtrando por titular y por clases 9 y 41.
- [ ] Buscar "ATHLETIC CLUB", "CHAMPIONS LEAGUE" y "LALIGA" en [eSearch de EUIPO](https://euipo.europa.eu/eSearch/), con las mismas clases.
- [ ] Revisar `src/data/sources.ts` y anotar cómo se obtuvo cada conjunto de datos (manual o extraído).
- [ ] Revisar las condiciones de uso de las fuentes citadas.
- [ ] Confirmar la monetización prevista.
