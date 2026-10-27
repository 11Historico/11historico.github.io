// scripts/qaEuropeanKnockouts.ts
// QA de v0.24.3a: semifinal/final europeas a partido único.

import { readFileSync } from "node:fs";
import {
  EUROPEAN_LEAGUE_PHASE_QUALIFYING_POSITIONS,
  getEuropeanLeaguePhaseUserPosition,
  EUROPEAN_LEAGUE_PHASE_MATCH_COUNT,
  applyEuropeanMatchResult,
  createEuropeanTournamentForQualification,
  getEuropeanKnockoutStageText,
  getEuropeanKnockoutStakesText,
  getEuropeanTournamentSummary,
  isEuropeanKnockoutPhase,
} from "../src/europe/europeanTournament";
import type { EuropeanQualificationResult, EuropeanTournamentState } from "../src/europe/europeanTypes";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function assertIncludes(haystack: string, needle: string, message: string): void {
  assert(haystack.includes(needle), message);
}

function makeTournament(seed: string): EuropeanTournamentState {
  const qualification: EuropeanQualificationResult = {
    qualified: true,
    competition: "champions_league",
    source: "league_position",
    label: "Champions League",
    shortLabel: "UCL",
    explanation: "QA: clasificación europea simulada.",
    priority: 1,
  };

  const tournament = createEuropeanTournamentForQualification({
    seasonNumber: 1,
    qualification,
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

function testLeaguePhaseToSemifinal(): void {
  const tournament = playLeaguePhase(makeTournament("knockout_semifinal"), ["win", "win", "win", "win", "win", "win"]);

  assert(tournament.leaguePhasePlayed === EUROPEAN_LEAGUE_PHASE_MATCH_COUNT, "La fase inicial debe cerrar tras 6 partidos.");
  assert(getEuropeanLeaguePhaseUserPosition(tournament) <= EUROPEAN_LEAGUE_PHASE_QUALIFYING_POSITIONS, "Ganar los 6 partidos debe dejar al usuario entre los 2 primeros.");
  assert(tournament.phase === "semifinal", "Entre los 2 primeros el torneo debe avanzar a semifinal.");
  assert(tournament.qualifiedForSemifinal, "qualifiedForSemifinal debe quedar activo.");
  assert(tournament.matches.filter((match) => match.phase === "semifinal").length === 1, "No debe duplicarse la semifinal.");
  assert(tournament.matches.filter((match) => match.phase === "final").length === 0, "La final no debe existir antes de ganar la semifinal.");
  assert(isEuropeanKnockoutPhase(tournament.phase), "La semifinal debe considerarse fase de eliminatoria.");
  assert(getEuropeanKnockoutStageText(tournament).includes("Semifinal europea a partido único"), "Debe rotular semifinal como partido único.");
  assert(getEuropeanKnockoutStakesText(tournament).includes("jugarás la final europea"), "La semifinal debe explicar qué pasa al ganar.");
}

function testLeaguePhaseElimination(): void {
  const tournament = playLeaguePhase(makeTournament("knockout_eliminated"), ["loss", "loss", "loss", "loss", "loss", "loss"]);

  assert(getEuropeanLeaguePhaseUserPosition(tournament) > EUROPEAN_LEAGUE_PHASE_QUALIFYING_POSITIONS, "Perder los 6 partidos debe dejar al usuario fuera de los 2 primeros.");
  assert(tournament.phase === "eliminated", "Fuera de los 2 primeros debe eliminar al equipo.");
  assert(tournament.eliminated, "El estado eliminado debe quedar activo.");
  assert(tournament.completed, "Una eliminación debe cerrar el torneo.");
  assert(tournament.currentMatchId === null, "Un eliminado no debe tener partido europeo actual.");
}

function testSemifinalWinCreatesSingleFinal(): void {
  let tournament = playLeaguePhase(makeTournament("knockout_final"), ["win", "win", "win", "win", "win", "win"]);
  const semifinal = tournament.matches.find((match) => match.phase === "semifinal");
  assert(semifinal !== undefined, "Debe existir semifinal tras clasificarse.");

  tournament = applyEuropeanMatchResult(tournament, semifinal.id, { userGoals: 2, opponentGoals: 1, result: "win" }, 38);
  const replay = applyEuropeanMatchResult(tournament, semifinal.id, { userGoals: 5, opponentGoals: 0, result: "win" }, 38);

  assert(tournament.phase === "final", "Ganar la semifinal debe llevar a la final.");
  assert(tournament.matches.filter((match) => match.phase === "final").length === 1, "Debe generarse una única final.");
  assert(replay.matches.filter((match) => match.phase === "final").length === 1, "Reaplicar la semifinal no debe duplicar la final.");
  assert(
    getEuropeanTournamentSummary(tournament).stakesText.includes("serás campeón europeo y sumará al palmarés al cerrar la temporada"),
    "La final debe explicar que ganar suma el título al palmarés al cerrar la temporada.",
  );
}

function testSemifinalLossEliminates(): void {
  let tournament = playLeaguePhase(makeTournament("knockout_semifinal_loss"), ["win", "win", "win", "win", "win", "win"]);
  const semifinal = tournament.matches.find((match) => match.phase === "semifinal");
  assert(semifinal !== undefined, "Debe existir semifinal tras clasificarse.");

  tournament = applyEuropeanMatchResult(tournament, semifinal.id, { userGoals: 0, opponentGoals: 1, result: "loss" }, 38);

  assert(tournament.phase === "eliminated", "Perder la semifinal debe eliminar.");
  assert(tournament.eliminated, "La eliminación en semifinal debe marcar eliminated.");
  assert(tournament.completed, "La eliminación en semifinal debe cerrar el torneo.");
  assert(tournament.matches.filter((match) => match.phase === "final").length === 0, "Perder semifinal no debe crear final.");
}

function testFinalOutcomesDoNotTouchPalmares(): void {
  let champion = playLeaguePhase(makeTournament("knockout_champion"), ["win", "win", "win", "win", "win", "win"]);
  const semifinal = champion.matches.find((match) => match.phase === "semifinal");
  assert(semifinal !== undefined, "Debe existir semifinal para llegar a la final.");
  champion = applyEuropeanMatchResult(champion, semifinal.id, { userGoals: 2, opponentGoals: 0, result: "win" }, 38);
  const final = champion.matches.find((match) => match.phase === "final");
  assert(final !== undefined, "Debe existir final tras ganar semifinal.");
  champion = applyEuropeanMatchResult(champion, final.id, { userGoals: 1, opponentGoals: 0, result: "win" }, 38);

  assert(champion.phase === "completed", "Ganar la final debe completar el torneo.");
  assert(champion.completed, "Ganar la final debe marcar completed.");
  assert(champion.champion, "Ganar la final debe marcar champion true.");
  assert(
    getEuropeanTournamentSummary(champion).statusText.includes("se suma al palmarés al cerrar la temporada"),
    "El texto de campeón debe decir que el título se suma al palmarés al cerrar la temporada, no que ya está sumado.",
  );

  let finalist = playLeaguePhase(makeTournament("knockout_finalist"), ["win", "win", "win", "win", "win", "win"]);
  const finalistSemi = finalist.matches.find((match) => match.phase === "semifinal");
  assert(finalistSemi !== undefined, "Debe existir semifinal para finalista.");
  finalist = applyEuropeanMatchResult(finalist, finalistSemi.id, { userGoals: 2, opponentGoals: 1, result: "win" }, 38);
  const finalistFinal = finalist.matches.find((match) => match.phase === "final");
  assert(finalistFinal !== undefined, "Debe existir final para finalista.");
  finalist = applyEuropeanMatchResult(finalist, finalistFinal.id, { userGoals: 0, opponentGoals: 1, result: "loss" }, 38);

  assert(finalist.phase === "completed", "Perder la final debe completar el torneo.");
  assert(finalist.completed, "Perder la final debe marcar completed.");
  assert(!finalist.champion, "Perder la final debe dejar champion false.");
  assert(getEuropeanTournamentSummary(finalist).statusText.includes("Finalista europeo"), "Perder la final debe rotular finalista europeo.");
}

function testUiAndRegistry(): void {
  const event = read("src/components/EuropeanMatchEvent.tsx");
  const eventCss = read("src/components/EuropeanMatchEvent.css");
  const panel = read("src/components/EuropeanProgressPanel.tsx");
  const panelCss = read("src/components/EuropeanProgressPanel.css");
  const packageJson = read("package.json");
  const docs = read("docs/v0_24_3a_EUROPEAN_KNOCKOUTS.md");

  assertIncludes(event, "Partido único", "EuropeanMatchEvent debe destacar semifinal/final como partido único.");
  assertIncludes(event, "getKnockoutWinText", "EuropeanMatchEvent debe explicar el resultado de ganar una eliminatoria.");
  assertIncludes(event, "getKnockoutLossText", "EuropeanMatchEvent debe explicar el resultado de perder una eliminatoria.");
  assertIncludes(eventCss, "european-match-event-card-final", "El CSS debe dar jerarquía visual a la final.");
  assertIncludes(eventCss, "european-match-event-card-semifinal", "El CSS debe dar jerarquía visual a la semifinal.");
  assertIncludes(panel, "Estado eliminatoria", "EuropeanProgressPanel debe mostrar estado de eliminatoria.");
  assertIncludes(panelCss, "european-progress-knockout-state", "El panel debe tener bloque visual de eliminatorias.");
  assertIncludes(packageJson, "qa:european-knockouts", "package.json debe registrar qa:european-knockouts.");
  assertIncludes(packageJson, "qa:european-progress-ui && npm run qa:european-knockouts", "qa:tech-debt debe ejecutar qa:european-knockouts tras progress UI.");
  assertIncludes(read("scripts/runQaSuite.mjs"), "qaEuropeanKnockouts", "runQaSuite debe ejecutar qaEuropeanKnockouts.");
  assertIncludes(read("scripts/runQaSuite.mjs"), "qaEuropeanKnockouts", "runQaSuite debe ejecutar qaEuropeanKnockouts.");
  assertIncludes(docs, "No se añaden títulos europeos al palmarés", "La documentación debe dejar fuera de alcance el palmarés.");
}

console.log("QA European Knockouts");
testLeaguePhaseToSemifinal();
console.log("✓ Fase inicial: los 2 primeros pasan a semifinal");
testLeaguePhaseElimination();
console.log("✓ Fuera de los 2 primeros elimina correctamente");
testSemifinalWinCreatesSingleFinal();
console.log("✓ Semifinal ganada crea una única final");
testSemifinalLossEliminates();
console.log("✓ Semifinal perdida elimina sin crear final");
testFinalOutcomesDoNotTouchPalmares();
console.log("✓ Final ganada/perdida cierra torneo sin tocar palmarés");
testUiAndRegistry();
console.log("✓ UI, documentación, package.json y runner de QA registran knockouts");
console.log("QA european knockouts OK");
