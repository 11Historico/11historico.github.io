# v0.25.93 — Aviso para seguir la Liga tras Copa o Europa

Es la fase 2 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`. Al terminar un partido de Copa o Europa, la simulación automática se para y la Liga espera a que pulses «Simular». La pantalla no lo decía: la tarjeta de acciones mostraba «Próximo paso» con el diagnóstico de la Liga, y el botón «Simular» seguía en gris.

## Cambio

En la tarjeta de acciones de `src/components/LeagueSimulatorView.tsx`, después de un partido de Copa o Europa:

| | Antes | Ahora |
| --- | --- | --- |
| Título | «Próximo paso» | «Sigue la Liga» |
| Texto | El diagnóstico de la Liga | «Partido de Copa terminado. La Liga no sigue sola: pulsa «Simular» para jugar la jornada 19.» (o «Partido de Champions League terminado…») |
| Botón «Simular» | Secundario, en gris | Principal, en blanco |

**Cuándo sale el aviso:**
- Después de un partido de Copa, mientras ese partido sea el último que se ha jugado.
- Después de un partido europeo, mientras la Liga no haya jugado la jornada antes de la que tocaba ese partido.
- En los dos casos, solo si no hay otro partido de Copa o Europa pendiente, ni una decisión del descanso, ni la ruleta, ni un partido en juego, y la Liga no ha terminado.

**Desaparece** en cuanto juegas la siguiente jornada. Pulsar «Continuar temporada» en la tarjeta europea no lo quita, porque la Liga sigue esperando.

## Sin cambios

- Un partido pendiente de Copa o Europa sigue bloqueando la Liga.
- Ningún botón cambia de función; solo de aspecto.

## Comprobación

- `tests/e2e/europe-supercopa.spec.ts`: tras el partido europeo, el título «Sigue la Liga» y el aviso.
- **Navegador**, con la partida guardada `career-strong`:
  - **Tras la Copa:** «Sigue la Liga», «Partido de Copa terminado… la jornada 19» y «Simular» en blanco. Al jugar la jornada vuelve «Próximo paso».
  - **Tras la Champions** (temporada siguiente): «Partido de Champions League terminado… la jornada 4». Sigue igual tras pulsar «Continuar temporada» en la tarjeta europea.
- `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` y Playwright.
