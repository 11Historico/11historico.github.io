// scripts/auditEuropeanOpponents.ts
//
// Fase 8 del roadmap (v0.25.97): auditoría de las medias de los rivales europeos. El usuario
// apuntó que algunas parecían desproporcionadas. Mide, sin cambiar el juego:
//  1. Qué media sale para cada club, sorteando muchos torneos como hace el juego.
//  2. Cómo queda frente a los rivales de LaLiga, con su progresión de carrera.
//  3. La probabilidad de pasar la fase de liga.
// Reproducible: npm run audit:european-opponents (o node .audit-dist/auditEuropeanOpponents.js --tournaments=N)

import { applyCareerRivalProgression, getRivalDifficultyBonus } from "../src/career/careerRules";
import { pickEuropeanOpponents } from "../src/europe/europeanOpponents";
import { estimateEuropeanSemifinalChance } from "../src/europe/europeanSemifinalChance";
import { createEuropeanTournamentForQualification } from "../src/europe/europeanTournament";
import type { EuropeanCompetition, EuropeanQualificationResult } from "../src/europe/europeanTypes";
import { getInitialCareerLeagueRivals } from "../src/simulation/leagueSimulator";
import { auditGameId } from "./auditSeeds";

const TOURNAMENTS = Number(process.argv.find((arg) => arg.startsWith("--tournaments="))?.split("=")[1] ?? 300);
const DRAWS = 2000;
const SAMPLES_PER_TOURNAMENT = 60;

// Desde v0.25.98 cada club tiene una media fija ±1 (src/europe/europeanOpponents.ts). Antes se
// sorteaba en el rango de la competición: 82-94, 76-88 y 70-82 (INFORME_RIVALES_EUROPEOS_v0_25_97).
const COMPETITIONS: { label: string; value: EuropeanCompetition }[] = [
  { label: "Champions", value: "champions_league" },
  { label: "Europa League", value: "europa_league" },
  { label: "Conference", value: "conference_league" },
];
const USER_RATINGS = [84, 86, 88];

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const pct = (value: number) => `${Math.round(value * 100)} %`;

// 1. Media de cada club en muchos sorteos, con semillas como las del juego.
const laLiga = getInitialCareerLeagueRivals().map((rival) => rival.ratings.overall).sort((a, b) => b - a);
const laLigaTop = laLiga[0];

for (const { label, value } of COMPETITIONS) {
  const byClub = new Map<string, number[]>();
  for (let draw = 0; draw < DRAWS; draw += 1) {
    for (const opponent of pickEuropeanOpponents({ competition: value, count: 8, seed: `${auditGameId(draw)}_1` })) {
      byClub.set(opponent.name, [...(byClub.get(opponent.name) ?? []), opponent.rating]);
    }
  }

  console.log(`\n### ${label}: media de cada club en ${DRAWS} sorteos\n`);
  console.log(`| Club | Sale en | Media | Mínima | Máxima | Por encima de ${laLigaTop} (Barça y Madrid) |`);
  console.log("| --- | --- | --- | --- | --- | --- |");
  for (const [club, ratings] of [...byClub.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"))) {
    console.log(`| ${[
      club,
      pct(ratings.length / DRAWS),
      mean(ratings).toFixed(1),
      Math.min(...ratings),
      Math.max(...ratings),
      pct(ratings.filter((rating) => rating > laLigaTop).length / ratings.length),
    ].join(" | ")} |`);
  }
}

// 2. LaLiga con la progresión de carrera.
console.log("\n### Rivales de LaLiga con la progresión de carrera\n");
console.log("| Temporadas superadas | Bonus | 1.º | 3.º | Media | Último |");
console.log("| --- | --- | --- | --- | --- | --- |");
for (const completed of [0, 3, 6, 9]) {
  const ratings = applyCareerRivalProgression(getInitialCareerLeagueRivals(), completed)
    .map((rival) => rival.ratings.overall)
    .sort((a, b) => b - a);
  console.log(`| ${completed} | +${getRivalDifficultyBonus(completed)} | ${ratings[0]} | ${ratings[2]} | ${mean(ratings).toFixed(1)} | ${ratings.at(-1)} |`);
}

// 3. Probabilidad de pasar la fase de liga, sin decidir (equilibrado).
console.log(`\n### Probabilidad de pasar la fase de liga sin decidir (${TOURNAMENTS} torneos por casilla)\n`);
console.log("| Competición | Tu rating europeo | Probabilidad | Rival medio |");
console.log("| --- | --- | --- | --- |");
for (const { label, value } of COMPETITIONS) {
  for (const userTeamRating of USER_RATINGS) {
    const chances: number[] = [];
    const rivals: number[] = [];
    for (let index = 0; index < TOURNAMENTS; index += 1) {
      const tournament = createEuropeanTournamentForQualification({
        seasonNumber: index + 1,
        qualification: { qualified: true, competition: value } as EuropeanQualificationResult,
        seed: `${auditGameId(index)}_${index + 1}`,
      });
      if (!tournament) throw new Error("No se creó el torneo.");
      rivals.push(...tournament.matches.map((match) => match.opponent.rating));
      chances.push(estimateEuropeanSemifinalChance({ tournament, userTeamRating, samples: SAMPLES_PER_TOURNAMENT })!.chance);
    }
    console.log(`| ${label} | ${userTeamRating} | ${pct(mean(chances))} | ${mean(rivals).toFixed(1)} |`);
  }
}
