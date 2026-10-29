# v0.25.74 — El partido se explica

## Petición

Que el juego no parezca solo azar después de crear el equipo. Esta es la fase 1 de la auditoría de control (bloque A: A1, A2 y A3): el partido se explica sin cambiar ningún resultado.

## Cambio

### A1 · Previa del partido

- **`src/simulation/matchEngine.ts`:** `estimateMatchOdds` simula el mismo partido 300 veces con semillas fijas (1 a 300) y devuelve la probabilidad de victoria, empate y derrota en 90 minutos. Usa todas las reglas del motor, y el partido real se sigue jugando con su propia semilla.
- **`src/simulation/leagueSimulator.ts`:** `getNextUserMatchPreview` prepara la previa del partido de Copa pendiente o, si no hay, del siguiente de Liga. Usa el mismo rival, campo y ajustes que el partido real: la forma de temporada del rival en Liga; en Copa, el contexto de ronda y el +1 del entrenador.
- **`src/europe/europeanMatchEngine.ts`:** `estimateEuropeanMatchOdds` hace lo mismo para Europa.
- **`src/components/MatchOddsBar.tsx` (nuevo) y `.css`:** barra de victoria, empate y derrota, y el texto «Eres favorito», «El rival es favorito» o «Partido igualado».
- **`LeagueSimulatorView.tsx`:** la previa va en la tarjeta «Próximo paso»: competición, jornada o ronda, campo, equipos en orden local-visitante con su media, y probabilidades. En Copa avisa de que es en 90 minutos y de que un empate va a la prórroga.
- **`EuropeanMatchEvent.tsx`:** probabilidades bajo la previa europea. En semifinal y final avisa de la prórroga y los penaltis.

### A2 · Factor que decidió el partido

- **`src/types/game.ts`:** tipo `MatchKeyFactor` y campo opcional `keyFactor` en `MatchResult`. Las partidas guardadas antiguas no lo tienen y no muestran frase.
- **`matchEngine.ts`:** `getMatchKeyFactor` elige el factor a partir de lo que ya ha pasado en `simulateMatch`, sin tirar ningún número aleatorio:
  - el gol de mentalidad en un partido igualado;
  - el gol del rival que empata una victoria (`rivalClosedGap`);
  - el que convierte un empate en derrota (`upset`);
  - ser muy favorito y no ganar;
  - una victoria ante un rival superior;
  - tres o más goles;
  - la portería a cero;
  - el campo.
- **`src/components/matchSequenceTimeline.ts`:** `getMatchKeyFactorText` con una frase por factor. Las frases no nombran San Mamés, porque la Supercopa se juega en sede neutral.
- **`MatchSequence.tsx` y `EuropeanMatchEvent.tsx`:** la frase sale al acabar la secuencia. En Europa solo aparece si el partido se decidió en 90 minutos; la prórroga y los penaltis ya tienen su texto.
- **`src/europe/*`:** `keyFactor` pasa del resultado al partido europeo guardado.

### A3 · Empates de Copa y Supercopa

- **`leagueSimulator.ts` (Copa) y `src/career/supercopaRules.ts`:** el gol que deshace el empate se registra como evento entre el 91' y el 119', con una tirada aparte (`seededRandom(semilla + 7)`), y con el factor `extra_time_win` o `extra_time_loss`. El ganador y el marcador son los mismos que antes. En Copa, antes no había evento y el marcador cambiaba al final; en Supercopa, el evento estaba al 90'.
- **`MatchSequence.tsx`:** la insignia dice «Victoria en la prórroga» o «Derrota en la prórroga».
- **`SeasonBrackets.tsx`:** «Decidido en la prórroga» en el cuadro de Copa.

## Comprobación de que no cambia ningún resultado

Antes de tocar el motor guardé una foto temporal de los resultados y la comparé después del cambio:
- 4.800 partidos con `simulateMatch`: 6 rivales, en casa y fuera, semillas 1 a 400.
- 6 temporadas completas de Liga y Copa, con `Math.random` y `Date.now` fijados.
- 300 partidos europeos, con eliminatorias.

La foto anterior se generó dos veces para confirmar que era determinista. Resultado: mismos marcadores, ganadores, goleadores, minutos y clasificaciones. La única diferencia es la esperada: un empate de Copa que ahora tiene su gol de la prórroga como evento.

## Pruebas

- **`tests/unit/matchExplanation.test.ts` (nuevo):**
  - el factor es coherente con el resultado y tiene texto, en 400 partidos;
  - los empates de Copa tienen su gol de la prórroga entre el 91' y el 119', y los goles con minuto cuadran con el marcador;
  - las probabilidades suman 1, son estables y favorecen al mejor equipo, también en Europa;
  - la previa de inicio de temporada es la jornada 1 de Liga.
- **`tests/e2e/europe-supercopa.spec.ts`:** previa con probabilidades en Liga y en la previa europea, y factor tras el partido europeo.
- **Comprobación temporal en el navegador, a 1280 y 375 px:**
  - previa de la jornada 1: «Athletic Club Histórico (88) vs Atlético de Madrid (90) · Eres favorito · Victoria 44 % · Empate 37 % · Derrota 19 %», favorito por jugar en casa;
  - factor «Tu defensa dejó la portería a cero»;
  - previa europea con «Victoria 64 %»;
  - sin desbordamiento horizontal ni errores.

## Qué no cambia

Motor de partido (cálculo y tiradas), ratings, plantillas, reglas de Liga, Copa y Europa, balance y ranking.

## Validación

- `npm run typecheck` y `npx eslint src scripts` sin errores.
- `npm test` (120 tests) y `npm run qa:ci` en verde.
- `npx playwright test`: 15 tests en verde y 2 saltados.
