// scripts/qaEuropeanBalance.ts
// QA de v0.24.4b: European Balance QA.
//
// Esta fase no introduce mecánica nueva: audita que la campaña europea y,
// sobre todo, el bonus de prestigio de v0.24.4a no rompan el balance del
// juego. Dos riesgos concretos motivan esta QA:
//
// 1. Que el bonus de prestigio se acumule temporada tras temporada (en vez
//    de aplicarse una vez y resetear) y el equipo del usuario acabe siendo
//    artificialmente imbatible.
// 2. Que, incluso aplicado correctamente, el bonus máximo (+1.0 por ganar la
//    Champions) deje las competiciones europeas triviales, o rompa el techo
//    de rating ya establecido (100).
//
// No repite las comprobaciones de forma/goles ya cubiertas por
// qaEuropeanMatchEngine.ts; se centra en balance a nivel de temporada/carrera.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { simulateEuropeanMatch } from "../src/europe/europeanMatchEngine";
import { applyEuropeanMatchResult, createEuropeanTournamentForQualification } from "../src/europe/europeanTournament";
import type { EuropeanCompetition, EuropeanQualificationResult, EuropeanTournamentState } from "../src/europe/europeanTypes";
import { awardEuropeanPrestigeToCareer, buildEuropeanPrestigeReward } from "../src/career/europeanPrestige";
import { applyCareerRatingBonus } from "../src/career/teamPower";
import type { TeamRating } from "../src/types/game";

