// src/components/MatchHalfTimeControl.tsx
// Decisión en el descanso (v0.25.78): el partido se para a los 45' en Copa y Europa.

import { useEffect, useRef } from "react";

import type { HalfTimeChoice } from "../types/game";
import { MatchIcon, type MatchIconKind } from "./MatchIcon";

import "./MatchApproachControl.css";

const OPTIONS: { value: HalfTimeChoice; label: string; icon: MatchIconKind }[] = [
  { value: "keep", label: "Seguir igual", icon: "balanced" },
  { value: "push", label: "Arriesgar", icon: "attacking" },
  { value: "close", label: "Cerrar el partido", icon: "defensive" },
];

export function MatchHalfTimeControl({ onChoice }: { onChoice: (choice: HalfTimeChoice) => void }) {
  const controlRef = useRef<HTMLDivElement>(null);

  // El botón de simular queda lejos de la tarjeta: sin esto, la decisión puede quedar fuera de la pantalla.
  useEffect(() => {
    controlRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div ref={controlRef} className="match-approach match-half-time">
      <div className="match-approach-options" role="group" aria-label="Decisión del descanso">
        <span>Descanso</span>
        {OPTIONS.map((option) => (
          <button key={option.value} type="button" className="match-approach-option" onClick={() => onChoice(option.value)}>
            <MatchIcon kind={option.icon} />
            {option.label}
          </button>
        ))}
      </div>
      <p>Arriesgar trae más goles en los dos lados durante la segunda parte, y cerrar el partido, menos.</p>
    </div>
  );
}
