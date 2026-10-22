# v0.24.9k — Secuencia de partido, Fase C (velocidad, contraste y movimiento reducido)

## Qué cambia

- Selector **Velocidad: Lento · Normal · Rápido** en la tarjeta de acciones de Liga. Se aplica a las secuencias de Liga, Copa y Europa y a la pausa entre partidos de la simulación automática.
  - Lento: x1,5 de duración. Normal: x1. Rápido: x0,5.
- La preferencia se guarda en el navegador (`once_historico_match_playback_speed_v1`). Si el almacenamiento no está disponible, dura hasta recargar.
- Contraste de texto y de barras comprobado con WCAG (ver abajo).
- Con `prefers-reduced-motion` la barra de progreso no hace transición y, como antes, la secuencia arranca directamente en el resultado final.

## Lo que no cambia

- El motor de partidos, los resultados, las probabilidades, el balance y los premios.
- La velocidad solo afecta al ritmo de presentación; la simulación es la misma a cualquier velocidad.

## Contraste

Cálculo WCAG sobre fondos aproximados de la tarjeta (fondo de la tarjeta, granate de la Copa y navy de Champions):

| Par | Ratio | Mínimo |
|---|---|---|
| Etiqueta de Liga `#f2d2d7` sobre tarjeta | 11,81 | 4,5 |
| Etiqueta de Copa `#f5d36a` sobre granate | 11,51 | 4,5 |
| Reloj blanco sobre chip | 10,74 | 4,5 |
| Texto en vivo (82 % blanco) sobre tarjeta | 11,46 | 4,5 |
| Opción activa `#451600` sobre `#ffe08a` | 11,90 | 4,5 |
| Opción inactiva (80 % blanco) | 8,52 | 4,5 |
| Barra de Liga `#ffe08a` sobre pista | 8,98 | 3 (no textual) |
| Barra de Copa `#e8b923` sobre pista | 6,29 | 3 (no textual) |
| Barra de Champions `#9ec5ff` sobre pista | 6,56 | 3 (no textual) |
| Barra de Europa `#ffb969` sobre pista | 6,84 | 3 (no textual) |
| Barra de Conference `#5fe1a0` sobre pista | 7,04 | 3 (no textual) |

## Archivos

- `src/components/matchPlaybackSpeed.ts`: preferencia de velocidad, guardada en el navegador y compartida entre componentes.
- `src/components/matchSequenceTimeline.ts` y `src/components/europeanMatchSequenceTimeline.ts`: duraciones escaladas por multiplicador.
- `src/components/LeagueSimulatorView.tsx`: componente `PlaybackSpeedControl` y pausa automática escalada.
- `src/components/EuropeanMatchEvent.tsx`: secuencia europea con la velocidad compartida.
- `src/components/LeagueSimulatorView.css` y `src/components/EuropeanMatchEvent.css`: selector y movimiento reducido.
- `scripts/qaMatchPlaybackSpeed.ts`: QA de multiplicadores, duraciones y cableado.
- `scripts/qaHooksSimulationDeps.ts`: dependencias del efecto de auto-simulación actualizadas.

## Validación

- `npm run qa:match-playback-speed` pasa.
- `typecheck` y `lint` pasan.
- `qa:tech-debt` completo pasa con `VITE_GLOBAL_RANKING_ENDPOINT=""`.
- En la app local: el selector aparece, cambia la opción activa, la preferencia persiste y una secuencia rápida dura unos 2 s.

## Cierre de la secuencia de partido

Con esta fase quedan cerradas las tres fases de la secuencia de partido (A: Liga y Copa; B: Europa; C: velocidad, contraste y movimiento reducido).
