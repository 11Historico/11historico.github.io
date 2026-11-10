import { useState, type ReactNode } from "react";

import type {
  CareerSupercopaQualification,
  CareerSupercopaResult,
} from "../types/career";
import { getSupercopaBracketRounds, type SupercopaSemifinalPreview } from "../career/supercopaRules";
import type { CoachSkills, Formation, MatchApproach, SelectedPlayer } from "../types/game";

import { MatchApproachControl } from "./MatchApproachControl";
import { MatchOddsBar } from "./MatchOddsBar";
import { MatchSequence } from "./MatchSequence";
import { MatchLineDuelBars } from "./MatchLineDuelBars";
import { CupMirrorBracket } from "./SeasonBrackets";
import { MatchCardsNotes } from "./MatchCards";

import "./CareerSupercopa.css";

interface CareerSupercopaProps {
  qualification: CareerSupercopaQualification;
  result?: CareerSupercopaResult;
  coachSkills?: CoachSkills;
  pitch?: { formation: Formation; selectedPlayers: SelectedPlayer[] };
  getSemifinalPreview: (approach: MatchApproach) => SupercopaSemifinalPreview | undefined;
  getFinalPreview: (approach: MatchApproach) => SupercopaSemifinalPreview | undefined;
  onSimulate: (approach: MatchApproach) => void;
  /** La final se juega aparte, con su propio planteamiento (v0.25.90). */
  onSimulateFinal: (approach: MatchApproach) => void;
  onContinue: () => void;
  onRestart: () => void;
  /** Tus cartas para el partido que toca (v0.25.108). */
  cardsSlot?: ReactNode;
  /** Lo que pasó con las cartas en el último partido. */
  cardNotes?: string[];
}

function MatchPreview({ label, preview, approach, coachSkills, onApproachChange, cardsSlot }: {
  label: string;
  cardsSlot?: ReactNode;
  preview?: SupercopaSemifinalPreview;
  approach: MatchApproach;
  coachSkills?: CoachSkills;
  onApproachChange: (approach: MatchApproach) => void;
}) {
  return (
    <section className="career-supercopa-preview" aria-label={label}>
      <MatchApproachControl value={approach} onChange={onApproachChange} competition="supercopa" coachSkills={coachSkills} />
      {cardsSlot}
      {preview && (
        <>
          <p>
            {label === "Previa de la final" ? "Tu final" : "Tu semifinal"}: {preview.venue === "home" ? "en casa contra" : "fuera contra"} <strong>{preview.rivalName}</strong>
          </p>
          <MatchLineDuelBars duel={preview.lineDuel} />
          <MatchOddsBar odds={preview.odds} note="en 90 minutos; si hay empate, prórroga" />
        </>
      )}
    </section>
  );
}

export function CareerSupercopa({
  qualification,
  result,
  coachSkills,
  pitch,
  getSemifinalPreview,
  getFinalPreview,
  onSimulate,
  onSimulateFinal,
  onContinue,
  onRestart,
  cardsSlot,
  cardNotes,
}: CareerSupercopaProps) {
  const [approach, setApproach] = useState<MatchApproach>("balanced");
  // Partido que se está reproduciendo. Cuando termina, se pasa al siguiente.
  const [playingIndex, setPlayingIndex] = useState(0);
  const [shownResult, setShownResult] = useState(result);

  // Al llegar la final se sigue donde se iba: no se repiten las semifinales.
  if (shownResult !== result) {
    setShownResult(result);
    if (!result || !shownResult) setPlayingIndex(0);
  }

  const matchCount = result?.results.length ?? 0;
  const allShown = result !== undefined && playingIndex >= matchCount;
  const isFinished = allShown && !result.awaitingFinal;
  const isFinalNext = allShown && result.awaitingFinal === true;
  const semifinalPreview = result ? undefined : getSemifinalPreview(approach);
  const finalPreview = isFinalNext ? getFinalPreview(approach) : undefined;

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

        <CupMirrorBracket
          rounds={getSupercopaBracketRounds(qualification.participants, result, playingIndex)}
          label="Cuadro de la Supercopa"
        />

        {!result && (
          <MatchPreview label="Previa de la semifinal" preview={semifinalPreview} approach={approach} coachSkills={coachSkills} onApproachChange={setApproach} cardsSlot={cardsSlot} />
        )}

        {!result && (
          <div className="career-supercopa-actions">
            <button type="button" className="primary-home-button" onClick={() => onSimulate(approach)}>
              Jugar las semifinales
            </button>
            <button type="button" className="secondary-home-button" onClick={onRestart}>
              Salir
            </button>
          </div>
        )}

        {result && (
          <section className={`career-supercopa-result ${isFinished && result.won ? "career-supercopa-won" : ""}`}>
            <p className="eyebrow">{isFinished ? "Resultado" : isFinalNext ? "Final de la Supercopa" : "Supercopa en directo"}</p>
            {/* Después de los partidos: las notas dicen si ganaste o perdiste. */}
            {allShown && <MatchCardsNotes notes={cardNotes} />}

            {isFinished && (
              <>
                <h2>{result.won ? "Campeón de Supercopa" : `Eliminado en ${result.eliminatedRoundName ?? "Supercopa"}`}</h2>
                <p>
                  Campeón: <strong>{result.championTeamName}</strong>
                  {result.runnerUpTeamName ? <> · Subcampeón: <strong>{result.runnerUpTeamName}</strong></> : null}
                </p>
              </>
            )}

            {isFinalNext && (
              <>
                <h2>¡A la final!</h2>
                <MatchPreview label="Previa de la final" preview={finalPreview} approach={approach} coachSkills={coachSkills} onApproachChange={setApproach} cardsSlot={cardsSlot} />
                <div className="career-supercopa-actions">
                  <button type="button" className="primary-home-button" onClick={() => onSimulateFinal(approach)}>
                    Jugar la final
                  </button>
                </div>
              </>
            )}

            <div className="career-supercopa-results-list">
              {result.results.slice(0, playingIndex + 1).map((match, index) => (
                <MatchSequence
                  key={match.fixtureId}
                  result={match}
                  pitch={pitch}
                  onFinished={() => setPlayingIndex((current) => (current === index ? index + 1 : current))}
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
