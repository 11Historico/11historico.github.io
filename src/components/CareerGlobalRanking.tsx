import { useEffect, useState } from "react";
import { formatCareerRangeLabel, formatEuropeanTrophyBreakdownLabel } from "../career/careerRanking";
import { getGlobalRankingBackendLabel, isGlobalRankingConfigured, loadGlobalRanking } from "../services/globalRankingService";
import CareerGlobalEndpointConfig from "./CareerGlobalEndpointConfig";
import type { CareerGlobalRankingEntry } from "../types/career";

import "./CareerGlobalRanking.css";

interface CareerGlobalRankingProps {
  onNewCareer: () => void;
  onViewLocalRanking: () => void;
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

export function CareerGlobalRanking({ onNewCareer, onViewLocalRanking, onBack }: CareerGlobalRankingProps) {
  const [entries, setEntries] = useState<CareerGlobalRankingEntry[]>([]);
  const [message, setMessage] = useState("Cargando ranking global...");
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [endpointRevision, setEndpointRevision] = useState(0);

  const configured = isGlobalRankingConfigured();

  useEffect(() => {
    let active = true;

    async function loadRanking() {
      setIsLoading(true);
      const result = await loadGlobalRanking();

      if (!active) return;

      setEntries(result.entries);
      setMessage(result.message);
      setLoadFailed(!result.ok && result.status !== "not_configured");
      setIsLoading(false);
    }

    void loadRanking();

    return () => {
      active = false;
    };
  }, [endpointRevision]);

  const emptyTitle = !configured
    ? "Conecta el ranking global"
    : loadFailed
      ? "No se pudo cargar el ranking global"
      : "Aún no hay carreras globales";
  const emptyDescription = configured
    ? message
    : "Guarda la URL /exec de Apps Script para cargar el Top 100 online desde este navegador.";

  return (
    <main className="career-global-ranking-screen">
      <section className="career-global-ranking-card">
        <p className="eyebrow">Top 100 online · {getGlobalRankingBackendLabel()}</p>
        <h1>Ranking global</h1>
        <p className="career-global-ranking-intro">
          Top global conectado a Google Sheets + Apps Script. Puedes usar `VITE_GLOBAL_RANKING_ENDPOINT` o guardar el endpoint /exec solo en este navegador.
        </p>

        {!configured && (
          <CareerGlobalEndpointConfig onEndpointChange={() => setEndpointRevision((value) => value + 1)} />
        )}

        {isLoading && (
          <div className="career-global-ranking-empty">
            <strong>Cargando...</strong>
            <span>Consultando el ranking global. La primera carga puede tardar hasta un minuto.</span>
          </div>
        )}

        {!isLoading && entries.length === 0 && (
          <div className="career-global-ranking-empty">
            <strong>{emptyTitle}</strong>
            <span>{emptyDescription}</span>
          </div>
        )}

        {!isLoading && entries.length > 0 && (
          <div className="career-global-ranking-table-wrap">
            <table className="career-global-ranking-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nick</th>
                  <th>Carrera</th>
                  <th>Puntos</th>
                  <th>Temp.</th>
                  <th>Europa</th>
                  <th>Mejor Liga</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.id}>
                    <td data-label="#"><strong>{index + 1}</strong></td>
                    <td data-label="Nick"><strong>{entry.nick}</strong></td>
                    <td data-label="Carrera">
                      <span>{formatCareerRangeLabel(entry)}</span>
                      <small>{entry.gameVersion}</small>
                    </td>
                    <td data-label="Puntos"><strong>{entry.arcadeScore}</strong></td>
                    <td data-label="Temp.">{entry.completedSeasons}</td>
                    <td data-label="Europa" className="career-global-ranking-europa-cell"><span>{formatEuropeanTrophyBreakdownLabel(entry.trophyCounts)}</span></td>
                    <td data-label="Mejor Liga">{entry.bestLeaguePosition}.º</td>
                    <td data-label="Fecha">{formatRankingDate(entry.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="career-global-ranking-actions">
          <button type="button" className="primary-home-button" onClick={onNewCareer}>
            Nueva carrera
          </button>
          <button type="button" className="secondary-home-button" onClick={onViewLocalRanking}>
            Ranking local
          </button>
          <button type="button" className="secondary-home-button" onClick={() => setEndpointRevision((value) => value + 1)}>
            Recargar ranking
          </button>
          <button type="button" className="secondary-home-button" onClick={onBack}>
            Volver
          </button>
        </div>

        <p className="career-global-ranking-privacy">
          <a href="privacidad.html">Política de privacidad del ranking global</a>
        </p>
      </section>
    </main>
  );
}

export default CareerGlobalRanking;
