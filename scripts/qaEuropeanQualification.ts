import {
  compareEuropeanQualificationPriority,
  getEuropeanCompetitionBadgeLabel,
  getEuropeanCompetitionLabel,
  getEuropeanCompetitionShortLabel,
  isEuropeanQualified,
  resolveEuropeanQualification,
} from "../src/europe/europeanQualification";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function testLeaguePositionCasesWithoutCopa(): void {
  assert(
    resolveEuropeanQualification({ leaguePosition: 1, userWonCopa: false }).competition === "champions_league",
    "Posición 1 sin Copa debe dar Champions League.",
  );
  assert(
    resolveEuropeanQualification({ leaguePosition: 4, userWonCopa: false }).competition === "champions_league",
    "Posición 4 sin Copa debe dar Champions League.",
  );
  assert(
    resolveEuropeanQualification({ leaguePosition: 5, userWonCopa: false }).competition === "europa_league",
    "Posición 5 sin Copa debe dar Europa League.",
  );
  assert(
    resolveEuropeanQualification({ leaguePosition: 6, userWonCopa: false }).competition === "conference_league",
    "Posición 6 sin Copa externa en Europa debe dar Conference League.",
  );
  assert(
    resolveEuropeanQualification({ leaguePosition: 7, userWonCopa: false }).competition === null,
    "Posición 7 sin reasignación no tiene plaza europea.",
  );

  const noEurope = resolveEuropeanQualification({ leaguePosition: 8, userWonCopa: false });
  assert(noEurope.competition === null && !noEurope.qualified, "Posición 8 sin Copa debe dar sin Europa.");
  assert(noEurope.source === "none", "Posición 8 sin Copa debe usar source 'none'.");

  logOk("Reglas de posición de Liga (1-4 Champions, 5 Europa League, 6 Conference, 7+ sin Europa)");

  const copaWinnerTop5 = resolveEuropeanQualification({ leaguePosition: 6, userWonCopa: false, copaWinnerLeaguePosition: 2 });
  assert(
    copaWinnerTop5.competition === "europa_league" && copaWinnerTop5.source === "league_reallocation",
    "Si el campeón de Copa ya está en Europa por Liga, el 6º recibe la plaza de Copa (Europa League).",
  );
  const seventhReallocated = resolveEuropeanQualification({ leaguePosition: 7, userWonCopa: false, copaWinnerLeaguePosition: 3 });
  assert(
    seventhReallocated.competition === "conference_league" && seventhReallocated.source === "league_reallocation",
    "Con campeón de Copa en Europa por Liga, el 7º recibe Conference League.",
  );
  const seventhSixthWinner = resolveEuropeanQualification({ leaguePosition: 7, userWonCopa: false, copaWinnerLeaguePosition: 6 });
  assert(seventhSixthWinner.competition === "conference_league", "Campeón de Copa 6º: el 7º recibe Conference League.");
  const eighthCopaTop4 = resolveEuropeanQualification({ leaguePosition: 8, userWonCopa: false, copaWinnerLeaguePosition: 1 });
  assert(eighthCopaTop4.competition === null, "Con campeón de Copa en Champions, el 8º no recibe plaza.");
  const sixthCopaOutside = resolveEuropeanQualification({ leaguePosition: 6, userWonCopa: false, copaWinnerLeaguePosition: 12 });
  assert(sixthCopaOutside.competition === "conference_league", "Campeón de Copa fuera de Europa: el 6º recibe Conference.");

  logOk("Reasignación de la plaza de Copa por campeón externo ya clasificado en Europa");
}

function testCopaCasesUpgradeMinimumToEuropaLeague(): void {
  const fromNone = resolveEuropeanQualification({ leaguePosition: 8, userWonCopa: true });
  assert(fromNone.competition === "europa_league" && fromNone.qualified, "Posición 8 + Copa debe dar Europa League.");
  assert(fromNone.source === "copa_winner", "Posición 8 + Copa debe usar source 'copa_winner'.");

  const fromConference = resolveEuropeanQualification({ leaguePosition: 7, userWonCopa: true, copaWinnerLeaguePosition: 3 });
  assert(
    fromConference.competition === "europa_league",
    "Posición 7 + Copa debe mejorar de Conference a Europa League.",
  );
  assert(fromConference.source === "copa_winner", "Posición 7 + Copa debe usar source 'copa_winner'.");
  assert(
    fromConference.explanation.toLowerCase().includes("mejora"),
    "La explicación de la mejora por Copa debe mencionar que mejora la plaza.",
  );

  logOk("La Copa del Rey garantiza como mínimo Europa League");
}

