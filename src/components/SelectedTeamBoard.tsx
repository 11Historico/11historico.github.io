// src/components/SelectedTeamBoard.tsx

import type { Formation, SelectedPlayer } from "../types/game";
import TacticalPitch from "./TacticalPitch";

import "./SelectedTeamBoard.css";

interface SelectedTeamBoardProps {
  formation: Formation;
  selectedPlayers: SelectedPlayer[];
  title?: string;
  compact?: boolean;
}

function getAverageOverall(selectedPlayers: SelectedPlayer[]): number {
  if (selectedPlayers.length === 0) return 0;

  const total = selectedPlayers.reduce(
    (sum, selected) => sum + selected.playerSeason.overall,
    0
  );

  return Math.round(total / selectedPlayers.length);
}

function getProgressLabel(selectedPlayers: SelectedPlayer[], formation: Formation): string {
  return `${selectedPlayers.length}/${formation.slots.length}`;
}

function getBestPlayer(selectedPlayers: SelectedPlayer[]): SelectedPlayer | undefined {
  return [...selectedPlayers].sort(
    (a, b) => b.playerSeason.overall - a.playerSeason.overall
  )[0];
}

export function SelectedTeamBoard({
  formation,
  selectedPlayers,
  title = "Once histórico Zurigorri",
  compact = false,
}: SelectedTeamBoardProps) {
  const averageOverall = getAverageOverall(selectedPlayers);
  const progressLabel = getProgressLabel(selectedPlayers, formation);
  const isComplete = selectedPlayers.length >= formation.slots.length;
  const bestPlayer = getBestPlayer(selectedPlayers);

  return (
    <section className={`selected-team-board ${compact ? "selected-team-board-compact" : ""}`}>
      <header className="selected-team-board-header">
        <div>
          <p className="eyebrow">Tu equipo</p>
          <h2>{title}</h2>
          <p>
            Formación <strong>{formation.name}</strong> · Progreso{" "}
            <strong>{progressLabel}</strong>
          </p>
        </div>

        <div className="team-board-summary">
          <span>{isComplete ? "Completo" : "En construcción"}</span>
          <strong>{averageOverall > 0 ? averageOverall : "--"}</strong>
          <small>media del once</small>
        </div>
      </header>

      <TacticalPitch
        formation={formation}
        selectedPlayers={selectedPlayers}
        compact={compact}
        showNames
      />

      <footer className="team-board-footer">
        <div>
          <strong>{bestPlayer ? bestPlayer.playerSeason.name : "Sin jugador clave aún"}</strong>
          <span>
            {bestPlayer
              ? `Mejor media actual: ${bestPlayer.playerSeason.overall} · ${bestPlayer.position}`
              : "Elige jugadores para empezar a formar el once"}
          </span>
        </div>

        <div>
          <strong>{formation.strengths[0]}</strong>
          <span>Punto fuerte de la formación</span>
        </div>
      </footer>
    </section>
  );
}

export default SelectedTeamBoard;
