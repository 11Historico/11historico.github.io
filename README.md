### v0.24.1c — European Tournament Calendar

- Añade el primer torneo europeo jugable: formato simplificado con fase inicial de 6 partidos, semifinal a partido único y final a partido único (`src/europe/europeanTournament.ts`).
- Rivales genéricos por competición (Champions League, Europa League, Conference League) con rating coherente por competición (`src/europe/europeanOpponents.ts`), sin nombres ni escudos reales.
- Reutiliza el motor de partidos existente (`src/simulation/matchEngine.ts`, sin modificarlo) para simular los partidos europeos (`src/europe/europeanMatchEngine.ts`); el rating de usuario y de rival, y la ventaja de local, influyen en el resultado igual que en Liga/Copa.
- Integra los partidos europeos como eventos dentro del calendario de Liga (`src/europe/europeanCalendar.ts`, `LeagueSimulatorView`): se reparten en jornadas fijas (o proporcionales si la Liga tiene otro tamaño), detienen la simulación automática y "saltar hasta el próximo evento", y muestran una tarjeta de evento ("Noche europea") para simular el partido y ver el resultado y el estado del torneo.
- El torneo se crea solo si la carrera está clasificada para Europa, persiste dentro de `europeanCareer.currentTournament`, y no se duplica al continuar la carrera ni al recargar una partida guardada. Las partidas antiguas sin este campo cargan sin romperse.
- Todavía NO suma títulos europeos al palmarés: ganar la final se registra solo internamente, con el texto "Campeón europeo pendiente de integración en palmarés".
- No cambia probabilidades, ratings históricos, balance de Liga/Copa/Supercopa ni funcionalidades existentes.
- Añade `qa:european-tournament`, `qa:european-match-engine` y `qa:european-calendar`, integradas en `qa:tech-debt` y en GitHub Actions.
- Actualiza versionado a `v0.24.1c` / `0.24.1-c.0`.

### v0.24.0c — Europa Qualification Foundation

- Añade la base de reglas puras de clasificación europea (`src/europe/europeanQualification.ts`): 1º-4º Champions League, 5º-6º Europa League, 7º Conference League, y la Copa del Rey garantiza como mínimo Europa League.
- Añade `EuropeanQualificationCard` y la integra en el resumen de temporada de carrera y en el resumen completo, mostrando la clasificación europea de la próxima temporada (sin dar a entender que ya se ha jugado).
- Añade persistencia del estado europeo dentro de la carrera (`europeanCareer`): histórico por temporada, mejor competición alcanzada y total de clasificaciones. Las partidas antiguas sin este campo cargan sin romperse.
- Todavía NO incluye partidos europeos, calendario, eliminatorias, simulación de torneos europeos ni ranking europeo. No suma títulos europeos al palmarés en esta fase.
- No cambia probabilidades, ratings históricos, balance de Liga/Copa/Supercopa ni funcionalidades existentes.
- Añade `qa:european-qualification`, `qa:european-qualification-ui` y `qa:european-persistence`, integradas en `qa:tech-debt` y en GitHub Actions.
- Actualiza versionado a `v0.24.0c` / `0.24.0-c.0`.

### v0.23.2c — Luck Wheel Real Rewards

- Ejecuta de verdad los premios de ruleta de cambio de jugador y cambio de entrenador.
- El premio de jugador pausa la simulación, permite retirar un jugador del once y elegir un sustituto compatible.
- El premio de entrenador pausa la simulación y permite elegir nuevo técnico o cancelar y volver a la Liga.
- El premio `+1 + jugador` mantiene el `ratingDelta` y además abre el cambio real de jugador.
- No cambia probabilidades, ratings históricos, palmarés, ranking ni Europa Career.
- Añade `qa:luck-wheel-real-rewards` e integra la QA en `qa:tech-debt`.
- Actualiza versionado a `v0.23.2c` / `0.23.2-c.0`.

