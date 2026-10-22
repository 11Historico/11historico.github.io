# v0.24.9f — Prórroga y penaltis en semifinal y final europeas

Decisión del usuario: **empate en semifinal o final = prórroga de 2×15 min y, si sigue el empate, penaltis.**

## Regla

- Solo afecta a la semifinal y la final europeas (partido único). La fase inicial (6 partidos) sigue pudiendo terminar en empate.
- El marcador a los 90' sale de `simulateMatch` con la misma semilla que antes: no cambia.
- Si hay empate a los 90': prórroga (`simulateExtraTime`, goles Poisson con `EXTRA_TIME_EXPECTED_GOALS = 0.32` por equipo con igualdad de rating, ajustados por ratio de rating y ventaja de local).
- Si la prórroga termina igualada: tanda de penaltis (`simulatePenaltyShootout`, 5 lanzamientos + muerte súbita, probabilidad de acierto 0.75 ± 0.002 por punto de rating, acotada a 0.65–0.85). Siempre hay ganador.
- El resultado de una eliminatoria nunca es `draw`: ganar avanza/da el título; perder elimina/subcampeón, igual que antes.
- Determinista: la prórroga y los penaltis usan un RNG derivado de la semilla del partido (`${gameId}_${match.id}`), así que recargar la partida no cambia el resultado.

## Datos guardados

`EuropeanTournamentMatch` gana campos opcionales (partidas antiguas siguen siendo válidas):
`decidedBy` (`regular_time` | `extra_time` | `penalties`), `regularTimeUserGoals`, `regularTimeOpponentGoals`, `penaltyShootout`.
`userGoals`/`opponentGoals` son el marcador final tras la prórroga, sin penaltis.

## Interfaz

- Tarjeta europea de eliminatoria: frase de la regla (`EUROPEAN_KNOCKOUT_TIE_RULE_TEXT`) y, tras jugar, cómo se decidió (`getEuropeanMatchDecisionText`).
- Panel de progreso: "Victoria (prórroga)" / "Derrota (p. 4-5)".

## Archivos

`src/europe/europeanTypes.ts`, `src/europe/europeanMatchEngine.ts`, `src/europe/europeanTournament.ts`, `src/components/LeagueSimulatorView.tsx`, `src/components/EuropeanMatchEvent.tsx`, `src/components/EuropeanProgressPanel.tsx`, `scripts/qaEuropeanKnockoutExtraTime.ts`.

## No tocado

Ratings, plantillas, balance de Liga, Copa, `matchEngine.ts`, fase inicial europea, premios/prestigio, ranking global. El QA de balance europeo no se ve afectado (no marca `isKnockout`).

## Validación

```powershell
npm run qa:european-knockout-extra-time
$env:VITE_GLOBAL_RANKING_ENDPOINT=""; npm run qa:tech-debt
```
