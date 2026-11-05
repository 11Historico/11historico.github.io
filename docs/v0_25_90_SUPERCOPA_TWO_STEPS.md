# v0.25.90 — Supercopa en dos pasos y con cuadro

Al jugar una carrera, el usuario simuló la Supercopa con un solo botón, y se jugaron a la vez las dos semifinales y la final. Además, el partido entre rivales llevaba la etiqueta «Final» («partido terminado»), y parecía que la final la jugaban otros equipos. Pidió un cuadro como el de la Copa y simular dos veces: la semifinal y después la final.

## Qué cambia

- **Primer paso, «Jugar las semifinales».** Se juegan las dos semifinales, tu partido y el de los rivales, una detrás de otra.
- **Si pasas:** sale «¡A la final!» con la previa de la final (rival, campo, duelo de líneas y probabilidades), eliges el planteamiento y la juegas con «Jugar la final». Las semifinales no se repiten.
- **Si caes:** la final entre rivales se juega a continuación, como antes.
- **Cuadro en espejo:** una semifinal a cada lado y la final en el centro. Es el mismo componente que el cuadro de Copa (`CupMirrorBracket`), ahora con tres columnas.
  - Antes de jugar, la final pone «Por decidir».
  - Cada resultado aparece cuando acaba su partido, para no adelantar nada.
- **«Terminado» en vez de «Final»** en los partidos entre rivales. Pasa en `MatchSequence`; solo la Supercopa muestra partidos entre rivales.
- **El control de planteamiento ya no dice** «Vale para todos tus partidos de la Supercopa», porque la final tiene el suyo.

## Lo que no cambia

- **Cada partido se simula igual:** mismas funciones y mismas semillas (+101, +202 y +303).
- **La Supercopa entera (`simulateCareerSupercopa`)**, que usan las auditorías y los tests, da exactamente lo mismo que antes. Se ha comprobado con 200 Supercopas, todas iguales.
- **La única diferencia de juego** es que puedes elegir otro planteamiento para la final.
- **Reglas de la Supercopa:** quién se clasifica, los cruces y la prórroga siguen igual.

## Partidas guardadas

- **El estado intermedio se guarda** como resultado con `awaitingFinal: true`.
- **Si se recarga antes de la final,** se vuelven a ver las semifinales y luego sale la previa de la final.
- **Las partidas antiguas** tienen la Supercopa entera o sin jugar, y siguen funcionando.

## Archivos

- `src/career/supercopaRules.ts`:
  - `simulateSupercopaSemifinals` y `simulateSupercopaFinal`.
  - `simulateCareerSupercopa`, que hace las dos cosas.
  - `getSupercopaFinalPreview` y `getSupercopaBracketRounds`.
- `src/types/career.ts`: `awaitingFinal`.
- `src/components/CareerSupercopa.tsx`: los dos pasos, la previa de la final y el cuadro.
- `src/App.tsx`: `handleSimulateCareerSupercopaFinal`.
- `src/components/SeasonBrackets.tsx` y `.css`: el cuadro en espejo admite otro número de rondas (`--cup-mirror-columns`) y su propio nombre.
- `src/components/MatchSequence.tsx` y `MatchApproachControl.tsx`: los dos textos.

## Comprobación

- `tests/unit/supercopaTwoSteps.test.ts`:
  - Si ganas la semifinal, se para antes de la final.
  - Jugar la final aparte da lo mismo que la Supercopa entera.
  - Si caes, se juega todo.
  - La previa de la final es contra el ganador de la otra semifinal.
  - El cuadro solo enseña lo ya visto.
- `tests/e2e/europe-supercopa.spec.ts`: el cuadro tiene 3 columnas y la final «Por decidir». Si pasas, aparece la previa de la final y el botón; al final hay 3 partidos y la final del cuadro ya no está por decidir.
- En el navegador, en modo desarrollo:
  - Las dos semifinales se juegan una detrás de otra y sale «¡A la final!» con la previa contra el ganador.
  - La final se juega aparte y termina en «Campeón de Supercopa».
  - El cuadro se va llenando, y el partido entre rivales dice «Terminado».
