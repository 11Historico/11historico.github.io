// src/europe/europeanOpponents.ts
//
// European Tournament Skeleton (v0.24.1a) — pool de rivales europeos y
// utilidades para elegirlos de forma determinista a partir de una semilla.
// Los rivales son clubes reales (nombres, sin escudos ni equipaciones). Cada pool
// tiene 20 clubes para que las temporadas no repitan siempre los mismos rivales.

import type { EuropeanCompetition, EuropeanOpponent } from "./europeanTypes";

interface OpponentSeed {
  name: string;
  country: string;
  /** Media fija del club (v0.25.98). Cada temporada varía ±1. */
  rating: number;
}

// v0.25.98 (fase 9): cada club tiene una media fija por nivel en vez de sortearla en el rango
// de la competición. Antes el Celtic tenía la misma media que el Bayern, y en Champions un club
// cualquiera superaba al Barça y al Madrid (91) una de cada cinco veces
// (docs/INFORME_RIVALES_EUROPEOS_v0_25_97.md). Las medias de cada competición quedan como
// estaban (88, 82 y 76), y la Champions no pasa de 91. Sin progresión con la carrera.
const CHAMPIONS_LEAGUE_POOL: OpponentSeed[] = [
  // Nivel alto: 90
  { name: "Bayern München", country: "Alemania", rating: 90 },
  { name: "Manchester City", country: "Inglaterra", rating: 90 },
  { name: "Inter de Milán", country: "Italia", rating: 90 },
  { name: "Paris Saint-Germain", country: "Francia", rating: 90 },
  { name: "Arsenal", country: "Inglaterra", rating: 90 },
  { name: "Liverpool", country: "Inglaterra", rating: 90 },
  // Nivel medio: 88
  { name: "Chelsea", country: "Inglaterra", rating: 88 },
  { name: "Napoli", country: "Italia", rating: 88 },
  { name: "Borussia Dortmund", country: "Alemania", rating: 88 },
  { name: "Benfica", country: "Portugal", rating: 88 },
  { name: "FC Porto", country: "Portugal", rating: 88 },
  { name: "RB Leipzig", country: "Alemania", rating: 88 },
  { name: "Sporting CP", country: "Portugal", rating: 88 },
  // Nivel bajo: 86
  { name: "Ajax", country: "Países Bajos", rating: 86 },
  { name: "PSV Eindhoven", country: "Países Bajos", rating: 86 },
  { name: "Celtic", country: "Escocia", rating: 86 },
  { name: "Galatasaray", country: "Turquía", rating: 86 },
  { name: "Fenerbahçe", country: "Turquía", rating: 86 },
  { name: "Club Brugge", country: "Bélgica", rating: 86 },
  { name: "Red Bull Salzburgo", country: "Austria", rating: 86 },
];

const EUROPA_LEAGUE_POOL: OpponentSeed[] = [
  // Nivel alto: 86
  { name: "Bayer Leverkusen", country: "Alemania", rating: 86 },
  { name: "Tottenham Hotspur", country: "Inglaterra", rating: 86 },
  { name: "AS Roma", country: "Italia", rating: 86 },
  { name: "Aston Villa", country: "Inglaterra", rating: 86 },
  { name: "Lazio", country: "Italia", rating: 86 },
  { name: "Olympique de Marsella", country: "Francia", rating: 86 },
  // Nivel medio: 82
  { name: "Eintracht Fráncfort", country: "Alemania", rating: 82 },
  { name: "VfB Stuttgart", country: "Alemania", rating: 82 },
  { name: "Olympique de Lyon", country: "Francia", rating: 82 },
  { name: "LOSC Lille", country: "Francia", rating: 82 },
  { name: "West Ham United", country: "Inglaterra", rating: 82 },
  { name: "Rangers", country: "Escocia", rating: 82 },
  { name: "Olympiacos", country: "Grecia", rating: 82 },
  // Nivel bajo: 78
  { name: "Anderlecht", country: "Bélgica", rating: 78 },
  { name: "Ferencváros", country: "Hungría", rating: 78 },
  { name: "Slavia Praga", country: "República Checa", rating: 78 },
  { name: "Lech Poznań", country: "Polonia", rating: 78 },
  { name: "Dinamo Zagreb", country: "Croacia", rating: 78 },
  { name: "Estrella Roja", country: "Serbia", rating: 78 },
  { name: "PAOK", country: "Grecia", rating: 78 },
];

