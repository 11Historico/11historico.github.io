import type { Formation, SelectedPlayer } from "../types/game";
import TacticalPitch from "./TacticalPitch";

import "./CareerPlayerReplacementPicker.css";

interface CareerPlayerReplacementPickerProps {
  formation: Formation;
  selectedPlayers: SelectedPlayer[];
  nextSeasonLabel: string;
  mode?: "player" | "player_formation" | "luck_wheel_player";
  onSelectPlayerToReplace: (selection: SelectedPlayer) => void;
  onCancel: () => void;
}

export function CareerPlayerReplacementPicker({
  formation,
  selectedPlayers,
  nextSeasonLabel,
  mode = "player",
  onSelectPlayerToReplace,
  onCancel,
}: CareerPlayerReplacementPickerProps) {
  const isLuckWheelMode = mode === "luck_wheel_player";

  return (
    <main className="career-replace-screen">
      <section className="career-replace-card">
        <header className="career-replace-header">
          <div>
            <p className="eyebrow">Modo carrera · {nextSeasonLabel}</p>
            <h1>Elige el jugador que quieres cambiar</h1>
            <p>
              {mode === "player_formation"
                ? "Saldrá un jugador del once actual. Después elegirás una alineación compatible y se sorteará un sustituto para el hueco libre. Si cancelas, conservas el once actual y avanzas a la siguiente temporada."
                : isLuckWheelMode
                  ? "Premio de ruleta: puedes cambiar un jugador ahora mismo. Saldrá un jugador del once actual y se sorteará una temporada histórica para buscar un sustituto compatible. Si cancelas, volverás a la Liga con el once actual."
                  : "Saldrá un jugador del once actual. Después se sorteará una temporada histórica y elegirás un sustituto compatible. Si cancelas, conservas el once actual y avanzas a la siguiente temporada."}
            </p>
          </div>
          <button type="button" className="secondary-home-button" onClick={onCancel}>
            {isLuckWheelMode ? "Cancelar y volver a la Liga" : "Cancelar y avanzar"}
          </button>
        </header>

        <div className="career-replace-layout">
          <section className="career-replace-board">
            <TacticalPitch formation={formation} selectedPlayers={selectedPlayers} showNames compact />
          </section>

          <section className="career-replace-list" aria-label="Jugadores del once actual">
            {selectedPlayers.map((selection) => (
              <article key={`${selection.slotId}-${selection.playerSeason.id}`} className="career-replace-player-card">
                <div>
                  <strong>{selection.playerSeason.name}</strong>
                  <span>
                    {selection.position} · {selection.playerSeason.season} · Media {selection.playerSeason.overall}
                  </span>
                </div>
                <button type="button" onClick={() => onSelectPlayerToReplace(selection)}>
                  {mode === "player_formation" ? "Elegir y ver alineaciones" : "Cambiar"}
                </button>
              </article>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}

export default CareerPlayerReplacementPicker;
