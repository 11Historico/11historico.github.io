// src/components/TacticalPitch.tsx

import type { Formation, FormationSlot, SelectedPlayer } from "../types/game";

import "./TacticalPitch.css";

interface TacticalPitchProps {
  formation: Formation;
  selectedPlayers?: SelectedPlayer[];
  compact?: boolean;
  showNames?: boolean;

  /**
   * Modo draft interactivo.
   * Si se informa, los slots compatibles se iluminan y se puede hacer clic.
   */
  highlightedSlotIds?: string[];
  activeSlotId?: string;
  onSlotClick?: (slot: FormationSlot) => void;

  /** Quién ha marcado o asistido en el partido, por nombre. Se resaltan con su nombre (v0.25.76). */
  goalContributions?: Record<string, "goal" | "assist">;
}

type PitchCoordinates = {
  x: number;
  y: number;
};

const DEFAULT_COORDINATES_BY_LABEL: Record<string, PitchCoordinates> = {
  POR: { x: 50, y: 91 },

  LD: { x: 82, y: 72 },
  LI: { x: 18, y: 72 },
  DFC: { x: 50, y: 74 },
  "DFC-I": { x: 38, y: 74 },
  "DFC-C": { x: 50, y: 76 },
  "DFC-D": { x: 62, y: 74 },
  "DFC izquierdo": { x: 38, y: 74 },
  "DFC derecho": { x: 62, y: 74 },
  CAD: { x: 86, y: 58 },
  CAI: { x: 14, y: 58 },

  MCD: { x: 50, y: 60 },
  MC: { x: 50, y: 50 },
  "MC-I": { x: 35, y: 50 },
  "MC-C": { x: 50, y: 50 },
  "MC-D": { x: 65, y: 50 },
  "MC izquierdo": { x: 35, y: 49 },
  "MC derecho": { x: 65, y: 49 },
  "MC centro": { x: 50, y: 49 },
  MI: { x: 18, y: 45 },
  MD: { x: 82, y: 45 },
  MP: { x: 50, y: 39 },

  EI: { x: 20, y: 22 },
  ED: { x: 80, y: 22 },
  SD: { x: 38, y: 20 },
  DC: { x: 62, y: 18 },
  "DC-I": { x: 38, y: 18 },
  "DC-D": { x: 62, y: 18 },
  "DC izquierdo": { x: 38, y: 17 },
  "DC derecho": { x: 62, y: 17 },
};

