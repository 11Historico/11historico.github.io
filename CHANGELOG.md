# Changelog

## v0.25.6 — Explicación de la falta de plaza europea

- La tarjeta "Sin billete europeo" de fin de temporada explica por qué no hay plaza: la posición del equipo y, si aplica, cómo el campeón de Copa ya clasificado por Liga desplazó la plaza al 6.º y la Conference al 7.º.
- La explicación se genera en `resolveEuropeanQualification` (`getNoEuropeanQualificationExplanation`), con pruebas unitarias. La regla no cambia.
- La prueba de flujo completo comprueba que la tarjeta muestra la posición del equipo.
- Versionado a `v0.25.6` / `0.25.6`.

## v0.25.5 — Marcas europeas de la tabla final

- La clasificación final marca las plazas europeas con el mismo reparto que el juego: 5.º Europa League, 6.º Conference, y la reasignación cuando el campeón de Copa ya está en Europa por Liga.
- Antes, la tabla marcaba siempre al 6.º como Europa League y podía mostrar Conference en el 8.º, contradiciendo al Game Over.
- La regla vive en una sola función (`getFinalTableEuropeanSpot`), con pruebas unitarias.
- Versionado a `v0.25.5` / `0.25.5`.

## v0.25.4 — Prueba de flujo completo

- Partida guardada de prueba generada por `npm run e2e:fixture` (`scripts/buildE2eFixture.ts`), con una plantilla débil para que la temporada termine en Game Over.
- Prueba de Playwright de la carrera completa: desde la partida guardada, avanza por liga, Copa y ruleta hasta el Game Over, y comprueba que la pantalla explica el motivo (objetivo fallido o descenso).
- Versionado a `v0.25.4` / `0.25.4`.

## v0.25.3 — Tests: Vitest y Playwright

- Vitest con 25 pruebas unitarias de lógica pura: reparto europeo y reasignación por campeón de Copa, líneas de tiempo de la secuencia de partido, velocidad y motor europeo (eliminatorias sin empate, determinismo, tandas).
- Playwright con dos pruebas de humo contra el build de producción: la home carga en español sin errores de consola, y el ranking global enlaza la política de privacidad.
- Ambas pruebas se ejecutan en el workflow de despliegue, después del build.
- Versionado a `v0.25.3` / `0.25.3`.

## v0.25.2 — P1 Low Cost

- Idioma del documento en español (`lang="es"`).
- Vista previa en redes: Open Graph y Twitter Cards con imagen de 1200×630 (`public/og-image.png`).
- Dependabot para dependencias npm y acciones de GitHub.
- Nota de privacidad publicada en `privacidad.html` y enlazada desde el ranking global.
- Foco visible en todos los controles por teclado.
- Moderación del ranking global: columna `oculto` en la hoja. Las filas marcadas no aparecen en el ranking sin borrar datos. Requiere redesplegar el script de Apps Script.
- Versionado a `v0.25.2` / `0.25.2`.

## v0.25.1 — Tech Cleanup

- Resuelve los hallazgos de `npm audit` sin cambios de versión mayor (Vite pasa de 8.1.2 a 8.3.5 dentro de la misma mayor). `npm audit` reporta 0 vulnerabilidades.
- Separa los datos históricos de plantillas en su propio fragmento: el bundle principal baja de 792 kB a 485 kB y desaparece el aviso de Vite de 500 kB.
- Añade `qa:bundle-chunking`, que impide quitar esa separación sin aviso.
- Hace `qa:global-ranking` independiente del `.env.local` local: la etiqueta del backend se comprueba según la configuración de compilación.
- Versionado a `v0.25.1` / `0.25.1`.

## v0.25.0 — Stable Public Release

Primera versión pública estable del juego con Europa Career completa y la secuencia de partido en Liga, Copa y Europa.

