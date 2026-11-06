# v0.25.95 — Probabilidad de pasar en Europa

Es la fase 5 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`, la primera de la ola 3, «influencia visible en Europa».

El informe `INFORME_EUROPA_E_INFLUENCIA_v0_25_91.md` midió dos cosas:
- **Pasar es difícil:** pasan 2 de 7, y con 84 en Europa League se pasa un 33 % de las veces decidiendo bien.
- **El juego no lo decía:** no se sabía cómo ibas ni qué necesitabas.

## Cambio

### Probabilidad de pasar a semifinales

Sale en dos sitios mientras queda fase de liga por jugar:
- En la **previa del partido europeo** de la tarjeta de acciones, bajo las probabilidades del partido.
- En la pestaña **«Clasificación europea»**, bajo la regla.

Por ejemplo: «Probabilidad de pasar a semifinales: 36 %. Con 11 puntos en los 6 partidos que faltan pasas casi seguro.» Tras ganar el primer partido, «57 %. Con 8 puntos en los 5 partidos que faltan…».

**Cómo se calcula** (`src/europe/europeanSemifinalChance.ts`):
- Se juega 200 veces lo que falta, con el motor europeo del juego:
  - tus partidos, con tu rating europeo y tus líneas, en planteamiento equilibrado;
  - los partidos entre rivales que aún no cuentan en la tabla.
- La tabla final se ordena con los mismos criterios que la clasificación real: puntos, diferencia de goles, goles a favor y nombre.
- **«Pasas casi seguro»** es lo mínimo que, sumando eso o más en lo que falta, pasa al menos el 90 % de las veces. Solo cuenta si se da en al menos el 5 % de las simulaciones; si no hay ninguno, solo se da la probabilidad.
- **Semillas propias** (`chance_…`), distintas de las de la partida: no gasta azar del juego ni adelanta resultados. Los partidos entre rivales tienen semilla fija en la tabla, y aquí se simulan con otras.
- **Se calcula sobre el torneo que se ve:** mientras se juega un partido, no lo delata. Se hace después de pintar la pantalla, como el rango esperado de Liga. Tarda unas décimas de segundo.

### Zona de semifinales

- Los 2 primeros de la clasificación europea, que ya tenían una raya verde a la izquierda, tienen ahora además fondo verde y una línea discontinua de corte tras el 2.º.
- La nota dice «Pasan a semifinales los 2 primeros, marcados en verde».

## Archivos

- `src/europe/europeanSemifinalChance.ts`: nuevo; el cálculo y el texto.
- `src/europe/europeanLeagueTable.ts`:
  - `getEuropeanRivalPairs` saca el reparto de partidos entre rivales, que ya existía dentro de la tabla;
  - se exportan `recordResult` y `compareRows`. La tabla sale igual.
- `src/components/LeagueSimulatorView.tsx`: calcula la probabilidad y la muestra en la previa.
- `src/components/EuropeanLeagueTable.tsx`, `LeagueSimulatorView.css`: zona y texto.

## Comprobación

- `tests/unit/europeanSemifinalChance.test.ts`:
  - mismo resultado siempre y sin `Math.random`;
  - un equipo mejor tiene más opciones;
  - ganar sube la probabilidad y perder la baja;
  - nada cuando acaba la fase;
  - tarda poco;
  - los textos.
- `tests/e2e/europe-supercopa.spec.ts`: la nota nueva, 2 filas marcadas y la probabilidad en la clasificación europea.
- **Navegador**, con la partida `career-strong` en Europa League: 36 % antes del primer partido. Tras ganarlo 2-1, 57 % y «Con 8 puntos en los 5 partidos que faltan».
- `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` y Playwright.