### v0.23.3b — Hooks Simulation Deps Cleanup

Limpieza técnica de hooks y dependencias derivada de la auditoría: estabiliza el bucle de simulación automática, elimina errores de `react-hooks/set-state-in-effect`, deja `lint:src` sin errores/warnings y lo activa en GitHub Actions. No cambia gameplay, ratings, ruleta, palmarés ni ranking.

### v0.23.3a — Mobile Viewport Fix

Corrección móvil de bajo riesgo derivada de la auditoría: todas las reglas con `100vh` conservan fallback clásico y añaden `100dvh` para evitar cortes de contenido por barras dinámicas en navegadores móviles. Añade `qa:mobile-viewport` y la ejecuta en `qa:tech-debt` y GitHub Actions. No cambia gameplay, ratings, ruleta, palmarés ni ranking.

### v0.23.3 — Tech Health Baseline

Base técnica de higiene tras auditoría: typecheck explícito en build/CI, QA de salud técnica, ignores de ESLint para ruido histórico/temporal, Node 24 en workflow de Pages y protección de artefactos locales de auditoría. No cambia gameplay, ratings, ruleta, palmarés ni ranking.

### v0.23.2b6 — Luck Wheel Label Fit

Pulido de legibilidad de la ruleta: las etiquetas internas de premios se acortan para caber mejor en cada quesito (`Jug.`, `Entr.`, `+1`, `+0.5`, `-0.5`, `-1`) y la leyenda externa mantiene el texto completo. Además, la QA confirma que los efectos `+0.5`, `+1`, `-0.5` y `-1` ya se aplican al rating de temporada usado por la simulación cuando la ruleta fue aceptada.

### v0.23.2b5 — Palmarés Supercopa + Game Over Showcase

Revisión del palmarés de carrera: la vitrina usa todos los títulos acumulados, incluida Supercopa, y se muestra también en Game Over. El resumen completo de carrera recibe el palmarés visible con la temporada actual sumada.

### v0.23.2b4 — Luck Wheel Skip Event Fix

Hotfix de simulación rápida: al pulsar Saltar hasta próximo evento o simular de golpe, la temporada avanza internamente partido a partido y se detiene si cruza un trigger válido de Ruleta de la Suerte antes de los 2/3 de Liga. Evita que la primera temporada se salte la ruleta por simular demasiado lejos.

### v0.23.2b2 — Luck Wheel Readability and Arrow Speed

Pulido visual de la ruleta de temporada: etiquetas cortas dentro de los quesitos, leyenda de premios completos y flecha de precisión con velocidad progresiva. Mantiene 12 quesitos, puntero fijo, coherencia visual y probabilidades reales intactas.

### v0.23.2b1 — Luck Wheel Segments Polish

Pulido visual de la ruleta de temporada: 12 quesitos repartidos, puntero fijo, centro fijo, etiquetas más legibles y alineación entre resultado lógico, premio visible y segmento final. Mantiene las probabilidades reales del motor.

### v0.23.2b — Season Luck Wheel UI

UI jugable para la ruleta de temporada: modal contextual, premios visibles, animación de giro, barra de precisión con flecha móvil, botón parar, rechazo sin efecto, pausa de simulación automática y aplicación de `ratingDelta` al poder de temporada. Los cambios reales de jugador/entrenador quedan registrados como premio para una iteración posterior.

### v0.23.2a — Season Luck Wheel engine

Motor lógico de la ruleta de temporada antes de la UI animada: máximo 1 uso por temporada, probabilidades 40/40/20, premios internos definidos, barra de precisión que favorece el centro y castiga extremos, textos narrativos y `npm run qa:season-luck-wheel`. No integra todavía modal/animación ni pausa real de simulación.

### v0.23.1a — Agentjacking guardrails

