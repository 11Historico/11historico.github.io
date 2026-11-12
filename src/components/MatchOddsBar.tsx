// src/components/MatchOddsBar.tsx
// Previa del partido (v0.25.74): probabilidad de victoria, empate y derrota en 90 minutos.

import type { MatchOdds } from "../simulation/matchEngine";

import "./MatchOddsBar.css";

function toPercent(value: number): number {
  return Math.round(value * 100);
}

function getFavoriteText(odds: MatchOdds): string {
  if (odds.win - odds.loss >= 0.15) return "Eres favorito";
  if (odds.loss - odds.win >= 0.15) return "El rival es favorito";
  return "Partido igualado";
}

/** Con aseline (v0.25.112): las probabilidades sin la carta elegida, para decir cuánto suma. */
export function MatchOddsBar({ odds, note, baseline }: { odds: MatchOdds; note?: string; baseline?: MatchOdds | null }) {
  const win = toPercent(odds.win);
  const draw = toPercent(odds.draw);
  const loss = Math.max(0, 100 - win - draw);
  const cardDelta = baseline ? win - toPercent(baseline.win) : undefined;

  return (
    <div className="match-odds">
      <div className="match-odds-bar" aria-hidden="true">
        <span className="match-odds-win" style={{ width: `${win}%` }} />
        <span className="match-odds-draw" style={{ width: `${draw}%` }} />
        <span className="match-odds-loss" style={{ width: `${loss}%` }} />
      </div>
      <p>
        <strong>{getFavoriteText(odds)}</strong> · Victoria {win}{"\u00a0"}%
        {cardDelta !== undefined && <b className="match-odds-card"> ({cardDelta >= 0 ? "+" : "−"}{Math.abs(cardDelta)} con la carta)</b>}
        {" · "}Empate {draw}{"\u00a0"}% · Derrota {loss}{"\u00a0"}%
        {note && <small> ({note})</small>}
      </p>
    </div>
  );
}
