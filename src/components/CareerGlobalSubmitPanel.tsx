import { useMemo, useState } from "react";
import type { CareerLocalRankingEntry } from "../types/career";
import {
  buildCareerGlobalRankingPayload,
  isGlobalRankingConfigured,
  submitGlobalRankingEntry,
  validateGlobalRankingNick,
} from "../services/globalRankingService";
import { trackEvent } from "../services/analytics";
import CareerGlobalEndpointConfig from "./CareerGlobalEndpointConfig";
import {
  hasSubmittedCareerGlobalRankingEntry,
  loadLastCareerGlobalRankingNick,
  markCareerGlobalRankingEntrySubmitted,
  saveLastCareerGlobalRankingNick,
} from "../storage/careerGlobalRankingStorage";

import "./CareerGlobalSubmitPanel.css";

interface CareerGlobalSubmitPanelProps {
  entry: CareerLocalRankingEntry;
  onViewGlobalRanking: () => void;
}

export function CareerGlobalSubmitPanel({ entry, onViewGlobalRanking }: CareerGlobalSubmitPanelProps) {
  const [nick, setNick] = useState(() => loadLastCareerGlobalRankingNick());
  const [submitted, setSubmitted] = useState(() => hasSubmittedCareerGlobalRankingEntry(entry.id));
  const [declined, setDeclined] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [endpointRevision, setEndpointRevision] = useState(0);

  const nickError = useMemo(() => nick ? validateGlobalRankingNick(nick) : undefined, [nick]);
  const endpointStatus = useMemo(() => ({
    configured: isGlobalRankingConfigured(),
    revision: endpointRevision,
  }), [endpointRevision]);
  const configured = endpointStatus.configured;

  function handleEndpointChange() {
    setEndpointRevision((value) => value + 1);
    setMessage("Endpoint guardado. Ya puedes enviar esta carrera al ranking global.");
  }

  async function handleSubmit() {
    const error = validateGlobalRankingNick(nick);

    if (error) {
      setMessage(error);
      return;
    }

    if (submitted) {
      setMessage("Esta carrera ya figura como enviada desde este navegador.");
      return;
    }

    const payload = buildCareerGlobalRankingPayload({ nick, entry });

    setIsSending(true);
    saveLastCareerGlobalRankingNick(nick);

    const result = await submitGlobalRankingEntry(payload);
    setIsSending(false);
    setMessage(result.message);
    if (result.ok) trackEvent("global_ranking_submit");

    // "duplicate" significa que el servidor ya tiene la carrera (por ejemplo, un
    // envío anterior que tardó más que el timeout): cuenta como enviada.
    if (result.ok || result.status === "duplicate") {
      markCareerGlobalRankingEntrySubmitted(entry.id);
      setSubmitted(true);
      onViewGlobalRanking();
    }
  }

  if (submitted) {
    return (
      <section className="career-global-submit-panel career-global-submit-panel-done" aria-label="Carrera enviada al ranking global">
        <h2>Carrera enviada al ranking global</h2>
        <div className="career-global-submit-actions">
          <button type="button" className="secondary-home-button" onClick={onViewGlobalRanking}>
            Ver ranking global
          </button>
        </div>
      </section>
    );
  }

  if (declined) {
    return (
      <section className="career-global-submit-panel career-global-submit-panel-declined" aria-label="Carrera no enviada al ranking global">
        <p>Esta carrera no se envía al ranking global. Queda solo en tu ranking local.</p>
        <button type="button" className="secondary-home-button" onClick={() => setDeclined(false)}>
          Cambiar de opinión
        </button>
      </section>
    );
  }

  return (
    <section className="career-global-submit-panel" aria-labelledby="career-global-submit-question">
      <div>
        <h2 id="career-global-submit-question">¿Enviar esta carrera al ranking global?</h2>
        <p>
          Tu puntuación se suma al Top global. Si no la envías, la carrera queda solo en tu ranking local.
        </p>
      </div>

      {!configured && (
        <>
          <p className="career-global-submit-message">El ranking global no está disponible en esta versión. Puedes configurar un endpoint aquí.</p>
          <CareerGlobalEndpointConfig compact onEndpointChange={handleEndpointChange} />
        </>
      )}

      <div className="career-global-submit-form">
        <label htmlFor="career-global-nick">Nick</label>
        <input
          id="career-global-nick"
          type="text"
          value={nick}
          maxLength={24}
          placeholder="Tu nick"
          onChange={(event) => setNick(event.target.value)}
          onBlur={() => saveLastCareerGlobalRankingNick(nick)}
        />
        {nickError && <small role="alert">{nickError}</small>}
      </div>

      <div className="career-global-submit-actions">
        <button
          type="button"
          className="career-global-submit-button"
          onClick={handleSubmit}
          disabled={isSending || !configured}
        >
          {!configured ? "Ranking global no disponible" : isSending ? "Enviando..." : "Sí, enviar al ranking global"}
        </button>
        <button type="button" className="career-global-decline-button" onClick={() => setDeclined(true)}>
          No enviar
        </button>
      </div>

      <p className="career-global-submit-message" role="status">{message}</p>
    </section>
  );
}

export default CareerGlobalSubmitPanel;
