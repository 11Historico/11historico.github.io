# v0.25.113 — La forma del rival, en la previa

Es la opción B del informe del Oviedo (`INFORME_VALOR_OVIEDO_v0_25_112.md`). Al usuario le extrañó ver al Real Oviedo, de media 77, con 82 en la previa. El número era correcto: es la media con la que juega ese partido, con su forma de temporada. Lo que faltaba era explicarlo. El usuario eligió «B» y aprobó el plan con «adelante».

## Lo que cambia

**En la previa de Liga**, debajo de la media del rival sale su forma de temporada: «forma +5» o «forma −4». Al pasar el ratón, el detalle: «76 sin la forma; esta temporada, −4 de forma».

- **Si la forma es 0**, no sale nada.
- **Copa y Europa** no tienen forma de temporada, así que no cambian.
- **La «media sin la forma»** ya lleva la progresión de rivales de la carrera (+0,5 por temporada, hasta +3).
- **La ayuda de la portada**, en «Supervivencia», lo explica: en Liga cada rival tiene una forma de temporada que sube o baja su media.

**Lo que no cambia:** ninguna media, la forma, la simulación ni el balance. La forma se lee solo para enseñarla.

## En el código

- **`leagueSimulator.ts`:** `UserMatchPreview` tiene `rivalSeasonForm`, solo en Liga. Es la diferencia entre la media que se ve y la del rival sin la forma, con los mismos redondeos que la previa.
- **`LeagueSimulatorView.tsx`:** `PreviewTeams` lo enseña debajo de la media del rival, con el detalle en el `title`.
- **`LeagueSimulatorView.css`:** `.next-match-preview-form`.
- **`GameHome.tsx`:** la frase de la ayuda.
- **`tests/unit/matchApproach.test.ts`:** la media de la previa es la del rival más su forma, y la forma cambia con la temporada.

## Comprobación

**En el navegador**, con la partida de prueba `career-weak` en la jornada 9: «Levante UD 72, forma −4», con el detalle «76 sin la forma; esta temporada, −4 de forma».

| Tamaño | Resultado |
| --- | --- |
| 1.440 px | la forma, pequeña, debajo del 72 |
| 375 px | igual, con cada equipo en su línea; nada se sale de la pantalla |

Sin errores en la consola.

**Comprobaciones:** pasan `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` y `npm run test:e2e`.
