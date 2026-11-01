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
