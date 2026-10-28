# v0.25.69 — Orden de las tarjetas por próximo evento

## Problema

En la pantalla de Liga, las tarjetas de partido iban siempre en el mismo orden: Copa pendiente, partido europeo y último partido. Tras un partido de Conference, la tarjeta europea se quedaba arriba hasta pulsar «Continuar temporada», y los partidos de Liga que se simulaban después salían debajo. Además, las próximas eliminatorias de Copa y los próximos partidos europeos no aparecían hasta que tocaba jugarlos.

## Petición

Arriba, la tarjeta del próximo partido (por ejemplo, Liga). Debajo, la de la siguiente competición (por ejemplo, Copa) y después la siguiente (por ejemplo, Europa).

## Decisión

No cambia ninguna regla: un partido europeo pendiente sigue bloqueando la Liga, así que mientras lo hay, su tarjeta va arriba. Que la Liga de la misma jornada se pudiera jugar antes habría cambiado la regla de bloqueo, y eso no se ha tocado.

## Cambio

- **`src/components/leagueEventOrder.ts` (nuevo):** `getLeagueEventSlots` ordena las competiciones por el número de partidos de Liga jugados cuando se pueden jugar.
  - **Copa:** su `gateMatchday`.
  - **Europa:** la jornada de su partido menos 1, porque se juega antes de esa jornada.
  - **Liga:** los partidos jugados.
  - **Empates:** va antes lo que bloquea la Liga (Copa, luego Europa), igual que la tarjeta de acciones.
  - **Resultado europeo recién jugado:** va arriba.
- **`src/components/LeagueSimulatorView.tsx`:** pinta una tarjeta por competición en ese orden.
  - **Liga:** la secuencia del último partido.
  - **Copa:** la tarjeta actual si está pendiente; si no, una tarjeta «Próximo» con ronda, jornada, rival y campo.
  - **Europa:** la tarjeta europea si está pendiente o recién jugada; si no, una tarjeta «Próximo» con fase, jornada, rival y campo.
  - **Cierre del resultado europeo:** se cierra solo cuando se juega el siguiente partido de Liga o Copa, como si se pulsara «Continuar temporada». El botón sigue funcionando igual.
  - **Ruleta:** su tarjeta de estado va después de las de partido.
- **`src/components/LeagueSimulatorView.css`:** `.next-event-card`, la tarjeta de Copa en versión más discreta.
- **`src/europe/europeanQualification.ts`:** `getEuropeanCompetitionIconKind`, que sustituye a dos copias de la misma correspondencia (`FinalSummary.tsx` y `EuropeanMatchEvent.tsx`).

## Pruebas

- **`tests/unit/leagueEventOrder.test.ts` (nuevo), 6 casos:**
  - orden por fecha;
  - Europa pendiente arriba;
  - Copa pendiente por delante de Europa;
  - resultado europeo recién jugado arriba;
  - Liga terminada al final;
  - sin último resultado.
- **`tests/e2e/europe-supercopa.spec.ts`:** después del partido europeo, al volver a simular la Liga, la tarjeta del resultado europeo desaparece y aparece la del próximo partido europeo.
- **Comprobación temporal en el navegador**, con la partida europea de prueba:

  | Momento | Orden |
  |---|---|
  | Inicio | Próximo Conference (antes de la jornada 4) › Próximo Copa (tras la jornada 18) |
  | Partido europeo pendiente | Europa › último partido de Liga › Próximo Copa |
  | Partido europeo recién jugado | Europa › último partido de Liga › Próximo Copa |
  | Tras el siguiente partido de Liga | Liga (jornada 4) › Próximo Conference (antes de la jornada 8) › Próximo Copa |

  A 375 px no hay desbordamiento horizontal.

## Qué no cambia

Reglas de Liga, Copa y Europa, calendario, bloqueo europeo, simulación y balance.

## Validación

- `npm run typecheck` y `npx eslint src scripts` sin errores.
- `npm test` (114 tests) y `npm run qa:ci` en verde.
- `npx playwright test`: 15 tests en verde y 2 saltados.
