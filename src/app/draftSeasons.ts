// src/app/draftSeasons.ts
//
// Sorteo de temporadas del draft (extraído de src/App.tsx, v0.25.7).
// Funciones puras: no dependen del estado de la aplicación.

import { getAvailableAthleticSeasons } from "../data/athleticSeasons";
import { getAthleticSeasonsForEasyModeRange } from "../data/easyModeSeasonRanges";
import type { EasyModeSeasonRangeId, GameDifficulty, SeasonId } from "../types/game";

function getSeasonYearNumber(season: SeasonId): number {
  const [startYear] = season.split("/");
  const parsed = Number(startYear);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getSeasonDecadeBucket(season: SeasonId): number {
  const year = getSeasonYearNumber(season);

  return Math.floor(year / 10) * 10;
}

function pickRandomSeason(
  seasons: SeasonId[],
  excludedSeasons: Set<SeasonId> = new Set(),
  previousSeason?: SeasonId
): SeasonId {
  if (seasons.length === 0) {
    throw new Error("No hay temporadas disponibles en athleticSeasons.ts");
  }

  const eligibleSeasons = seasons.filter((season) => !excludedSeasons.has(season));
  const uniquePool = eligibleSeasons.length > 0 ? eligibleSeasons : seasons;

  const previousDecade = previousSeason ? getSeasonDecadeBucket(previousSeason) : undefined;
  const variedPool = previousDecade === undefined
    ? uniquePool
    : uniquePool.filter((season) => getSeasonDecadeBucket(season) !== previousDecade);

  const pool = variedPool.length > 0 ? variedPool : uniquePool;
  const index = Math.floor(Math.random() * pool.length);

  return pool[index];
}

function createRandomPlayerRoundSeasons(totalRounds: number, seasons: SeasonId[] = getAvailableAthleticSeasons()): SeasonId[] {
  const usedSeasons = new Set<SeasonId>();
  const selectedSeasons: SeasonId[] = [];

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const previousSeason = selectedSeasons[selectedSeasons.length - 1];
    const nextSeason = pickRandomSeason(seasons, usedSeasons, previousSeason);
    selectedSeasons.push(nextSeason);
    usedSeasons.add(nextSeason);
  }

  return selectedSeasons;
}

function getDraftSeasonPool(params: {
  difficulty: GameDifficulty;
  easyModeSeasonRangeId: EasyModeSeasonRangeId;
}): SeasonId[] {
  return params.difficulty === "normal"
    ? getAthleticSeasonsForEasyModeRange(params.easyModeSeasonRangeId)
    : getAvailableAthleticSeasons();
}

export { createRandomPlayerRoundSeasons, getDraftSeasonPool, pickRandomSeason };
