import { useMemo, useState } from "react";

import { canChangeFormationWithOnePlayer } from "../career/careerRules";
import { FORMATIONS } from "../data/formations";
import { resolvePlayerSlotPlacement } from "../domain/positionRules";
import type { Formation, FormationSlot, SelectedPlayer } from "../types/game";

import "./CareerFormationChangePicker.css";

interface CareerFormationChangePickerProps {
  currentFormation: Formation;
  selectedPlayers: SelectedPlayer[];
  nextSeasonLabel: string;
  onConfirmFormationChange: (formation: Formation, remappedPlayers: SelectedPlayer[]) => void;
  allowOpenSlot?: boolean;
  removedPlayer?: SelectedPlayer;
  onCancel: () => void;
}

interface FormationOption {
  formation: Formation;
  remappedPlayers: SelectedPlayer[];
  reason: string;
  movementLabel: string;
  isKeepCurrent?: boolean;
}

const LINE_LABELS: Record<FormationSlot["line"], string> = {
  goalkeeper: "portería",
  defense: "defensa",
  midfield: "medio",
  attack: "ataque",
};

function buildMovementLabel(result: ReturnType<typeof canChangeFormationWithOnePlayer>): string {
  if (!result.removedLine || !result.addedLine) return "Misma estructura de líneas";

  return `Mueve 1 jugador: ${LINE_LABELS[result.removedLine]} → ${LINE_LABELS[result.addedLine]}`;
}

function getOriginalSlotLine(formation: Formation, selectedPlayer: SelectedPlayer): FormationSlot["line"] | undefined {
  return formation.slots.find((slot) => slot.id === selectedPlayer.slotId)?.line;
}

function buildKeepCurrentFormationOption(
  currentFormation: Formation,
  selectedPlayers: SelectedPlayer[],
  allowOpenSlot: boolean,
  removedPlayer?: SelectedPlayer,
): FormationOption | undefined {
  if (!allowOpenSlot || !removedPlayer) return undefined;

  const occupiedSlotIds = new Set(selectedPlayers.map((player) => player.slotId));
  const openSlots = currentFormation.slots.filter((slot) => !occupiedSlotIds.has(slot.id));

  if (selectedPlayers.length !== currentFormation.slots.length - 1 || openSlots.length !== 1) {
    return undefined;
  }

  return {
    formation: currentFormation,
    remappedPlayers: selectedPlayers,
    reason: "Mantienes la alineación actual y solo cambias el jugador que ha salido.",
    movementLabel: "Solo cambio de jugador",
    isKeepCurrent: true,
  };
}

function remapPlayersToFormation(
  selectedPlayers: SelectedPlayer[],
  formation: Formation,
  currentFormation: Formation,
  allowOpenSlot = false,
  requiredOpenSlotLine?: FormationSlot["line"],
): SelectedPlayer[] | undefined {
  const slots = [...formation.slots].sort((a, b) => {
    const order: Record<FormationSlot["line"], number> = {
      goalkeeper: 0,
      defense: 1,
      midfield: 2,
      attack: 3,
    };

    return order[a.line] - order[b.line];
  });

  const players = [...selectedPlayers].sort(
    (a, b) => b.playerSeason.overall - a.playerSeason.overall,
  );

  function search(
    slotIndex: number,
    remainingPlayers: SelectedPlayer[],
    placedPlayers: SelectedPlayer[],
    skippedSlot: boolean,
  ): SelectedPlayer[] | undefined {
    if (slotIndex >= slots.length) {
      return remainingPlayers.length === 0 ? placedPlayers : undefined;
    }

    const slot = slots[slotIndex];

    if (allowOpenSlot && !skippedSlot && slot.line === requiredOpenSlotLine) {
      const skippedResult = search(slotIndex + 1, remainingPlayers, placedPlayers, true);
      if (skippedResult) return skippedResult;
    }

    const candidates = remainingPlayers
      .map((player, index) => ({
        player,
        index,
        originalLine: getOriginalSlotLine(currentFormation, player),
        placement: resolvePlayerSlotPlacement(player.playerSeason, slot),
      }))
      .filter((item) => item.originalLine === slot.line && item.placement.canPlace)
      .sort((a, b) => b.player.playerSeason.overall - a.player.playerSeason.overall);

    for (const candidate of candidates) {
      const nextRemaining = remainingPlayers.filter((_, index) => index !== candidate.index);
      const nextPlaced: SelectedPlayer[] = [
        ...placedPlayers,
        {
          slotId: slot.id,
          position: candidate.placement.assignedPosition ?? slot.allowedPositions[0],
          playerSeason: candidate.player.playerSeason,
        },
      ];

      const result = search(slotIndex + 1, nextRemaining, nextPlaced, skippedSlot);
      if (result) return result;
    }

    return undefined;
  }

  return search(0, players, [], false);
}