function testCopaDoesNotDowngradeBetterLeaguePlaces(): void {
  const stillChampions = resolveEuropeanQualification({ leaguePosition: 3, userWonCopa: true });
  assert(
    stillChampions.competition === "champions_league",
    "Posición 3 + Copa debe mantener Champions League (plaza superior a Copa).",
  );
  assert(stillChampions.source === "league_position", "Posición 3 + Copa debe mantener source 'league_position'.");

  const stillEuropaLeague = resolveEuropeanQualification({ leaguePosition: 5, userWonCopa: true });
  assert(
    stillEuropaLeague.competition === "europa_league" && stillEuropaLeague.source === "league_position",
    "Posición 5 + Copa debe mantener Europa League vía Liga (Copa no la mejora, ya era igual).",
  );

  logOk("La Copa no rebaja una plaza de Liga igual o mejor");
}

function testPriorityHelpers(): void {
  assert(
    compareEuropeanQualificationPriority("champions_league", "europa_league") > 0,
    "Champions debe tener más prioridad que Europa League.",
  );
  assert(
    compareEuropeanQualificationPriority("europa_league", "conference_league") > 0,
    "Europa League debe tener más prioridad que Conference.",
  );
  assert(
    compareEuropeanQualificationPriority("conference_league", null) > 0,
    "Conference debe tener más prioridad que ninguna clasificación.",
  );
  assert(
    compareEuropeanQualificationPriority(null, null) === 0,
    "Sin clasificación en ambos lados debe ser prioridad igual.",
  );

  logOk("compareEuropeanQualificationPriority ordena correctamente Champions > Europa League > Conference > ninguna");
}

function testLabelHelpers(): void {
  assert(getEuropeanCompetitionLabel("champions_league") === "Champions League", "Label de Champions incorrecto.");
  assert(getEuropeanCompetitionLabel("europa_league") === "Europa League", "Label de Europa League incorrecto.");
  assert(getEuropeanCompetitionLabel("conference_league") === "Conference League", "Label de Conference incorrecto.");
  assert(getEuropeanCompetitionLabel(null) === "Sin clasificación europea", "Label sin clasificación incorrecto.");

  assert(getEuropeanCompetitionShortLabel("champions_league") === "Champions", "Short label de Champions incorrecto.");
  assert(getEuropeanCompetitionShortLabel(null) === "Sin Europa", "Short label sin clasificación incorrecto.");

  assert(getEuropeanCompetitionBadgeLabel("champions_league") === "UCL", "Badge de Champions incorrecto.");
  assert(getEuropeanCompetitionBadgeLabel("europa_league") === "UEL", "Badge de Europa League incorrecto.");
  assert(getEuropeanCompetitionBadgeLabel("conference_league") === "UECL", "Badge de Conference incorrecto.");

  logOk("Helpers de etiquetas devuelven los textos esperados");
}

function testIsEuropeanQualifiedHelper(): void {
  assert(isEuropeanQualified({ qualified: true }), "isEuropeanQualified debe ser true si qualified=true.");
  assert(!isEuropeanQualified({ qualified: false }), "isEuropeanQualified debe ser false si qualified=false.");
  assert(!isEuropeanQualified(null), "isEuropeanQualified debe ser false con null.");
  assert(!isEuropeanQualified(undefined), "isEuropeanQualified debe ser false con undefined.");

  logOk("isEuropeanQualified funciona con resultados, entradas históricas, null y undefined");
}

console.log("QA European Qualification Rulebook");

testLeaguePositionCasesWithoutCopa();
testCopaCasesUpgradeMinimumToEuropaLeague();
testCopaDoesNotDowngradeBetterLeaguePlaces();
testPriorityHelpers();
testLabelHelpers();
testIsEuropeanQualifiedHelper();

console.log("QA european qualification OK");