- Secuencia de partido en Liga y Copa: previa, reloj de 0' a 90', goles en su minuto y resultado final, con botón Saltar (PR #24).
- Secuencia de partido en Europa: previa, 90', prórroga y penaltis cuando los hubo, marcador revelado por tramos y resultado final (PR #25).
- Velocidad de la secuencia Lento / Normal / Rápido, guardada en el navegador, y movimiento reducido respetado; contraste de la paleta comprobado (PR #26).
- Empate en semifinal o final europea: prórroga 2×15 min y, si sigue igual, penaltis; nunca queda empate en eliminatorias (PR #20).
- Reparto europeo real de LaLiga: 7 plazas (4 Champions, 2 Europa League, 1 Conference) con reasignación cuando el campeón de Copa ya está en Europa por Liga. Aplicado al Game Over y a la clasificación europea jugable (PR #23).
- Ruleta de la temporada: la etiqueta de cada quesito queda centrada en su premio, de modo que el premio aplicado coincide con el señalado (PR #21).
- Vitrina de palmarés: las vitrinas vacías de Champions, Europa League y Conference dicen qué trofeo falta (PR #22).
- Ranking global: tiempo de espera de 45 s para arranques en frío de Apps Script; variable de endpoint pasada al build de GitHub Pages (PRs #16 y #17).
- Carrera: al recargar en la pantalla de recompensa de intertemporada, la recompensa se retoma sin perderse (PR #18).
- Textos del palmarés y del ranking local corregidos (PR #19).
- Versionado a `v0.25.0` / `0.25.0` en código, package.json, package-lock y QA de consistencia.

## v0.24.9a — Share & Retention Hotfix

- Alinea la versión visible y las entradas nuevas del ranking con la fase publicada.
- Avisa si el Game Over no se pudo guardar en el ranking local.
- Normaliza entradas antiguas del ranking sin todos los contadores de títulos.

## v0.24.7 — Europa Career Release Stabilization

- Cierra el arco completo de "Europa Career" (v0.24.0a–v0.24.6b) como versión pública estable.
- Corrige `APP_VERSION`/`APP_VERSION_NAME`/`APP_STATUS` (`src/config/appVersion.ts`), que seguían apuntando a `v0.24.2a` diez fases por detrás, y su comprobación en `qa:release-stabilization`.
- Corrige `CHANGELOG.md`: eliminadas 6 cabeceras `# Changelog` repetidas y 3 bloques de entradas duplicadas (`v0.23.3b`, `v0.23.2b6`, `v0.23.2b` aparecían cada una 3 veces); verificado que el conjunto de versiones documentadas es idéntico antes y después, sin pérdida de historial. Añadidas las 9 entradas que faltaban entre `v0.24.2b` y `v0.24.6b`.
- Añade `docs/v0_24_7_EUROPA_CAREER_RELEASE_STABILIZATION.md` como resumen de referencia único de todo el arco europeo (hasta ahora cada fase solo enlazaba a la inmediatamente anterior, sin un punto de entrada común).
- No cambia probabilidades, ratings históricos, balance de Liga/Copa/Supercopa, la Ruleta de la Suerte ni funcionalidades existentes: es una fase de higiene de release, no de producto.
- Actualiza versionado a `v0.24.7` / `0.24.7`.

## v0.24.6b — European Visual Polish

- Extiende el sistema de color por competición (azul Champions / naranja Europa League / verde Conference), que ya existía en `EuropeanMatchEvent.css`, a `EuropeanQualificationCard` y `EuropeanProgressPanel`, que hasta entonces mostraban las tres competiciones de forma idéntica.
- Da a la columna "Europa" de los rankings local y global (v0.24.5a) un acento de color propio (`#cfe0ff`), distinguiéndola de un vistazo de Liga/Copa/Supercopa.
- Añade `qa:european-visual-polish` e integra la QA en `qa:tech-debt` y GitHub Actions.
- No cambia responsive/móvil (v0.24.6a), estructura de datos, backend, Ruleta de la Suerte, Liga, Copa ni Supercopa.
- Actualiza versionado a `v0.24.6b` / `0.24.6-b.0`.

## v0.24.6a — European Mobile Polish

- Corrige 3 huecos de responsive/móvil en pantallas europeas recientes: la columna "Europa" de los rankings sin `<span>` (rompía el alineado móvil apilado), el grid de KPIs de `EuropeanMatchEvent` sin colapso forzado a una columna en móvil estrecho, y su botón de acción sin ancho completo en móvil.
- No duplica la cobertura móvil ya existente (`v0.23.3a`, `@media` ya presentes en las pantallas europeas).
- Añade `qa:european-mobile-polish` e integra la QA en `qa:tech-debt` y GitHub Actions.
- No cambia estructura de datos, backend, Ruleta de la Suerte, Liga, Copa ni Supercopa.
- Actualiza versionado a `v0.24.6a` / `0.24.6-a.0`.

## v0.24.5b — Backend Ranking Migration

- Migra `apps-script/globalRankingBackend.gs` para exponer el desglose de títulos por competición (`championsTitles`...`supercopaTitles`) como columnas propias en Sheets, añadidas al final de `HEADERS` sin desplazar índices existentes.
- `trophyCounts` (JSON) sigue siendo la fuente de verdad y el formato que recibe el cliente no cambia; la fórmula de puntuación (`PALMARES_POINTS`/`computeScores_`) tampoco se toca.
- Añade `migrateExistingTrophyColumns_()`, migración de un solo uso para rellenar las columnas nuevas en filas ya existentes (requiere ejecución manual del usuario en Apps Script tras desplegar).
- Añade `qa:global-ranking-backend-migration` e integra la QA en `qa:tech-debt` y GitHub Actions.
- Actualiza versionado a `v0.24.5b` / `0.24.5-b.0`.

## v0.24.5a — Global Ranking Europa Fields

- Expone en la UI de ranking (local y global) el desglose de títulos europeos por competición, que ya viajaba dentro de `trophyCounts` en cada entrada pero no se mostraba de forma diferenciada.
- Nuevos helpers `getEuropeanTrophyBreakdown`/`formatEuropeanTrophyBreakdownLabel` en `careerRanking.ts`, usados por `CareerLocalRanking.tsx` (sustituye la suma manual anterior) y `CareerGlobalRanking.tsx` (antes no mostraba nada de Europa).
- No añade campos nuevos al payload ni toca `apps-script/globalRankingBackend.gs`; eso queda para v0.24.5b.
- Añade `qa:global-ranking-europa-fields` e integra la QA en `qa:tech-debt` y GitHub Actions.
- Actualiza versionado a `v0.24.5a` / `0.24.5-a.0`.

## v0.24.4b — European Balance QA

- Añade `scripts/qaEuropeanBalance.ts`, QA de balance dedicada a los riesgos concretos que introdujo el bonus de prestigio de v0.24.4a: que se acumulara temporada tras temporada, y que el bonus máximo dejara las competiciones triviales o superara el techo de rating de 100.
- No modifica ningún archivo de producción: es QA pura sobre mecánica ya existente.
- Integra la QA en `qa:tech-debt` y GitHub Actions.
- Actualiza versionado a `v0.24.4b` / `0.24.4-b.0`.

## v0.24.4a — European Rewards / Prestige

- Añade recompensa de prestigio europeo tras cada campaña europea, integrada en la transición entre temporadas: campeón de Champions/Europa League/Conference da +1.0/+0.75/+0.5 de bonus de rating; final perdida da +0.25; semifinal o fase inicial perdida solo dan narrativa, sin bonus.
- El bonus se combina con `Math.max` (nunca se acumula) y nunca puede reclamarse dos veces sobre el mismo torneo (`europeanPrestigeAwarded`).
- Corrige de paso el cableado de v0.24.3b: los títulos europeos no llegaban a sumarse al palmarés real en `App.tsx`/`CareerSeasonOutcome.tsx` pese a que la infraestructura ya existía; y corrige que `normalizeEuropeanTournament` no conservaba las marcas de título/prestigio ya otorgados al recargar una partida guardada.
- Añade `qa:european-rewards-prestige` e integra la QA en `qa:tech-debt` y GitHub Actions.
- Actualiza versionado a `v0.24.4a` / `0.24.4-a.0`.

## v0.24.3b — European Trophies + Palmarés

- Los títulos europeos (Champions League, Europa League, Conference League) se suman por fin al palmarés de carrera al cerrar la temporada, con guardarraíl anti-duplicado (`europeanTrophyAwarded`).
- Nuevo módulo `src/career/europeanTrophies.ts` y extensión de `careerRanking.ts`/`getFinalCareerTrophyCounts` para aceptar el torneo europeo pendiente.
- Añade `qa:european-trophies-palmares` e integra la QA en `qa:tech-debt` y GitHub Actions.
- No cambia el ranking global, la Ruleta de la Suerte, Liga, Copa ni Supercopa.
- Actualiza versionado a `v0.24.3b` / `0.24.3-b.0`.

## v0.24.3a — European Knockouts

- Mejora la experiencia de semifinal y final europea como partidos únicos, con consecuencias claras y mayor jerarquía visual.
- Nuevo bloque narrativo de eliminatoria en `EuropeanMatchEvent`, estado de eliminatoria visible en `EuropeanProgressPanel`.
- Nuevos helpers puros en `europeanTournament.ts`: `isEuropeanKnockoutPhase`, `getEuropeanKnockoutStageText`, `getEuropeanKnockoutStakesText`.
- Mantiene el título europeo como estado interno del torneo; la integración real en palmarés queda para v0.24.3b.
- Añade `qa:european-knockouts` e integra la QA en `qa:tech-debt` y GitHub Actions.
- Actualiza versionado a `v0.24.3a` / `0.24.3-a.0`.

## v0.24.2b — European Progress UI

- Añade `EuropeanProgressPanel`, vista consultiva del progreso europeo completo: partidos jugados/totales, puntos, V/E/D, goles a favor/en contra, objetivo contextual por fase, próxima noche europea y calendario europeo completo.
- Integra el panel dentro de `EuropeanMatchEvent`.
- Añade `qa:european-progress-ui` e integra la QA en `qa:tech-debt` y GitHub Actions.
- No se añaden títulos europeos al palmarés, no se modifica el motor de simulación europeo ni las reglas de clasificación.
- Actualiza versionado a `v0.24.2b` / `0.24.2-b.0`.

## v0.24.2a — European UI Matchday View

- Mejora visualmente la tarjeta de evento europeo "Noche europea".
- Añade badge por competición: Champions League, Europa League y Conference League.
- Añade narrativa contextual para partido local, visitante, semifinal, final, eliminación y campeón pendiente de palmarés.
- Mejora la presentación del rival, país, rating, sede y marcador previo.
- Añade progreso visual del torneo europeo con partidos jugados, puntos, V/E/D y goles a favor/en contra.
- Refuerza el responsive móvil de la tarjeta europea.
- Añade `qa:european-matchday-ui` e integra la QA en `qa:tech-debt` y GitHub Actions.
- No suma títulos europeos al palmarés todavía. Esa integración queda para v0.24.3b.
- No cambia ratings históricos, Ruleta de la Suerte, ranking global ni balance de Liga/Copa/Supercopa.
- Actualiza versionado a `v0.24.2a` / `0.24.2-a.0`.

## v0.24.1c — European Tournament Calendar

- Añade el primer torneo europeo jugable con formato simplificado: fase inicial de 6 partidos, semifinal a partido único y final a partido único (`src/europe/europeanTournament.ts`). Clasificar a semifinales requiere 10 o más puntos en la fase inicial; con menos, el equipo queda eliminado. Perder la semifinal elimina; ganarla lleva a la final.
- Añade rivales europeos genéricos por competición (Champions League 82-94, Europa League 76-88, Conference League 70-82 de rating) en `src/europe/europeanOpponents.ts`, elegidos de forma determinista por semilla, sin nombres ni escudos reales.
- Añade `src/europe/europeanMatchEngine.ts`, que reutiliza el motor de partidos real (`src/simulation/matchEngine.ts`, sin modificarlo) para simular los partidos europeos; el rating de usuario y de rival, y la ventaja de local, influyen en el resultado igual que en Liga/Copa.
- Añade `src/europe/europeanCalendar.ts` e integra los partidos europeos como eventos dentro del calendario de Liga (`LeagueSimulatorView`): jornadas fijas 4/8/12/16/20/24 (fase inicial), 30 (semifinal) y 36 (final) para una Liga de 38 jornadas, o el equivalente proporcional si el tamaño de Liga es distinto. La simulación automática y "saltar hasta el próximo evento" se detienen en la jornada europea, igual que ya hacían con la Copa del Rey.
- Añade el componente `EuropeanMatchEvent` (+ CSS) con la tarjeta de evento "Noche europea": competición, fase, rival, condición de local/visitante, rating del rival, botón "Simular partido europeo", resultado y estado del torneo, y botón "Continuar temporada".
- El torneo se crea solo si la última clasificación europea guardada indica `qualified: true`, al continuar a la temporada siguiente (`handleContinueCareerAfterSeason` en `App.tsx`), y se guarda en `europeanCareer.currentTournament`. No se duplica al continuar la carrera ni al recargar una partida guardada; `normalizeEuropeanCareerState` acepta partidas antiguas sin este campo.
- Todavía NO suma títulos europeos al palmarés: ganar la final europea se registra solo internamente (`tournament.champion`), mostrando el texto "Campeón europeo pendiente de integración en palmarés" en vez de dar a entender que el título ya cuenta. Esa integración queda planificada para v0.24.3b.
- No cambia probabilidades, ratings históricos, balance de Liga/Copa/Supercopa, la Ruleta de la Suerte ni funcionalidades existentes. Ver `docs/v0_24_1c_EUROPEAN_TOURNAMENT_CALENDAR.md` para el detalle del formato elegido y las decisiones de diseño.
- Añade `qa:european-tournament`, `qa:european-match-engine` y `qa:european-calendar`, integradas en `qa:tech-debt` y en el workflow de GitHub Pages antes del build.
- Actualiza versionado a `v0.24.1c` / `0.24.1-c.0`.

## v0.24.0c — Europa Qualification Foundation

- Añade la base de reglas puras de clasificación europea (`src/europe/europeanTypes.ts`, `europeanQualification.ts`): 1º-4º Champions League, 5º-6º Europa League, 7º Conference League, 8º o peor sin Europa.
- La Copa del Rey garantiza como mínimo Europa League: mejora Conference/sin Europa hasta Europa League, pero no rebaja una plaza de Liga igual o mejor (Champions o Europa League).
- Añade `EuropeanQualificationCard` (+ CSS) y la integra en `CareerSeasonOutcome` y `FinalSummary`, mostrando la clasificación europea de la próxima temporada sin insinuar que ya se ha jugado.
- Añade persistencia del estado europeo dentro de la carrera (`europeanCareer` en `SavedGameState`): histórico por temporada, mejor competición alcanzada y total de clasificaciones, con normalización segura para partidas antiguas sin este campo.
- El módulo nuevo es independiente del `EuropeanCompetition` heredado de `src/types/career.ts` / `getEuropeanQualification` en `careerRules.ts`, que sigue decidiendo la supervivencia de la carrera sin cambios. Ver `docs/v0_24_0c_EUROPA_QUALIFICATION_FOUNDATION.md` para la justificación.
- Todavía NO incluye partidos europeos, calendario, eliminatorias, simulación de torneos europeos ni ranking europeo. No suma títulos europeos al palmarés en esta fase.
- No cambia probabilidades, ratings históricos, balance de Liga/Copa/Supercopa ni funcionalidades existentes.
- Añade `qa:european-qualification`, `qa:european-qualification-ui` y `qa:european-persistence`, integradas en `qa:tech-debt` y en el workflow de GitHub Pages antes del build.
- Actualiza versionado a `v0.24.0c` / `0.24.0-c.0`.

## v0.23.2c — Luck Wheel Real Rewards

- Ejecuta de verdad los premios de ruleta de cambio de jugador y cambio de entrenador.
- El premio de jugador pausa la simulación, permite retirar un jugador del once y elegir un sustituto compatible.
- El premio de entrenador pausa la simulación y permite elegir nuevo técnico o cancelar y volver a la Liga.
- El premio `+1 + jugador` mantiene el `ratingDelta` y además abre el cambio real de jugador.
- No cambia probabilidades, ratings históricos, palmarés, ranking ni Europa Career.
- Añade `qa:luck-wheel-real-rewards` e integra la QA en `qa:tech-debt`.
- Actualiza versionado a `v0.23.2c` / `0.23.2-c.0`.

## v0.23.3b — Hooks Simulation Deps Cleanup

- Corrige deuda de hooks marcada por la auditoría: elimina errores `react-hooks/set-state-in-effect` y dependencias obsoletas en el bucle de simulación.
- Estabiliza `LeagueSimulatorView` con callbacks memoizados para `commitContext`, `finishIfReady` y `maybeOfferSeasonLuckWheel`, evitando closures obsoletos en la simulación automática.
- Limpia avisos de hooks en paneles auxiliares y evita efectos usados solo para derivar estado local.
- Activa `lint:src` como paso de GitHub Actions tras dejarlo sin errores/warnings.
- Añade `qa:hooks-simulation-deps` y lo integra en `qa:tech-debt` y en el workflow de deploy.
- Actualiza versionado a `v0.23.3b` / `0.23.3-b.0`.
- No toca probabilidades, balance, ratings históricos, ruleta, palmarés, ranking ni Europa Career.

## v0.23.3a — Mobile Viewport Fix

- Añade fallback dinámico de viewport móvil: cada regla `100vh` conserva su fallback y añade la equivalente `100dvh`.
- Cubre pantallas principales: home, draft, selección de formación, entrenador, liga, resumen, carrera, rankings, Supercopa, ruleta y contenedores de scroll.
- Añade `qa:mobile-viewport` para verificar que ninguna regla `100vh` quede sin fallback `100dvh`.
- Integra la QA móvil en `qa:tech-debt` y en el workflow de GitHub Pages antes del build.
- Actualiza versionado a `v0.23.3a` / `0.23.3-a.0`.
- No toca probabilidades, balance, ratings históricos, ruleta, palmarés, ranking ni Europa Career.

## v0.23.3 — Tech Health Baseline

- Añade `typecheck` explícito y lo usa antes del build.
- Añade `qa:tech-health-baseline` para auditar higiene técnica sin tocar gameplay.
- Integra la QA de salud técnica dentro de `qa:tech-debt`.
- Actualiza el workflow de GitHub Pages a Node 24 y añade pasos de typecheck + QA técnica antes del build.
- Ajusta `eslint.config.js` para ignorar `dist`, `.audit-dist`, `reports`, `patch_files`, backups y ficheros históricos `_FIXED`.
- Añade `lint:src` como lint focalizado sobre código vivo, sin activar todavía como bloqueo de deploy hasta corregir hooks/deps reales.
- Protege artefactos locales de auditoría en `.gitignore`.
- Actualiza versionado a `v0.23.3` / `0.23.3`.
- No toca probabilidades, balance, ratings históricos, ruleta, palmarés, ranking ni Europa Career.

## v0.23.2b6 — Luck Wheel Label Fit

- Acorta etiquetas internas de la ruleta para que encajen mejor en cada quesito: `Jug.`, `Entr.`, `+1`, `+0.5`, `-0.5`, `-1`.
- Mantiene la leyenda externa con el nombre completo de los premios.
- Ajusta CSS de tamaño, ancho, interlineado y sombra para mejorar nitidez.
- Refuerza `qa:season-luck-wheel-ui` con etiquetas ultracortas y comprobación explícita de aplicación de `ratingDelta`.
- Documenta que `+0.5`, `+1`, `-0.5` y `-1` ya tienen efecto real en el rating de temporada usado por simulación.
- Actualiza versionado a `v0.23.2b6` / `0.23.2-b6.0`.
- No toca probabilidades, balance, ratings históricos, plantillas base, palmarés, ranking ni Europa Career.

## v0.23.2b5 — Palmarés Supercopa + Game Over Showcase

- Revisa `PalmaresTrophyCase` para aceptar `CareerTrophyCounts` y mostrar todo el palmarés acumulado de carrera.
- Mapea correctamente Liga, Copa, Supercopa, Champions, Europa League y Conference desde el contador de carrera.
- Añade una vitrina de palmarés en la pantalla de Game Over.
- El Game Over suma la temporada actual antes de mostrar palmarés, evitando que una Supercopa ganada se quede fuera del escaparate final.
- El resumen completo usa el palmarés visible de carrera cuando se vuelve desde modo carrera.
- Añade `qa:palmares-showcase` y lo integra en `qa:tech-debt`.
- Actualiza versionado a `v0.23.2b5` / `0.23.2-b5.0`.
- No toca probabilidades de ruleta, balance, ratings históricos, plantillas base, ranking global ni Europa Career.

## v0.23.2b4 — Luck Wheel Skip Event Fix

- Corrige la simulación rápida para que no se salte la Ruleta de la Suerte al avanzar muchos partidos de golpe.
- Al pulsar Saltar hasta próximo evento, el flujo avanza internamente partido a partido y evalúa los triggers tras cada resultado.
- Si se cruza mitad de temporada o una eliminación temprana de Copa antes de los 2/3 de Liga, se detiene y muestra la ruleta.
- Mantiene el límite de dos primeros tercios de Liga para evitar ruletas al final de temporada.
- Evita que la primera temporada pueda completar Liga/Copa sin ofrecer la ruleta por haber usado simulación rápida.
- Refuerza `qa:season-luck-wheel-ui` para auditar que el salto rápido usa `simulateLeagueUntilNextEvent` y evalúa `maybeOfferSeasonLuckWheel` dentro del bucle.
- Actualiza versionado a `v0.23.2b4` / `0.23.2-b4.0`.
- No toca probabilidades reales, balance, ratings históricos, plantillas base, ranking local, ranking global ni Europa Career.

## v0.23.2b2 — Luck Wheel Readability and Arrow Speed

- Sustituye textos largos dentro de los quesitos por etiquetas cortas y más nítidas: `+0.5`, `+1`, `Jugador`, `Entrenador`, `Sin efecto`, `-0.5` y `-1`.
- Añade leyenda de premios completos para explicar las etiquetas cortas sin saturar la rueda.
- Mejora contraste, tamaño y suavizado de las etiquetas de la ruleta.
- Añade flecha de precisión con velocidad progresiva: empieza más lenta, acelera con el tiempo y tiene límite máximo.
- Refuerza `qa:season-luck-wheel-ui` para cubrir etiquetas cortas, leyenda, aceleración y límite de velocidad.
- Actualiza versionado a `v0.23.2b2` / `0.23.2-b2.0`.
- No toca probabilidades reales, balance, ratings históricos, plantillas base, ranking local, ranking global ni Europa Career.

## v0.23.2b1 — Luck Wheel Segments Polish

- Aumenta la ruleta visual a 12 quesitos repartidos.
- Repite visualmente premios sin cambiar probabilidades reales del motor.
- Mantiene el puntero fijo y la rueda girando por debajo.
- Fuerza coherencia visual entre resultado lógico, segmento final y premio mostrado.
- Mejora legibilidad de premios largos con saltos cortos.
- Refuerza QA de UI para comprobar 12 segmentos, 3 `Sin efecto`, 3 `+0.5`, puntero fijo y no alteración de probabilidades.
- Actualiza versionado a `v0.23.2b1` / `0.23.2-b1.0`.
- No toca balance, ratings históricos, plantillas base, ranking local, ranking global ni Europa Career.

## v0.23.2b — Season Luck Wheel UI

- Añade `SeasonLuckWheelModal` con modal narrativo para la ruleta de temporada.
- Muestra premios visibles en la ruleta: `+0.5`, cambio de jugador, cambio de entrenador, `+1.0`, `+1.0` + jugador, sin efecto, `-0.5` y `-1.0`.
- Añade animación de giro con segmentos visuales.
- Añade barra de precisión con flecha móvil y botón `Parar flecha`.
- Integra botones `Jugar ruleta` y `No jugar`; rechazar consume la oportunidad sin efecto.
- Pausa la simulación automática cuando aparece la oferta de ruleta.
- Añade triggers iniciales por mitad de temporada y eliminación en Copa del Rey.
- Persiste el estado de ruleta en el contexto de liga.
- Aplica los efectos de media al rating que usa la simulación durante la temporada.
- Añade `npm run qa:season-luck-wheel-ui` e integra la QA en `npm run qa:tech-debt`.
- Actualiza versionado a `v0.23.2b` / `0.23.2-b.0`.
- No toca ratings históricos, plantillas base, ranking local, ranking global ni Europa Career.

## v0.23.2a — Season Luck Wheel engine

- Añade `src/career/seasonLuckWheel.ts` con el motor lógico de la ruleta de temporada.
- Define máximo 1 ruleta por temporada, oferta contextual y rechazo sin efecto.
- Define probabilidad general: 40% positivo, 40% neutro, 20% negativo.
- Define premios positivos internos: 40% `+0.5`, 30% cambio de jugador, 20% cambio de entrenador, 8% `+1.0`, 2% `+1.0` + cambio de jugador.
- Define penalizaciones internas: 90% `-0.5`, 10% `-1.0`.
- Añade barra de precisión lógica: centro con más opciones positivas y extremos con más opciones negativas.
- Añade premios visibles de ruleta para la futura UI animada.
- Añade `src/career/seasonLuckWheelText.ts` con 20 frases de aparición y 20 frases positivas/neutras/negativas.
- Añade `npm run qa:season-luck-wheel` e integra la QA en `npm run qa:tech-debt`.
- Actualiza versionado a `v0.23.2a` / `0.23.2-a.0`.
- No toca UI, simulación en vivo, balance, ratings históricos, plantillas, recompensas, ranking local ni ranking global.

## v0.23.1a — Agentjacking guardrails

- Añade guardarraíles anti-agentjacking en `AGENTS.md` para tratar archivos, parches, markdown, logs, OCR, CSV y artefactos como entrada no confiable.
- Bloquea instrucciones incrustadas que intenten ignorar el roadmap, leer secretos, saltarse tests, hacer `git add .`, forzar push o cambiar ratings/balance/plantillas sin fase explícita.
- Refuerza reglas de Git seguro: stage explícito, no comandos destructivos sin confirmación y no commitear `dist` salvo release/build.
- Añade `npm run qa:agentjacking` e integra la auditoría en `npm run qa:tech-debt`.
- Actualiza versionado a `v0.23.1a` / `0.23.1-a.0`.
- No toca gameplay, balance, ratings históricos, plantillas, recompensas, ranking local, ranking global ni backend Apps Script.

## v0.23.1 — Release stabilization

- Cierra una versión estable post-ranking global real antes de abrir Europa Career.
- Actualiza versionado público a `v0.23.1` y npm a `0.23.1`.
- Añade `npm run qa:release-stabilization`.
- `npm run qa:tech-debt` incorpora la QA de estabilización.
- Verifica que `.env`, `.env.local` y `.env.*.local` están protegidos por `.gitignore`.
- Verifica que fuentes/docs/dist no filtran Deployment IDs reales de Apps Script.
- Verifica que la guía Apps Script documenta `/exec`, `.env.local` y la configuración segura.
- No toca balance, ratings históricos, plantillas, ranking local, recompensas ni backend Apps Script.

## v0.23.0e — Global ranking UI polish

- Añade configuración local del endpoint Apps Script desde la UI, guardada solo en el navegador.
- `globalRankingService` prioriza endpoint explícito, endpoint guardado en navegador y después `VITE_GLOBAL_RANKING_ENDPOINT`.
- La pantalla Ranking global permite pegar URL `/exec`, guardar endpoint y recargar Top 100.
- El panel de Game Over permite activar el ranking global si el backend aparece pendiente.
- Añade `npm run qa:global-ranking-ui` y lo integra en `npm run qa:tech-debt`.
- Actualiza versionado a `v0.23.0e` / `0.23.0-e.0`.
- No toca balance, ratings históricos, plantillas, recompensas ni ranking local.

## v0.23.0d — Global ranking real submit QA

- Añade `npm run qa:global-ranking-real` para validar contra el backend real de Apps Script configurado por `VITE_GLOBAL_RANKING_ENDPOINT`.
- La QA real comprueba `health`, carga del Top 100 y, opcionalmente, envío real + aparición en ranking + bloqueo de duplicado con `FUTBOL11_GLOBAL_RANKING_WRITE_QA=1`.
- Expone `checkGlobalRankingHealth` y URLs puras de `health`/`top` en `globalRankingService`.
- Documenta el flujo de prueba real con PowerShell sin commitear `.env.local`.
- Actualiza versionado a `v0.23.0d` / `0.23.0-d.0`.
- No toca balance, ratings históricos, plantillas, reglas de recompensa ni ranking local.

## v0.23.0c — Team power progression QA

- Centraliza el cálculo de poder de carrera en `src/career/teamPower.ts`.
- El premio de entrenador `+0.5` se refleja en todas las valoraciones visibles y llega al rating que usa la simulación.
- La pantalla de resumen diferencia rating base, bonus activo, rating de temporada y rating simulado.
- `LeagueSimulatorView` reutiliza el mismo cálculo compartido para compresión de carrera y dificultad.
- Añade `npm run qa:team-power` y lo integra en `npm run qa:tech-debt`.
- No toca balance base, ratings históricos, plantillas, reglas de recompensa ni ranking global.

## v0.23.0b — Global ranking backend Apps Script

- Añade backend mínimo copiables a Apps Script en `apps-script/globalRankingBackend.gs`.
- Conecta el frontend a `VITE_GLOBAL_RANKING_ENDPOINT` para envío real y carga Top 100 desde Google Sheets + Apps Script.
- Interpreta respuestas de Apps Script con `ok/status/message/entry/entries` y clasifica duplicados sin romper Game Over.
- Mantiene ranking local y guardado normal separados.
- Amplía `npm run qa:global-ranking` con casos de envoltorio Apps Script, duplicados y carga de Top 100.
- Actualiza versionado a `v0.23.0b` / `0.23.0-b.0`.
- No toca balance, ratings históricos, plantillas, simulación ni reglas de recompensa.

## v0.23.0a — Global ranking foundation

- Prepara el contrato frontend del ranking global sin conectar todavía backend real.
- Añade servicio `globalRankingService` con submit/load, validación de payload, orden Top 100, timeout y manejo de errores.
- Añade almacenamiento separado para último nick y carreras ya enviadas desde este navegador.
- Añade panel de envío en Game Over y pantalla `Ranking global` en estado preparado/pendiente de backend.
- Añade `npm run qa:global-ranking` y lo integra en `npm run qa:tech-debt`.
- No toca balance, ratings históricos, plantillas, simulación, ranking local ni reglas de recompensa.

## v0.22.9c — Tech debt version cleanup

- Alinea la versión visible del juego con `appVersion.ts`: `v0.22.9c`.
- Actualiza `package.json` y `package-lock.json` a `0.22.9-c.0`, formato semver válido para representar la fase `v0.22.9c`.
- Añade `npm run qa:version` para auditar consistencia entre app, paquete, lockfile, README, CHANGELOG y doc de fase.
- Añade `npm run qa:tech-debt` para encadenar QA de versión, recompensa y ranking local.
- Documenta la fase en `docs/v0_22_9c_TECH_DEBT_VERSION_CLEANUP.md`.
- No toca balance, ratings históricos, plantillas, simulación ni ranking global.

## v0.22.9b — Special reward player-only fix

- El premio especial de Jugador + alineación ya permite mantener la formación actual y cambiar solo el jugador.
- La pantalla de cambio compatible incluye una opción explícita `Mantener formación`.
- El draft posterior al cambio de formación bloquea colocaciones falsas de línea: un MP puro ya no puede cubrir un hueco de delantero.
- La asignación de posición prioriza la posición natural de la línea del slot antes que comodines tácticos.
- QA de recompensa ampliada: mantener formación, hueco exacto del jugador retirado y bloqueo de MP puro como delantero.
- No toca balance, ratings históricos, plantillas ni simulación de Liga/Copa.

## v0.22.9a — Local ranking UX QA

- Muestra el rango de temporadas de cada carrera en el Top local (ejemplo `2025/26–2027/28`).
- Vista móvil del ranking en tarjetas apiladas con etiquetas, sin scroll horizontal.
- Amplía `npm run qa:career-ranking` con persistencia tras recarga simulada, desempates por mejor posición y fecha, datos corruptos, borrado y rango de temporadas.
- Verifica automáticamente que guardar/borrar ranking no toca el guardado normal de partida (claves de `localStorage` separadas).
- Sin backend, sin ranking global, sin cambios de balance ni de simulación.

## v0.22.9 — Local ranking basic

- Guarda automáticamente la carrera al llegar a Game Over.
- Persiste en `localStorage` temporadas superadas, puntos arcade, palmarés, mejor posición, última temporada, versión del juego y fecha.
- Añade pantalla Top local ordenada por puntos arcade, temporadas superadas y palmarés.
- Añade botones `Nueva carrera`, `Ver ranking local` y `Borrar ranking local`.
- Añade `npm run qa:career-ranking` para validar cálculo, orden, límite Top 100 y campos obligatorios.
- Sin backend, sin ranking global, sin tocar balance, ratings históricos ni plantillas.

## v0.22.8a — Career reward cancel snapshot fix

- Guarda snapshot completo al entrar en recompensa de carrera.
- Cancelar `Jugador + alineación` restaura formación, once, entrenador, rating visible, Media XI y estado de carrera ya avanzado.
- Bloquea estados 12/11, duplicados y slots inexistentes en el flujo de recompensa.
- Amplía `npm run qa:formation-reward` con pruebas automáticas de cancelación segura.
- No toca balance, ratings históricos, plantillas ni ranking local.

## v0.22.8 — Game Over arcade summary

- Añade resumen arcade en Game Over con temporadas superadas, palmarés y puntuación.
- Corrige mojibake visible en textos de estado y radar de draft.
- No toca simulación, balance, Supercopa ni ratings históricos.

## v0.22.7 — QA formation reward script

- Añade `npm run qa:formation-reward` para validar automáticamente el premio de cambio de formación.
- Cubre desbloqueo por Liga, Copa y Supercopa + Europa, y bloqueo de Supercopa sin Europa.
- Comprueba que 4-3-3 → 4-2-4 no recoloca jugadores conservados fuera de su línea natural.
- No toca gameplay público, simulación, balance ni ratings.


## v0.22.6 — Formation line strict fix

- Fix: el premio Jugador + alineación ya no recoloca jugadores conservados fuera de su línea natural.
- Fix: el hueco reservado para el draft corresponde a la línea que debe cubrir el sustituto.
- Fix: ganar Liga se comunica como premio especial en la pantalla de temporada.


## v0.22.5 — Formation reward replacement slot fix

- Corrige el flujo de premio Jugador + alineación: elegir jugador saliente → elegir formación compatible → draft del sustituto → aplicar o cancelar y avanzar.
- Las formaciones compatibles reservan un hueco válido para el jugador eliminado.
- El draft posterior exige un sustituto natural de la línea abierta para evitar recolocaciones forzadas fuera de rol.
- Sin cambios en simulación ni balance.

## v0.22.1 — Formation change reward

- Añadido cambio de formación compatible como recompensa especial entre temporadas.
- Se desbloquea si Athletic gana Liga, gana Copa, o gana Supercopa y además se clasifica para Europa.
- La Supercopa por sí sola no salva la temporada ni desbloquea formación si no hay objetivo europeo.
- Solo se muestran formaciones que mueven como máximo un jugador entre defensa, medio y ataque.
- El once actual se recoloca automáticamente en puestos válidos antes de continuar.
- No toca simulación, balance, rating efectivo, ascensos/descensos ni reglas de Supercopa.

## v0.22.0d — Career QA and copy polish

- Objetivo cumplido más concreto en modo carrera: Champions, Europa League, Conference o Copa.
- Copy de Game Over más arcade y explícito.
- La pantalla entre temporadas reutiliza el motivo concreto del objetivo.
- Documentada la validación jugable de Supercopa, recompensa, media/rating y Game Over.
- Sin cambios en simulación, balance, rating efectivo, ascensos/descensos ni Supercopa.

## v0.22.0b — Career rating display fix

- Añadida Media XI actual en la pantalla de temporada superada.
- Renombrado "Media visible equipo" a "Rating visible equipo" para evitar confusión.
- Sin cambios en simulación, balance, Supercopa ni calendario.

## v0.22.0a — Supercopa basic

- Añadida Supercopa básica en modo carrera.
- Participan 1.º y 2.º de Liga + campeón y subcampeón de Copa.
- Si hay duplicados, la plaza se rellena con el siguiente mejor clasificado de Liga.
- Si Athletic está clasificado, juega semifinal y posible final antes de la siguiente Liga.
- Ganar Supercopa suma +2 al palmarés, pero no salva la temporada ni afecta a Europa.
- No toca balance base de Liga/Copa ni rating efectivo.


## v0.21.0l — Final summary polish

- Pulida la pantalla final de temporada para dar más sensación de cierre/recompensa.
- Añadido titular más claro en carrera, subtítulo de objetivo cumplido y CTAs superiores compactos.
- Reordenadas las estadísticas clave, Copa, entrenador, rating y jugadores destacados.
- No toca simulación, balance, carrera, ascensos/descensos ni calendario dinámico.


## v0.21.0k — Career preview cleanup

- Eliminado el botón “Jugar partida rápida” de la pantalla informativa del modo carrera.
- La pantalla de carrera queda centrada en empezar carrera o volver.
- Sin cambios en simulación, calendario, ascensos/descensos ni balance.

## v0.21.0j — Desktop home simplification

- Simplificada la portada de escritorio en layout de dos columnas.
- Añadidos chips informativos de Liga, Copa y modo carrera.
- Reordenadas acciones principales para reducir fricción visual en PC.
- Sin cambios en simulación, carrera, ratings, ascensos/descensos ni calendario.


## v0.21.0i — Mobile home simplification

- Simplificada la portada pública en móvil con enfoque tipo app.
- CTA principal más claro para nueva partida y modo carrera.
- “Cómo se juega” pasa a bloque plegable.
- Apoyo, feedback y versión quedan más discretos.
- No se toca la lógica de simulación, carrera, ascensos/descensos ni rating efectivo.

## v0.22.4 — Career exit copy and coach layout fix

- Refuerza el copy de salida de carrera como `Salir`.
- Corrige el layout de la ficha de entrenador en el resumen completo para separar nombre, temporada, media/bonus y especialidad.
- No toca simulación, balance, Supercopa ni recompensas.


## v0.21.0h — Career dynamic calendar fix

- Corrige el bloqueo al iniciar la segunda temporada de modo carrera tras aplicar ascensos/descensos.
- El calendario de carrera ahora se genera con los 19 rivales actuales de Primera, incluyendo ascendidos y excluyendo descendidos.
- Los equipos ascendidos pueden jugar partidos de Liga y rival-vs-rival con sus ratings propios.
- No toca rating efectivo 0.55, partida rápida, Supercopa ni Europa jugable.


## v0.21.0g — Dynamic promotion pool

- Añadida bolsa dinámica de Segunda División en modo carrera.
- Los descendidos entran en la bolsa y pueden volver a ascender en temporadas futuras.
- Los ascendidos salen de la bolsa mientras juegan en Primera.
- Añadido bloque visual de ascensos y descensos en pantalla entre temporadas.
- No se toca rating efectivo, Supercopa, Europa ni partida rápida.

## v0.21.0f — Career promotion and summary fix

- En modo carrera, los 3 equipos descendidos dejan de estar en la Liga de la temporada siguiente.
- Se incorporan 3 equipos ascendidos desde una bolsa de Segunda/clubes candidatos para mantener una liga de 20 equipos.
- El botón `Ver resumen completo` ya no corta la continuidad del modo carrera: permite volver a la pantalla de carrera para continuar.
- Mantiene la compresión de rating efectiva de v0.21.0e.

## v0.21.0e — Career effective rating balance

- Añade rating efectivo solo para modo carrera con compresión de élite: `80 + (rating - 80) * 0.55`.
- Mantiene intactas las medias visibles de jugadores, el resumen del equipo, la partida rápida y el balance base de Liga/Copa.
- La compresión se aplica justo antes de simular Liga/Copa en carrera, para probar un modo carrera más realista y menos propenso a dobletes consecutivos.

## v0.21.0d — Critical audit fixes

- Corrige el bonus de entrenador en Copa: el contexto de simulación conserva `selectedCoach`, por lo que entrenadores con `cup >= 86` aplican el +1 previsto.
- Corrige mojibake visible en textos de formaciones y comentarios/errores de Copa.
- Corrige 11 posiciones duplicadas en plantillas históricas (`["LI", "LI"]`, `["LD", "LD"]`) con secundarios conservadores.
- Protege el guardado/borrado de historial con `try/catch` para evitar rupturas por `localStorage`.
- Elimina backups/copias sueltas sin referencias de código activo.

## v0.21.0c — Interseason rewards

- Añade pantalla entre temporadas tras superar objetivo en modo carrera.
- Permite continuar carrera cambiando 1 jugador o cambiando entrenador.
- El cambio de jugador obliga a elegir a quién sacar, sortea una temporada histórica y permite fichar un sustituto compatible.
- Mantiene el bucle Liga + Copa para la siguiente temporada.
- Actualiza marcador de temporadas superadas y palmarés básico de Liga/Copa/Supercopa.
- No introduce todavía ranking global, Supercopa jugable ni Europa jugable.


## v0.21.0b — Career flow basic

- El modo carrera Athletic ya permite iniciar una carrera básica desde 2025/26.
- Reutiliza el flujo validado de formación, draft, entrenador, Liga y Copa.
- Evalúa objetivo de carrera al terminar la temporada: Europa o Copa, con descenso como Game Over duro.
- Añadidas pantallas básicas de temporada superada y Game Over de carrera.
- El entrenador queda validado al seleccionarlo; se elimina el paso redundante de confirmar entrenador.
- Sin recompensas entre temporadas, Supercopa, ranking global ni Europa jugable todavía.

## v0.21.0a — Career rules skeleton

- Añadidos tipos mínimos de modo carrera.
- Añadidas reglas puras para objetivo, clasificación europea, dificultad, palmarés y cambio de formación compatible.
- Documentación añadida en `docs/v0_21_0a_CAREER_RULES_SKELETON.md`.
- Sin integrar todavía flujo jugable de carrera, ranking global ni Google Apps Script.
- Sin cambios en motor, Liga, Copa, ratings, draft ni simulación.

## v0.20.0 — Pre-career foundation

- Entrada visual para `Modo carrera Athletic`.
- Pantalla informativa con reglas cerradas del futuro modo carrera.
- Documentación añadida en `docs/v0_20_0_PRE_CAREER_FOUNDATION.md`.
- Sin cambios en motor, Liga, Copa, ratings, draft ni simulación.

## v0.19.0 — Beta pública estable

- Cambio de estado visible a `Beta pública`.
- Portada reescrita para usuario nuevo.
- Añadido botón `Compartir juego`.
- Mantenido botón `Enviar feedback` con Google Forms.
- README actualizado para publicación pública.
- Sin cambios en motor, Liga, Copa, ratings, draft ni simulación.

## v0.18.7 — Public copy and feedback form

- Feedback conectado a Google Forms.
- Limpieza de textos internos de beta local.

## v0.18.6 — Public feedback and coach confirm top

- Botón de confirmar entrenador colocado arriba.
- Canal de feedback público añadido.

## v0.18.5 — Scroll reset on phase change

- Reset automático de scroll al cambiar de fase.

## v0.18.4 — UI clarity and mobile results polish

- Mejor explicación visual del bonus de entrenador.
- Resultado final móvil más compacto.

## v0.18.3 — Coach bonus balance fix

- Bonus de entrenador ajustado por rating y especialidad.

## v0.18.1 — Mobile draft layout fix

- Lista de jugadores más accesible en móvil.
- Campo y habilidades bajan de prioridad en mobile.

## v0.22.0c — Career rewards polish

- Clarifica el tipo de recompensa entre temporadas según el mérito conseguido.
- Distingue recompensa estándar por Europa, premio copero, premio mayor por Liga y Supercopa como palmarés sin recompensa extra.
- Mantiene estable la lógica: cambiar 1 jugador o cambiar entrenador.
- No toca simulación, balance, calendario dinámico, Supercopa ni rating efectivo.

## v0.22.2 - Career reward flow fix

- Elimina el botón Volver al inicio de la pantalla final de temporada para evitar salidas accidentales.
- Reordena los premios: sin título, jugador o entrenador; con título, jugador + alineación o entrenador +0.5.
- El cambio de alineación se decide después de elegir el jugador que sale, evitando bloqueos como 3-3-4 sin opciones.
- El premio de entrenador +0.5 permite cambiar entrenador o mantener el actual aplicando igualmente el bonus.
- Cancelar una rama de recompensa ya iniciada avanza a la siguiente temporada conservando plantilla/formación actual; no vuelve a recompensas.

## v0.22.3 - Career reward lock and recalc fix

- Cambia los botones de salida de carrera de "Volver al inicio" a "Salir" para reducir abandonos accidentales.
- Refuerza el bloqueo de ramas de recompensa: cancelar tras elegir una mejora avanza a la siguiente temporada y no vuelve a "Toca decidir".
- Recalcula la media/rating visible tras cambiar jugador, formación o entrenador.
- Mantiene intactos simulación, balance, Supercopa, ascensos/descensos y ratings históricos.
