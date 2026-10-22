import {
  appendEuropeanQualification,
  createEmptyEuropeanCareerState,
  getLatestEuropeanQualification,
  normalizeEuropeanCareerState,
} from "../src/europe/europeanCareerState";
import { resolveEuropeanQualification } from "../src/europe/europeanQualification";
import type { EuropeanSeasonEntry } from "../src/europe/europeanTypes";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function buildEntry(
  seasonNumber: number,
  leaguePosition: number,
  userWonCopa: boolean,
  copaWinnerLeaguePosition?: number | null,
): EuropeanSeasonEntry {
  const result = resolveEuropeanQualification({ leaguePosition, userWonCopa, copaWinnerLeaguePosition, seasonNumber });

  return {
    seasonNumber,
    qualified: result.qualified,
    competition: result.competition,
    source: result.source,
    explanation: result.explanation,
    achievedFromLeaguePosition: leaguePosition,
    achievedFromCopa: userWonCopa,
  };
}

function testOldSaveWithoutEuropeanCareerNormalizesSafely(): void {
  const normalizedFromUndefined = normalizeEuropeanCareerState(undefined);
  assert(normalizedFromUndefined.history.length === 0, "Estado antiguo sin europeanCareer debe normalizar a histórico vacío.");
  assert(normalizedFromUndefined.currentQualification === null, "Estado antiguo sin europeanCareer no debe tener clasificación actual.");
  assert(normalizedFromUndefined.totalQualifications === 0, "Estado antiguo sin europeanCareer debe tener 0 clasificaciones.");

  const normalizedFromPartial = normalizeEuropeanCareerState({});
  assert(Array.isArray(normalizedFromPartial.history), "Un objeto vacío debe normalizar a histórico como array.");

  logOk("Las partidas antiguas sin europeanCareer se normalizan sin romper");
}

function testFourthPositionStoresChampions(): void {
  const state = appendEuropeanQualification(createEmptyEuropeanCareerState(), buildEntry(0, 4, false));
  const latest = getLatestEuropeanQualification(state);

  assert(latest?.competition === "champions_league", "4º puesto debe guardar Champions League.");
  assert(latest?.qualified === true, "4º puesto debe guardar qualified=true.");
  assert(state.bestCompetition === "champions_league", "El mejor resultado histórico debe ser Champions League.");

  logOk("Temporada con 4º puesto guarda Champions League");
}

function testSeventhPositionStoresConference(): void {
  const state = appendEuropeanQualification(createEmptyEuropeanCareerState(), buildEntry(0, 7, false, 3));
  const latest = getLatestEuropeanQualification(state);

  assert(latest?.competition === "conference_league", "7º puesto debe guardar Conference League.");

  logOk("Temporada con 7º puesto guarda Conference League");
}

function testEighthPositionWithCopaStoresEuropaLeague(): void {
  const state = appendEuropeanQualification(createEmptyEuropeanCareerState(), buildEntry(0, 8, true));
  const latest = getLatestEuropeanQualification(state);

  assert(latest?.competition === "europa_league", "8º puesto + Copa debe guardar Europa League.");
  assert(latest?.source === "copa_winner", "8º puesto + Copa debe guardar source 'copa_winner'.");

  logOk("Temporada con 8º puesto y Copa guarda Europa League");
}

function testSeasonWithoutEuropeStoresUnqualifiedEntry(): void {
  // Decisión de diseño: se guarda igualmente una entrada en el histórico para
  // temporadas sin clasificación europea (qualified=false, competition=null),
  // en lugar de omitirla, para que el histórico refleje todas las temporadas
  // jugadas de la carrera.
  const state = appendEuropeanQualification(createEmptyEuropeanCareerState(), buildEntry(0, 12, false));
  const latest = getLatestEuropeanQualification(state);

  assert(latest?.qualified === false, "Temporada sin Europa debe guardar qualified=false.");
  assert(latest?.competition === null, "Temporada sin Europa debe guardar competition=null.");
  assert(state.history.length === 1, "Temporada sin Europa debe seguir apareciendo en el histórico.");

  logOk("Temporada sin clasificación europea guarda una entrada explícita de 'no clasificado'");
}

function testNoDuplicateEntriesForSameSeason(): void {
  let state = createEmptyEuropeanCareerState();
  state = appendEuropeanQualification(state, buildEntry(2, 5, false));
  state = appendEuropeanQualification(state, buildEntry(2, 5, false));

  assert(state.history.length === 1, "No debe duplicarse la entrada al repetir la misma temporada.");
  assert(state.totalQualifications === 1, "totalQualifications no debe contar duplicados de la misma temporada.");

  state = appendEuropeanQualification(state, buildEntry(3, 1, false));
  assert(state.history.length === 2, "Una temporada distinta sí debe añadir una nueva entrada.");

  logOk("No se duplican entradas para la misma temporada, incluso si se guarda dos veces");
}

function testStateSurvivesSerializationRoundTrip(): void {
  let state = createEmptyEuropeanCareerState();
  state = appendEuropeanQualification(state, buildEntry(0, 3, false));
  state = appendEuropeanQualification(state, buildEntry(1, 8, true));

  const roundTripped = normalizeEuropeanCareerState(JSON.parse(JSON.stringify(state)));

  assert(roundTripped.history.length === state.history.length, "El serializado debe conservar el número de temporadas.");
  assert(
    roundTripped.currentQualification?.competition === state.currentQualification?.competition,
    "El serializado debe conservar la clasificación actual.",
  );
  assert(roundTripped.bestCompetition === state.bestCompetition, "El serializado debe conservar el mejor resultado histórico.");
  assert(
    roundTripped.totalQualifications === state.totalQualifications,
    "El serializado debe conservar el total de clasificaciones.",
  );

  logOk("El estado europeo serializa y deserializa sin perder datos");
}

console.log("QA European Persistence");

testOldSaveWithoutEuropeanCareerNormalizesSafely();
testFourthPositionStoresChampions();
testSeventhPositionStoresConference();
testEighthPositionWithCopaStoresEuropaLeague();
testSeasonWithoutEuropeStoresUnqualifiedEntry();
testNoDuplicateEntriesForSameSeason();
testStateSurvivesSerializationRoundTrip();

console.log("QA european persistence OK");
