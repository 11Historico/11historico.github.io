import { useState } from "react";

import type {
  CareerSupercopaQualification,
  CareerSupercopaResult,
} from "../types/career";

import { MatchSequence } from "./LeagueSimulatorView";

import "./CareerSupercopa.css";

interface CareerSupercopaProps {
  qualification: CareerSupercopaQualification;
  result?: CareerSupercopaResult;
  onSimulate: () => void;
  onContinue: () => void;
  onRestart: () => void;
}

export function CareerSupercopa({
  qualification,
  result,
  onSimulate,
  onContinue,
  onRestart,
}: CareerSupercopaProps) {
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
          <div className="career-supercopa-actions">
            <button type="button" className="primary-home-button" onClick={onSimulate}>
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