export function CareerFormationChangePicker({
  currentFormation,
  selectedPlayers,
  nextSeasonLabel,
  onConfirmFormationChange,
  allowOpenSlot = false,
  removedPlayer,
  onCancel,
}: CareerFormationChangePickerProps) {
  const [selectedFormationId, setSelectedFormationId] = useState<string | undefined>();

  const options = useMemo<FormationOption[]>(() => {
    const keepCurrentOption = buildKeepCurrentFormationOption(
      currentFormation,
      selectedPlayers,
      allowOpenSlot,
      removedPlayer,
    );

    const formationChangeOptions = FORMATIONS
      .filter((formation) => formation.id !== currentFormation.id)
      .map((formation) => {
        const compatibility = canChangeFormationWithOnePlayer(currentFormation, formation);
        if (!compatibility.canChange) return undefined;

        const removedPlayerOriginalLine = removedPlayer
          ? getOriginalSlotLine(currentFormation, removedPlayer)
          : undefined;
        const requiredOpenSlotLine = compatibility.addedLine ?? removedPlayerOriginalLine;

        if (allowOpenSlot) {
          if (!removedPlayerOriginalLine || !requiredOpenSlotLine) return undefined;
          if (compatibility.removedLine && compatibility.removedLine !== removedPlayerOriginalLine) {
            return undefined;
          }
        }

        const remappedPlayers = remapPlayersToFormation(
          selectedPlayers,
          formation,
          currentFormation,
          allowOpenSlot,
          requiredOpenSlotLine,
        );
        if (!remappedPlayers) return undefined;

        return {
          formation,
          remappedPlayers,
          reason: compatibility.reason,
          movementLabel: buildMovementLabel(compatibility),
        } satisfies FormationOption;
      })
      .filter((item): item is FormationOption => Boolean(item));

    return [keepCurrentOption, ...formationChangeOptions].filter(
      (item): item is FormationOption => Boolean(item),
    );
  }, [allowOpenSlot, currentFormation, removedPlayer, selectedPlayers]);

  const selectedOption = options.find((option) => option.formation.id === selectedFormationId);

  return (
    <main className="career-formation-change-screen">
      <section className="career-formation-change-card">
        <p className="eyebrow">Modo carrera · premio especial</p>
        <h1>Cambiar jugador o formación compatible</h1>
        <p className="career-formation-change-lead">
          Has desbloqueado un ajuste táctico para la temporada {nextSeasonLabel}. Puedes mantener tu formación actual y cambiar solo el jugador, o elegir una alineación compatible con los jugadores restantes, sin moverlos de su línea natural y con un hueco válido para el sustituto.
        </p>

        <section className="career-formation-change-current" aria-label="Formación actual">
          <span>Formación actual</span>
          <strong>{currentFormation.name}</strong>
          <small>{selectedPlayers.length}/{allowOpenSlot ? "10" : "11"} jugadores conservados</small>
        </section>

        {options.length === 0 ? (
          <section className="career-formation-change-empty">
            <strong>No hay formaciones compatibles para este once.</strong>
            <p>
              Los jugadores que quedan no encajan de forma segura en otra formación con un hueco válido para el sustituto. Puedes cancelar y avanzar a la siguiente temporada sin aplicar el cambio.
            </p>
          </section>
        ) : (
          <div className="career-formation-change-grid">
            {options.map((option) => {
              const isSelected = option.formation.id === selectedFormationId;

              return (
                <button
                  key={option.formation.id}
                  type="button"
                  className={`career-formation-option ${isSelected ? "career-formation-option-selected" : ""}`}
                  onClick={() => setSelectedFormationId(option.formation.id)}
                >
                  <span>{option.isKeepCurrent ? "Mantener formación" : "Nueva formación"}</span>
                  <strong>{option.formation.name}</strong>
                  <small>{option.movementLabel}</small>
                  <em>{option.reason}</em>
                </button>
              );
            })}
          </div>
        )}

        {selectedOption && (
          <section className="career-formation-change-confirm" aria-label="Confirmar cambio de formación">
            <div>
              <span>Cambio seleccionado</span>
              <strong>
                {selectedOption.isKeepCurrent
                  ? `${currentFormation.name} · solo cambio de jugador`
                  : `${currentFormation.name} → ${selectedOption.formation.name}`}
              </strong>
              <small>
                {selectedOption.isKeepCurrent
                  ? "No se cambia la formación: el próximo draft cubrirá el hueco exacto del jugador que has elegido retirar."
                  : "Se recolocan automáticamente los jugadores actuales y el próximo draft cubrirá el hueco libre."} Si cancelas, conservarás tu plantilla y formación actuales y avanzarás a la siguiente temporada.
              </small>
            </div>
          </section>
        )}

        <div className="career-formation-change-actions">
          <button
            type="button"
            className="primary-home-button"
            disabled={!selectedOption}
            onClick={() => {
              if (!selectedOption) return;
              onConfirmFormationChange(selectedOption.formation, selectedOption.remappedPlayers);
            }}
          >
            {selectedOption?.isKeepCurrent ? "Solo cambiar jugador" : "Confirmar alineación"}
          </button>
          <button type="button" className="secondary-home-button" onClick={onCancel}>
            Cancelar y avanzar
          </button>
        </div>
      </section>
    </main>
  );
}

export default CareerFormationChangePicker;
