// src/components/MatchSequence.tsx
// Secuencia de partido de Liga, Copa y Supercopa (previa, minutos y goles).

import { useEffect, useLayoutEffect, useState } from "react";

import type { MatchResult } from "../types/game";
import { CompetitionIcon } from "./CompetitionIcon";
import { TeamKitIcon, TeamWithKit } from "./TeamKitIcon";
import {
  MATCH_SEQUENCE_TICK_MS,
  countGoalsForTeam,
  getMatchSequenceDurationMs,
  getMatchSequenceFrame,
  getResultBadge,
  getResultClass,
} from "./matchSequenceTimeline";
import { getMatchPlaybackMultiplier, useMatchPlaybackSpeed } from "./matchPlaybackSpeed";

// Los estilos de la secuencia siguen en LeagueSimulatorView.css.
import "./LeagueSimulatorView.css";

function getMatchSequenceTag(result: MatchResult): string {
  if (result.roundName?.startsWith("Supercopa")) return result.roundName;
  if (result.competition === "cup") return `Copa del Rey · ${result.roundName ?? ""}`.trim();
  return `LaLiga · Jornada ${result.matchday}`;
}

export function MatchSequence({
  result,
  onPlayingChange,
}: {
  result: MatchResult;
  onPlayingChange: (playing: boolean) => void;
}) {
  const playbackMultiplier = getMatchPlaybackMultiplier(useMatchPlaybackSpeed());
  const durationMs = getMatchSequenceDurationMs(playbackMultiplier);
  const [elapsedMs, setElapsedMs] = useState(() =>
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? durationMs : 0,
  );
  const frame = getMatchSequenceFrame(result.goalEvents, elapsedMs, playbackMultiplier);
  const isFinal = frame.stage === "final";
  const homeGoals = isFinal ? result.homeGoals : countGoalsForTeam(frame.visibleGoals, result.homeTeamName);
  const awayGoals = isFinal ? result.awayGoals : countGoalsForTeam(frame.visibleGoals, result.awayTeamName);

  // En layout: la vista retiene la clasificación antes del primer pintado del partido.
  useLayoutEffect(() => {
    onPlayingChange(!isFinal);
  }, [isFinal, onPlayingChange]);

  useLayoutEffect(() => {
    return () => onPlayingChange(false);
  }, [onPlayingChange]);

  useEffect(() => {
    if (isFinal) return undefined;

    const intervalId = window.setInterval(() => {
      setElapsedMs((current) => Math.min(durationMs, current + MATCH_SEQUENCE_TICK_MS));
    }, MATCH_SEQUENCE_TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [durationMs, isFinal]);

  return (
    <article className={`last-result-card match-sequence ${result.competition === "cup" ? "match-sequence-cup" : "match-sequence-league"}`}>
      <div className="last-result-top">
        {isFinal ? (
          result.userTeamPlayed === false ? (
            <span className="match-sequence-clock">Final</span>
          ) : (
            <span className={getResultClass(result)}>{getResultBadge(result)}</span>
          )
        ) : (
          <span className="match-sequence-clock">{frame.stage === "preview" ? "Previa" : `${frame.minute}'`}</span>
        )}
        <span className="match-sequence-tag">
          <CompetitionIcon kind={result.competition === "cup" ? "copa" : "liga"} />
          {getMatchSequenceTag(result)}
        </span>
      </div>

      <div className="last-result-scoreboard">
        <ScoreTeam teamName={result.homeTeamName} goals={homeGoals} />
        <span className="score-separator">-</span>
        <ScoreTeam teamName={result.awayTeamName} goals={awayGoals} />
      </div>

      <div className="match-sequence-progress" aria-hidden="true">
        <span style={{ width: `${(elapsedMs / durationMs) * 100}%` }} />
      </div>

      {frame.visibleGoals.length > 0 ? (
        <ul className="goal-events-list" aria-live="polite">
          {frame.visibleGoals.map((event, index) => (
            <li key={`${event.minute}_${event.teamName}_${index}`}>
              <strong>{event.minute}'</strong>
              <TeamWithKit teamName={event.teamName} />
              {event.scorerName && <em>{event.scorerName}</em>}
              {event.assistName && <small>Asistencia: {event.assistName}</small>}
            </li>
          ))}
        </ul>
      ) : (
        isFinal && <p className="empty-league-message">Partido sin goles.</p>
      )}

      {!isFinal && (
        <button
          type="button"
          className="secondary-league-button match-sequence-skip"
          onClick={() => setElapsedMs(durationMs)}
        >
          Saltar
        </button>
      )}
    </article>
  );
}

function ScoreTeam({ teamName, goals }: { teamName: string; goals: number }) {
  return (
    <span className="score-team">
      <TeamKitIcon teamName={teamName} />
      <span>{teamName}</span>
      <strong>{goals}</strong>
    </span>
  );
}
