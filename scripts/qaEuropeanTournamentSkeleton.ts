import {
  applyEuropeanMatchResult,
  createEuropeanTournamentForQualification,
  getEuropeanTournamentSummary,
  getNextEuropeanMatch,
} from "../src/europe/europeanTournament";
import type { EuropeanSeasonEntry, EuropeanTournamentState } from "../src/europe/europeanTypes";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function buildQualification(overrides: Partial<EuropeanSeasonEntry> = {}): EuropeanSeasonEntry {
  return {
    seasonNumber: 0,
    qualified: true,
    competition: "champions_league",
    source: "league_position",
    explanation: "QA",
    ...overrides,
  };
}

function playMatch(
  tournament: EuropeanTournamentState,
  matchId: string,
  result: "win" | "draw" | "loss",
): EuropeanTournamentState {
  const goalsByResult = { win: { userGoals: 2, opponentGoals: 0 }, draw: { userGoals: 1, opponentGoals: 1 }, loss: { userGoals: 0, opponentGoals: 2 } };
  return applyEuropeanMatchResult(tournament, matchId, { ...goalsByResult[result], result });
}

function testNoQualificationDoesNotCreateTournament(): void {
  const tournament = createEuropeanTournamentForQualification({
    seasonNumber: 0,
    qualification: buildQualification({ qualified: false, competition: null }),
  });

  assert(tournament === null, "Sin clasificación no debe crear torneo.");

  const tournamentFromUndefined = createEuropeanTournamentForQualification({
    seasonNumber: 0,
    qualification: undefined,
  });

  assert(tournamentFromUndefined === null, "Sin entrada de clasificación no debe crear torneo.");

  logOk("Sin clasificación europea no se crea torneo");
}

function testChampionsLeagueCreatesSixMatches(): void {
  const tournament = createEuropeanTournamentForQualification({
    seasonNumber: 1,
    qualification: buildQualification({ competition: "champions_league" }),
    seed: "qa-champions",
  });

  assert(tournament !== null, "Champions League debe crear torneo.");
  assert(tournament.competition === "champions_league", "El torneo debe ser de Champions League.");
  assert(tournament.matches.length === 6, "El torneo debe tener 6 partidos de fase inicial.");
  assert(tournament.phase === "league_phase", "El torneo debe empezar en fase inicial.");

  for (const match of tournament.matches) {
    assert(match.opponent.rating >= 82 && match.opponent.rating <= 94, `Rival de Champions fuera de rango: ${match.opponent.rating}.`);
  }

  logOk("Champions League crea torneo con 6 partidos y rivales 82-94");
}

function testEuropaLeagueOpponentRatingRange(): void {
  const tournament = createEuropeanTournamentForQualification({
    seasonNumber: 1,
    qualification: buildQualification({ competition: "europa_league" }),
    seed: "qa-europa-league",
  });

  assert(tournament !== null, "Europa League debe crear torneo.");

  for (const match of tournament.matches) {
    assert(match.opponent.rating >= 76 && match.opponent.rating <= 88, `Rival de Europa League fuera de rango: ${match.opponent.rating}.`);
  }

  logOk("Europa League crea torneo con rivales de rating 76-88");
}

function testConferenceLeagueOpponentRatingRange(): void {
  const tournament = createEuropeanTournamentForQualification({
    seasonNumber: 1,
    qualification: buildQualification({ competition: "conference_league" }),
    seed: "qa-conference",
  });

  assert(tournament !== null, "Conference League debe crear torneo.");

  for (const match of tournament.matches) {
    assert(match.opponent.rating >= 70 && match.opponent.rating <= 82, `Rival de Conference fuera de rango: ${match.opponent.rating}.`);
  }

  logOk("Conference League crea torneo con rivales de rating 70-82 (más accesibles)");
}

function testMatchIdsAreUniqueAndMixHomeAway(): void {
  const tournament = createEuropeanTournamentForQualification({
    seasonNumber: 2,
    qualification: buildQualification({ competition: "champions_league" }),
    seed: "qa-unique",
  });

  assert(tournament !== null, "Debe crear torneo.");

  const ids = tournament.matches.map((match) => match.id);
  const uniqueIds = new Set(ids);
  assert(uniqueIds.size === ids.length, "Los IDs de partido deben ser únicos.");

  const homeMatches = tournament.matches.filter((match) => match.isHome).length;
  const awayMatches = tournament.matches.filter((match) => !match.isHome).length;
  assert(homeMatches > 0 && awayMatches > 0, "Debe haber mezcla de partidos como local y visitante.");

  logOk("IDs de partido únicos y mezcla de local/visitante");
}

