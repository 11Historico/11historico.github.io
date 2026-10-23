// src/components/PhaseProgress.tsx

import type { GamePhase } from "../types/game";
import { APP_VERSION } from "../config/appVersion";

import "./PhaseProgress.css";

interface PhaseProgressProps {
  phase: GamePhase;
  playerProgress?: {
    selected: number;
    total: number;
  };
}

const PHASES: Array<{
  id: GamePhase;
  label: string;
  shortLabel: string;
}> = [
  {
    id: "formation_selection",
    label: "Formación",
    shortLabel: "Formación",
  },
  {
    id: "player_selection",
    label: "Jugadores",
    shortLabel: "Jugadores",
  },
  {
    id: "coach_selection",
    label: "Entrenador",
    shortLabel: "Míster",
  },
  {
    id: "team_summary",
    label: "Resumen",
    shortLabel: "Resumen",
  },
  {
    id: "league_simulation",
    label: "Liga",
    shortLabel: "Liga",
  },
  {
    id: "finished",
    label: "Resultado",
    shortLabel: "Final",
  },
];

function getPhaseIndex(phase: GamePhase): number {
  const index = PHASES.findIndex((item) => item.id === phase);
  return index >= 0 ? index : 0;
}

export function PhaseProgress({ phase, playerProgress }: PhaseProgressProps) {
  const activeIndex = getPhaseIndex(phase);

  return (
    <nav className="phase-progress" aria-label="Progreso de la partida">
      <span className="phase-version-pill">{APP_VERSION}</span>
      <div className="phase-progress-inner">
        {PHASES.map((item, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;

          return (
            <div
              key={item.id}
              className={`phase-step ${isActive ? "phase-step-active" : ""} ${
                isDone ? "phase-step-done" : ""
              }`}
            >
              <span className="phase-step-number">{isDone ? "✓" : index + 1}</span>

              <div>
                <strong>{item.label}</strong>

                {item.id === "player_selection" && playerProgress ? (
                  <small>
                    {playerProgress.selected}/{playerProgress.total}
                  </small>
                ) : (
                  <small>{item.shortLabel}</small>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export default PhaseProgress;