Seguridad operativa antes de Europa Career: añade reglas anti-agentjacking en `AGENTS.md`, trata archivos/parches/logs como entrada no confiable, protege secretos y Git, y añade `npm run qa:agentjacking` dentro de `qa:tech-debt`.

### v0.23.1 — Release stabilization

Versión estable post-ranking global real: congela la base antes de Europa Career, añade `npm run qa:release-stabilization`, protege endpoints locales y valida que fuentes/docs/dist no filtren Deployment IDs reales de Apps Script.

### v0.23.0e — Global ranking UI polish

Pulido UX del ranking global real: permite guardar la URL `/exec` de Apps Script desde el navegador, recargar el Top 100, mejorar mensajes de backend pendiente/ranking vacío y añadir `npm run qa:global-ranking-ui`.

### v0.23.0d — Global ranking real submit QA

Valida el ranking global real conectado a Apps Script: health, carga de Top 100 y smoke test opcional de escritura/duplicados con `npm run qa:global-ranking-real`.

### v0.23.0c — Team power progression QA

Asegura que las mejoras de equipo afectan al poder real usado por la simulación: rating base, bonus de entrenador `+0.5`, ratings por línea y dificultad quedan centralizados en `teamPower.ts`, visibles en el resumen y cubiertos por `npm run qa:team-power`.

### v0.23.0b — Global ranking backend Apps Script

Conecta el ranking global a un backend real mínimo con Google Sheets + Apps Script. Añade el script `apps-script/globalRankingBackend.gs`, configuración por `VITE_GLOBAL_RANKING_ENDPOINT`, envío real desde Game Over, carga Top 100, manejo de duplicados y QA ampliada.

### v0.23.0a — Global ranking foundation

Base frontend del futuro ranking global: contrato de envío/carga, validación de nick, pantalla Top global pendiente de backend, panel de Game Over para enviar carrera, storage separado de último nick/carreras enviadas y `npm run qa:global-ranking`. Todavía sin Apps Script/Supabase/Firebase real.

### v0.22.9c — Tech debt version cleanup

- Versión visible y versión npm alineadas antes de abrir ranking global.
- `package.json` usa `0.22.9-c.0` porque `0.22.9c` no es semver válido.
- Añade `npm run qa:version` y `npm run qa:tech-debt`.
- README, CHANGELOG y doc de fase auditados por QA.

### v0.22.9b — Special reward player-only fix

- Premio especial: permite mantener formación y cambiar solo jugador.
- Bloquea MP puro colocado como delantero en drafts estrictos por línea.
- QA de recompensa ampliada.

### v0.22.9a — Local ranking UX QA

El Top local muestra el rango de temporadas de cada carrera (`2025/26–2027/28`), se adapta a móvil con tarjetas apiladas y amplía `npm run qa:career-ranking` con QA de persistencia, desempates, datos corruptos, borrado y separación del guardado normal de partida.

### v0.22.9 — Local ranking basic

Modo carrera guarda automáticamente el Game Over en un ranking local del navegador. El Top local ordena por puntos arcade, temporadas superadas y palmarés; incluye botones de nueva carrera, ver ranking local y borrar ranking local. Sin backend ni ranking global todavía.

### v0.22.8 — Game Over arcade summary

Game Over muestra resumen arcade de carrera: temporadas superadas, causa de eliminación, palmarés y puntos. También corrige mojibake visible.

## v0.22.7 — QA formation reward script

- Añade `npm run qa:formation-reward` para validar automáticamente el premio de cambio de formación.
- Cubre desbloqueo por Liga, Copa y Supercopa + Europa, y bloqueo de Supercopa sin Europa.
- Comprueba que 4-3-3 → 4-2-4 no recoloca jugadores conservados fuera de su línea natural.
- No toca gameplay público, simulación, balance ni ratings.


## v0.22.6 — Formation line strict fix

- Fix: el premio Jugador + alineación ya no recoloca jugadores conservados fuera de su línea natural.
- Fix: el hueco reservado para el draft corresponde a la línea que debe cubrir el sustituto.
- Fix: ganar Liga se comunica como premio especial en la pantalla de temporada.

