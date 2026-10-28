# Auditoría por roles — Futbol11 v0.25.22

Auditoría a partir del código y del estado real de `main` (`0b5ac62`, v0.25.22). Sustituye como referencia al informe de v0.25.1 (`docs/INFORME_ROLES_v0_25_1.md`), del que se ha comprobado qué sigue abierto.

Prioridad: **P1** = conviene hacerlo pronto · **P2** = mejora clara · **P3** = después.
Cualquier cambio de balance, rating, probabilidad o regla de competición requiere autorización explícita (`AGENTS.md`).

## Estado frente al informe de v0.25.1

Estado a 25/10/2026 (v0.25.33).

| Punto anterior | Estado hoy |
|---|---|
| `lang="es"` en `index.html` | Hecho |
| Open Graph y Twitter Cards con imagen 1200×630 | Hecho (`og-image.png`) |
| Dependabot (npm y Actions) | Hecho: fusionados #30, #31, #32, #33 y #35. Queda #34 (TypeScript 7), bloqueado porque `typescript-eslint` declara `typescript <6.1.0` |
| Columna `oculto` en la hoja | Hecho en código (v0.25.2). Falta redesplegar Apps Script (pendiente tuyo) |
| Nota de privacidad | Hecha |
| Analítica sin cookies | Hecha con 2 eventos. Pendiente: confirmar visitas en GoatCounter y añadir 3 eventos (fase 6) |
| Vitest para lógica pura | Hecho: 81 pruebas en 13 archivos |
| Playwright en CI | Hecho: 7 pruebas en 5 especificaciones |
| Explicar por qué no hay plaza europea | Hecho (`EuropeanQualificationCard`) |
| Foco visible común | Hecho desde v0.25.2 (`src/index.css`, global) |
| Dividir `App.tsx` | Parcial: 1.705 líneas (antes 1.841). Hechos el guardado (v0.25.29) y las transiciones de la ruleta y del cambio de entrenador (v0.25.33). Quedan más cortes, que necesitan diseño |
| `React.lazy` en carrera y Europa | Hecho en v0.25.26: 11 pantallas en diferido. JS principal de 537 kB a 386 kB |
| Derivar la versión de `package.json` | Hecho en v0.25.25 |
| Regla de reasignación de la plaza de Copa en reglas | Hecho en "Cómo funciona" (v0.25.31) |
| Fondo de estadio 2D | Hecho en la portada (v0.25.18) y en la pantalla de carrera (v0.25.28) |

## Hallazgos de esta auditoría (v0.25.22)

