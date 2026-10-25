import { beforeEach, describe, expect, it, vi } from "vitest";

const validateMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/app/teamValidation", () => ({
  TOTAL_PLAYER_ROUNDS: 11,
  validateSelectedTeam: validateMock,
}));

import { checkCareerFormationChange, startCareerFormationChange } from "../../src/app/careerRewardFlow";
import type { Formation, SelectedPlayer } from "../../src/types/game";

// Formación de prueba con dos huecos posibles; los jugadores solo ocupan slotId.
function formationWithSlots(slotIds: string[]): Formation {
  return { id: "test", slots: slotIds.map((id) => ({ id })) } as unknown as Formation;
}

function players(slotIds: string[]): SelectedPlayer[] {
  return slotIds.map((slotId) => ({ slotId }) as unknown as SelectedPlayer);
}

beforeEach(() => {
  validateMock.mockReset();
  validateMock.mockReturnValue({ valid: true, errors: [] });
});

describe("startCareerFormationChange", () => {
  it("guarda la formación actual para poder cancelar y entra en el reemplazo", () => {
    const current = formationWithSlots(["gk", "rb"]);
    const patch = startCareerFormationChange(current);

    expect(patch.careerRewardFlow).toBe("player_formation");
    expect(patch.replacementOriginalFormation).toBe(current);
    expect(patch.phase).toBe("player_selection");
    expect(patch.screen).toBe("career_player_replacement_pick");
    expect(patch.leagueContext).toBeUndefined();
    expect(patch.teamRating).toBeUndefined();
  });
});

describe("checkCareerFormationChange: cambio de formación de la carrera", () => {
  it("acepta un equipo válido con exactamente un hueco", () => {
    const result = checkCareerFormationChange({
      isPlayerFormationFlow: true,
      formation: formationWithSlots(["gk", "rb"]),
      remappedPlayers: players(["gk"]),
    });

    expect(result).toEqual({ valid: true });
  });

  it("rechaza si quedan dos huecos y explica cuántos", () => {
    const result = checkCareerFormationChange({
      isPlayerFormationFlow: true,
      formation: formationWithSlots(["gk", "rb"]),
      remappedPlayers: [],
    });

    expect(result).toEqual({
      valid: false,
      errors: ["La nueva formación debe dejar exactamente 1 hueco y deja 2."],
    });
  });

  it("devuelve los errores de la validación del equipo aunque el hueco sea correcto", () => {
    validateMock.mockReturnValue({ valid: false, errors: ["Falta un portero."] });

    const result = checkCareerFormationChange({
      isPlayerFormationFlow: true,
      formation: formationWithSlots(["gk", "rb"]),
      remappedPlayers: players(["gk"]),
    });

    expect(result).toEqual({ valid: false, errors: ["Falta un portero."] });
  });
});

describe("checkCareerFormationChange: resto de flujos", () => {
  it("acepta cualquier equipo válido, sin exigir un hueco", () => {
    const result = checkCareerFormationChange({
      isPlayerFormationFlow: false,
      formation: formationWithSlots(["gk", "rb"]),
      remappedPlayers: [],
    });

    expect(result).toEqual({ valid: true });
  });

  it("devuelve los errores de la validación si el equipo no es válido", () => {
    validateMock.mockReturnValue({ valid: false, errors: ["Demasiados defensas."] });

    const result = checkCareerFormationChange({
      isPlayerFormationFlow: false,
      formation: formationWithSlots(["gk", "rb"]),
      remappedPlayers: players(["gk"]),
    });

    expect(result).toEqual({ valid: false, errors: ["Demasiados defensas."] });
  });
});