# Futbol11 — Once histórico Zurigorri

Juego web en React + TypeScript para construir un once histórico del Athletic Club, elegir entrenador y simular LaLiga 25/26 + Copa del Rey.

## Estado actual

Versión pública actual: `v0.25.54_STABLE_PUBLIC_RELEASE`.

Base jugable cerrada:

- `v0.15.8_BALANCE_LIGA_OK`: balance de Liga aceptado y congelado.
- `v0.16.0_COPA_DEL_REY_REALISTA_OK`: Copa del Rey realista aceptada y congelada.
- `v0.18.7_PUBLIC_COPY_AND_FEEDBACK_FORM`: beta online con formulario público de feedback.

No reabrir balance de Liga/Copa salvo decisión expresa.

## Enlace online

GitHub Pages:

```text
https://ikeritu.github.io/11Historico/
```

## Qué incluye

- Histórico Athletic 1928/29–2025/26, sin temporadas sin Liga nacional.
- Modo Fácil con selector de rangos históricos.
- Modo Normal.
- Modo Leyenda.
- Draft histórico con variedad de temporadas.
- Validación de posiciones y jugadores repetidos.
- Entrenadores históricos con bonus visible y ajustado.
- Simulación visual con botón único `Simular` / `Parar simulación`.
- LaLiga 25/26 balanceada.
- Copa del Rey con factor sorpresa.
- Resultado final con clasificación, Copa, historial del navegador y mejor partida.
- UX móvil pulida para draft, entrenador y resultado final.
- Botón de feedback público mediante Google Forms.
- Botón para compartir el juego.
- Entrada informativa de Modo carrera Athletic en preparación.
- Reglas puras del modo carrera preparadas para el MVP jugable.
- Ranking local de mejores carreras guardado en el navegador.
- Ranking global preparado para Google Sheets + Apps Script mediante `VITE_GLOBAL_RANKING_ENDPOINT`.
- QA de ranking global real: health, Top 100, envío opcional y duplicados contra Apps Script.
- QA de estabilización de release para proteger endpoints locales y evitar filtrado de Deployment IDs reales.
- Guardarraíles anti-agentjacking: archivos/parches/logs como entrada no confiable, secretos protegidos y Git seguro.
- Poder de equipo de carrera centralizado: Media XI, rating visible, entrenador y bonus temporal influyen en la simulación.
- Flujo básico de carrera con copy de objetivo corregido y techo de media ajustado.
- Flujo básico de una temporada de carrera conectado a Liga y Copa.
- Supercopa básica en modo carrera con 1.º/2.º de Liga + finalistas de Copa.
- Pantalla de carrera con Media XI, rating visible, recompensas explicadas y copy de objetivo/Game Over pulido.
- Cambio de formación compatible como premio por ganar Liga, Copa, o Supercopa + clasificación europea.
- Cancelación segura de `Jugador + alineación` mediante snapshot completo de recompensa.
- Europa Career completa: clasificación según el reparto de 7 plazas de LaLiga (con reasignación por campeón de Copa), torneo jugable con fase inicial, semifinal y final, prórroga y penaltis en eliminatorias, títulos y prestigio en el palmarés.
- Secuencia de partido en Liga, Copa y Europa: previa, reloj, goles en su minuto (Liga y Copa), prórroga y penaltis (Europa) y resultado final, con velocidad Lento / Normal / Rápido guardada en el navegador.
- Ruleta de temporada con la etiqueta de cada quesito centrada en su premio, de forma que el premio que se aplica coincide con el que señala la flecha.

## Cómo se juega

1. Elige dificultad.
2. En Modo Fácil, elige rango de temporadas.
3. Elige formación.
4. Completa el draft de 11 jugadores.
5. Elige entrenador.
6. Revisa el Athletic Club histórico creado.
7. Simula Liga y Copa.
8. Consulta el resultado final y comparte feedback si quieres.

