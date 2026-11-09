import { describe, expect, it } from "vitest";
import { pickEuropeanOpponents, pickSingleEuropeanOpponent } from "../../src/europe/europeanOpponents";
import {
  applyEuropeanMatchResult,
  createEuropeanTournamentForQualification,
  EUROPEAN_LEAGUE_PHASE_MATCH_COUNT,
} from "../../src/europe/europeanTournament";
import type { EuropeanCompetition, EuropeanQualificationResult, EuropeanTournamentState } from "../../src/europe/europeanTypes";

// Semillas como las del juego: `${gameId}_${temporada}`, con gameId = game_<fecha>_<hex> (App.tsx).
const GAMES = 800;
const SEASONS = 5;
const gameIds = Array.from(
  { length: GAMES },
  (_, game) => `game_${1_760_000_000_000 + game * 7_919_331}_${((game + 1) * 2_654_435_761 >>> 0).toString(16)}`,
);
const seeds = gameIds.flatMap((gameId) => Array.from({ length: SEASONS }, (_, season) => `${gameId}_${season + 1}`));
const POOLS = [
  ["champions_league", 20],
  ["europa_league", 20],
  ["conference_league", 10],
] as const;

function createTournament(competition: EuropeanCompetition, seasonNumber: number, seed: string): EuropeanTournamentState {
  const qualification = { qualified: true, competition } as EuropeanQualificationResult;
  const tournament = createEuropeanTournamentForQualification({ seasonNumber, qualification, seed });
  if (!tournament) throw new Error("No se creó el torneo.");
  return tournament;
}

/** Gana los seis partidos de la fase inicial: con 18 puntos pasa siempre a semifinales. */
function semifinalOpponent(tournament: EuropeanTournamentState): string {
  let state = tournament;
  for (const match of tournament.matches) {
    state = applyEuropeanMatchResult(state, match.id, { userGoals: 3, opponentGoals: 0, result: "win", goalEvents: [] });
  }
  const semifinal = state.matches.find((match) => match.phase === "semifinal");
  if (!semifinal) throw new Error("No hay semifinal.");
  return semifinal.opponent.name;
}

function worstShare(names: string[]): [string, number] {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  const [name, count] = [...counts].sort((a, b) => b[1] - a[1])[0];
  return [name, count / names.length];
}

describe("sorteo europeo sin sesgo (v0.25.106)", () => {
  // 6 rivales de 20 (30 %) o de 10 (60 %). Con 4000 sorteos, 3 puntos son más de 4 desviaciones.
  it.each(POOLS)("fase inicial: en %s cada club sale en su parte justa de los torneos", (competition, poolSize) => {
    const expected = EUROPEAN_LEAGUE_PHASE_MATCH_COUNT / poolSize;
    const counts = new Map<string, number>();
    for (const seed of seeds) {
      for (const opponent of pickEuropeanOpponents({ competition, count: EUROPEAN_LEAGUE_PHASE_MATCH_COUNT, seed })) {
        counts.set(opponent.name, (counts.get(opponent.name) ?? 0) + 1);
      }
    }
    const worst = [...counts].sort((a, b) => Math.abs(b[1] / seeds.length - expected) - Math.abs(a[1] / seeds.length - expected))[0];

    expect(counts.size).toBe(poolSize);
    expect(Math.abs(worst[1] / seeds.length - expected), `${worst[0]}: ${Math.round((worst[1] / seeds.length) * 100)} %`).toBeLessThan(0.03);
  });

  // Antes, con la semilla de solo temporada y competición, el 70 % se encontraba al mismo rival.
  it.each(POOLS)("semifinal: en %s el rival cambia con la partida, no solo con la temporada", (competition, poolSize) => {
    const names = gameIds.map((gameId) => semifinalOpponent(createTournament(competition, 1, `${gameId}_1`)));
    const [name, share] = worstShare(names);
    const expected = 1 / (poolSize - EUROPEAN_LEAGUE_PHASE_MATCH_COUNT);

    expect(share - expected, `${name}: ${Math.round(share * 100)} %`).toBeLessThan(0.06);
  });

  it("un torneo guardado antes de la v0.25.106, sin drawSeed, conserva su rival de semifinal", () => {
    const tournament = createTournament("champions_league", 3, "game_1762000000000_abc_3");
    const legacy: EuropeanTournamentState = { ...tournament, drawSeed: undefined };
    const expected = pickSingleEuropeanOpponent({
      competition: "champions_league",
      seed: "3_champions_league_semifinal",
      excludeIds: tournament.matches.map((match) => match.opponent.id),
    });

    expect(semifinalOpponent(legacy)).toBe(expected.name);
  });
});
