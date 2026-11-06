// scripts/auditSupercopaRating.ts
//
// Fase 11 del roadmap: auditoría de la media con la que juegas la Supercopa. Sin cambiar el juego.
// La Liga, la Copa y Europa juegan con applyDifficultyToTeamRating (compresión de carrera más la
// dificultad) y con los rivales de LaLiga subidos por la progresión de carrera. La Supercopa
// (App.tsx → supercopaRules.ts) recibe el teamRating visible y los rivales sin progresión.
// Compara, con las mismas semillas:
//  - Hoy: media visible y rivales sin progresión.
//  - Solo la media como la Liga: compresión y dificultad, rivales sin progresión.
//  - Todo como la Liga: compresión, dificultad y rivales con progresión.
// Reproducible: npm run audit:supercopa (o node .audit-dist/auditSupercopaRating.js --cups=N)

import strong from "../tests/e2e/fixtures/career-strong.json";
import { applyCareerRivalProgression, getRivalDifficultyBonus } from "../src/career/careerRules";
import { simulateCareerSupercopa } from "../src/career/supercopaRules";
import { applyDifficultyToTeamRating } from "../src/career/teamPower";
import { USER_TEAM_ID } from "../src/data/laliga2526Teams";
import { getInitialCareerLeagueRivals } from "../src/simulation/leagueSimulator";
import { USER_TEAM_NAME } from "../src/simulation/leagueTable";
import type { CareerSupercopaParticipant, CareerSupercopaQualification } from "../src/types/career";
import type { GameDifficulty, RivalTeam, SelectedPlayer, TeamRating } from "../src/types/game";

const CUPS = Number(process.argv.find((arg) => arg.startsWith("--cups="))?.split("=")[1] ?? 10000);

const baseRating = strong.teamRating as unknown as TeamRating;
const selectedPlayers = strong.selectedPlayers as unknown as SelectedPlayer[];
const rivals = getInitialCareerLeagueRivals();

// Nombres internos: "normal" es Fácil y "dificil" es Normal (v0.25.70).
const DIFFICULTIES: { label: string; value: GameDifficulty }[] = [
  { label: "Fácil", value: "normal" },
  { label: "Normal", value: "dificil" },
  { label: "Leyenda", value: "leyenda" },
];
const VISIBLE_OVERALLS = [84, 86, 88, 90];
// La Supercopa se juega al empezar la temporada siguiente: con 1 temporada superada es la primera.
const COMPLETED_SEASONS = [1, 3, 6];
const SOURCES: CareerSupercopaParticipant["source"][] = ["league_champion", "league_runner_up", "cup_champion", "cup_runner_up"];

const pct = (value: number) => `${Math.round(value * 100)} %`;

/** El once de la partida de prueba, movido entero hasta la media visible pedida. */
function withVisibleOverall(target: number): TeamRating {
  const delta = target - baseRating.overall;
  const shift = (value: number) => Math.min(99, value + delta);

  return {
    ...baseRating,
    overall: target,
    attack: shift(baseRating.attack),
    defense: shift(baseRating.defense),
    control: shift(baseRating.control),
    physical: shift(baseRating.physical),
    mentality: shift(baseRating.mentality),
    goalkeeping: shift(baseRating.goalkeeping),
  };
}

// Los tres rivales más fuertes de LaLiga, que son los que suelen llegar a la Supercopa.
const topRivals = [...rivals].sort((a, b) => b.ratings.overall - a.ratings.overall).slice(0, 3);

/** El usuario pasa por los cuatro puestos de entrada: cambian el rival de semifinal y el campo. */
function qualificationFor(userSource: CareerSupercopaParticipant["source"]): CareerSupercopaQualification {
  const others = SOURCES.filter((source) => source !== userSource);
  const participants: CareerSupercopaParticipant[] = [
    { teamId: USER_TEAM_ID, teamName: USER_TEAM_NAME, source: userSource, sourceLabel: userSource },
    ...topRivals.map((rival, index) => ({ teamId: rival.id, teamName: rival.name, source: others[index], sourceLabel: others[index] })),
  ];

  return { seasonLabel: "Auditoría", participants, userQualified: true, reason: "Auditoría" };
}

function measure(teamRating: TeamRating, cupRivals: RivalTeam[]): { titles: number; finals: number } {
  let titles = 0;
  let finals = 0;

  for (let cup = 0; cup < CUPS; cup += 1) {
    const userSource = SOURCES[cup % SOURCES.length];
    const result = simulateCareerSupercopa({
      qualification: qualificationFor(userSource),
      teamRating,
      selectedPlayers,
      rivals: cupRivals,
      approach: "balanced",
      seed: 900_000 + cup * 7919,
    });

    if (result.won) titles += 1;
    if (result.won || result.eliminatedRoundName === "Final") finals += 1;
  }

  return { titles: titles / CUPS, finals: finals / CUPS };
}

console.log(`# Auditoría de la media en la Supercopa (${CUPS} Supercopas por casilla)\n`);
console.log(`Rivales: ${topRivals.map((rival) => `${rival.name} (${rival.ratings.overall})`).join(", ")}. Planteamiento equilibrado.\n`);

console.log("## Media con la que juegas\n");
console.log("| Media visible | Supercopa hoy | Liga en Fácil | Liga en Normal | Liga en Leyenda |");
console.log("| --- | --- | --- | --- | --- |");
for (const visible of VISIBLE_OVERALLS) {
  const rating = withVisibleOverall(visible);
  const league = DIFFICULTIES.map(({ value }) => applyDifficultyToTeamRating(rating, value, true).overall.toFixed(1));
  console.log(`| ${visible} | ${visible} | ${league.join(" | ")} |`);
}

console.log("\n## Rivales de LaLiga con la progresión de carrera\n");
console.log("| Temporadas superadas | Subida en la Liga | En la Supercopa hoy |");
console.log("| --- | --- | --- |");
for (const seasons of COMPLETED_SEASONS) {
  console.log(`| ${seasons} | +${getRivalDifficultyBonus(seasons)} | +0 |`);
}

for (const { label, value } of DIFFICULTIES) {
  console.log(`\n## ${label}: probabilidad de ganar la Supercopa (de llegar a la final)\n`);
  console.log("| Media visible | Temporadas superadas | Hoy | Solo la dificultad | Solo la media como la Liga | Todo como la Liga |");
  console.log("| --- | --- | --- | --- | --- | --- |");

  for (const visible of VISIBLE_OVERALLS) {
    const rating = withVisibleOverall(visible);
    // Sin compresión (isCareerMode false): solo suma o resta la dificultad a la media visible.
    const difficultyOnly = applyDifficultyToTeamRating(rating, value, false);
    const leagueRating = applyDifficultyToTeamRating(rating, value, true);
    // Las tres primeras no dependen de las temporadas: los rivales no suben.
    const cell = (m: { titles: number; finals: number }) => `${pct(m.titles)} (${pct(m.finals)})`;
    const today = cell(measure(rating, rivals));
    const difficultyCell = cell(measure(difficultyOnly, rivals));
    const ratingOnly = cell(measure(leagueRating, rivals));

    for (const seasons of COMPLETED_SEASONS) {
      const asLeague = measure(leagueRating, applyCareerRivalProgression(rivals, seasons));
      console.log(`| ${visible} | ${seasons} | ${today} | ${difficultyCell} | ${ratingOnly} | ${cell(asLeague)} |`);
    }
  }
}
