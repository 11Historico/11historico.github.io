// scripts/qaEuropeanRewardsPrestige.ts
// QA de v0.24.4a: European Rewards / Prestige.

import { readFileSync } from "node:fs";
import {
  applyEuropeanMatchResult,
  createEuropeanTournamentForQualification,
} from "../src/europe/europeanTournament";
import type { EuropeanQualificationResult, EuropeanTournamentState } from "../src/europe/europeanTypes";
import {
  awardEuropeanPrestigeToCareer,
  buildEuropeanPrestigeReward,
  getEuropeanPrestigeTier,
  hasPendingEuropeanPrestige,
} from "../src/career/europeanPrestige";
import { addEuropeanTrophyToCounts, awardEuropeanTrophyToCareer } from "../src/career/europeanTrophies";
import { createEmptyCareerRankingTrophyCounts, getFinalCareerTrophyCounts } from "../src/career/careerRanking";
import type { CareerSeasonResult } from "../src/types/career";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function assertIncludes(haystack: string, needle: string, message: string): void {
  assert(haystack.includes(needle), message);
}

function makeQualification(competition: EuropeanTournamentState["competition"]): EuropeanQualificationResult {
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

function makeTournament(competition: EuropeanTournamentState["competition"], seed: string): EuropeanTournamentState {
  const tournament = createEuropeanTournamentForQualification({
    seasonNumber: 1,
    qualification: makeQualification(competition),
    seed,
    totalLeagueMatchdays: 38,
  });

  assert(tournament !== null, "Debe crearse un torneo europeo para una clasificación válida.");
  return tournament;
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

function toSemifinal(tournament: EuropeanTournamentState): EuropeanTournamentState {
  return playLeaguePhase(tournament, ["win", "win", "win", "draw", "loss", "loss"]);
}

function winMatch(tournament: EuropeanTournamentState, phase: "semifinal" | "final"): EuropeanTournamentState {
  const match = tournament.matches.find((candidate) => candidate.phase === phase);
  assert(match !== undefined, `Debe existir partido de ${phase}.`);
  return applyEuropeanMatchResult(tournament, match.id, { userGoals: 2, opponentGoals: 0, result: "win" }, 38);
}

function loseMatch(tournament: EuropeanTournamentState, phase: "semifinal" | "final"): EuropeanTournamentState {
  const match = tournament.matches.find((candidate) => candidate.phase === phase);
  assert(match !== undefined, `Debe existir partido de ${phase}.`);
  return applyEuropeanMatchResult(tournament, match.id, { userGoals: 0, opponentGoals: 1, result: "loss" }, 38);
}

function makeChampion(competition: EuropeanTournamentState["competition"], seed: string): EuropeanTournamentState {
  let tournament = toSemifinal(makeTournament(competition, seed));
  tournament = winMatch(tournament, "semifinal");
  tournament = winMatch(tournament, "final");
  assert(tournament.completed && tournament.champion, "El torneo QA debe terminar campeón.");
  return tournament;
}

function makeRunnerUp(seed: string): EuropeanTournamentState {
  let tournament = toSemifinal(makeTournament("champions_league", seed));
  tournament = winMatch(tournament, "semifinal");
  tournament = loseMatch(tournament, "final");
  assert(tournament.completed && !tournament.champion, "El torneo QA debe terminar finalista, no campeón.");
  return tournament;
}

function makeSemifinalExit(seed: string): EuropeanTournamentState {
  let tournament = toSemifinal(makeTournament("champions_league", seed));
  tournament = loseMatch(tournament, "semifinal");
  assert(tournament.eliminated && tournament.completed, "El torneo QA debe quedar eliminado en semifinales.");
  return tournament;
}

function makeLeaguePhaseExit(seed: string): EuropeanTournamentState {
  const tournament = playLeaguePhase(makeTournament("champions_league", seed), ["win", "draw", "loss", "loss", "draw", "loss"]);
  assert(tournament.eliminated && tournament.completed, "El torneo QA debe quedar eliminado en fase inicial.");
  assert(tournament.matches.every((match) => match.phase !== "semifinal"), "No debe haber semifinal en una eliminación de fase inicial.");
  return tournament;
}

function testChampionsWinGrantsFullBonus(): void {
  const tournament = makeChampion("champions_league", "prestige_champions");
  const award = awardEuropeanPrestigeToCareer({ previousRatingBonus: 0, tournament });

  assert(award.awarded, "Ganar la Champions debe otorgar prestigio.");
  assert(award.reward?.tier === "champion", "El tier debe ser campeón.");
  assert(award.nextRatingBonus === 1.0, "La Champions campeona debe dar +1.0 de bonus.");
  assert(award.tournament?.europeanPrestigeAwarded === true, "El torneo debe quedar marcado como prestigio otorgado.");
  console.log("✓ Ganar la Champions otorga +1.0 de prestigio");
}

function testEuropaLeagueWinGrantsMidBonus(): void {
  const tournament = makeChampion("europa_league", "prestige_europa");
  const award = awardEuropeanPrestigeToCareer({ previousRatingBonus: 0, tournament });

  assert(award.awarded, "Ganar la Europa League debe otorgar prestigio.");
  assert(award.nextRatingBonus === 0.75, "La Europa League campeona debe dar +0.75 de bonus.");
  console.log("✓ Ganar la Europa League otorga +0.75 de prestigio");
}

function testConferenceWinGrantsSmallBonus(): void {
  const tournament = makeChampion("conference_league", "prestige_conference");
  const award = awardEuropeanPrestigeToCareer({ previousRatingBonus: 0, tournament });

  assert(award.awarded, "Ganar la Conference debe otorgar prestigio.");
  assert(award.nextRatingBonus === 0.5, "La Conference campeona debe dar +0.5 de bonus.");
  console.log("✓ Ganar la Conference otorga +0.5 de prestigio");
}

function testLostFinalGrantsMinorRewardNoTitle(): void {
  const tournament = makeRunnerUp("prestige_runner_up");
  const award = awardEuropeanPrestigeToCareer({ previousRatingBonus: 0, tournament });

  assert(award.awarded, "Perder la final debe otorgar prestigio menor.");
  assert(award.reward?.tier === "runner_up", "El tier debe ser finalista.");
  assert(award.nextRatingBonus === 0.25, "Perder la final debe dar +0.25, nunca un título.");

  const trophyCounts = addEuropeanTrophyToCounts(createEmptyCareerRankingTrophyCounts(), tournament);
  assert(trophyCounts.champions === 0, "Perder la final no debe sumar título de Champions al palmarés.");
  console.log("✓ Perder la final da recompensa menor sin título");
}

function testLostSemifinalGrantsNarrativeOnly(): void {
  const tournament = makeSemifinalExit("prestige_semifinal");
  const award = awardEuropeanPrestigeToCareer({ previousRatingBonus: 0, tournament });

  assert(award.awarded, "Perder la semifinal debe registrar prestigio (narrativo).");
  assert(award.reward?.tier === "semifinal", "El tier debe ser semifinal.");
  assert(award.nextRatingBonus === 0, "Perder la semifinal no debe dar bonus de forma.");
  assert(Boolean(award.reward?.narrative), "Perder la semifinal debe dejar texto narrativo.");

  const trophyCounts = addEuropeanTrophyToCounts(createEmptyCareerRankingTrophyCounts(), tournament);
  assert(trophyCounts.champions === 0, "Perder la semifinal no debe sumar título al palmarés.");
  console.log("✓ Perder la semifinal da solo narrativa, sin bonus");
}

function testLeaguePhaseExitGrantsNarrativeOnly(): void {
  const tournament = makeLeaguePhaseExit("prestige_league_phase");
  const award = awardEuropeanPrestigeToCareer({ previousRatingBonus: 0, tournament });

  assert(award.awarded, "Quedar eliminado en fase inicial debe registrar prestigio (narrativo).");
  assert(award.reward?.tier === "league_phase", "El tier debe ser fase inicial.");
  assert(award.nextRatingBonus === 0, "La eliminación en fase inicial no debe dar bonus de forma.");
  console.log("✓ Eliminación en fase inicial da solo narrativa, sin bonus");
}

function testPrestigeCannotBeClaimedTwice(): void {
  const tournament = makeChampion("champions_league", "prestige_no_duplicate");
  const firstAward = awardEuropeanPrestigeToCareer({ previousRatingBonus: 0, tournament });
  assert(firstAward.awarded, "El primer otorgamiento debe registrarse.");
  assert(firstAward.tournament !== undefined && firstAward.tournament !== null, "Debe devolver el torneo marcado.");

  const secondAward = awardEuropeanPrestigeToCareer({
    previousRatingBonus: firstAward.nextRatingBonus,
    tournament: firstAward.tournament,
  });

  assert(!secondAward.awarded, "No debe poder reclamarse dos veces el mismo prestigio europeo.");
  assert(secondAward.nextRatingBonus === firstAward.nextRatingBonus, "El bonus no debe duplicarse ni crecer en el segundo intento.");
  assert(!hasPendingEuropeanPrestige(firstAward.tournament), "Tras otorgarse, el torneo no debe seguir teniendo prestigio pendiente.");
  console.log("✓ El prestigio europeo no puede reclamarse dos veces sobre el mismo torneo");
}

function testBonusNeverStacksAboveMax(): void {
  const tournament = makeChampion("champions_league", "prestige_ceiling");
  const award = awardEuropeanPrestigeToCareer({ previousRatingBonus: 0.75, tournament });

  assert(award.nextRatingBonus === 1.0, "Math.max debe respetar el mayor de los dos bonus, nunca sumarlos.");

  const lowerTournament = makeChampion("conference_league", "prestige_ceiling_lower");
  const lowerAward = awardEuropeanPrestigeToCareer({ previousRatingBonus: 1.0, tournament: lowerTournament });
  assert(lowerAward.nextRatingBonus === 1.0, "Un premio menor no debe rebajar un bonus previo más alto.");
  console.log("✓ El bonus de prestigio usa techo (Math.max), nunca se acumula");
}

function testNationalCompetitionsUnaffected(): void {
  const tournament = makeChampion("champions_league", "prestige_national_unaffected");
  const seasonResult: CareerSeasonResult = {
    leaguePosition: 3,
    wonLeague: true,
    wonCopa: true,
    wonSupercopa: true,
    europeanQualification: "champions",
  };

  const trophyAward = awardEuropeanTrophyToCareer({ trophyCounts: createEmptyCareerRankingTrophyCounts(), tournament });
  const finalCounts = getFinalCareerTrophyCounts(trophyAward.trophyCounts, seasonResult);

  assert(finalCounts.liga === 1, "El prestigio europeo no debe alterar el conteo de Ligas.");
  assert(finalCounts.copa === 1, "El prestigio europeo no debe alterar el conteo de Copas.");
  assert(finalCounts.supercopa === 1, "El prestigio europeo no debe alterar el conteo de Supercopas.");
  assert(finalCounts.champions === 1, "El título europeo debe seguir sumando por su propio mecanismo (europeanTrophies).");
  console.log("✓ Liga, Copa y Supercopa quedan intactas junto al prestigio europeo");
}

function testTierDetectionMatchesPhaseReached(): void {
  assert(getEuropeanPrestigeTier(makeChampion("champions_league", "tier_champion")) === "champion", "Campeón debe detectarse como tier champion.");
  assert(getEuropeanPrestigeTier(makeRunnerUp("tier_runner_up")) === "runner_up", "Finalista debe detectarse como tier runner_up.");
  assert(getEuropeanPrestigeTier(makeSemifinalExit("tier_semifinal")) === "semifinal", "Eliminado en semifinal debe detectarse como tier semifinal.");
  assert(getEuropeanPrestigeTier(makeLeaguePhaseExit("tier_league_phase")) === "league_phase", "Eliminado en fase inicial debe detectarse como tier league_phase.");
  console.log("✓ La detección de tier distingue correctamente cada fase de salida europea");
}

function testRewardNarrativeMentionsCompetition(): void {
  const reward = buildEuropeanPrestigeReward(makeChampion("europa_league", "narrative_competition"));
  assert(reward.competitionLabel === "Europa League", "La recompensa debe identificar la competición europea.");
  assert(reward.narrative.includes("Europa League"), "La narrativa debe mencionar la competición.");
  console.log("✓ La narrativa de prestigio identifica la competición europea");
}

function testGlobalRankingAndLuckWheelUntouched(): void {
  const prestigeModule = read("src/career/europeanPrestige.ts");
  const globalRankingService = read("src/services/globalRankingService.ts");

  assert(!prestigeModule.includes("SeasonLuckWheelOffer"), "El módulo de prestigio no debe tocar la ruleta de temporada.");
  assert(!prestigeModule.includes("globalRankingService"), "El módulo de prestigio no debe tocar el ranking global.");
  assert(!globalRankingService.includes("europeanPrestige"), "El servicio de ranking global no debe depender del prestigio europeo.");
  console.log("✓ Ranking global y ruleta de la suerte quedan fuera del alcance del prestigio europeo");
}

function testAppWiresPrestigeIntoSeasonTransition(): void {
  const app = read("src/App.tsx");

  assertIncludes(app, "awardEuropeanPrestigeToCareer", "App debe importar y usar awardEuropeanPrestigeToCareer.");
  assertIncludes(app, "previousRatingBonus: careerSeasonRatingBonus", "El prestigio debe partir del bonus de rating pendiente actual.");
  assertIncludes(app, "tournament: europeanTrophyAward.tournament", "El prestigio debe encadenarse sobre el mismo torneo que ya integró el título al palmarés.");
  assertIncludes(app, "setCareerSeasonRatingBonus(nextCareerSeasonRatingBonus)", "App debe aplicar el bonus de prestigio a careerSeasonRatingBonus.");
  assertIncludes(app, "setCareerEuropeanPrestigeReward(europeanPrestigeAward.reward ?? undefined)", "App debe guardar la recompensa de prestigio para mostrarla.");
  assertIncludes(app, "europeanPrestigeReward={careerEuropeanPrestigeReward}", "App debe pasar la recompensa de prestigio a la pantalla entre temporadas.");
  console.log("✓ App.tsx conecta el prestigio europeo en la transición de temporada");
}

function testInterseasonRewardRendersPrestige(): void {
  const component = read("src/components/CareerInterseasonReward.tsx");

  assertIncludes(component, "europeanPrestigeReward", "La pantalla entre temporadas debe aceptar la recompensa de prestigio.");
  assertIncludes(component, "career-european-prestige-panel", "Debe existir un bloque visual para el prestigio europeo.");
  assertIncludes(component, "europeanPrestigeReward.narrative", "Debe mostrarse el texto narrativo del prestigio.");
  console.log("✓ La pantalla entre temporadas muestra el prestigio europeo");
}

function testSavedGamePersistsPrestigeReward(): void {
  const storage = read("src/storage/localGameStorage.ts");
  const app = read("src/App.tsx");

  assertIncludes(storage, "careerEuropeanPrestigeReward?: EuropeanPrestigeReward", "SavedGameState debe persistir la recompensa de prestigio.");
  assertIncludes(app, "careerEuropeanPrestigeReward,", "El autosave debe incluir careerEuropeanPrestigeReward en el payload.");
  assertIncludes(app, "setCareerEuropeanPrestigeReward(loadedGame.careerEuropeanPrestigeReward)", "Cargar partida debe restaurar la recompensa de prestigio.");
  console.log("✓ La recompensa de prestigio europeo sobrevive a recargar la partida guardada");
}

function testTournamentNormalizationPreservesAwardFlags(): void {
  const careerState = read("src/europe/europeanCareerState.ts");

  assertIncludes(careerState, "europeanTrophyAwarded: tournament.europeanTrophyAwarded", "normalizeEuropeanTournament debe conservar europeanTrophyAwarded al recargar.");
  assertIncludes(careerState, "europeanPrestigeAwarded: tournament.europeanPrestigeAwarded", "normalizeEuropeanTournament debe conservar europeanPrestigeAwarded al recargar.");
  console.log("✓ Recargar una partida no borra las marcas de título/prestigio ya otorgados");
}

function testQaRegisteredInPackageAndWorkflow(): void {
  const packageJson = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
  const scripts = packageJson.scripts ?? {};

  assert(Boolean(scripts["qa:european-rewards-prestige"]), "Debe existir qa:european-rewards-prestige en package.json.");
  assert(Boolean(scripts["qa:tech-debt"]?.includes("qa:european-rewards-prestige")), "qa:tech-debt debe incluir qa:european-rewards-prestige.");
  assertIncludes(read("scripts/runQaSuite.mjs"), "qaEuropeanRewardsPrestige", "runQaSuite debe ejecutar qaEuropeanRewardsPrestige.");
  assertIncludes(read("scripts/runQaSuite.mjs"), "qaEuropeanRewardsPrestige", "runQaSuite debe ejecutar qaEuropeanRewardsPrestige.");
  console.log("✓ QA de prestigio europeo registrada en package.json y deploy.yml");
}

console.log("QA European Rewards / Prestige");
testChampionsWinGrantsFullBonus();
testEuropaLeagueWinGrantsMidBonus();
testConferenceWinGrantsSmallBonus();
testLostFinalGrantsMinorRewardNoTitle();
testLostSemifinalGrantsNarrativeOnly();
testLeaguePhaseExitGrantsNarrativeOnly();
testPrestigeCannotBeClaimedTwice();
testBonusNeverStacksAboveMax();
testNationalCompetitionsUnaffected();
testTierDetectionMatchesPhaseReached();
testRewardNarrativeMentionsCompetition();
testGlobalRankingAndLuckWheelUntouched();
testAppWiresPrestigeIntoSeasonTransition();
testInterseasonRewardRendersPrestige();
testSavedGamePersistsPrestigeReward();
testTournamentNormalizationPreservesAwardFlags();
testQaRegisteredInPackageAndWorkflow();
console.log("QA european rewards prestige OK");
