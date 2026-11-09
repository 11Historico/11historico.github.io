// src/europe/europeanOpponents.ts
//
// European Tournament Skeleton (v0.24.1a) — pool de rivales europeos y
// utilidades para elegirlos de forma determinista a partir de una semilla.
// Los rivales son clubes reales (nombres, sin escudos ni equipaciones). Cada pool
// tiene 20 clubes para que las temporadas no repitan siempre los mismos rivales.

import type { EuropeanCompetition, EuropeanOpponent, EuropeanOpponentStyle } from "./europeanTypes";

interface OpponentSeed {
  name: string;
  country: string;
  /** Media fija del club (v0.25.98). Cada temporada varía ±1. */
  rating: number;
  /**
   * Estilo del club (v0.25.105, fase 10), fijado a mano: ofensivo, equilibrado o defensivo, un
   * tercio de cada más o menos. Mueve ±3 el ataque y la defensa sin cambiar la media
   * (EUROPEAN_STYLE_SHIFT en europeanMatchEngine.ts).
   */
  style: EuropeanOpponentStyle;
}

// v0.25.98 (fase 9): cada club tiene una media fija por nivel en vez de sortearla en el rango
// de la competición. Antes el Celtic tenía la misma media que el Bayern, y en Champions un club
// cualquiera superaba al Barça y al Madrid (91) una de cada cinco veces
// (docs/INFORME_RIVALES_EUROPEOS_v0_25_97.md). Las medias de cada competición quedan como
// estaban (88, 82 y 76), y la Champions no pasa de 91. Sin progresión con la carrera.
const CHAMPIONS_LEAGUE_POOL: OpponentSeed[] = [
  // Nivel alto: 90
  { name: "Bayern München", country: "Alemania", rating: 90, style: "attacking" },
  { name: "Manchester City", country: "Inglaterra", rating: 90, style: "balanced" },
  { name: "Inter de Milán", country: "Italia", rating: 90, style: "defensive" },
  { name: "Paris Saint-Germain", country: "Francia", rating: 90, style: "attacking" },
  { name: "Arsenal", country: "Inglaterra", rating: 90, style: "balanced" },
  { name: "Liverpool", country: "Inglaterra", rating: 90, style: "attacking" },
  // Nivel medio: 88
  { name: "Chelsea", country: "Inglaterra", rating: 88, style: "defensive" },
  { name: "Napoli", country: "Italia", rating: 88, style: "balanced" },
  { name: "Borussia Dortmund", country: "Alemania", rating: 88, style: "attacking" },
  { name: "Benfica", country: "Portugal", rating: 88, style: "balanced" },
  { name: "FC Porto", country: "Portugal", rating: 88, style: "defensive" },
  { name: "RB Leipzig", country: "Alemania", rating: 88, style: "attacking" },
  { name: "Sporting CP", country: "Portugal", rating: 88, style: "balanced" },
  // Nivel bajo: 86
  { name: "Ajax", country: "Países Bajos", rating: 86, style: "attacking" },
  { name: "PSV Eindhoven", country: "Países Bajos", rating: 86, style: "attacking" },
  { name: "Celtic", country: "Escocia", rating: 86, style: "defensive" },
  { name: "Galatasaray", country: "Turquía", rating: 86, style: "defensive" },
  { name: "Fenerbahçe", country: "Turquía", rating: 86, style: "balanced" },
  { name: "Club Brugge", country: "Bélgica", rating: 86, style: "defensive" },
  { name: "Red Bull Salzburgo", country: "Austria", rating: 86, style: "balanced" },
];

const EUROPA_LEAGUE_POOL: OpponentSeed[] = [
  // Nivel alto: 86
  { name: "Bayer Leverkusen", country: "Alemania", rating: 86, style: "attacking" },
  { name: "Tottenham Hotspur", country: "Inglaterra", rating: 86, style: "attacking" },
  { name: "AS Roma", country: "Italia", rating: 86, style: "defensive" },
  { name: "Aston Villa", country: "Inglaterra", rating: 86, style: "balanced" },
  { name: "Lazio", country: "Italia", rating: 86, style: "balanced" },
  { name: "Olympique de Marsella", country: "Francia", rating: 86, style: "attacking" },
  // Nivel medio: 82
  { name: "Eintracht Fráncfort", country: "Alemania", rating: 82, style: "attacking" },
  { name: "VfB Stuttgart", country: "Alemania", rating: 82, style: "balanced" },
  { name: "Olympique de Lyon", country: "Francia", rating: 82, style: "attacking" },
  { name: "LOSC Lille", country: "Francia", rating: 82, style: "defensive" },
  { name: "West Ham United", country: "Inglaterra", rating: 82, style: "defensive" },
  { name: "Rangers", country: "Escocia", rating: 82, style: "balanced" },
  { name: "Olympiacos", country: "Grecia", rating: 82, style: "defensive" },
  // Nivel bajo: 78
  { name: "Anderlecht", country: "Bélgica", rating: 78, style: "balanced" },
  { name: "Ferencváros", country: "Hungría", rating: 78, style: "defensive" },
  { name: "Slavia Praga", country: "República Checa", rating: 78, style: "defensive" },
  { name: "Lech Poznań", country: "Polonia", rating: 78, style: "balanced" },
  { name: "Dinamo Zagreb", country: "Croacia", rating: 78, style: "attacking" },
  { name: "Estrella Roja", country: "Serbia", rating: 78, style: "balanced" },
  { name: "PAOK", country: "Grecia", rating: 78, style: "defensive" },
];

const CONFERENCE_LEAGUE_POOL: OpponentSeed[] = [
  // Nivel alto: 79
  { name: "Qarabağ", country: "Azerbaiyán", rating: 79, style: "attacking" },
  { name: "APOEL", country: "Chipre", rating: 79, style: "defensive" },
  { name: "Dinamo Tbilisi", country: "Georgia", rating: 79, style: "balanced" },
  // Nivel medio: 76
  { name: "Víkingur Reykjavík", country: "Islandia", rating: 76, style: "balanced" },
  { name: "Pyunik", country: "Armenia", rating: 76, style: "attacking" },
  { name: "KF Tirana", country: "Albania", rating: 76, style: "defensive" },
  { name: "Budućnost Podgorica", country: "Montenegro", rating: 76, style: "defensive" },
  // Nivel bajo: 73
  { name: "Zimbru Chișinău", country: "Moldavia", rating: 73, style: "balanced" },
  { name: "FC Vaduz", country: "Liechtenstein", rating: 73, style: "defensive" },
  { name: "Valletta FC", country: "Malta", rating: 73, style: "attacking" },
];

export const EUROPEAN_STYLE_LABEL: Record<EuropeanOpponentStyle, string> = {
  attacking: "ofensivo",
  balanced: "equilibrado",
  defensive: "defensivo",
};

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
      style: seedEntry.style,
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