function testGetNextEuropeanMatchReturnsFirstScheduled(): void {
  const tournament = createEuropeanTournamentForQualification({
    seasonNumber: 3,
    qualification: buildQualification({ competition: "conference_league" }),
    seed: "qa-next-match",
  });

  assert(tournament !== null, "Debe crear torneo.");

  const next = getNextEuropeanMatch(tournament);
  assert(next !== null, "Debe devolver el primer partido scheduled.");
  assert(next.id === tournament.matches[0].id, "Debe devolver el primer partido de la lista.");

  logOk("getNextEuropeanMatch devuelve el primer partido scheduled");
}

function testApplyEuropeanMatchResultUpdatesStats(): void {
  let tournament = createEuropeanTournamentForQualification({
    seasonNumber: 4,
    qualification: buildQualification({ competition: "conference_league" }),
    seed: "qa-apply-result",
  });

  assert(tournament !== null, "Debe crear torneo.");

  const firstMatchId = tournament.matches[0].id;
  tournament = applyEuropeanMatchResult(tournament, firstMatchId, { userGoals: 3, opponentGoals: 1, result: "win" });

  assert(tournament.wins === 1, "Debe sumar una victoria.");
  assert(tournament.leaguePhasePoints === 3, "Una victoria debe dar 3 puntos.");
  assert(tournament.leaguePhasePlayed === 1, "Debe sumar un partido jugado de fase inicial.");
  assert(tournament.goalsFor === 3 && tournament.goalsAgainst === 1, "Debe sumar goles a favor/en contra.");
  assert(tournament.matches[0].status === "played", "El partido debe quedar marcado como jugado.");
  assert(tournament.matches[0].result === "win", "El partido debe guardar el resultado.");

  const summary = getEuropeanTournamentSummary(tournament);
  assert(summary.matchesPlayed === 1, "El resumen debe reflejar 1 partido jugado.");
  assert(summary.points === 3, "El resumen debe reflejar 3 puntos.");

  logOk("applyEuropeanMatchResult actualiza puntos, goles y estadísticas");
}

function testSixWinsAdvanceToSemifinal(): void {
  let tournament = createEuropeanTournamentForQualification({
    seasonNumber: 5,
    qualification: buildQualification({ competition: "champions_league" }),
    seed: "qa-advance",
  });

  assert(tournament !== null, "Debe crear torneo.");

  // 6 victorias: el usuario termina primero de la fase de liga y pasa a semifinales.
  const results: Array<"win" | "draw" | "loss"> = ["win", "win", "win", "win", "win", "win"];

  for (let index = 0; index < results.length; index += 1) {
    const nextMatch = getNextEuropeanMatch(tournament);
    assert(nextMatch !== null, `Debe haber partido pendiente #${index + 1}.`);
    tournament = playMatch(tournament, nextMatch.id, results[index]);
  }

  assert(tournament.leaguePhasePoints === 18, `Puntos esperados 18, obtenidos ${tournament.leaguePhasePoints}.`);
  assert(tournament.phase === "semifinal", "Entre los 2 primeros debe avanzar a semifinal.");
  assert(tournament.qualifiedForSemifinal, "qualifiedForSemifinal debe ser true.");
  assert(tournament.eliminated === false, "No debe estar eliminado.");
  assert(tournament.matches.length === 7, "Debe añadirse el partido de semifinal (7 partidos en total).");

  const semifinalMatch = tournament.matches.find((match) => match.phase === "semifinal");
  assert(semifinalMatch !== undefined && semifinalMatch.status === "scheduled", "La semifinal debe quedar programada.");

  logOk("Tras 6 victorias el torneo avanza a semifinal (2 primeros)");
}