const FORMATION_COORDINATES: Record<string, PitchCoordinates[]> = {
  "4-3-3": [
    { x: 50, y: 91 },
    { x: 82, y: 72 },
    { x: 62, y: 75 },
    { x: 38, y: 75 },
    { x: 18, y: 72 },
    { x: 31, y: 52 },
    { x: 50, y: 57 },
    { x: 69, y: 52 },
    { x: 18, y: 25 },
    { x: 50, y: 16 },
    { x: 82, y: 25 },
  ],

  "4-4-2": [
    { x: 50, y: 91 },
    { x: 82, y: 72 },
    { x: 62, y: 75 },
    { x: 38, y: 75 },
    { x: 18, y: 72 },
    { x: 16, y: 49 },
    { x: 40, y: 54 },
    { x: 60, y: 54 },
    { x: 84, y: 49 },
    { x: 38, y: 18 },
    { x: 62, y: 18 },
  ],

  "4-2-3-1": [
    { x: 50, y: 91 }, // POR
    { x: 82, y: 72 }, // LD
    { x: 62, y: 75 }, // DFC-D
    { x: 38, y: 75 }, // DFC-I
    { x: 18, y: 72 }, // LI
    { x: 39, y: 60 }, // MCD
    { x: 61, y: 60 }, // MC
    { x: 50, y: 36 }, // MP
    { x: 18, y: 37 }, // EI
    { x: 82, y: 37 }, // ED
    { x: 50, y: 16 }, // DC
  ],

  "5-3-2": [
    { x: 50, y: 91 }, // POR
    { x: 70, y: 76 }, // DFC-D
    { x: 50, y: 79 }, // DFC-C
    { x: 30, y: 76 }, // DFC-I
    { x: 88, y: 57 }, // CAD
    { x: 12, y: 57 }, // CAI
    { x: 35, y: 51 }, // MC
    { x: 63, y: 48 }, // MP
    { x: 50, y: 58 }, // MCD
    { x: 38, y: 18 }, // SD
    { x: 62, y: 18 }, // DC
  ],

  "3-5-2": [
    { x: 50, y: 91 }, // POR
    { x: 70, y: 76 }, // DFC-D
    { x: 50, y: 79 }, // DFC-C
    { x: 30, y: 76 }, // DFC-I
    { x: 88, y: 55 }, // CAD
    { x: 12, y: 55 }, // CAI
    { x: 50, y: 58 }, // MCD
    { x: 35, y: 50 }, // MC
    { x: 65, y: 50 }, // MP
    { x: 38, y: 18 }, // SD
    { x: 62, y: 18 }, // DC
  ],

  "4-5-1": [
    { x: 50, y: 91 }, // POR
    { x: 84, y: 72 }, // LD
    { x: 63, y: 76 }, // DFC-D
    { x: 37, y: 76 }, // DFC-I
    { x: 16, y: 72 }, // LI
    { x: 40, y: 60 }, // MCD
    { x: 60, y: 60 }, // MC
    { x: 50, y: 42 }, // MP
    { x: 16, y: 44 }, // MI
    { x: 84, y: 44 }, // MD
    { x: 50, y: 16 }, // DC
  ],
  "3-4-3": [
    { x: 50, y: 91 },
    { x: 30, y: 76 },
    { x: 50, y: 79 },
    { x: 70, y: 76 },
    { x: 14, y: 51 },
    { x: 40, y: 54 },
    { x: 60, y: 54 },
    { x: 86, y: 51 },
    { x: 22, y: 24 },
    { x: 50, y: 16 },
    { x: 78, y: 24 },
  ],
  "5-4-1": [
    { x: 50, y: 91 },
    { x: 12, y: 64 },
    { x: 30, y: 76 },
    { x: 50, y: 79 },
    { x: 70, y: 76 },
    { x: 88, y: 64 },
    { x: 18, y: 49 },
    { x: 40, y: 55 },
    { x: 60, y: 55 },
    { x: 82, y: 49 },
    { x: 50, y: 16 },
  ],
  "3-6-1": [
    { x: 50, y: 91 },
    { x: 30, y: 76 },
    { x: 50, y: 79 },
    { x: 70, y: 76 },
    { x: 13, y: 49 },
    { x: 50, y: 61 },
    { x: 36, y: 53 },
    { x: 64, y: 53 },
    { x: 50, y: 38 },
    { x: 87, y: 49 },
    { x: 50, y: 16 },
  ],
  "3-3-4": [
    { x: 50, y: 91 },
    { x: 30, y: 76 },
    { x: 50, y: 79 },
    { x: 70, y: 76 },
    { x: 35, y: 53 },
    { x: 50, y: 58 },
    { x: 65, y: 53 },
    { x: 16, y: 24 },
    { x: 41, y: 17 },
    { x: 59, y: 17 },
    { x: 84, y: 24 },
  ],
  "4-2-4": [
    { x: 50, y: 91 },
    { x: 82, y: 72 },
    { x: 62, y: 75 },
    { x: 38, y: 75 },
    { x: 18, y: 72 },
    { x: 42, y: 55 },
    { x: 58, y: 55 },
    { x: 17, y: 24 },
    { x: 41, y: 17 },
    { x: 59, y: 17 },
    { x: 83, y: 24 },
  ],
  "4-6-0": [
    { x: 50, y: 91 },
    { x: 82, y: 72 },
    { x: 62, y: 75 },
    { x: 38, y: 75 },
    { x: 18, y: 72 },
    { x: 42, y: 60 },
    { x: 58, y: 60 },
    { x: 16, y: 46 },
    { x: 39, y: 36 },
    { x: 61, y: 36 },
    { x: 84, y: 46 },
  ],
  "5-2-3": [
    { x: 50, y: 91 },
    { x: 12, y: 64 },
    { x: 30, y: 76 },
    { x: 50, y: 79 },
    { x: 70, y: 76 },
    { x: 88, y: 64 },
    { x: 42, y: 55 },
    { x: 58, y: 55 },
    { x: 22, y: 25 },
    { x: 50, y: 16 },
    { x: 78, y: 25 },
  ],
};