## Requisitos para desarrollo

- Node.js 20 o superior recomendado.
- npm.

## Instalación local en Windows

```powershell
cd "D:\Proyectos\⚽ Futbol11"
npm.cmd install
```

## Arranque local

```powershell
npm.cmd run dev
```

## Ranking global con Apps Script

Para activar el ranking global real, crea `.env.local` en la raíz del proyecto:

```env
VITE_GLOBAL_RANKING_ENDPOINT=https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec
```

El backend copiables está en:

```text
apps-script/globalRankingBackend.gs
```

Guía completa:

```text
docs/GLOBAL_RANKING_APPS_SCRIPT_SETUP.md
```


Abre la URL que indique Vite, normalmente:

```text
http://localhost:5173/
```

## QA técnica rápida

```powershell
npm.cmd run qa:version
npm.cmd run qa:release-stabilization
npm.cmd run qa:agentjacking
npm.cmd run qa:formation-reward
npm.cmd run qa:career-ranking
npm.cmd run build
```

## Build de producción

```powershell
npm.cmd run build
```

## Auditorías

Balance Liga:

```powershell
npm.cmd run audit:balance:100
```

Copa del Rey:

```powershell
npm.cmd run audit:copa:100
```

## QA ranking global real

Con `.env.local` configurado:

```powershell
npm.cmd run qa:global-ranking-real
```

Para ejecutar también un envío real de prueba al Google Sheet:

```powershell
$env:FUTBOL11_GLOBAL_RANKING_WRITE_QA = "1"
npm.cmd run qa:global-ranking-real
Remove-Item Env:FUTBOL11_GLOBAL_RANKING_WRITE_QA
```

La prueba de escritura crea una entrada QA real y después verifica que el segundo envío queda bloqueado como duplicado.

## Despliegue en GitHub Pages

El repositorio debe usar:

```text
Settings → Pages → Source: GitHub Actions
```

El workflow `.github/workflows/deploy.yml` compila el proyecto y publica `dist/`.

## Mantenimiento

No subir al repositorio:

- `node_modules/`
- carpetas `_export*`
- archivos `.zip` o `.rar`

`dist/` puede regenerarse con `npm.cmd run build`.

## Nota sobre datos

Las plantillas combinan fuentes oficiales, referencias históricas y estimaciones para gameplay. Los ratings no son datos oficiales: son valores internos para equilibrar el juego.

## Changelog breve

### v0.21.0k — Career preview cleanup

- Corrige el bloqueo al simular la segunda temporada de carrera.
- Genera el calendario de carrera con la Primera actual tras ascensos/descensos.
- Permite que los ascendidos compitan correctamente en Liga.

### v0.21.0e — Career effective rating balance

- Añade compresión de rating efectiva solo en modo carrera: los ratings visibles se mantienen intactos, pero los valores superiores a 80 se simulan con la fórmula `80 + (rating - 80) * 0.55`.
- La compresión se aplica únicamente al rating usado por la simulación de Liga/Copa en carrera; partida rápida y ratings históricos visibles no se rebajan.
- Objetivo: reducir dobletes demasiado frecuentes sin tocar el balance histórico ya cerrado.

### v0.21.0d — Critical audit fixes

- Modo carrera básico jugable para una temporada.
- Inicio desde 2025/26 reutilizando formación, draft, entrenador, Liga y Copa.
- Evaluación de objetivo al final de temporada: Europa o Copa; descenso = Game Over.
- Pantallas básicas de temporada superada y Game Over de carrera.
- El entrenador se valida directamente al seleccionarlo, sin botón extra de confirmación.
- Sin recompensas, Supercopa, ranking global ni Europa jugable todavía.

### v0.21.0a — Career rules skeleton

