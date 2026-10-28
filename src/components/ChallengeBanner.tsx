// src/components/ChallengeBanner.tsx
//
// Aviso de reto en la home (v0.25.9): muestra la marca recibida en el enlace.
// No inicia ninguna carrera: solo informa.

import { formatCareerTrophyCounts } from "../career/shareRetention";
import type { ChallengeSummary } from "../career/challengeLink";

import "./ChallengeBanner.css";

interface ChallengeBannerProps {
  challenge: ChallengeSummary;
  onDismiss: () => void;
}

export function ChallengeBanner({ challenge, onDismiss }: ChallengeBannerProps) {
  return (
    <section className="challenge-banner" aria-label="Reto recibido">
      <div className="challenge-banner-info">
        <span className="challenge-banner-eyebrow">Reto recibido</span>
        <strong>{challenge.arcadeScore} puntos</strong>
        <p>
          {challenge.completedSeasons} {challenge.completedSeasons === 1 ? "temporada superada" : "temporadas superadas"} · Mejor Liga {challenge.bestLeaguePosition}.º
        </p>
        <small>Palmarés: {formatCareerTrophyCounts(challenge.trophyCounts)}</small>
      </div>
      <p className="challenge-banner-hint">Entra en Jugar carrera y supera esta marca.</p>
      <button type="button" className="secondary-home-button" onClick={onDismiss}>
        Cerrar
      </button>
    </section>
  );
}

export default ChallengeBanner;
