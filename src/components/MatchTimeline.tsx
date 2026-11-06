// src/components/MatchTimeline.tsx
// Línea de tiempo del partido (v0.25.99, fase 17): los goles en su minuto, arriba los
// tuyos y abajo los del rival, y el descanso marcado con tu decisión. Sustituye a la
// barra de progreso y solo pinta datos que ya trae el resultado: no cambia la simulación.

import type { MatchHalfTimeEffect } from "../types/game";
import {
  getMatchTimelineLabel,
  getTimelineHalfTimeLabel,
  getTimelinePercent,
  type MatchTimelineGoal,
} from "./matchSequenceTimeline";

import "./MatchTimeline.css";

export function MatchTimeline({
  goals,
  minute,
  extraTime,
  halfTimeEffect,
  halfTimePending = false,
  trackClassName,
  topLabel,
  bottomLabel,
  legend,
}: {
  /** Solo los goles ya mostrados: la línea no adelanta el resultado. */
  goals: MatchTimelineGoal[];
  minute: number;
  /** Solo cuando el reloj ya pasó de 90': antes, la escala de 120' delataría la prórroga. */
  extraTime: boolean;
  halfTimeEffect?: MatchHalfTimeEffect;
  halfTimePending?: boolean;
  /** Clase de la barra de cada competición, para conservar su color. */
  trackClassName: string;
  /** Para lectores de pantalla: «Tus goles», «Goles del rival»… */
  topLabel: string;
  bottomLabel: string;
  legend: string;
}) {
  const halfClass = halfTimePending
    ? "match-timeline-tick match-timeline-half match-timeline-half-pending"
    : halfTimeEffect
      ? "match-timeline-tick match-timeline-half match-timeline-half-decided"
      : "match-timeline-tick match-timeline-half";

  return (
    <div
      className="match-timeline"
      role="img"
      aria-label={getMatchTimelineLabel({ goals, minute, extraTime, halfTimeEffect, topLabel, bottomLabel })}
    >
      <div className={`match-timeline-track ${trackClassName}`}>
        <span style={{ width: `${getTimelinePercent(minute, extraTime)}%` }} />
      </div>

      <span className={halfClass} style={{ left: `${getTimelinePercent(45, extraTime)}%` }}>
        <small>{getTimelineHalfTimeLabel(halfTimeEffect)}</small>
      </span>

      {extraTime && (
        <span className="match-timeline-tick" style={{ left: `${getTimelinePercent(90, true)}%` }}>
          <small>90'</small>
        </span>
      )}

      {goals.map((goal, index) => (
        <span
          key={`${goal.minute}_${goal.isTop}_${index}`}
          className={goal.isTop ? "match-timeline-goal match-timeline-goal-top" : "match-timeline-goal match-timeline-goal-bottom"}
          style={{ left: `${getTimelinePercent(goal.minute, extraTime)}%` }}
        />
      ))}

      <small className="match-timeline-legend">{legend}</small>
    </div>
  );
}
