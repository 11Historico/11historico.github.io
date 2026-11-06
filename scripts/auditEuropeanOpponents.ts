// scripts/auditEuropeanOpponents.ts
//
// Fase 8 del roadmap (v0.25.97): auditoría de las medias de los rivales europeos. El usuario
// apuntó que algunas parecían desproporcionadas. Mide, sin cambiar el juego:
//  1. Qué media sale para cada club, sorteando muchos torneos como hace el juego.
//  2. Cómo queda frente a los rivales de LaLiga, con su progresión de carrera.
//  3. La probabilidad de pasar la fase de liga hoy y con una escala alternativa de ejemplo.
// Reproducible: npm run audit:european-opponents (o node .audit-dist/auditEuropeanOpponents.js --tournaments=N)

import { applyCareerRivalProgression, getRivalDifficultyBonus } from "../src/career/careerRules";
import { pickEuropeanOpponents } from "../src/europe/europeanOpponents";
import { estimateEuropeanSemifinalChance } from "../src/europe/europeanSemifinalChance";
import { createEuropeanTournamentForQualification } from "../src/europe/europeanTournament";
import type { EuropeanCompetition, EuropeanQualificationResult, EuropeanTournamentState } from "../src/europe/europeanTypes";
import { getInitialCareerLeagueRivals } from "../src/simulation/leagueSimulator";

const TOURNAMENTS = Number(process.argv.find((arg) => arg.startsWith("--tournaments="))?.split("=")[1] ?? 300);
const DRAWS = 2000;
const SAMPLES_PER_TOURNAMENT = 60;

const COMPETITIONS: { label: string; value: EuropeanCompetition; range: [number, number]; alternative: [number, number] }[] = [
  // Rangos del juego (src/europe/europeanOpponents.ts) y una escala alternativa de ejemplo, con techo
  // en el nivel de Barcelona y Real Madrid (91). La alternativa no es una propuesta cerrada: sirve
  // para ver cuánto pesa el rango en la probabilidad de pasar.
  { label: "Champions", value: "champions_league", range: [82, 94], alternative: [82, 91] },
  { label: "Europa League", value: "europa_league", range: [76, 88], alternative: [76, 86] },
  { label: "Conference", value: "conference_league", range: [70, 82], alternative: [70, 80] },
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
    for (const opponent of pickEuropeanOpponents({ competition: value, count: 8, seed: `audit_${draw}_${value}` })) {
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

// 3. Probabilidad de pasar la fase de liga, sin decidir (equilibrado), hoy y con la escala alternativa.
function rescale(tournament: EuropeanTournamentState, from: [number, number], to: [number, number]): EuropeanTournamentState {
  const map = (rating: number) => Math.round(to[0] + ((rating - from[0]) / (from[1] - from[0])) * (to[1] - to[0]));
  return {
    ...tournament,
    matches: tournament.matches.map((match) => ({ ...match, opponent: { ...match.opponent, rating: map(match.opponent.rating) } })),
  };
}

console.log(`\n### Probabilidad de pasar la fase de liga sin decidir (${TOURNAMENTS} torneos por casilla)\n`);
console.log("| Competición | Tu rating europeo | Hoy | Escala alternativa |");
console.log("| --- | --- | --- | --- |");
for (const { label, value, range, alternative } of COMPETITIONS) {
  for (const userTeamRating of USER_RATINGS) {
    const today: number[] = [];
    const scaled: number[] = [];
    for (let index = 0; index < TOURNAMENTS; index += 1) {
      const tournament = createEuropeanTournamentForQualification({
        seasonNumber: index + 1,
        qualification: { qualified: true, competition: value } as EuropeanQualificationResult,
        seed: `audit_${index}_${value}`,
      });
      if (!tournament) throw new Error("No se creó el torneo.");
      today.push(estimateEuropeanSemifinalChance({ tournament, userTeamRating, samples: SAMPLES_PER_TOURNAMENT })!.chance);
      scaled.push(estimateEuropeanSemifinalChance({ tournament: rescale(tournament, range, alternative), userTeamRating, samples: SAMPLES_PER_TOURNAMENT })!.chance);
    }
    console.log(`| ${label} ${range[0]}-${range[1]} → ${alternative[0]}-${alternative[1]} | ${userTeamRating} | ${pct(mean(today))} | ${pct(mean(scaled))} |`);
  }
}
