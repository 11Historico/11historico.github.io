import { useState } from "react";

import type {
  CareerSupercopaQualification,
  CareerSupercopaResult,
} from "../types/career";
import type { SupercopaSemifinalPreview } from "../career/supercopaRules";
import type { CoachSkills, Formation, MatchApproach, SelectedPlayer } from "../types/game";

import { MatchApproachControl } from "./MatchApproachControl";
import { MatchOddsBar } from "./MatchOddsBar";
import { MatchSequence } from "./MatchSequence";
import { getLineDuelSummary } from "./matchSequenceTimeline";

import "./CareerSupercopa.css";

interface CareerSupercopaProps {
  qualification: CareerSupercopaQualification;
  result?: CareerSupercopaResult;
  coachSkills?: CoachSkills;
  pitch?: { formation: Formation; selectedPlayers: SelectedPlayer[] };
  getSemifinalPreview: (approach: MatchApproach) => SupercopaSemifinalPreview | undefined;
  onSimulate: (approach: MatchApproach) => void;
  onContinue: () => void;
  onRestart: () => void;
}

export function CareerSupercopa({
  qualification,
  result,
  coachSkills,
  pitch,
  getSemifinalPreview,
  onSimulate,
  onContinue,
  onRestart,
}: CareerSupercopaProps) {
  const [approach, setApproach] = useState<MatchApproach>("balanced");
  const preview = result ? undefined : getSemifinalPreview(approach);
  // Partido que se está reproduciendo. Cuando termina, se pasa al siguiente.
  const [playingIndex, setPlayingIndex] = useState(0);
  const [shownResult, setShownResult] = useState(result);

  if (shownResult !== result) {
    setShownResult(result);
    setPlayingIndex(0);
  }

  const matchCount = result?.results.length ?? 0;
  const isFinished = result !== undefined && playingIndex >= matchCount;

  return (
    <main className="career-supercopa-screen">
      <section className="career-supercopa-card">
        <p className="eyebrow">Modo carrera · {qualification.seasonLabel}</p>
        <h1>Supercopa de España</h1>
        <p className="career-supercopa-lead">
          Juegan 1.º y 2.º de Liga más campeón y subcampeón de Copa. Si hay duplicados,
          entra el siguiente mejor clasificado de Liga.
        </p>

        <div className="career-supercopa-participants">
          {qualification.participants.map((participant) => (
            <article key={`${participant.teamId}-${participant.source}`}>
              <span>{participant.sourceLabel}</span>
              <strong>{participant.teamName}</strong>
            </article>
          ))}
        </div>

        {!result && (
          <section className="career-supercopa-preview" aria-label="Previa de la semifinal">
            <MatchApproachControl value={approach} onChange={setApproach} competition="supercopa" coachSkills={coachSkills} />
            {preview && (
              <>
                <p>
                  Tu semifinal: {preview.venue === "home" ? "en casa contra" : "fuera contra"} <strong>{preview.rivalName}</strong>
                </p>
                <small>{getLineDuelSummary(preview.lineDuel)}</small>
                <MatchOddsBar odds={preview.odds} note="en 90 minutos; si hay empate, prórroga" />
              </>
            )}
          </section>
        )}

        {!result && (
          <div className="career-supercopa-actions">
            <button type="button" className="primary-home-button" onClick={() => onSimulate(approach)}>
              Simular Supercopa
            </button>
            <button type="button" className="secondary-home-button" onClick={onRestart}>
              Salir
            </button>
          </div>
        )}

        {result && (
          <section className={`career-supercopa-result ${isFinished && result.won ? "career-supercopa-won" : ""}`}>
            <p className="eyebrow">{isFinished ? "Resultado" : "Supercopa en directo"}</p>

            {isFinished && (
              <>
                <h2>{result.won ? "Campeón de Supercopa" : `Eliminado en ${result.eliminatedRoundName ?? "Supercopa"}`}</h2>
                <p>
                  Campeón: <strong>{result.championTeamName}</strong>
                  {result.runnerUpTeamName ? <> · Subcampeón: <strong>{result.runnerUpTeamName}</strong></> : null}
                </p>
              </>
            )}

            <div className="career-supercopa-results-list">
              {result.results.slice(0, playingIndex + 1).map((match, index) => (
                <MatchSequence
                  key={match.fixtureId}
                  result={match}
                  pitch={pitch}
                  onPlayingChange={(playing) => {
                    if (!playing) setPlayingIndex((current) => (current === index ? index + 1 : current));
                  }}
                />
              ))}
            </div>

            {isFinished && (
              <div className="career-supercopa-actions">
                <button type="button" className="primary-home-button" onClick={onContinue}>
                  Jugar Liga {qualification.seasonLabel}
                </button>
                <button type="button" className="secondary-home-button" onClick={onRestart}>
                  Salir
                </button>
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

export default CareerSupercopa;
