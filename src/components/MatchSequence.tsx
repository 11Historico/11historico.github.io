// src/components/MatchSequence.tsx
// Secuencia de partido de Liga, Copa y Supercopa (previa, minutos y goles).

import { useEffect, useLayoutEffect, useState } from "react";

import type { Formation, HalfTimeChoice, MatchResult, SelectedPlayer } from "../types/game";
import { CompetitionIcon } from "./CompetitionIcon";
import { MatchDominanceBar } from "./MatchDominanceBar";
import { MatchHalfTimeControl } from "./MatchHalfTimeControl";
import { MatchIcon } from "./MatchIcon";
import TacticalPitch from "./TacticalPitch";
import { TeamKitIcon, TeamWithKit } from "./TeamKitIcon";
import {
  MATCH_SEQUENCE_TICK_MS,
  countGoalsForTeam,
  getGoalContributions,
  getHalfTimeEffectText,
  getHalfTimeElapsedMs,
  getLineDuelText,
  getMatchSequenceDurationMs,
  getMatchApproachEffectText,
  getMatchKeyFactorIcon,
  getMatchKeyFactorText,
  getMatchSequenceFrame,
  getResultBadge,
  getResultClass,
  isExtraTimeFactor,
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
  pitch,
  onHalfTimeChoice,
}: {
  result: MatchResult;
  onPlayingChange: (playing: boolean) => void;
  /** Tu once, para el mini campo (v0.25.76). No se muestra en partidos entre rivales. */
  pitch?: { formation: Formation; selectedPlayers: SelectedPlayer[] };
  /** Mientras hay decisión pendiente, el partido se para a los 45' (v0.25.78). */
  onHalfTimeChoice?: (choice: HalfTimeChoice) => void;
}) {
  const playbackMultiplier = getMatchPlaybackMultiplier(useMatchPlaybackSpeed());
  const durationMs = getMatchSequenceDurationMs(playbackMultiplier);
  const stopMs = onHalfTimeChoice ? getHalfTimeElapsedMs(result.goalEvents, playbackMultiplier) : durationMs;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [elapsedMs, setElapsedMs] = useState(() => (reducedMotion ? stopMs : 0));
  const isAtHalfTime = Boolean(onHalfTimeChoice) && elapsedMs >= stopMs;
  const frame = getMatchSequenceFrame(result.goalEvents, elapsedMs, playbackMultiplier);
  const isFinal = frame.stage === "final";
  const homeGoals = isFinal ? result.homeGoals : countGoalsForTeam(frame.visibleGoals, result.homeTeamName);
  const awayGoals = isFinal ? result.awayGoals : countGoalsForTeam(frame.visibleGoals, result.awayTeamName);
  const showPitch = pitch && result.userTeamPlayed !== false;
  const lineDuelText = isFinal ? getLineDuelText(result) : undefined;

  // En layout: la vista retiene la clasificación antes del primer pintado del partido.
  useLayoutEffect(() => {
    onPlayingChange(!isFinal);
  }, [isFinal, onPlayingChange]);

  useLayoutEffect(() => {
    return () => onPlayingChange(false);
  }, [onPlayingChange]);

  useEffect(() => {
    if (isFinal || isAtHalfTime) return undefined;

    const intervalId = window.setInterval(() => {
      setElapsedMs((current) => Math.min(stopMs, current + MATCH_SEQUENCE_TICK_MS));
    }, MATCH_SEQUENCE_TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [isAtHalfTime, isFinal, stopMs]);

  return (
    <article className={`last-result-card match-sequence ${result.competition === "cup" ? "match-sequence-cup" : "match-sequence-league"}`}>
      <div className="last-result-top">
        {isFinal ? (
          result.userTeamPlayed === false ? (
            <span className="match-sequence-clock">Final</span>
          ) : (
            <span className={getResultClass(result)}>
              {getResultBadge(result)}
              {isExtraTimeFactor(result.keyFactor) ? " en la prórroga" : ""}
            </span>
          )
        ) : (
          <span className="match-sequence-clock">{frame.stage === "preview" ? "Previa" : `${frame.minute}'`}</span>
        )}
        <span className="match-sequence-tag">
          <CompetitionIcon kind={result.roundName?.startsWith("Supercopa") ? "supercopa" : result.competition === "cup" ? "copa" : "liga"} />
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

      {result.expectedGoals && <MatchDominanceBar expectedGoals={result.expectedGoals} started={frame.stage !== "preview"} />}

      {isAtHalfTime && onHalfTimeChoice && (
        <MatchHalfTimeControl
          onChoice={(choice) => {
            if (reducedMotion) setElapsedMs(durationMs);
            onHalfTimeChoice(choice);
          }}
        />
      )}

      {isFinal && result.userTeamPlayed !== false && result.keyFactor && (
        <p className="match-key-factor">
          <MatchIcon kind={getMatchKeyFactorIcon(result.keyFactor)} />
          {getMatchKeyFactorText(result.keyFactor)}
        </p>
      )}

      {lineDuelText && <p className="match-line-duel">{lineDuelText}</p>}

      {isFinal && getMatchApproachEffectText(result.approachEffect) && (
        <p className="match-approach-effect">{getMatchApproachEffectText(result.approachEffect)}</p>
      )}

      {isFinal && getHalfTimeEffectText(result.halfTimeEffect) && (
        <p className="match-approach-effect">{getHalfTimeEffectText(result.halfTimeEffect)}</p>
      )}

      <div className={showPitch ? "match-sequence-body match-sequence-body-pitch" : "match-sequence-body"}>
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
          <p className="empty-league-message">{isFinal ? "Partido sin goles." : " "}</p>
        )}

        {/* La lista de goles ya lo cuenta en texto: el campo es solo apoyo visual. */}
        {showPitch && (
          <div className="match-sequence-pitch" aria-hidden="true">
            <TacticalPitch
              formation={pitch.formation}
              selectedPlayers={pitch.selectedPlayers}
              compact
              goalContributions={getGoalContributions(frame.visibleGoals)}
            />
          </div>
        )}
      </div>

      {!isFinal && !isAtHalfTime && (
        <button
          type="button"
          className="secondary-league-button match-sequence-skip"
          onClick={() => setElapsedMs(stopMs)}
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