function getSelectedPlayerForSlot(
  slot: FormationSlot,
  selectedPlayers: SelectedPlayer[]
): SelectedPlayer | undefined {
  return selectedPlayers.find((selected) => selected.slotId === slot.id);
}

function getSlotCoordinates(
  formation: Formation,
  slot: FormationSlot,
  index: number
): PitchCoordinates {
  const formationCoordinates = FORMATION_COORDINATES[formation.name];

  if (formationCoordinates?.[index]) {
    return formationCoordinates[index];
  }

  return DEFAULT_COORDINATES_BY_LABEL[slot.label] ?? {
    x: 50,
    y: 50,
  };
}

function getMarkerClass(line: FormationSlot["line"]): string {
  if (line === "goalkeeper") return "tactical-marker tactical-marker-goalkeeper";
  if (line === "defense") return "tactical-marker tactical-marker-defense";
  if (line === "midfield") return "tactical-marker tactical-marker-midfield";
  return "tactical-marker tactical-marker-attack";
}

export function TacticalPitch({
  formation,
  selectedPlayers = [],
  compact = false,
  showNames = false,
  highlightedSlotIds = [],
  activeSlotId,
  onSlotClick,
  goalContributions,
}: TacticalPitchProps) {
  const highlightedSlots = new Set(highlightedSlotIds);
  const hasInteractiveSelection = highlightedSlots.size > 0;

  return (
    <div
      className={`tactical-pitch ${compact ? "tactical-pitch-compact" : ""} ${
        hasInteractiveSelection ? "tactical-pitch-selecting" : ""
      }`}
    >
      <div className="pitch-lines">
        <div className="pitch-center-circle" />
        <div className="pitch-half-line" />
        <div className="pitch-box pitch-box-top" />
        <div className="pitch-small-box pitch-small-box-top" />
        <div className="pitch-box pitch-box-bottom" />
        <div className="pitch-small-box pitch-small-box-bottom" />
      </div>

      {formation.slots.map((slot, index) => {
        const coordinates = getSlotCoordinates(formation, slot, index);
        const selectedPlayer = getSelectedPlayerForSlot(slot, selectedPlayers);
        const isHighlighted = !selectedPlayer && highlightedSlots.has(slot.id);
        const isActive = activeSlotId === slot.id;
        const isClickable = Boolean(onSlotClick && isHighlighted);
        const contribution = selectedPlayer && goalContributions?.[selectedPlayer.playerSeason.name];

        return (
          <button
            key={slot.id}
            type="button"
            className={`${getMarkerClass(slot.line)} ${
              selectedPlayer ? "tactical-marker-filled" : ""
            } ${isHighlighted ? "tactical-marker-highlighted" : ""} ${
              isActive ? "tactical-marker-active" : ""
            } ${isClickable ? "tactical-marker-clickable" : ""} ${
              contribution ? `tactical-marker-${contribution}` : ""
            }`}
            style={{
              left: `${coordinates.x}%`,
              top: `${coordinates.y}%`,
            }}
            title={selectedPlayer ? selectedPlayer.playerSeason.name : slot.allowedPositions.join(" / ")}
            disabled={!isClickable}
            onClick={() => {
              if (isClickable) {
                onSlotClick?.(slot);
              }
            }}
          >
            <span className="tactical-shirt">
              {selectedPlayer ? selectedPlayer.position : slot.label}
            </span>

            {(showNames || contribution) && (
              <strong className="tactical-player-name">
                {selectedPlayer ? selectedPlayer.playerSeason.name : isHighlighted ? "Elegir aquí" : "Libre"}
              </strong>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TacticalPitch;

