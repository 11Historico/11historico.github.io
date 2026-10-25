// scripts/buildE2eFixture.ts
// Genera las partidas guardadas de prueba para las pruebas de flujo completo (Playwright).
// - career-weak: equipo débil y sin clasificación europea: la temporada termina en Game Over.
// - career-strong: equipo fuerte: la temporada se supera (pantalla "Temporada superada").
// Ejecutar con: npm run e2e:fixture

import { mkdirSync, writeFileSync } from "node:fs";
import { ATHLETIC_SEASONS } from "../src/data/athletic/seasons";
import { FORMATIONS, getFormationById } from "../src/data/formations";
import { resolvePlayerSlotPlacement } from "../src/domain/positionRules";
import { calculateTeamRating } from "../src/simulation/teamRating";
import type { SelectedCoach, SelectedPlayer } from "../src/types/game";

const OUTPUT_WEAK = "tests/e2e/fixtures/career-weak.json";
const OUTPUT_STRONG = "tests/e2e/fixtures/career-strong.json";

type Strength = "weak" | "strong";

function buildSquad(strength: Strength) {
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
    // Débil: los jugadores más flojos de la base de datos. Fuerte: los mejores.
    const pick = strength === "weak" ? candidates[candidates.length - 1] : candidates[0];
    used.add(pick.playerSeason.canonicalPlayerId);
    selectedPlayers.push({ slotId: slot.id, position: pick.position, playerSeason: pick.playerSeason } as SelectedPlayer);
  }

  return { formation, selectedPlayers };
}

function buildSave(strength: Strength) {
  const { formation, selectedPlayers } = buildSquad(strength);
  const sortedCoaches = [...ATHLETIC_SEASONS.map((season) => season.coach)].sort((a, b) => a.overall - b.overall);
  const coachSeason = strength === "weak" ? sortedCoaches[0] : sortedCoaches[sortedCoaches.length - 1];
  const selectedCoach = { coachSeason } as SelectedCoach;
  const teamRating = calculateTeamRating({ selectedPlayers, selectedCoach, formation });

  return {
    gameId: strength === "weak" ? "e2e_career_weak" : "e2e_career_strong",
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
    careerBestLeaguePosition: strength === "weak" ? 18 : 3,
    europeanCareer: {
      currentQualification: null,
      history: [],
      bestCompetition: null,
      totalQualifications: 0,
      currentTournament: null,
    },
    savedAt: "2026-10-22T00:00:00.000Z",
  };
}

function main(): void {
  mkdirSync("tests/e2e/fixtures", { recursive: true });

  const outputs: Array<[Strength, string]> = [
    ["weak", OUTPUT_WEAK],
    ["strong", OUTPUT_STRONG],
  ];

  for (const [strength, output] of outputs) {
    const save = buildSave(strength);
    writeFileSync(output, `${JSON.stringify(save, null, 2)}\n`, "utf8");
    console.log(`Fixture escrita en ${output} (media XI ${save.teamRating.overall})`);
  }
}

main();
