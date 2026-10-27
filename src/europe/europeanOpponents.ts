// src/europe/europeanOpponents.ts
//
// European Tournament Skeleton (v0.24.1a) — pool de rivales europeos y
// utilidades para elegirlos de forma determinista a partir de una semilla.
// Champions y Europa League usan nombres genéricos. Conference League usa nombres
// reales de clubes (v0.25.48), sin escudos ni equipaciones.

import type { EuropeanCompetition, EuropeanOpponent } from "./europeanTypes";

interface OpponentSeed {
  name: string;
  country: string;
}

const CHAMPIONS_LEAGUE_RATING_RANGE: [number, number] = [82, 94];
const EUROPA_LEAGUE_RATING_RANGE: [number, number] = [76, 88];
const CONFERENCE_LEAGUE_RATING_RANGE: [number, number] = [70, 82];

const CHAMPIONS_LEAGUE_POOL: OpponentSeed[] = [
  { name: "München Rot", country: "Alemania" },
  { name: "Manchester Blue", country: "Inglaterra" },
  { name: "Milano Nero", country: "Italia" },
  { name: "Paris Étoile", country: "Francia" },
  { name: "Amsterdam Rouge", country: "Países Bajos" },
  { name: "Lisboa Verde", country: "Portugal" },
  { name: "London Azzurro", country: "Inglaterra" },
  { name: "Torino Granata", country: "Italia" },
  { name: "Wien Imperial", country: "Austria" },
  { name: "Zürich Cristal", country: "Suiza" },
];

const EUROPA_LEAGUE_POOL: OpponentSeed[] = [
  { name: "Brussel Azul", country: "Bélgica" },
  { name: "Praha Dourada", country: "República Checa" },
  { name: "Warszawa Blanco", country: "Polonia" },
  { name: "Glasgow Gris", country: "Escocia" },
  { name: "Zagreb Rojo", country: "Croacia" },
  { name: "Bucuresti Amarillo", country: "Rumanía" },
  { name: "Belgrade Negro", country: "Serbia" },
  { name: "Sofia Celeste", country: "Bulgaria" },
  { name: "Budapest Coral", country: "Hungría" },
  { name: "Bratislava Índigo", country: "Eslovaquia" },
];

const CONFERENCE_LEAGUE_POOL: OpponentSeed[] = [
  { name: "KF Tirana", country: "Albania" },
  { name: "Zimbru Chișinău", country: "Moldavia" },
  { name: "Víkingur Reykjavík", country: "Islandia" },
  { name: "APOEL", country: "Chipre" },
  { name: "FC Vaduz", country: "Liechtenstein" },
  { name: "Pyunik", country: "Armenia" },
  { name: "Dinamo Tbilisi", country: "Georgia" },
  { name: "Qarabağ", country: "Azerbaiyán" },
  { name: "Budućnost Podgorica", country: "Montenegro" },
  { name: "Valletta FC", country: "Malta" },
];

function getPoolForCompetition(competition: EuropeanCompetition): OpponentSeed[] {
  if (competition === "champions_league") return CHAMPIONS_LEAGUE_POOL;
  if (competition === "europa_league") return EUROPA_LEAGUE_POOL;
  return CONFERENCE_LEAGUE_POOL;
}

function getRatingRangeForCompetition(competition: EuropeanCompetition): [number, number] {
  if (competition === "champions_league") return CHAMPIONS_LEAGUE_RATING_RANGE;
  if (competition === "europa_league") return EUROPA_LEAGUE_RATING_RANGE;
  return CONFERENCE_LEAGUE_RATING_RANGE;
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
 * Elige `count` rivales únicos para una competición europea, con rating
 * dentro del rango de la competición. Determinista si se pasa `seed`.
 */
export function pickEuropeanOpponents(params: {
  competition: EuropeanCompetition;
  count: number;
  seed?: string | number;
  excludeIds?: string[];
}): EuropeanOpponent[] {
  const { competition, count, seed = `${competition}_default`, excludeIds = [] } = params;
  const pool = getPoolForCompetition(competition);
  const [minRating, maxRating] = getRatingRangeForCompetition(competition);
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

    const rating = Math.round(minRating + random.next() * (maxRating - minRating));

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
