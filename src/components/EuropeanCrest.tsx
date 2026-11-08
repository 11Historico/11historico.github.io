// src/components/EuropeanCrest.tsx
//
// Escudo genérico de un rival europeo (v0.25.102): la bandera de su país con las iniciales
// del club. El país va en texto para quien no distingue los colores.

import { getEuropeanCrestBackground, getEuropeanCrestInitials } from "../europe/europeanCrest";
import type { EuropeanOpponent } from "../europe/europeanTypes";

import "./EuropeanCrest.css";

export function EuropeanCrest({ opponent, compact = false }: { opponent: Pick<EuropeanOpponent, "name" | "country">; compact?: boolean }) {
  return (
    <span
      className={compact ? "european-crest european-crest-compact" : "european-crest"}
      style={{ background: getEuropeanCrestBackground(opponent.country) }}
      role="img"
      aria-label={opponent.country}
      title={`${opponent.name} · ${opponent.country}`}
    >
      <span aria-hidden="true">{getEuropeanCrestInitials(opponent.name)}</span>
    </span>
  );
}