| Hallazgo | Estado hoy |
|---|---|
| Texto "Partida rápida" en la pantalla de liga en carrera | Hecho (v0.25.23) |
| Prueba E2E intermitente `career-full-flow` | Hecho: semilla fija (fase 2, v0.25.26 y PR #65) |
| Prueba E2E `season-challenge` inestable | Hecho (v0.25.27 y PR #65) |
| Consolidar los QA de CI en un solo runner | Hecho (v0.25.24): 30 QA en una compilación |
| Plausibilidad del palmarés en el ranking global | Hecho en código (v0.25.30). Falta redesplegar Apps Script |
| Errores internos visibles para el cliente | Hecho (v0.25.30): mensaje genérico y registro en servidor |
| Caché del top del ranking global | Hecho (v0.25.30). Se borra al enviar una carrera nueva |
| Barra de fases rota en escritorio | Hecho (v0.25.27) |
| Foco de la ruleta de temporada | Hecho (v0.25.27) |
| Tope de la progresión de rivales | Implementado (v0.25.22). Pendiente jugar una carrera de diez temporadas para validar el ritmo |
| Manifiesto web e instalación en móvil | Hecho en código (v0.25.32, sin service worker). Pendiente probar la instalación en un móvil real |
| Botones sin `type` explícito | No hace falta: los 80 botones de `src/` ya lo tienen (la cifra de 26 era un error de recuento) |
| Estilos en línea | No hace falta: los 12 son valores dinámicos |
| Fase 8: texto de la regla de Copa | Hecho (v0.25.31). Motivo del resultado al final de temporada: ya existía |
| Fase 9: decisión de balance | Pendiente: jugar una carrera de diez temporadas |
| Fase 6: analítica de crecimiento | Pendiente: depende de confirmar GoatCounter |
| Fase 15: imagen para compartir | Pendiente: depende de la fase 6 |
| Fase 16: marca y monetización | Pendiente: decisión tuya, con asesoría |
| Fase 17: ranking semanal | Pendiente: decisión tuya (opcional) |

---

## 1. Desarrollador frontend

**Lo que vemos**
- `App.tsx` sigue siendo el cuello de botella: 1.735 líneas y gestión de estado de carrera, guardado, ruleta, Europa y pantallas.
- Bundle principal de 498 kB, justo por debajo del aviso de 500 kB. Ninguna pantalla se carga en diferido.
- `getCupDifficultyBonus` (`src/career/careerRules.ts`) sigue sin usarse.
- 12 objetos `style={{...}}` en componentes y 26 `<button>` sin `type` explícito. Son menores, pero conviene revisar los que estén dentro de formularios.

**Cambios propuestos**
- **P2** Partir `App.tsx` en hooks por dominio (`useCareer`, `useSavedGame`, `useLuckWheel`). Sin cambio de comportamiento, con las pruebas de carrera completa como red.
- **P2** Cargar en diferido `LeagueSimulatorView`, `FinalSummary` y la UI europea con `React.lazy`. Objetivo: bajar el bundle inicial de forma visible.
- **P2** Decidir sobre `getCupDifficultyBonus`: conectarlo (es decisión de balance) o eliminarlo.
- **P3** Mover los estilos inline a clases CSS.

## 2. Diseñador de interfaz y UX

**Lo que vemos (verificado con capturas en 375 px y 1280 px)**
- **Error de texto en carrera:** la pantalla de liga dice "Partida rápida: simula Liga y Copa…" también en modo carrera (`src/components/LeagueSimulatorView.tsx:793`).
- **Barra de fases en escritorio:** los pasos se parten en dos filas ("Resultado" queda sola debajo).
- **Barra de fases en móvil:** es un desplazamiento horizontal con la barra oculta (`PhaseProgress.css:180`). Nada indica que hay más pasos a la derecha.
- Pantalla de liga en móvil: el panel de "Próximo paso" ocupa casi toda la pantalla antes de la clasificación. Conviene comprobar si la clasificación se entiende sin hacer scroll.
- El foco visible es global desde v0.25.2 (`src/index.css`). Corrección: la auditoría anterior decía lo contrario.

**Cambios propuestos**
- **P1** Cambiar el texto de la pantalla de liga según `isCareerMode` ("Carrera" en vez de "Partida rápida"). Cambio de una línea.
- ~~**P1** Foco visible global~~ Hecho desde v0.25.2.
- **P2** En la barra de fases de móvil, marcar el paso siguiente o indicar desplazamiento (flecha o sombra en el borde).
- **P2** Revisar el foco al abrir la ruleta y la tarjeta europea, que son modales (orden de tabulación y foco inicial).
- **P3** Primera partida: tres pasos explicativos (ruleta, Game Over, Europa).

## 3. Diseñador de juego

**Lo que vemos**
- Afirmación de la dificultad Leyenda verificada: Barça y Madrid (91) y Atlético (87) están entre los rivales más fuertes de `src/data/laliga2526Teams.ts`. El texto es correcto.
- La progresión de rivales (`v0.25.22`) usa un tope de +10 de valoración. Un rival de 91 llegaría a 99 (el máximo) tras diez temporadas superadas; los equipos fuertes quedarían pegados al techo y la diferencia entre ellos se reduciría.
- La regla de reasignación de la plaza de Copa aparece solo en la tarjeta europea, cuando ya ha pasado. No hay ninguna explicación antes de llegar a esa situación.

**Cambios propuestos**
- **P1** Jugar una carrera completa de 10 temporadas y comprobar si los equipos fuertes llegan a 99 y si la liga se aplana. Si es así, bajar el tope (es decisión tuya; ver `getRivalDifficultyBonus`).
- **P2** Añadir en "Cómo funciona" una frase sobre la plaza de Copa: "Si el campeón de Copa ya está en Europa por Liga, su plaza pasa al siguiente clasificado."
- **P2** Al final de temporada, mostrar cuál fue el motivo principal del resultado (objetivo fallido, descenso), para entender cada Game Over.
- **P3** Retos semanales que reutilicen el motor actual, sin cambiar el balance histórico.

**Riesgo**
- Cualquier ajuste de rivales, probabilidades o reparto europeo afecta a los rankings ya publicados. Debe ir como fase nueva.

## 4. Diseñador gráfico 2D

**Lo que vemos**
- `favicon.svg`, `og-image.png` (1200×630) y `icons.svg` están publicados correctamente en `dist/` con rutas relativas.
- Iconos de competición propios, coherentes en tarjetas, portada y pantalla de carrera.
- Ilustración de estadio de 52 KB (7,7 KB comprimida): correcta.
- **No hay manifiesto web ni iconos PNG 192/512** para instalar el juego en el móvil.

**Cambios propuestos**
- **P2** Manifiesto `manifest.webmanifest` con iconos 192 y 512 (normal y maskable). Permite instalar el juego en la pantalla de inicio.
- **P2** Fondo de estadio en la pantalla de carrera, reutilizando `home-stadium.svg` con el mismo velo.
- **P3** Versión en blanco y negro del icono de competición para estados deshabilitados.

## 5. Desarrollador backend / redes (Apps Script)

**Lo que vemos (`apps-script/globalRankingBackend.gs`)**
- `doPost` usa `LockService` y comprueba duplicados por `careerId` bajo bloqueo (correcto).
- La puntuación se recalcula en el servidor (`computeScores_`), pero **a partir de datos que manda el cliente**: `completedSeasons` (hasta 500) y los trofeos (hasta sus límites). No hay comprobación de coherencia: cualquiera puede enviar una puntuación alta sin haber jugado.
- `careerId` lo genera el cliente. No prueba que la carrera exista.
- `readEntries_` lee la hoja entera en cada envío y en cada consulta del ranking. Con 5.000 filas, la latencia crece.
- `toErrorResponse_` devuelve el mensaje de error interno al cliente.
- Moderación por columna `oculto` implementada; falta el redespliegue en Apps Script (pendiente tuyo).

**Cambios propuestos**
- **P1** Comprobaciones de plausibilidad en `normalizePayload_`: el palmarés no puede superar lo que permiten las temporadas declaradas (por ejemplo, un título de Liga por temporada como máximo). Reduce las puntuaciones imposibles, sin dar seguridad fuerte.
- **P2** Cachear el top de `doGet` con `CacheService` durante unos minutos, para no leer la hoja en cada visita.
- **P2** Mensaje genérico en `toErrorResponse_` y registro interno del error con `console.error`.
- **P3** Token de un solo uso emitido antes de cada envío (no es seguridad fuerte, pero frena el spam automatizado).

## 6. QA / tester

**Lo que vemos**
- 43 scripts `qa:*` en `package.json`, 29 de ellos en CI. Cada uno compila con `vite build --ssr` por separado. Esto alarga el workflow y explica las colas de más de 30 minutos que vimos antes.
- Pruebas: 73 unitarias en 12 archivos; 6 pruebas de Playwright en 4 especificaciones.
- **Prueba intermitente:** `career-full-flow` falló una vez en una ejecución completa de Playwright y pasó en las cuatro siguientes. No se ha encontrado la causa.
- La mayoría de los QA siguen comprobando texto con `includes()`. Esto ha provocado fallos por cambios de código correctos.

**Cambios propuestos**
- **P1** Consolidar los QA de texto en un único runner que compile una sola vez. Reduce el tiempo de CI.
- **P1** Investigar la prueba intermitente: la traza ya se guarda en fallo (`trace: "retain-on-failure"`); revisar esperas fijas y comparar trazas del fallo.
- **P2** Pruebas de captura de pantalla (`toHaveScreenshot`) para la portada y la pantalla de carrera en móvil. Habrían detectado el botón sin estilo de v0.25.19.
- **P2** Prueba e2e de la pantalla de liga en modo carrera que compruebe el texto correcto (ver rol UX).
- **P3** Sustituir los QA de texto por pruebas de comportamiento, de forma gradual.

## 7. Marketing digital / redes sociales

**Lo que vemos**
- `lang="es"`, Open Graph y Twitter Cards con imagen están en `index.html` y en `dist/`.
- No hay manifiesto web (ver rol 2D), así que el enlace compartido no se puede instalar.
- Los textos de compartir (`SHARE_TEXT` en `GameHome.tsx`) describen el juego, pero no hay una imagen de carrera para compartir.
- No hay plan de contenido en el repositorio.

**Cambios propuestos**
- **P2** Imagen de vista previa para compartir una temporada superada (puntos, palmarés y clasificación), reutilizando el resumen que ya existe.
- **P2** Texto de compartir distinto según el contexto: portada, reto y fin de carrera.
- **P3** Plan de contenido: un clip o captura por noche europea y por título, con un hashtag propio.

## 8. Gestor de patrocinios (monetización)

**Lo que vemos**
- Apoyo voluntario con Ko-fi y PayPal (`SupportButton.tsx`). Sin anuncios.
- El juego usa el nombre "Athletic Club" y referencias a camisetas (`shirtIcon`). Es un riesgo de marca de terceros que no se ha revisado con asesoría.

**Cambios propuestos**
- **P2** Mantener el apoyo voluntario como fuente principal.
- **P2** Antes de cualquier patrocinio o tienda, revisar el uso del nombre y de los elementos de marca del club. Es decisión tuya, con asesoría.
- **P3** Página de agradecimiento con enlaces de apoyo, sin publicidad en la pantalla de juego.

## 9. CTO

**Lo que vemos**
- `npm audit --omit=dev`: 0 vulnerabilidades (comprobado hoy).
- Dependencias de producción: solo `react` y `react-dom`.
- **6 PRs de Dependabot abiertos** (#30–#35): #33 agrupa 9 actualizaciones menores y de parche; #34 (TypeScript 6→7) y #35 (`@types/node` 24→26) son saltos mayores; #30–#32 son acciones de GitHub, con saltos mayores en `upload-pages-artifact` y `deploy-pages`.
- La versión está escrita a mano en varios archivos: `appVersion.ts`, `package.json`, `package-lock.json`, README y 5 QA. Ha provocado fallos de QA varias veces.
- CI: 29 pasos de QA antes del build (ver rol QA).
- Almacenamiento: las claves de `localStorage` llevan sufijo de versión (`_v1`), lo que permite migrar más adelante.

**Cambios propuestos**
- **P1** Revisar #33 (menores y parches) con CI en verde y fusionar si pasa. Tratar #34, #35 y #30–#32 cada uno en su fase.
- **P1** Consolidar los QA de CI (ver rol QA).
- **P2** Derivar `APP_VERSION` y la versión de los QA desde una sola fuente.
- **P2** Documentar el proceso de release en un solo sitio: versión, CHANGELOG, documento de fase, etiqueta y redespliegue de Apps Script si cambia el backend.
- **P3** Migraciones de `localStorage` cuando cambie el esquema de partida.

## 10. Growth hacker (indie)

**Lo que vemos**
- Solo dos eventos de analítica: `career_start` y `game_over` (`src/App.tsx`, llamadas a `trackEvent`).
- No se mide el envío al ranking global, el reto copiado ni el reto abierto. No se puede medir el bucle viral, que es lo que más puede crecer.
- Retención: enlace de reto (`src/career/challengeLink.ts`) y ranking local y global.
- La nota de privacidad solo menciona los eventos de partida. Cualquier evento nuevo exige actualizarla en el mismo PR.

**Cambios propuestos**
- **P1** Añadir tres eventos: `global_ranking_submit`, `challenge_copy` y `challenge_open`, sin propiedades, y actualizar la nota de privacidad en el mismo PR.
- **P1** Comprobar en GoatCounter si llegan visitas desde el móvil (pendiente tuyo).
- **P2** Instalable desde el móvil (manifiesto, ver rol 2D).
- **P3** Ranking semanal con reinicio, sin tocar el histórico.

---

## Orden recomendado

1. **Esta semana (P1 de bajo coste):** texto "Partida rápida" en carrera (hecho en v0.25.23); revisar Dependabot #33; investigar la prueba intermitente.
2. **Después (P1 de más coste):** consolidar los QA en un runner; plausibilidad del backend; tres eventos de analítica con nota de privacidad; jugar una carrera de diez temporadas y decidir el tope de progresión.
3. **Siguiente fase (P2):** partir `App.tsx`, carga diferida, manifiesto, fondo en carrera, regla de Copa en "Cómo funciona", imagen de compartir, caché del ranking.
4. **Decisiones tuyas:** balance de rivales, uso de la marca del club, cualquier monetización.

## Pendiente tuyo (no se puede hacer desde aquí)

- Comprobar que GoatCounter recibe visitas desde un móvil con datos.
- Redesplegar `apps-script/globalRankingBackend.gs` para la columna `oculto`.
- Jugar una carrera completa de diez temporadas con la progresión nueva.