- Añadidos tipos mínimos de modo carrera.
- Añadidas reglas puras para objetivo, clasificación europea, dificultad, palmarés y cambio de formación compatible.
- Documentación interna de carrera en `docs/v0_21_0a_CAREER_RULES_SKELETON.md`.
- Sin integrar todavía flujo jugable de carrera, ranking global ni Google Apps Script.
- Sin cambios en motor, Liga, Copa, ratings, draft ni simulación.

### v0.20.0 — Pre-career foundation

- Entrada visual para `Modo carrera Athletic`.
- Pantalla informativa con reglas cerradas de carrera.
- Documentación interna de carrera en `docs/v0_20_0_PRE_CAREER_FOUNDATION.md`.
- Sin cambios en motor, Liga, Copa, ratings, draft ni simulación.

### v0.19.0 — Beta pública estable

- Portada orientada a usuario público.
- Estado visible cambiado a `Beta pública`.
- Botón `Compartir juego`.
- Feedback público mediante Google Forms.
- README público actualizado.
- Changelog simple incorporado.
- Sin cambios en motor, Liga, Copa, ratings, draft ni simulación.

### v0.18.x — Beta online

- Publicación en GitHub Pages.
- Layout móvil del draft mejorado.
- Atajo móvil para ver formación.
- Bonus de entrenador corregido y explicado.
- Resultado final móvil más compacto.
- Reset de scroll al cambiar de fase.
- Formulario público de feedback.

### v0.16.x — Base UX y beta local

- Copa del Rey realista cerrada.
- Pantalla final y portada pulidas.
- Botones de apoyo integrados.

### v0.15.x — Balance Liga cerrado

- Balance de Liga validado y congelado.


## v0.21.0k — Career preview cleanup

La portada de escritorio se simplifica en dos columnas: presentación del juego a la izquierda y acciones principales a la derecha. No toca lógica de simulación ni modo carrera.

## v0.21.0l — Final summary polish

- Pulida la pantalla final de temporada para dar más sensación de cierre/recompensa.
- Añadido titular más claro en carrera, subtítulo de objetivo cumplido y CTAs superiores compactos.
- Reordenadas las estadísticas clave, Copa, entrenador, rating y jugadores destacados.
- No toca simulación, balance, carrera, ascensos/descensos ni calendario dinámico.


### v0.22.0c — Career rewards polish

Pulido de la pantalla entre temporadas del modo carrera: ahora explica mejor por qué el jugador recibe la recompensa y qué tipo de mérito ha conseguido. La lógica se mantiene controlada: cambiar un jugador o cambiar entrenador.

### v0.22.2 - Career reward flow fix

- Final de temporada sin botón directo de salida accidental.
- Premios revisados: sin título, jugador o entrenador; con título, jugador + alineación o entrenador +0.5.
- Cambio de alineación después de elegir jugador saliente.
- Cancelar tras entrar en una rama de recompensa avanza a la siguiente temporada sin aplicar cambios.

### v0.22.3 - Career reward lock and recalc fix

- Botones de salida de carrera renombrados a "Salir".
- Cancelar una recompensa ya elegida avanza a la siguiente temporada y evita rerolls infinitos.
- Recalcula media/rating visible después de cambios de jugador, formación o entrenador.


### v0.22.5 — Formation reward replacement slot fix

- Ajusta el premio Jugador + alineación para que la nueva formación se calcule tras elegir el jugador saliente.
- El hueco reservado para el nuevo draft debe ser válido para el jugador eliminado y el sustituto debe ser natural para la línea abierta.
- Evita casos como colocar un mediapunta puro en una línea de delantero por un cambio de formación.
- No toca simulación, balance, Supercopa, ascensos/descensos ni ratings históricos.

### v0.22.4 — Career exit copy and coach layout fix

- Botones de salida de carrera claros como `Salir`.
- Ficha de entrenador en resumen completo con líneas separadas para evitar texto pegado.
