import { formatCareerRangeLabel, formatEuropeanTrophyBreakdownLabel, getEuropeanTrophyBreakdown } from "../career/careerRanking";
import type { CareerLocalRankingEntry } from "../types/career";

import "./CareerLocalRanking.css";

interface CareerLocalRankingProps {
  entries: CareerLocalRankingEntry[];
  onNewCareer: () => void;
  onClearRanking: () => void;
  onBack: () => void;
}

function formatRankingDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getTrophySummary(entry: CareerLocalRankingEntry): string {
  const trophies = [
    ["Liga", entry.trophyCounts.liga],
    ["Copa", entry.trophyCounts.copa],
    ["Supercopa", entry.trophyCounts.supercopa],
    ["Europa", getEuropeanTrophyBreakdown(entry.trophyCounts).total],
  ]
    .filter(([, count]) => Number(count) > 0)
    .map(([label, count]) => `${label} ${count}`);

  return trophies.length > 0 ? trophies.join(" · ") : "Sin títulos";
}

export function CareerLocalRanking({
  entries,
  onNewCareer,
  onClearRanking,
  onBack,
}: CareerLocalRankingProps) {
  const topEntries = entries.slice(0, 10);

  return (
    <main className="career-ranking-screen">
      <section className="career-ranking-card">
        <p className="eyebrow">Modo carrera</p>
        <h1>Top local</h1>
        <p className="career-ranking-intro">
          Mejores carreras guardadas solo en este navegador: este ranking no envía nada fuera de tu dispositivo. Para compararte con otros jugadores, usa el ranking global.
        </p>

        {topEntries.length === 0 ? (
          <div className="career-ranking-empty">
            <strong>No hay carreras guardadas todavía</strong>
            <span>Cuando llegues a Game Over, la carrera se añadirá automáticamente a este ranking local.</span>
          </div>
        ) : (
          <div className="career-ranking-table-wrap">
            <table className="career-ranking-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Carrera</th>
                  <th>Puntos</th>
                  <th>Temp.</th>
                  <th>Palmarés</th>
                  <th>Europa</th>
                  <th>Mejor Liga</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {topEntries.map((entry, index) => (
                  <tr key={entry.id}>
                    <td data-label="#"><strong>{index + 1}</strong></td>
                    <td data-label="Carrera">
                      <span>{formatCareerRangeLabel(entry)}</span>
                      <small>Última Liga: {entry.lastLeaguePosition}.º · {entry.gameVersion}</small>
                    </td>
                    <td data-label="Puntos"><strong>{entry.arcadeScore}</strong></td>
                    <td data-label="Temp.">{entry.completedSeasons}</td>
                    <td data-label="Palmarés">
                      <span>{entry.palmaresScore} pts</span>
                      <small>{getTrophySummary(entry)}</small>
                    </td>
                    <td data-label="Europa" className="career-ranking-europa-cell"><span>{formatEuropeanTrophyBreakdownLabel(entry.trophyCounts)}</span></td>
                    <td data-label="Mejor Liga">{entry.bestLeaguePosition}.º</td>
                    <td data-label="Fecha">{formatRankingDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="career-ranking-actions">
          <button type="button" className="primary-home-button" onClick={onNewCareer}>
            Nueva carrera
          </button>
          <button type="button" className="secondary-home-button" onClick={onBack}>
            Volver
          </button>
          <button
            type="button"
            className="career-ranking-danger-button"
            onClick={onClearRanking}
            disabled={entries.length === 0}
          >
            Borrar ranking local
          </button>
        </div>
      </section>
    </main>
  );
}

export default CareerLocalRanking;
