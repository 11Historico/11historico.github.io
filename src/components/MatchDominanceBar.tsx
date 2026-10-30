// src/components/MatchDominanceBar.tsx
// Barra de dominio (v0.25.76): reparto de los goles esperados con los que se jugó el
// partido, de local a visitante. No inventa nada: sale de los datos del motor.

import type { MatchExpectedGoals } from "../types/game";
import { getMatchDominance } from "./matchSequenceTimeline";

import "./MatchDominanceBar.css";

export function MatchDominanceBar({ expectedGoals, started }: { expectedGoals: MatchExpectedGoals; started: boolean }) {
  const dominance = getMatchDominance(expectedGoals);
  // En la previa arranca igualada y se abre cuando empieza el partido.
  const home = started ? dominance.home : 50;
  const away = started ? dominance.away : 50;
  const userShare = dominance.userIsHome ? dominance.home : dominance.away;

  return (
    <div
      className="match-dominance"
      role="img"
      aria-label={`Dominio según los goles esperados: tu equipo ${userShare} %, rival ${100 - userShare} %`}
      title="Calculado con los goles esperados de cada equipo"
    >
      <span className="match-dominance-value">{home}{" "}%</span>
      <div className="match-dominance-bar">
        <span className={dominance.userIsHome ? "match-dominance-user" : "match-dominance-rival"} style={{ width: `${home}%` }} />
        <span className={dominance.userIsHome ? "match-dominance-rival" : "match-dominance-user"} style={{ width: `${away}%` }} />
      </div>
      <span className="match-dominance-value">{away}{" "}%</span>
      <small>Dominio</small>
    </div>
  );
}
