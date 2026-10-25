// src/app/teamValidation.ts
//
// Validación y saneado del equipo del draft (extraído de src/App.tsx, v0.25.7).
// Funciones puras: no dependen del estado de la aplicación.

import { getPlayerIdentityKey, resolvePlayerSlotPlacement } from "../domain/positionRules";
import type { Formation, SelectedPlayer } from "../types/game";

export const TOTAL_PLAYER_ROUNDS = 11;

interface TeamValidationResult {
  valid: boolean;
  errors: string[];
}


function validateSelectedTeam(params: {
  formation?: Formation;
  selectedPlayers: SelectedPlayer[];
  expectedPlayerCount?: number;
}): TeamValidationResult {
  const { formation, selectedPlayers, expectedPlayerCount = TOTAL_PLAYER_ROUNDS } = params;
  const errors: string[] = [];

  if (!formation) {
    errors.push("No hay formación seleccionada.");
    return { valid: false, errors };
  }

  if (selectedPlayers.length !== expectedPlayerCount) {
    errors.push(`El once debe tener ${expectedPlayerCount}/${TOTAL_PLAYER_ROUNDS} jugadores para este paso y tiene ${selectedPlayers.length}.`);
  }

  if (selectedPlayers.length > TOTAL_PLAYER_ROUNDS) {
    errors.push(`El once tiene demasiados jugadores: ${selectedPlayers.length}/${TOTAL_PLAYER_ROUNDS}.`);
  }

  const seenNames = new Map<string, string>();
  const seenSlots = new Map<string, string>();

  for (const selected of selectedPlayers) {
    const normalizedName = getPlayerIdentityKey(selected.playerSeason);
    const previousName = seenNames.get(normalizedName);

    if (previousName) {
      errors.push(`Jugador repetido: ${selected.playerSeason.name}.`);
    } else {
      seenNames.set(normalizedName, selected.playerSeason.name);
    }

    const previousSlot = seenSlots.get(selected.slotId);

    if (previousSlot) {
      errors.push(
        `Puesto ocupado dos veces: ${selected.slotId} (${previousSlot} y ${selected.playerSeason.name}).`
      );
    } else {
      seenSlots.set(selected.slotId, selected.playerSeason.name);
    }

    const slot = formation.slots.find((item) => item.id === selected.slotId);

    if (!slot) {
      errors.push(`Puesto no encontrado en la formación: ${selected.slotId}.`);
      continue;
    }

    const placement = resolvePlayerSlotPlacement(selected.playerSeason, slot);

    if (!placement.canPlace) {
      errors.push(
        placement.reason ?? `${selected.playerSeason.name} no puede ocupar ${slot.label}.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function sanitizeSelectedPlayers(params: {
  formation?: Formation;
  selectedPlayers: SelectedPlayer[];
}): SelectedPlayer[] {
  const { formation, selectedPlayers } = params;

  if (!formation) return [];

  const usedNames = new Set<string>();
  const usedSlots = new Set<string>();
  const cleaned: SelectedPlayer[] = [];

  for (const selected of selectedPlayers) {
    const normalizedName = getPlayerIdentityKey(selected.playerSeason);
    const slot = formation.slots.find((item) => item.id === selected.slotId);

    if (!slot) continue;
    if (usedNames.has(normalizedName)) continue;
    if (usedSlots.has(selected.slotId)) continue;
    if (!resolvePlayerSlotPlacement(selected.playerSeason, slot).canPlace) continue;

    usedNames.add(normalizedName);
    usedSlots.add(selected.slotId);
    cleaned.push(selected);
  }

  return cleaned;
}

export { sanitizeSelectedPlayers, validateSelectedTeam };
export type { TeamValidationResult };
