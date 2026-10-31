// scripts/auditCareerDecisions.ts
//
// Auditoría conjunta de las decisiones de partido (v0.25.78): juega carreras completas
// con las funciones reales del juego y compara a un jugador que decide bien, a uno que
// nunca decide y a uno que decide mal. Reproducible: npm run audit:career

import { applyDifficultyToTeamRating } from "../src/career/teamPower";
import { ATHLETIC_SEASONS } from "../src/data/athletic/seasons";
import { FORMATIONS, getFormationById } from "../src/data/formations";
import { resolvePlayerSlotPlacement } from "../src/domain/positionRules";
import { calculateTeamRating } from "../src/simulation/teamRating";
import type { GameDifficulty, SelectedCoach, SelectedPlayer } from "../src/types/game";

import { mean, meanWithMargin, percentile, playCareer, share, type Policy } from "./auditCareerRunner";

const CAREERS_PER_CELL = Number(process.argv.find((arg) => arg.startsWith("--careers="))?.split("=")[1] ?? 200);

const POLICIES: Policy[] = [
  { label: "Como antes (v0.25.74)", approach: "balanced", halfTime: "keep", legacyEurope: true },
  { label: "Nunca decide", approach: "balanced", halfTime: "keep" },
  { label: "Solo planteamiento", approach: "best", halfTime: "keep" },
  { label: "Solo descanso", approach: "balanced", halfTime: "good" },
  { label: "Decide bien", approach: "best", halfTime: "good" },
  { label: "Decide mal", approach: "worst", halfTime: "bad" },
];

const TEAMS: { label: string; percentile: number; defensivePercentile?: number }[] = [
  { label: "Flojo", percentile: 0.25 },
  { label: "Medio", percentile: 0.5 },
  { label: "Bueno", percentile: 0.75 },
  { label: "Élite", percentile: 1 },
  // Delanteros y medios buenos con defensa floja: el caso en el que el perfil real pesa en Europa.
  { label: "Desequilibrado", percentile: 0.95, defensivePercentile: 0.15 },
];

const DIFFICULTIES: { label: string; value: GameDifficulty }[] = [
  { label: "Normal", value: "dificil" },
  { label: "Fácil", value: "normal" },
];

function buildTeam(percentile: number, defensivePercentile = percentile) {
  const formation = getFormationById("4-3-3") ?? FORMATIONS.find((candidate) => candidate.name === "4-3-3");
  if (!formation) throw new Error("Falta la formación 4-3-3.");

  const used = new Set<string>();
  const selectedPlayers: SelectedPlayer[] = [];

  for (const slot of formation.slots) {
    const candidates: { playerSeason: SelectedPlayer["playerSeason"]; position: SelectedPlayer["position"] }[] = [];

    for (const season of ATHLETIC_SEASONS) {
      for (const playerSeason of season.players) {
        if (used.has(playerSeason.canonicalPlayerId)) continue;
        const placement = resolvePlayerSlotPlacement(playerSeason, slot);
        if (placement.canPlace) candidates.push({ playerSeason, position: placement.assignedPosition as SelectedPlayer["position"] });
      }
    }

    candidates.sort((a, b) => a.playerSeason.overall - b.playerSeason.overall);
    const slotPercentile = slot.line === "defense" || slot.line === "goalkeeper" ? defensivePercentile : percentile;
    const pick = candidates[Math.min(candidates.length - 1, Math.floor(slotPercentile * candidates.length))];
    used.add(pick.playerSeason.canonicalPlayerId);
    selectedPlayers.push({ slotId: slot.id, position: pick.position, playerSeason: pick.playerSeason });
  }

  const coaches = [...ATHLETIC_SEASONS.map((season) => season.coach)].sort((a, b) => a.overall - b.overall);
  const selectedCoach: SelectedCoach = { coachSeason: coaches[Math.min(coaches.length - 1, Math.floor(percentile * coaches.length))] };

  return { formation, selectedPlayers, selectedCoach, teamRating: calculateTeamRating({ selectedPlayers, selectedCoach, formation }) };
}

let rejected = 0;
let played = 0;

for (const { label: difficultyLabel, value: difficulty } of DIFFICULTIES) {
  for (const { label: teamLabel, percentile: teamPercentile, defensivePercentile } of TEAMS) {
    const team = buildTeam(teamPercentile, defensivePercentile);
    const effective = applyDifficultyToTeamRating(team.teamRating, difficulty, true);

    console.log(`\n### Dificultad ${difficultyLabel} · equipo ${teamLabel} (media ${Math.round(team.teamRating.overall)}, ${effective.overall} en carrera; ataque ${effective.attack}, defensa ${effective.defense}) · ${team.selectedCoach.coachSeason.name}\n`);
    console.log("| Jugador | Temporadas superadas | Pasa la 1.ª | 5 o más | Puntuación media | Puntuación p90 | Liga | Copa | Supercopa | Europa | Títulos por temporada | Posición media | Llegan al tope |");
    console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

    for (const policy of POLICIES) {
      const careers = Array.from({ length: CAREERS_PER_CELL }, (_, index) => playCareer({ policy, seed: index + 1, difficulty, team }));
      const seasons = careers.map((career) => career.completedSeasons);
      const europe = careers.map((career) => career.trophies.champions + career.trophies.europaLeague + career.trophies.conference);
      const totalTrophies = careers.reduce(
        (sum, career, index) => sum + career.trophies.liga + career.trophies.copa + career.trophies.supercopa + europe[index],
        0,
      );
      const totalSeasons = seasons.reduce((sum, value) => sum + value + 1, 0);

      played += careers.length;
      rejected += careers.filter((career) => !career.plausible).length;

      console.log(
        `| ${[
          policy.label,
          meanWithMargin(seasons),
          share(seasons.filter((value) => value >= 1).length, careers.length),
          share(seasons.filter((value) => value >= 5).length, careers.length),
          meanWithMargin(careers.map((career) => career.score)),
          String(percentile(careers.map((career) => career.score), 0.9)),
          mean(careers.map((career) => career.trophies.liga)).toFixed(2),
          mean(careers.map((career) => career.trophies.copa)).toFixed(2),
          mean(careers.map((career) => career.trophies.supercopa)).toFixed(2),
          mean(europe).toFixed(2),
          (totalTrophies / totalSeasons).toFixed(2),
          mean(careers.map((career) => career.averagePosition)).toFixed(1),
          share(careers.filter((career) => career.reachedCap).length, careers.length),
        ].join(" | ")} |`,
      );
    }
  }
}

console.log(`\nCarreras simuladas: ${played}. Rechazadas por la regla de plausibilidad del ranking: ${rejected}.`);
