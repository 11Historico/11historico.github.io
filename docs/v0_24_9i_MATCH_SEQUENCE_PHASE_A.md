# v0.24.9i — Secuencia de partido, Fase A (Liga y Copa)

## Qué cambia

- La tarjeta de último resultado de Liga y Copa es ahora una secuencia: previa (1 s), juego (2,8 s con el reloj de 0' a 90' o hasta el último gol) y resultado final.
- Los goles aparecen en su minuto y el marcador parcial se actualiza con ellos.
- Botón "Saltar" para ir directo al resultado final.
- La auto-simulación espera a que termine la secuencia antes de jugar la siguiente jornada.
- Copa del Rey tiene tono granate y oro; Liga conserva su estilo actual.

## Lo que no cambia

- El motor de partidos, los resultados, las probabilidades y el balance. La secuencia solo reproduce los `goalEvents` que ya genera el motor.
- Europa: sigue con su propia tarjeta (`EuropeanMatchEvent`) hasta la Fase B.

## Archivos

- `src/components/matchSequenceTimeline.ts`: lógica pura de la línea de tiempo.
- `src/components/LeagueSimulatorView.tsx`: componente `MatchSequence` y cableado con la auto-simulación.
- `src/components/LeagueSimulatorView.css`: estilos de la secuencia y de la Copa.
- `scripts/qaMatchSequence.ts`: QA de la línea de tiempo y del cableado.
- `scripts/qaHooksSimulationDeps.ts`: dependencias del efecto de auto-simulación actualizadas.

## Validación

- `npm run qa:match-sequence` pasa.
- `typecheck` y `lint` pasan.
- `qa:tech-debt` completo pasa con `VITE_GLOBAL_RANKING_ENDPOINT=""`.
- En la app local: la simulación automática espera cada secuencia, el reloj avanza, los goles aparecen en su minuto y el resultado final coincide con el marcador.

## Pendiente (Fases B y C)

- Fase B: Europa con su tema, prórroga y penaltis en la secuencia.
- Fase C: velocidad configurable (Lento / Normal / Rápido) y revisión de contraste y de `prefers-reduced-motion`.