const CONFERENCE_LEAGUE_POOL: OpponentSeed[] = [
  // Nivel alto: 79
  { name: "Qarabağ", country: "Azerbaiyán", rating: 79 },
  { name: "APOEL", country: "Chipre", rating: 79 },
  { name: "Dinamo Tbilisi", country: "Georgia", rating: 79 },
  // Nivel medio: 76
  { name: "Víkingur Reykjavík", country: "Islandia", rating: 76 },
  { name: "Pyunik", country: "Armenia", rating: 76 },
  { name: "KF Tirana", country: "Albania", rating: 76 },
  { name: "Budućnost Podgorica", country: "Montenegro", rating: 76 },
  // Nivel bajo: 73
  { name: "Zimbru Chișinău", country: "Moldavia", rating: 73 },
  { name: "FC Vaduz", country: "Liechtenstein", rating: 73 },
  { name: "Valletta FC", country: "Malta", rating: 73 },
];

/** Variación de la media de un club entre temporadas: −1, 0 o +1. */
const SEASON_RATING_VARIATION = 1;

function getPoolForCompetition(competition: EuropeanCompetition): OpponentSeed[] {
  if (competition === "champions_league") return CHAMPIONS_LEAGUE_POOL;
  if (competition === "europa_league") return EUROPA_LEAGUE_POOL;
  return CONFERENCE_LEAGUE_POOL;
}

function hashSeed(seed: string | number): number {
  const text = String(seed);
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return hash || 1;
}

/**
 * Generador pseudoaleatorio simple y determinista (misma semilla -> misma
 * secuencia). Solo para elegir rivales/ratings europeos; no toca el motor de
 * partidos ni sus probabilidades.
 */
class EuropeanRandom {
  private state: number;

  constructor(seed: string | number) {
    this.state = hashSeed(seed);
  }

  next(): number {
    this.state = (Math.imul(this.state, 1103515245) + 12345) >>> 0;
    return this.state / 4294967296;
  }
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildOpponentId(competition: EuropeanCompetition, name: string): string {
  return `euro_opp_${competition}_${slugifyName(name)}`;
}

/**
 * Elige `count` rivales únicos para una competición europea, cada uno con la media
 * fija de su club ±1 (v0.25.98). Determinista si se pasa `seed`.
 */
export function pickEuropeanOpponents(params: {
  competition: EuropeanCompetition;
  count: number;
  seed?: string | number;
  excludeIds?: string[];
}): EuropeanOpponent[] {
  const { competition, count, seed = `${competition}_default`, excludeIds = [] } = params;
  const pool = getPoolForCompetition(competition);
  const random = new EuropeanRandom(seed);

  const shuffled = pool
    .map((entry) => ({ entry, sortKey: random.next() }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((item) => item.entry);

  const opponents: EuropeanOpponent[] = [];

  for (const seedEntry of shuffled) {
    if (opponents.length >= count) break;

    const id = buildOpponentId(competition, seedEntry.name);

    if (excludeIds.includes(id)) continue;

    // La misma tirada que antes sorteaba la media en el rango: ahora solo da la variación de la temporada.
    const variation = Math.min(SEASON_RATING_VARIATION, Math.floor(random.next() * (2 * SEASON_RATING_VARIATION + 1)) - SEASON_RATING_VARIATION);
    const rating = seedEntry.rating + variation;

    opponents.push({
      id,
      name: seedEntry.name,
      country: seedEntry.country,
      rating,
      tier: competition,
    });
  }

  return opponents;
}

/**
 * Elige un único rival europeo (usado para semifinal/final), evitando
 * repetir rivales ya usados en el mismo torneo.
 */
export function pickSingleEuropeanOpponent(params: {
  competition: EuropeanCompetition;
  seed?: string | number;
  excludeIds?: string[];
}): EuropeanOpponent {
  const [opponent] = pickEuropeanOpponents({ ...params, count: 1 });
  return opponent;
}
