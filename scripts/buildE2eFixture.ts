// scripts/buildE2eFixture.ts
// Genera la partida guardada de prueba para la prueba de flujo completo (Playwright).
// Equipo débil y sin clasificación europea: la temporada termina en Game Over.
// Ejecutar con: npm run e2e:fixture

import { mkdirSync, writeFileSync } from "node:fs";
import { ATHLETIC_SEASONS } from "../src/data/athletic/seasons";
import { FORMATIONS, getFormationById } from "../src/data/formations";
import { resolvePlayerSlotPlacement } from "../src/domain/positionRules";
import { calculateTeamRating } from "../src/simulation/teamRating";
import type { SelectedCoach, SelectedPlayer } from "../src/types/game";

const OUTPUT = "tests/e2e/fixtures/career-weak.json";

function buildWeakSquad() {
  const formation = getFormationById("4-3-3") ?? FORMATIONS.find((candidate) => candidate.name === "4-3-3");
  if (!formation) throw new Error("Falta la formación 4-3-3.");

  const used = new Set<string>();
  const selectedPlayers: SelectedPlayer[] = [];

  for (const slot of formation.slots) {
    const candidates: Array<{ playerSeason: (typeof ATHLETIC_SEASONS)[number]["players"][number]; position: string }> = [];

    for (const season of ATHLETIC_SEASONS) {
      for (const playerSeason of season.players) {
        if (used.has(playerSeason.canonicalPlayerId)) continue;

        const placement = resolvePlayerSlotPlacement(playerSeason, slot);
        if (placement.canPlace) {
          candidates.push({ playerSeason, position: placement.assignedPosition });
        }
      }
    }

    candidates.sort((a, b) => b.playerSeason.overall - a.playerSeason.overall);
    // Último candidato: los jugadores más flojos de la base de datos. Así la temporada
    // termina sin objetivo cumplido y la carrera acaba en Game Over.
    const pick = candidates[candidates.length - 1];
    used.add(pick.playerSeason.canonicalPlayerId);
    selectedPlayers.push({ slotId: slot.id, position: pick.position, playerSeason: pick.playerSeason } as SelectedPlayer);
  }

  return { formation, selectedPlayers };
}

function main(): void {
  const { formation, selectedPlayers } = buildWeakSquad();
  const coachSeason = [...ATHLETIC_SEASONS.map((season) => season.coach)].sort((a, b) => a.overall - b.overall)[0];
  const selectedCoach = { coachSeason } as SelectedCoach;
  const teamRating = calculateTeamRating({ selectedPlayers, selectedCoach, formation });

  const save = {
    gameId: "e2e_career_weak",
    phase: "league_simulation",
    difficulty: "normal",
    selectedFormation: formation,
    playerRoundSeasons: [],
    currentRoundIndex: 11,
    selectedPlayers,
    selectedCoach,
    teamRating,
    isCareerMode: true,
    careerCompletedSeasons: 3,
    careerSeasonLabel: "2028/29",
    careerTrophyCounts: { champions: 0, liga: 0, europaLeague: 0, copa: 0, conference: 0, supercopa: 0 },
    careerBestLeaguePosition: 18,
    europeanCareer: {
      currentQualification: null,
      history: [],
      bestCompetition: null,
      totalQualifications: 0,
      currentTournament: null,
    },
    savedAt: "2026-10-22T00:00:00.000Z",
  };

  mkdirSync("tests/e2e/fixtures", { recursive: true });
  writeFileSync(OUTPUT, `${JSON.stringify(save, null, 2)}\n`, "utf8");
  console.log(`Fixture escrita en ${OUTPUT} (media XI ${teamRating.overall})`);
}

main();
