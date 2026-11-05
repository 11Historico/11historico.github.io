// scripts/auditEuropePhase.ts
//
// Mide por qué cuesta pasar la fase inicial europea (petición del 2026-11-05: «no he pasado
// ni una sola vez de la primera ronda»). Juega solo la fase inicial (6 partidos, pasan los 2
// primeros de 7) con el mismo motor y los mismos rivales que el juego, para varios ratings de
// simulación del usuario y tres formas de decidir. No cambia el juego.
// Reproducible: npm run audit:europe (o node .audit-dist/auditEuropePhase.js --tournaments=N)

import { estimateEuropeanMatchOdds, simulateEuropeanMatch, type SimulateEuropeanMatchInput } from "../src/europe/europeanMatchEngine";
import {
  applyEuropeanMatchResult,
  createEuropeanTournamentForQualification,
  getEuropeanLeaguePhaseUserPosition,
} from "../src/europe/europeanTournament";
import type { EuropeanCompetition, EuropeanQualificationResult } from "../src/europe/europeanTypes";
import type { HalfTimeChoice, MatchApproach } from "../src/types/game";

import { pickHalfTime, pointsValue } from "./auditCareerRunner";

const TOURNAMENTS = Number(process.argv.find((arg) => arg.startsWith("--tournaments="))?.split("=")[1] ?? 600);
const ODDS_SAMPLES = 60;
const APPROACHES: MatchApproach[] = ["balanced", "attacking", "defensive"];

const COMPETITIONS: { label: string; value: EuropeanCompetition }[] = [
  { label: "Champions", value: "champions_league" },
  { label: "Europa League", value: "europa_league" },
  { label: "Conference", value: "conference_league" },
];
// Rating de simulación del usuario (ya comprimido). Un once de 88-89 visible juega con 84-85.
const RATINGS = [82, 84, 86, 88, 90];

type Policy = { label: string; approach: "best" | "worst" | "balanced"; halfTime: "good" | "bad" | "keep" };
const POLICIES: Policy[] = [
  { label: "Decide bien", approach: "best", halfTime: "good" },
  { label: "No decide", approach: "balanced", halfTime: "keep" },
  { label: "Decide mal", approach: "worst", halfTime: "bad" },
];

function pickApproach(policy: Policy, shared: Omit<SimulateEuropeanMatchInput, "seed" | "isKnockout">): MatchApproach {
  if (policy.approach === "balanced") return "balanced";
  const ranked = APPROACHES
    .map((approach) => ({ approach, value: pointsValue(estimateEuropeanMatchOdds({ ...shared, approach }, ODDS_SAMPLES)) }))
    .sort((a, b) => (policy.approach === "best" ? b.value - a.value : a.value - b.value));
  return ranked[0].approach;
}

function pct(value: number, total: number): string {
  return `${Math.round((value / total) * 100)} %`;
}

for (const { label: competitionLabel, value: competition } of COMPETITIONS) {
  console.log(`\n### ${competitionLabel}\n`);
  console.log("| Rating del usuario | Decisiones | Pasa a semifinales (top 2) | Quedaría top 4 | Posición media | Puntos medios | Rival medio |");
  console.log("| --- | --- | --- | --- | --- | --- | --- |");

  for (const rating of RATINGS) {
    for (const policy of POLICIES) {
      let top2 = 0;
      let top4 = 0;
      let positionSum = 0;
      let pointsSum = 0;
      let rivalSum = 0;
      let rivalCount = 0;

      for (let index = 0; index < TOURNAMENTS; index += 1) {
        let tournament = createEuropeanTournamentForQualification({
          seasonNumber: index + 1,
          // Solo cuentan `qualified` y `competition`; el resto del resultado no se usa al crear el torneo.
          qualification: { qualified: true, competition } as Pick<EuropeanQualificationResult, "qualified" | "competition"> as EuropeanQualificationResult,
          seed: `audit_${index}_${competition}`,
        });
        if (!tournament) throw new Error("No se creó el torneo.");

        for (const match of tournament.matches) {
          rivalSum += match.opponent.rating;
          rivalCount += 1;
          const shared = { userTeamRating: rating, opponentRating: match.opponent.rating, isHome: match.isHome, competition };
          const approach = pickApproach(policy, shared);
          const input: SimulateEuropeanMatchInput = { ...shared, approach, seed: `audit_${index}_${match.id}` };
          const base = simulateEuropeanMatch(input);
          const firstHalf = base.goalEvents.filter((goal) => goal.minute <= 45);
          const margin = firstHalf.filter((goal) => goal.isUserGoal).length - firstHalf.filter((goal) => !goal.isUserGoal).length;
          const choice: HalfTimeChoice = pickHalfTime(policy.halfTime, margin, (base.expectedGoals?.user ?? 0) < (base.expectedGoals?.rival ?? 0));
          const outcome = choice === "keep" ? base : simulateEuropeanMatch({ ...input, halfTimeChoice: choice });
          tournament = applyEuropeanMatchResult(tournament, match.id, outcome);
        }

        const position = getEuropeanLeaguePhaseUserPosition(tournament);
        if (position <= 2) top2 += 1;
        if (position <= 4) top4 += 1;
        positionSum += position;
        pointsSum += tournament.leaguePhasePoints;
      }

      console.log(`| ${[
        rating,
        policy.label,
        pct(top2, TOURNAMENTS),
        pct(top4, TOURNAMENTS),
        (positionSum / TOURNAMENTS).toFixed(1),
        (pointsSum / TOURNAMENTS).toFixed(1),
        (rivalSum / rivalCount).toFixed(1),
      ].join(" | ")} |`);
    }
  }
}
