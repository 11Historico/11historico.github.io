import { describe, expect, it } from "vitest";

import { ATHLETIC_SEASONS } from "../../src/data/athletic/seasons";
import { getFormationById } from "../../src/data/formations";
import { resolvePlayerSlotPlacement } from "../../src/domain/positionRules";
import { calculateTeamRating } from "../../src/simulation/teamRating";
import type { Formation, SelectedCoach, SelectedPlayer } from "../../src/types/game";

const selectedCoach: SelectedCoach = { coachSeason: ATHLETIC_SEASONS[0].coach };

function buildSquad(formation: Formation): SelectedPlayer[] {
  const used = new Set<string>();

  return formation.slots.map((slot) => {
    for (const season of ATHLETIC_SEASONS) {
      for (const playerSeason of season.players) {
        const placement = resolvePlayerSlotPlacement(playerSeason, slot);

        if (placement.canPlace && !used.has(playerSeason.canonicalPlayerId)) {
          used.add(playerSeason.canonicalPlayerId);
          return { slotId: slot.id, position: placement.assignedPosition as SelectedPlayer["position"], playerSeason };
        }
      }
    }

    throw new Error(`Nadie puede ocupar ${slot.id}.`);
  });
}

function getFormation(id: string): Formation {
  const formation = getFormationById(id);
  if (!formation) throw new Error(`Falta la formación ${id}.`);
  return formation;
}

function averageOverall(players: SelectedPlayer[]): number {
  return players.reduce((sum, selected) => sum + selected.playerSeason.overall, 0) / players.length;
}

describe("Etiqueta del equipo (v0.25.80)", () => {
  function labelFor(formationId: string, overalls: { attack: number; midfield: number; defense: number }): string {
    const formation = getFormation(formationId);
    const lineBySlot = new Map(formation.slots.map((slot) => [slot.id, slot.line]));
    const selectedPlayers = buildSquad(formation).map((selected) => {
      const line = lineBySlot.get(selected.slotId);
      const overall = line === "attack" ? overalls.attack : line === "midfield" ? overalls.midfield : overalls.defense;

      return { ...selected, playerSeason: { ...selected.playerSeason, overall } };
    });

    return calculateTeamRating({ formation, selectedPlayers, selectedCoach }).profileLabel;
  }

  it("lee el estilo de la media real de cada línea", () => {
    expect(labelFor("4-3-3", { attack: 84, midfield: 78, defense: 76 })).toBe("Equipo ofensivo y vertical");
    expect(labelFor("4-3-3", { attack: 76, midfield: 78, defense: 84 })).toBe("Equipo sólido y competitivo");
    expect(labelFor("4-3-3", { attack: 76, midfield: 84, defense: 76 })).toBe("Equipo dominador de mediocampo");
  });

  it("sin una línea que destaque, la etiqueta depende del nivel", () => {
    expect(labelFor("4-3-3", { attack: 81, midfield: 81, defense: 81 })).toBe("Equipo equilibrado de alto nivel");
    expect(labelFor("4-3-3", { attack: 76, midfield: 76, defense: 76 })).toBe("Equipo competitivo");
  });

  it("en un 4-6-0 los medios cuentan como ataque", () => {
    expect(labelFor("4-6-0", { attack: 0, midfield: 84, defense: 76 })).toBe("Equipo ofensivo y vertical");
    expect(labelFor("4-6-0", { attack: 0, midfield: 76, defense: 84 })).toBe("Equipo sólido y competitivo");
  });
});

describe("Formación sin delanteros (v0.25.79)", () => {
  it("en un 4-6-0 los medios hacen de delanteros: su ataque no se hunde", () => {
    const formation = getFormation("4-6-0");
    const selectedPlayers = buildSquad(formation);
    const rating = calculateTeamRating({ formation, selectedPlayers, selectedCoach });

    expect(rating.attack).toBeGreaterThanOrEqual(averageOverall(selectedPlayers));
  });

  it("un 4-3-3 sin delanteros todavía elegidos sigue contando la línea como vacía", () => {
    const formation = getFormation("4-3-3");
    const squad = buildSquad(formation);
    const attackSlots = new Set(formation.slots.filter((slot) => slot.line === "attack").map((slot) => slot.id));
    const withoutAttackers = squad.filter((selected) => !attackSlots.has(selected.slotId));
    const complete = calculateTeamRating({ formation, selectedPlayers: squad, selectedCoach });
    const incomplete = calculateTeamRating({ formation, selectedPlayers: withoutAttackers, selectedCoach });

    expect(incomplete.attack).toBeLessThan(complete.attack);
  });
});
