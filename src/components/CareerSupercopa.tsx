import type {
  CareerSupercopaQualification,
  CareerSupercopaResult,
} from "../types/career";

import "./CareerSupercopa.css";

interface CareerSupercopaProps {
  qualification: CareerSupercopaQualification;
  result?: CareerSupercopaResult;
  onSimulate: () => void;
  onContinue: () => void;
  onRestart: () => void;
}

function formatScore(result: CareerSupercopaResult["results"][number]): string {
  return `${result.homeTeamName} ${result.homeGoals}-${result.awayGoals} ${result.awayTeamName}`;
}

export function CareerSupercopa({
  qualification,
  result,
  onSimulate,
  onContinue,
  onRestart,
}: CareerSupercopaProps) {
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
          <section className={`career-supercopa-result ${result.won ? "career-supercopa-won" : ""}`}>
            <p className="eyebrow">Resultado</p>
            <h2>{result.won ? "Campeón de Supercopa" : `Eliminado en ${result.eliminatedRoundName ?? "Supercopa"}`}</h2>
            <p>
              Campeón: <strong>{result.championTeamName}</strong>
              {result.runnerUpTeamName ? <> · Subcampeón: <strong>{result.runnerUpTeamName}</strong></> : null}
            </p>

            <div className="career-supercopa-results-list">
              {result.results.map((match) => (
                <article key={match.fixtureId}>
                  <span>{match.roundName ?? "Supercopa"}</span>
                  <strong>{formatScore(match)}</strong>
                </article>
              ))}
            </div>

            <div className="career-supercopa-actions">
              <button type="button" className="primary-home-button" onClick={onContinue}>
                Jugar Liga {qualification.seasonLabel}
              </button>
              <button type="button" className="secondary-home-button" onClick={onRestart}>
                Salir
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

export default CareerSupercopa;
