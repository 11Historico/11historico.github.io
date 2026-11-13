# v0.25.114 — Las cartas cuentan y el rival de Copa se explica

Salen de la temporada de prueba de la v0.25.113. El usuario pidió «haz la 1 y la 2».

## 1. El balance de decisiones cuenta las cartas

**Lo que fallaba:** el resumen de la temporada dijo «decidiste en 1 partido y ningún resultado habría sido distinto sin tocar nada», aunque una Revancha en Liga había convertido una derrota en empate. El balance (`decisionBalance.ts`, de la v0.25.96) es anterior a las cartas: solo contaba el planteamiento y el descanso, y solo miraba los partidos de Copa, Europa y Supercopa.

**Ahora:**
- **Una carta es una decisión.** Cuenta como partido decidido, y si la crónica dice que cambió el resultado, el resumen también.
- **Entran tus partidos de Liga con carta.** La temporada en juego los lee de la Liga, y el resumen final de `leagueCardResults`, un campo nuevo del resumen que guarda solo tus partidos de Liga con carta.
- **Cómo se compara, según la decisión:**
  - **Carta antes del partido:** con el mismo partido sin ella. Si además hubo planteamiento, ese partido sin carta lo conserva.
  - **Carta en el descanso:** se juega después de la decisión del descanso, así que se compara con el marcador antes del descanso o, si hubo planteamiento, con el partido equilibrado.
  - **Si arriesgar o cerrar el partido cambió el marcador,** el partido ya no guarda la comparación de la carta jugada antes, como ya pasaba con la del planteamiento. Se compara con el marcador antes del descanso.

## 2. En Copa, el rival que se crece se ve

**Lo que confundía:** en Copa, al elegir una carta, la media del rival subía (el Betis pasó de 83 a 84). Es el impulso del rival inferior (`applyCupRivalContext`): cuanto más favorito eres, más se crece el rival. No cambia: solo se explica.

**Ahora:**
- **Con una carta elegida, si el rival sube,** su media enseña de cuánto a cuánto, como la tuya, con «se crece» debajo: «78 → 79, se crece».
- **Al pasar el ratón:** «En Copa, el rival inferior se crece cuanto más favorito eres: con tu carta pasa de 78 a 79.»
- **La ayuda de la portada**, en «Cartas», lo dice.

En Liga y en Europa la carta no cambia al rival, así que no sale nada.

**Lo que no cambia:** ninguna media, el impulso de Copa, las cartas ni el motor.

## En el código

- **`decisionBalance.ts`:** `cardEffect` en `getOutcomes`.
- **`types/game.ts` y `leagueSimulator.ts`:** `FinalGameSummary.leagueCardResults`.
- **`CareerSeasonOutcome.tsx` y `LeagueSimulatorView.tsx`:** el balance recibe los partidos de Liga.
- **`LeagueSimulatorView.tsx`:** `PreviewTeams` tiene `rivalBaseOverall`, la media del rival sin la carta, que sale de la previa sin carta de la v0.25.112.
- **`GameHome.tsx`:** la frase de la ayuda.
- **`tests/unit/decisionBalance.test.ts`:** las cartas antes del partido y en el descanso, solas y con planteamiento o descanso.

## Comprobación

**En el navegador,** con la partida de prueba `career-strong` y tres cartas en la mano:
- **Copa, dieciseisavos en Almería:** con el +12, «Unión Deportiva Almería 78 → 79, se crece» y «Athletic Club Histórico 88 → 99». Bien a 1.440 y a 375 px; nada se sale de la pantalla.
- **Después del partido:** «decidiste en 1 partido…».
- **Con un +4 en la jornada 19 de Liga:** «decidiste en 2 partidos…». Antes, la Liga no contaba.
- **Sin errores en la consola.**

**Comprobaciones:** pasan `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` y `npm run test:e2e`.