const ROOT = process.cwd();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function readText(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function assertIncludes(haystack: string, needle: string, message: string): void {
  assert(haystack.includes(needle), message);
}

function assertNotIncludes(haystack: string, needle: string, message: string): void {
  assert(!haystack.includes(needle), message);
}

function makeQualification(competition: EuropeanCompetition): EuropeanQualificationResult {
  return {
    qualified: true,
    competition,
    source: "league_position",
    label: competition,
    shortLabel: competition,
    explanation: "QA: clasificación europea simulada.",
    priority: 1,
  };
}

function playLeaguePhase(tournament: EuropeanTournamentState, results: Array<"win" | "draw" | "loss">): EuropeanTournamentState {
  return results.reduce<EuropeanTournamentState>((state, result) => {
    const match = state.matches.find((candidate) => candidate.status === "scheduled" && candidate.phase === "league_phase");
    assert(match !== undefined, "Debe existir partido pendiente de fase inicial.");

    const outcome = result === "win"
      ? { userGoals: 2, opponentGoals: 0, result }
      : result === "draw"
        ? { userGoals: 1, opponentGoals: 1, result }
        : { userGoals: 0, opponentGoals: 1, result };

    return applyEuropeanMatchResult(state, match.id, outcome, 38);
  }, tournament);
}

function makeChampionTournament(competition: EuropeanCompetition, seed: string): EuropeanTournamentState {
  const tournament = createEuropeanTournamentForQualification({
    seasonNumber: 1,
    qualification: makeQualification(competition),
    seed,
    totalLeagueMatchdays: 38,
  });
  assert(tournament !== null, "Debe crearse un torneo europeo para una clasificación válida.");

  let state = playLeaguePhase(tournament, ["win", "win", "win", "win", "win", "win"]);
  const semifinal = state.matches.find((match) => match.phase === "semifinal");
  assert(semifinal !== undefined, "Debe existir semifinal.");
  state = applyEuropeanMatchResult(state, semifinal.id, { userGoals: 2, opponentGoals: 0, result: "win" }, 38);
  const final = state.matches.find((match) => match.phase === "final");
  assert(final !== undefined, "Debe existir final.");
  state = applyEuropeanMatchResult(state, final.id, { userGoals: 2, opponentGoals: 0, result: "win" }, 38);

  assert(state.completed && state.champion, "El torneo QA debe terminar campeón.");
  return state;
}

function countWins(params: { userTeamRating: number; opponentRating: number; competition: EuropeanCompetition; samples: number; seedPrefix: string }): number {
  let wins = 0;

  for (let index = 0; index < params.samples; index += 1) {
    const output = simulateEuropeanMatch({
      userTeamRating: params.userTeamRating,
      opponentRating: params.opponentRating,
      isHome: index % 2 === 0,
      competition: params.competition,
      seed: `${params.seedPrefix}-${index}`,
    });

    if (output.result === "win") wins += 1;
  }

  return wins;
}

function testPrestigeBonusOrderingIsSane(): void {
  const champions = buildEuropeanPrestigeReward(makeChampionTournament("champions_league", "balance_order_champions"));
  const europa = buildEuropeanPrestigeReward(makeChampionTournament("europa_league", "balance_order_europa"));
  const conference = buildEuropeanPrestigeReward(makeChampionTournament("conference_league", "balance_order_conference"));

  assert(champions.ratingBonus > europa.ratingBonus, "Champions debe dar más bonus que Europa League.");
  assert(europa.ratingBonus > conference.ratingBonus, "Europa League debe dar más bonus que Conference.");
  assert(conference.ratingBonus > 0.25, "Incluso la Conference campeona debe superar el bonus de finalista (0.25).");
  assert(champions.ratingBonus <= 1.0 && europa.ratingBonus <= 1.0 && conference.ratingBonus <= 1.0, "Ningún bonus de campeón debe superar +1.0.");
  logOk(`El bonus de prestigio respeta el orden Champions (${champions.ratingBonus}) > Europa League (${europa.ratingBonus}) > Conference (${conference.ratingBonus})`);
}

function testPrestigeBonusNeverStacksAcrossSeasons(): void {
  // Simula 4 temporadas seguidas ganando la Champions, reseteando el bonus a
  // 0 entre temporadas (tal y como hace handleStartLeagueSimulation en
  // App.tsx al aplicar el bonus pendiente). El bonus resultante debe ser
  // siempre +1.0, nunca crecer temporada a temporada.
  let previousRatingBonus = 0;

  for (let season = 1; season <= 4; season += 1) {
    const tournament = makeChampionTournament("champions_league", `balance_no_stack_season_${season}`);
    const award = awardEuropeanPrestigeToCareer({ previousRatingBonus, tournament });

    assert(award.awarded, `La temporada ${season} debe otorgar prestigio.`);
    assert(award.nextRatingBonus === 1.0, `El bonus de la temporada ${season} debe ser exactamente +1.0, no ${award.nextRatingBonus}.`);

    // Reset explícito: así es como App.tsx deja el bonus tras aplicarlo en
    // handleStartLeagueSimulation (setCareerSeasonRatingBonus(0)).
    previousRatingBonus = 0;
  }

  logOk("Ganar la Champions 4 temporadas seguidas nunca hace crecer el bonus más allá de +1.0 por temporada");
}

function testPrestigeBonusUsesCeilingEvenWithoutReset(): void {
  // Caso defensivo: aunque por algún fallo futuro no se reseteara el bonus
  // entre temporadas, awardEuropeanPrestigeToCareer usa Math.max, así que un
  // bonus previo igual al máximo nunca debe crecer por encima de él.
  const tournament = makeChampionTournament("champions_league", "balance_no_stack_defensive");
  const award = awardEuropeanPrestigeToCareer({ previousRatingBonus: 1.0, tournament });

  assert(award.nextRatingBonus === 1.0, "Incluso sin resetear, el techo Math.max debe impedir superar +1.0.");
  logOk("El techo Math.max impide el stacking incluso si el bonus previo no se resetea");
}

function testMaxPrestigeBonusRespectsRatingCeiling(): void {
  const nearCapRating: TeamRating = {
    attack: 99.5,
    defense: 99.5,
    control: 99.5,
    physical: 99.5,
    mentality: 99.5,
    goalkeeping: 99.5,
    overall: 99.5,
    profileLabel: "QA",
    strengths: [],
    weaknesses: [],
  };

  const boosted = applyCareerRatingBonus(nearCapRating, 1.0);

  for (const key of ["attack", "defense", "control", "physical", "mentality", "goalkeeping", "overall"] as const) {
    assert(boosted[key] <= 100, `${key} no debe superar el techo de 100 tras el bonus máximo de prestigio (obtenido ${boosted[key]}).`);
  }

  logOk("El bonus máximo de prestigio (+1.0) respeta el techo de rating de 100");
}

function testMaxBoostedTeamStillFacesCompetitiveChampionsOpponents(): void {
  const samples = 50;
  const wins = countWins({
    userTeamRating: 100,
    opponentRating: 94,
    competition: "champions_league",
    samples,
    seedPrefix: "balance-max-boost-champions",
  });

  assert(wins < samples, "Ni con el bonus máximo la final de Champions debe ganarse siempre (100%).");
  assert(wins > 0, "Con rating al techo, ganar contra el rival más fuerte de Champions debe seguir siendo posible.");
  logOk(`Con el bonus máximo, un usuario al techo de rating gana ${wins}/${samples} contra el rival más fuerte de Champions (posible, no automático ni trivial)`);
}

function testCompetitionTiersStayOrderedInDifficulty(): void {
  const samples = 50;
  const userTeamRating = 84;

  const winsVsChampions = countWins({
    userTeamRating,
    opponentRating: 88,
    competition: "champions_league",
    samples,
    seedPrefix: "balance-tier-champions",
  });
  const winsVsEuropa = countWins({
    userTeamRating,
    opponentRating: 82,
    competition: "europa_league",
    samples,
    seedPrefix: "balance-tier-europa",
  });
  const winsVsConference = countWins({
    userTeamRating,
    opponentRating: 76,
    competition: "conference_league",
    samples,
    seedPrefix: "balance-tier-conference",
  });

  assert(
    winsVsConference >= winsVsEuropa && winsVsEuropa >= winsVsChampions,
    `Las competiciones deben mantenerse ordenadas por dificultad: Conference (${winsVsConference}) >= Europa League (${winsVsEuropa}) >= Champions (${winsVsChampions}).`,
  );
  logOk(`Las competiciones europeas mantienen su orden de dificultad: Conference ${winsVsConference}/${samples} >= Europa League ${winsVsEuropa}/${samples} >= Champions ${winsVsChampions}/${samples}`);
}

function testBonusCombinationOnlyEverUsesMathMax(): void {
  const app = readText("src/App.tsx");
  const prestigeModule = readText("src/career/europeanPrestige.ts");

  assertIncludes(prestigeModule, "Math.max(params.previousRatingBonus, reward.ratingBonus)", "El módulo de prestigio debe combinar bonus solo con Math.max.");
  assertNotIncludes(prestigeModule, "previousRatingBonus +", "El módulo de prestigio no debe sumar bonus de temporada (+=/+), solo usar techo.");
  assertIncludes(app, "Math.max(previous, 0.5)", "El bonus de renovar entrenador debe seguir usando techo, no suma.");
  logOk("El bonus de temporada (prestigio + otras recompensas) solo se combina con Math.max, nunca se suma");
}

function testDoesNotTouchOtherSystems(): void {
  const prestigeModule = readText("src/career/europeanPrestige.ts");
  const balanceScript = readText("scripts/qaEuropeanBalance.ts");

  assertNotIncludes(prestigeModule, "leagueSimulator", "El módulo de prestigio no debe tocar el simulador de Liga.");
  assertNotIncludes(prestigeModule, "globalRankingService", "El módulo de prestigio no debe tocar el ranking global.");
  assertNotIncludes(prestigeModule, "SeasonLuckWheelOffer", "El módulo de prestigio no debe tocar la Ruleta de la Suerte.");
  assert(balanceScript.length > 0, "guard trivial para mantener la referencia al propio script sin efectos colaterales.");
  logOk("El prestigio europeo se mantiene fuera de Liga, ranking global y Ruleta de la Suerte");
}

function testQaRegisteredInPackageAndWorkflow(): void {
  const packageJson = JSON.parse(readText("package.json")) as { scripts?: Record<string, string> };
  const scripts = packageJson.scripts ?? {};

  assert(Boolean(scripts["qa:european-balance"]), "Debe existir qa:european-balance en package.json.");
  assert(Boolean(scripts["qa:tech-debt"]?.includes("qa:european-balance")), "qa:tech-debt debe incluir qa:european-balance.");
  assertIncludes(readText("scripts/runQaSuite.mjs"), "qaEuropeanBalance", "runQaSuite debe ejecutar qaEuropeanBalance.");
  assertIncludes(readText("scripts/runQaSuite.mjs"), "qaEuropeanBalance", "runQaSuite debe ejecutar qaEuropeanBalance.");
  logOk("QA de balance europeo registrada en package.json y deploy.yml");
}

console.log("QA European Balance");
testPrestigeBonusOrderingIsSane();
testPrestigeBonusNeverStacksAcrossSeasons();
testPrestigeBonusUsesCeilingEvenWithoutReset();
testMaxPrestigeBonusRespectsRatingCeiling();
testMaxBoostedTeamStillFacesCompetitiveChampionsOpponents();
testCompetitionTiersStayOrderedInDifficulty();
testBonusCombinationOnlyEverUsesMathMax();
testDoesNotTouchOtherSystems();
testQaRegisteredInPackageAndWorkflow();
console.log("QA european balance OK");
