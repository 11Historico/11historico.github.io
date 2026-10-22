// src/career/challengeLink.ts
//
// Enlace de reto (v0.25.9): comparte la marca de una carrera en la URL. Solo lleva
// puntuación, temporadas, mejor posición y palmarés: ni nick, ni fechas, ni datos
// personales. Al abrirlo, la home muestra la marca a superar.

import type { CareerLocalRankingEntry, CareerTrophyCounts } from "../types/career";

export const CHALLENGE_QUERY_PARAM = "reto";

const MAX_SCORE = 1_000_000;
const MAX_SEASONS = 500;
const MAX_LEAGUE_POSITION = 64;
const MAX_TITLES = 999;

export interface ChallengeSummary {
  arcadeScore: number;
  completedSeasons: number;
  bestLeaguePosition: number;
  trophyCounts: CareerTrophyCounts;
}

// Orden fijo en la URL: liga, copa, supercopa, champions, europaLeague, conference.
const TROPHY_ORDER: Array<keyof CareerTrophyCounts> = ["liga", "copa", "supercopa", "champions", "europaLeague", "conference"];

export function getChallengeSummary(entry: CareerLocalRankingEntry): ChallengeSummary {
  return {
    arcadeScore: entry.arcadeScore,
    completedSeasons: entry.completedSeasons,
    bestLeaguePosition: entry.bestLeaguePosition,
    trophyCounts: { ...entry.trophyCounts },
  };
}

function toBase64Url(text: string): string {
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function isInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

export function encodeChallenge(summary: ChallengeSummary): string {
  const payload = {
    s: summary.arcadeScore,
    t: summary.completedSeasons,
    b: summary.bestLeaguePosition,
    c: TROPHY_ORDER.map((key) => summary.trophyCounts[key]),
  };

  return toBase64Url(JSON.stringify(payload));
}

/** Devuelve la marca si el valor es válido; si no, null. Nunca lanza. */
export function parseChallenge(value: string | null): ChallengeSummary | null {
  if (!value) return null;

  try {
    const data: unknown = JSON.parse(fromBase64Url(value));
    if (typeof data !== "object" || data === null) return null;

    const { s, t, b, c } = data as Record<string, unknown>;
    if (!isInteger(s, 0, MAX_SCORE) || !isInteger(t, 0, MAX_SEASONS) || !isInteger(b, 1, MAX_LEAGUE_POSITION)) return null;
    if (!Array.isArray(c) || c.length !== TROPHY_ORDER.length || !c.every((count) => isInteger(count, 0, MAX_TITLES))) return null;

    const trophyCounts = Object.fromEntries(TROPHY_ORDER.map((key, index) => [key, c[index]])) as unknown as CareerTrophyCounts;

    return { arcadeScore: s, completedSeasons: t, bestLeaguePosition: b, trophyCounts };
  } catch {
    return null;
  }
}

/** URL completa del reto, conservando la base (sin parámetros previos del reto). */
export function buildChallengeLink(summary: ChallengeSummary, baseUrl: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set(CHALLENGE_QUERY_PARAM, encodeChallenge(summary));
  return url.toString();
}
