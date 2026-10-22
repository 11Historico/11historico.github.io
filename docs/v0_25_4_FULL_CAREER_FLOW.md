# v0.25.4 — Prueba de flujo completo

Segundo paso de la red de pruebas (rol QA del informe). Añade una prueba de navegador que recorre una carrera completa. No cambia gameplay, balance, simulación ni ranking.

## Qué se añade

- **Partida guardada de prueba** (`tests/e2e/fixtures/career-weak.json`), generada por `npm run e2e:fixture` desde `scripts/buildE2eFixture.ts`. Equipo con los jugadores más flojos de la base de datos, para que la temporada termine sin objetivo cumplido. Es determinista: regenerarla produce el mismo archivo.
- **Prueba** (`tests/e2e/career-full-flow.spec.ts`): carga la partida guardada, pulsa "Continuar" y avanza con los botones que aparecen (Saltar, Continuar, Continuar temporada, Continuar carrera, Simular partido de Copa, Simular Copa y terminar temporada, Saltar hasta próximo evento). Si aparece la ruleta de temporada, la rechaza. Termina al ver el Game Over y comprueba que la pantalla explica el motivo (objetivo fallido o descenso). Falla si durante 10 intentos seguidos no hay ningún paso de avance, y muestra los botones y el texto de esa pantalla.

## Lo que no cubre todavía

- El draft: la prueba parte de una plantilla ya construida. Automatizar el draft es una prueba aparte.
- Europa: la partida de prueba no está clasificada, así que no aparece la noche europea.
- Carreras sanas (sobrevivir varias temporadas): solo se prueba el Game Over.

## Validación

- `npm run test:e2e`: 3 pruebas pasan (2 de humo y la de flujo completo, que tarda unos 3 s).
- `npm test`: 25 pruebas unitarias pasan.
- `typecheck`, `lint` y `qa:tech-debt` completo pasan con `VITE_GLOBAL_RANKING_ENDPOINT=""`.

## Para ejecutar en local

```bash
npm run build
npm run test:e2e
```