function testSixLossesEliminatesUser(): void {
  let tournament = createEuropeanTournamentForQualification({
    seasonNumber: 6,
    qualification: buildQualification({ competition: "champions_league" }),
    seed: "qa-eliminate",
  });

  assert(tournament !== null, "Debe crear torneo.");

  // 6 derrotas = 0 puntos.
  for (let index = 0; index < 6; index += 1) {
    const nextMatch = getNextEuropeanMatch(tournament);
    assert(nextMatch !== null, `Debe haber partido pendiente #${index + 1}.`);
    tournament = playMatch(tournament, nextMatch.id, "loss");
  }

  assert(tournament.leaguePhasePoints === 0, "Con 6 derrotas los puntos deben ser 0.");
  assert(tournament.eliminated === true, "Fuera de los 2 primeros debe quedar eliminado.");
  assert(tournament.completed === true, "El torneo debe quedar completado (cerrado) al eliminar.");
  assert(tournament.phase === "eliminated", "La fase debe quedar en eliminated.");
  assert(getNextEuropeanMatch(tournament) === null, "No debe haber más partidos pendientes tras eliminar.");

  logOk("Tras 6 derrotas el usuario queda fuera de los 2 primeros y eliminado");
}

function testSemifinalAndFinalAreNeverDuplicated(): void {
  let tournament = createEuropeanTournamentForQualification({
    seasonNumber: 7,
    qualification: buildQualification({ competition: "europa_league" }),
    seed: "qa-no-duplicate",
  });

  assert(tournament !== null, "Debe crear torneo.");

  const results: Array<"win" | "draw" | "loss"> = ["win", "win", "win", "win", "loss", "loss"];
  for (const result of results) {
    const nextMatch = getNextEuropeanMatch(tournament);
    assert(nextMatch !== null, "Debe haber partido pendiente.");
    tournament = playMatch(tournament, nextMatch.id, result);
  }

  assert(tournament.phase === "semifinal", "Debe llegar a semifinal (12 puntos).");
  const semifinalCountAfterQualifying = tournament.matches.filter((match) => match.phase === "semifinal").length;
  assert(semifinalCountAfterQualifying === 1, "Debe existir exactamente una semifinal tras clasificar.");

  // Reintentar aplicar un resultado ya jugado no debe duplicar nada (idempotencia).
  const lastPlayedLeagueMatch = tournament.matches.find((match) => match.phase === "league_phase" && match.status === "played");
  assert(lastPlayedLeagueMatch !== undefined, "Debe existir un partido de fase inicial ya jugado.");
  const beforeRetry = tournament.matches.length;
  tournament = applyEuropeanMatchResult(tournament, lastPlayedLeagueMatch.id, { userGoals: 9, opponentGoals: 9, result: "win" });
  assert(tournament.matches.length === beforeRetry, "Reaplicar un resultado ya jugado no debe duplicar partidos.");
  assert(tournament.matches.find((match) => match.id === lastPlayedLeagueMatch.id)?.userGoals !== 9, "No debe sobrescribir un resultado ya jugado.");

  const semifinalMatch = tournament.matches.find((match) => match.phase === "semifinal");
  assert(semifinalMatch !== undefined, "Debe existir semifinal.");
  tournament = playMatch(tournament, semifinalMatch.id, "win");

  assert(tournament.phase === "final", "Ganar la semifinal debe llevar a la final.");
  const finalCount = tournament.matches.filter((match) => match.phase === "final").length;
  assert(finalCount === 1, "Debe existir exactamente una final tras ganar semifinal.");

  const semifinalCountAfterFinal = tournament.matches.filter((match) => match.phase === "semifinal").length;
  assert(semifinalCountAfterFinal === 1, "No debe duplicarse la semifinal al avanzar a la final.");

  logOk("Semifinal y final nunca se duplican, incluso si se reaplican resultados");
}

console.log("QA European Tournament Skeleton");

testNoQualificationDoesNotCreateTournament();
testChampionsLeagueCreatesSixMatches();
testEuropaLeagueOpponentRatingRange();
testConferenceLeagueOpponentRatingRange();
testMatchIdsAreUniqueAndMixHomeAway();
testGetNextEuropeanMatchReturnsFirstScheduled();
testApplyEuropeanMatchResultUpdatesStats();
testSixWinsAdvanceToSemifinal();
testSixLossesEliminatesUser();
testSemifinalAndFinalAreNeverDuplicated();

console.log("QA european tournament skeleton OK");
