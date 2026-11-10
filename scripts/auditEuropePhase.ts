// scripts/auditEuropePhase.ts
//
// Mide por qué cuesta pasar la fase inicial europea (petición del 2026-11-05: «no he pasado
// ni una sola vez de la primera ronda»). Juega la fase inicial (6 partidos, 7 equipos) y, desde
// la v0.25.107, la previa del 3.º contra el 4.º, con el mismo motor, los mismos rivales y sus
// estilos (v0.25.105) que el juego, para varios ratings de simulación del usuario y tres formas
// de decidir. No cambia el juego.
// Reproducible: npm run audit:europe (o node .audit-dist/auditEuropePhase.js --tournaments=N)

import { estimateEuropeanMatchOdds, simulateEuropeanMatch, type SimulateEuropeanMatchInput } from "../src/europe/europeanMatchEngine";
import {
  applyEuropeanMatchResult,
  createEuropeanTournamentForQualification,
  getEuropeanLeaguePhaseUserPosition,
} from "../src/europe/europeanTournament";
import type { EuropeanCompetition, EuropeanQualificationResult, EuropeanTournamentMatch, EuropeanTournamentState } from "../src/europe/europeanTypes";
import type { HalfTimeChoice, MatchApproach } from "../src/types/game";

import { advanceValue, pickHalfTime, pointsValue } from "./auditCareerRunner";
import { auditGameId } from "./auditSeeds";

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

type Shared = Omit<SimulateEuropeanMatchInput, "seed" | "isKnockout" | "approach">;

function pickApproach(policy: Policy, shared: Shared, isKnockout: boolean): MatchApproach {
  if (policy.approach === "balanced") return "balanced";
  const value = isKnockout ? advanceValue : pointsValue;
  const ranked = APPROACHES
    .map((approach) => ({ approach, value: value(estimateEuropeanMatchOdds({ ...shared, approach }, ODDS_SAMPLES)) }))
    .sort((a, b) => (policy.approach === "best" ? b.value - a.value : a.value - b.value));
  return ranked[0].approach;
}

function play(tournament: EuropeanTournamentState, match: EuropeanTournamentMatch, policy: Policy, rating: number, index: number): EuropeanTournamentState {
  const isKnockout = match.phase === "playoff";
  const shared: Shared = { userTeamRating: rating, opponentRating: match.opponent.rating, opponentStyle: match.opponent.style, isHome: match.isHome, competition: match.competition };
  const input: SimulateEuropeanMatchInput = { ...shared, approach: pickApproach(policy, shared, isKnockout), isKnockout, seed: `${auditGameId(index)}_${match.id}` };
  const base = simulateEuropeanMatch(input);
  const firstHalf = base.goalEvents.filter((goal) => goal.minute <= 45);
  const margin = firstHalf.filter((goal) => goal.isUserGoal).length - firstHalf.filter((goal) => !goal.isUserGoal).length;
  const choice: HalfTimeChoice = pickHalfTime(policy.halfTime, margin, (base.expectedGoals?.user ?? 0) < (base.expectedGoals?.rival ?? 0));
  const outcome = choice === "keep" ? base : simulateEuropeanMatch({ ...input, halfTimeChoice: choice });
  return applyEuropeanMatchResult(tournament, match.id, outcome);
}

function pct(value: number, total: number): string {
  return `${Math.round((value / total) * 100)} %`;
}

for (const { label: competitionLabel, value: competition } of COMPETITIONS) {
  console.log(`\n### ${competitionLabel}\n`);
  console.log("| Rating del usuario | Decisiones | Llega a semifinales | Directo (top 2) | Juega la previa | Gana la previa | Posición media | Puntos medios | Rival medio |");
  console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");

  for (const rating of RATINGS) {
    for (const policy of POLICIES) {
      let semifinal = 0;
      let top2 = 0;
      let playoffs = 0;
      let playoffWins = 0;
      let positionSum = 0;
      let pointsSum = 0;
      let rivalSum = 0;
      let rivalCount = 0;

      for (let index = 0; index < TOURNAMENTS; index += 1) {
        let tournament = createEuropeanTournamentForQualification({
          seasonNumber: index + 1,
          // Solo cuentan `qualified` y `competition`; el resto del resultado no se usa al crear el torneo.
          qualification: { qualified: true, competition } as Pick<EuropeanQualificationResult, "qualified" | "competition"> as EuropeanQualificationResult,
          seed: `${auditGameId(index)}_${index + 1}`,
        });
        if (!tournament) throw new Error("No se creó el torneo.");

        for (const match of tournament.matches) {
          rivalSum += match.opponent.rating;
          rivalCount += 1;
          tournament = play(tournament, match, policy, rating, index);
        }

        const position = getEuropeanLeaguePhaseUserPosition(tournament);
        if (position <= 2) top2 += 1;
        positionSum += position;
        pointsSum += tournament.leaguePhasePoints;

        if (tournament.phase === "playoff") {
          playoffs += 1;
          const playoff = tournament.matches.find((match) => match.phase === "playoff")!;
          tournament = play(tournament, playoff, policy, rating, index);
          if (tournament.phase === "semifinal") playoffWins += 1;
        }
        if (tournament.phase === "semifinal") semifinal += 1;
      }

      console.log(`| ${[
        rating,
        policy.label,
        pct(semifinal, TOURNAMENTS),
        pct(top2, TOURNAMENTS),
        pct(playoffs, TOURNAMENTS),
        playoffs ? pct(playoffWins, playoffs) : "-",
        (positionSum / TOURNAMENTS).toFixed(1),
        (pointsSum / TOURNAMENTS).toFixed(1),
        (rivalSum / rivalCount).toFixed(1),
      ].join(" | ")} |`);
    }
  }
}
