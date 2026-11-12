// scripts/auditOviedoRating.ts
//
// Tarea «revisar el valor de Oviedo que tiene +82»: qué media enseña la previa del Real Oviedo
// (base 77) en la Liga y en la Copa, temporada a temporada de carrera, con las funciones del juego.
// No cambia el juego.
// Reproducible: npm run audit:oviedo (o node .audit-dist/auditOviedoRating.js --seasons=N)

import { applyCareerRivalProgression, getRivalDifficultyBonus } from "../src/career/careerRules";
import { applyDifficultyToTeamRating } from "../src/career/teamPower";
import { FORMATIONS } from "../src/data/formations";
import { getLaliga2526TeamById } from "../src/data/laliga2526Teams";
import {
  createUserLeagueSimulation,
  getInitialCareerLeagueRivals,
  getNextUserMatchInfo,
  getPendingCupFixture,
  simulateNextCupMatch,
  simulateNextUserLeagueMatch,
} from "../src/simulation/leagueSimulator";
import { calculateTeamRating } from "../src/simulation/teamRating";
import type { GameDifficulty } from "../src/types/game";

import { draftTeam, mean, seedCareer, share } from "./auditCareerRunner";

const SEASONS_PER_ROW = Number(process.argv.find((arg) => arg.startsWith("--seasons="))?.split("=")[1] ?? 2000);
const OVIEDO = "real_oviedo";
const CAREER_SEASONS = [0, 1, 2, 3, 6];
const DIFFICULTIES: { label: string; value: GameDifficulty }[] = [
  { label: "Normal", value: "dificil" },
  { label: "Fácil", value: "normal" },
];

const base = getLaliga2526TeamById(OVIEDO)?.ratings.overall;
console.log(`Real Oviedo, media base: ${base}.\n`);

interface Seen { league: number[]; cup: number[]; cupUser: number[] }

function playSeasonSeeing(seed: number, completedSeasons: number, difficulty: GameDifficulty): Seen {
  seedCareer(seed);
  const team = draftTeam(FORMATIONS[seed % FORMATIONS.length], seed % 2 ? "best" : "random");
  const teamRating = applyDifficultyToTeamRating(calculateTeamRating(team), difficulty, true);
  const seen: Seen = { league: [], cup: [], cupUser: [] };
  let context = createUserLeagueSimulation({ rivals: applyCareerRivalProgression(getInitialCareerLeagueRivals(), completedSeasons) });

  for (let guard = 0; guard < 200 && !context.state.completed; guard += 1) {
    const info = getNextUserMatchInfo({ context, teamRating });
    if (info?.rivalId === OVIEDO) {
      if (info.competition === "league") seen.league.push(info.rivalOverall);
      else {
        seen.cup.push(info.rivalOverall);
        seen.cupUser.push(info.userOverall);
      }
    }
    context = getPendingCupFixture(context)
      ? simulateNextCupMatch({ context, teamRating, selectedPlayers: team.selectedPlayers }).context
      : simulateNextUserLeagueMatch({ context, teamRating, selectedPlayers: team.selectedPlayers }).context;
  }

  return seen;
}

function distribution(values: number[]): string {
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([value, count]) => `${value}: ${share(count, values.length)}`).join(" · ");
}

for (const { label, value: difficulty } of DIFFICULTIES) {
  console.log(`### Dificultad ${label}\n`);
  console.log("| Temporada de carrera | Progresión | Liga: media que enseña la previa | Liga: 82 o más | Liga: reparto | Copa: partidos contra el Oviedo | Copa: media | Copa: reparto |");
  console.log("| --- | --- | --- | --- | --- | --- | --- | --- |");

  for (const completedSeasons of CAREER_SEASONS) {
    const league: number[] = [];
    const cup: number[] = [];
    for (let index = 0; index < SEASONS_PER_ROW; index += 1) {
      const seen = playSeasonSeeing(index + 1 + completedSeasons * 100_000, completedSeasons, difficulty);
      // La forma es la misma toda la temporada: un valor por temporada en Liga.
      if (seen.league.length) league.push(seen.league[0]);
      cup.push(...seen.cup);
    }
    console.log(`| ${[
      completedSeasons + 1,
      `+${getRivalDifficultyBonus(completedSeasons)}`,
      mean(league).toFixed(1),
      share(league.filter((value) => value >= 82).length, league.length),
      distribution(league),
      String(cup.length),
      cup.length ? mean(cup).toFixed(1) : "-",
      cup.length ? distribution(cup) : "-",
    ].join(" | ")} |`);
  }
  console.log("");
}
