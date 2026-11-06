// src/components/MatchLineDuelBars.tsx
// Duelo de líneas en la previa (v0.25.100, fase 16 del roadmap): tu ataque
// contra su defensa y tu defensa contra su ataque, en barras enfrentadas. Son las
// mismas líneas que usa el motor; no cambia la simulación.

import type { MatchLineDuel } from "../types/game";
import { getLineDuelBarPercent, getLineDuelEdgeLabel, getLineDuelRows } from "./matchSequenceTimeline";

import "./MatchLineDuelBars.css";

export function MatchLineDuelBars({ duel }: { duel: MatchLineDuel }) {
  return (
    <div className="line-duel">
      {getLineDuelRows(duel).map((row) => (
        <div key={row.userLabel} className="line-duel-row" role="img" aria-label={row.text}>
          <span className="line-duel-label">
            {row.userLabel} <strong>{row.userValue}</strong>
          </span>
          <span
            className={
              row.edge > 0 ? "line-duel-edge line-duel-edge-user" : row.edge < 0 ? "line-duel-edge line-duel-edge-rival" : "line-duel-edge"
            }
          >
            {getLineDuelEdgeLabel(row.edge)}
          </span>
          <span className="line-duel-label line-duel-label-rival">
            {row.rivalLabel} <strong>{row.rivalValue}</strong>
          </span>
          <span className="line-duel-bars">
            <span className="line-duel-track line-duel-track-user">
              <span style={{ width: `${getLineDuelBarPercent(row.userValue)}%` }} />
            </span>
            <span className="line-duel-track line-duel-track-rival">
              <span style={{ width: `${getLineDuelBarPercent(row.rivalValue)}%` }} />
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
