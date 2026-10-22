// src/europe/europeanMatchEngine.ts
//
// European Match Engine Integration (v0.24.1b) — simula partidos europeos
// reutilizando el motor de partidos existente (`simulateMatch` en
// `src/simulation/matchEngine.ts`), en vez de crear un motor nuevo.
//
// Como `EuropeanOpponent` solo tiene un rating global (no desglose por
// línea como `RivalTeam`), se construyen adaptadores mínimos: un
// `TeamRating`/`RivalTeam` con reparto uniforme a partir del rating recibido.
// Esto reutiliza fielmente las fórmulas de expected-goals, ventaja de
// local/visitante y varianza ya ajustadas y probadas para Liga/Copa, sin
// tocar `matchEngine.ts` ni sus probabilidades.

import { simulateMatch } from "../simulation/matchEngine";
import type { RivalTeam, RivalTeamRatings, TeamRating } from "../types/game";
import type {
  EuropeanCompetition,
  EuropeanKnockoutDecision,
  EuropeanMatchOutcome,
  EuropeanPenaltyShootout,
} from "./europeanTypes";

export interface SimulateEuropeanMatchInput {
  /** Rating global del usuario ya con ratingDelta/dificultad de temporada aplicados. */
  userTeamRating: number;
  /** Rating global del rival europeo (`EuropeanOpponent.rating`). */
  opponentRating: number;
  isHome: boolean;
  competition: EuropeanCompetition;
  seed?: string | number;
  /**
   * Semifinal o final (partido único). Si el marcador a los 90' es empate se
   * juega prórroga (2×15') y, si persiste, penaltis: el resultado nunca es
   * "draw". En la fase inicial un empate sigue siendo empate.
   */
  isKnockout?: boolean;
}

export interface SimulateEuropeanMatchOutput {
  /** Marcador final (tras la prórroga si la hubo; sin contar penaltis). */
  userGoals: number;
  opponentGoals: number;
  result: EuropeanMatchOutcome;
  /** Solo en eliminatorias. */
  decidedBy?: EuropeanKnockoutDecision;
  /** Marcador a los 90' cuando hubo prórroga o penaltis. */
  regularTimeUserGoals?: number;
  regularTimeOpponentGoals?: number;
  penaltyShootout?: EuropeanPenaltyShootout;
}

// Goles esperados por equipo en 30' de prórroga con igualdad de rating: menos
// que el tercio de un partido normal (~1.3 por equipo), por el cansancio.
const EXTRA_TIME_EXPECTED_GOALS = 0.32;
const PENALTY_BASE_SCORING_PROBABILITY = 0.75;
const PENALTY_RATING_EDGE_PER_POINT = 0.002;
const PENALTY_PROBABILITY_MIN = 0.65;
const PENALTY_PROBABILITY_MAX = 0.85;
const PENALTY_REGULAR_KICKS = 5;
const PENALTY_MAX_SUDDEN_DEATH_ROUNDS = 20;

/** Generador determinista (mulberry32): misma semilla, misma secuencia. */
function createRng(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function samplePoisson(lambda: number, rng: () => number): number {
  const limit = Math.exp(-lambda);
  let goals = 0;
  let product = rng();

  while (product > limit && goals < 6) {
    goals += 1;
    product *= rng();
  }

  return goals;
}

function simulateExtraTime(params: {
  userTeamRating: number;
  opponentRating: number;
  isHome: boolean;
  rng: () => number;
}): { userGoals: number; opponentGoals: number } {
  const ratio = clampRating(params.userTeamRating) / clampRating(params.opponentRating);
  const userStrength = Math.pow(Math.max(0.7, Math.min(1.4, ratio)), 2);
  const opponentStrength = Math.pow(Math.max(0.7, Math.min(1.4, 1 / ratio)), 2);
  const homeEdge = 1.08;

  return {
    userGoals: samplePoisson(EXTRA_TIME_EXPECTED_GOALS * userStrength * (params.isHome ? homeEdge : 1), params.rng),
    opponentGoals: samplePoisson(EXTRA_TIME_EXPECTED_GOALS * opponentStrength * (params.isHome ? 1 : homeEdge), params.rng),
  };
}

function simulatePenaltyShootout(params: {
  userTeamRating: number;
  opponentRating: number;
  rng: () => number;
}): EuropeanPenaltyShootout {
  const edge = (params.userTeamRating - params.opponentRating) * PENALTY_RATING_EDGE_PER_POINT;
  const userProbability = Math.max(PENALTY_PROBABILITY_MIN, Math.min(PENALTY_PROBABILITY_MAX, PENALTY_BASE_SCORING_PROBABILITY + edge));
  const opponentProbability = Math.max(PENALTY_PROBABILITY_MIN, Math.min(PENALTY_PROBABILITY_MAX, PENALTY_BASE_SCORING_PROBABILITY - edge));

  let userScored = 0;
  let opponentScored = 0;

  for (let kick = 1; kick <= PENALTY_REGULAR_KICKS; kick += 1) {
    if (params.rng() < userProbability) userScored += 1;
    if (params.rng() < opponentProbability) opponentScored += 1;

    // Tanda decidida antes de lanzar los 5: el que va por detrás ya no puede alcanzar.
    const userKicksLeft = PENALTY_REGULAR_KICKS - kick;
    if (userScored > opponentScored + userKicksLeft || opponentScored > userScored + userKicksLeft) {
      return { userScored, opponentScored };
    }
  }

  for (let round = 0; round < PENALTY_MAX_SUDDEN_DEATH_ROUNDS && userScored === opponentScored; round += 1) {
    if (params.rng() < userProbability) userScored += 1;
    if (params.rng() < opponentProbability) opponentScored += 1;
  }

  if (userScored === opponentScored) {
    // Imposible en la práctica (20 rondas de muerte súbita); evita un bucle sin salida.
    if (params.rng() < 0.5) userScored += 1;
    else opponentScored += 1;
  }

  return { userScored, opponentScored };
}

function clampRating(value: number): number {
  return Math.max(40, Math.min(99, Math.round(value)));
}

function buildUniformTeamRating(overall: number): TeamRating {
  const clamped = clampRating(overall);

  return {
    attack: clamped,
    defense: clamped,
    control: clamped,
    physical: clamped,
    mentality: clamped,
    goalkeeping: clamped,
    overall: clamped,
    profileLabel: "Europa",
    strengths: [],
    weaknesses: [],
  };
}

function buildUniformRivalTeam(rating: number, competition: EuropeanCompetition): RivalTeam {
  const clamped = clampRating(rating);
  const ratings: RivalTeamRatings = {
    attack: clamped,
    midfield: clamped,
    defense: clamped,
    goalkeeping: clamped,
    mentality: clamped,
    overall: clamped,
  };

  return {
    id: `european_rival_${competition}`,
    name: "Rival europeo",
    shirtIcon: "🇪🇺",
    ratings,
  };
}

function seedToNumber(seed?: string | number): number | undefined {
  if (typeof seed === "number") return seed;
  if (typeof seed !== "string") return undefined;

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash;
}

/**
 * Simula un partido europeo reutilizando `simulateMatch`. No genera
 * estadísticas individuales (goleadores/asistentes): esta fase solo necesita
 * el marcador y el resultado.
 */
export function simulateEuropeanMatch(input: SimulateEuropeanMatchInput): SimulateEuropeanMatchOutput {
  const { userTeamRating, opponentRating, isHome, competition, seed, isKnockout = false } = input;

  const teamRating = buildUniformTeamRating(userTeamRating);
  const rival = buildUniformRivalTeam(opponentRating, competition);

  const matchResult = simulateMatch({
    fixtureId: `european_${competition}`,
    matchday: 0,
    rival,
    venue: isHome ? "home" : "away",
    teamRating,
    selectedPlayers: [],
    seed: seedToNumber(seed),
  });

  const userGoals = isHome ? matchResult.homeGoals : matchResult.awayGoals;
  const opponentGoals = isHome ? matchResult.awayGoals : matchResult.homeGoals;

  const result: EuropeanMatchOutcome = matchResult.userTeamWon
    ? "win"
    : matchResult.userTeamDrew
      ? "draw"
      : "loss";

  if (!isKnockout) {
    return { userGoals, opponentGoals, result };
  }

  if (result !== "draw") {
    return { userGoals, opponentGoals, result, decidedBy: "regular_time" };
  }

  // Empate a los 90' en semifinal/final: prórroga y, si sigue igual, penaltis.
  // La semilla propia mantiene determinista la partida recargada sin alterar
  // el marcador de los 90' (que sale de simulateMatch con la semilla original).
  const baseSeed = seedToNumber(seed) ?? Math.floor(Math.random() * 0xffffffff);
  const rng = createRng(baseSeed ^ 0x9e3779b9);

  const extraTime = simulateExtraTime({ userTeamRating, opponentRating, isHome, rng });
  const finalUserGoals = userGoals + extraTime.userGoals;
  const finalOpponentGoals = opponentGoals + extraTime.opponentGoals;

  if (finalUserGoals !== finalOpponentGoals) {
    return {
      userGoals: finalUserGoals,
      opponentGoals: finalOpponentGoals,
      result: finalUserGoals > finalOpponentGoals ? "win" : "loss",
      decidedBy: "extra_time",
      regularTimeUserGoals: userGoals,
      regularTimeOpponentGoals: opponentGoals,
    };
  }

  const penaltyShootout = simulatePenaltyShootout({ userTeamRating, opponentRating, rng });

  return {
    userGoals: finalUserGoals,
    opponentGoals: finalOpponentGoals,
    result: penaltyShootout.userScored > penaltyShootout.opponentScored ? "win" : "loss",
    decidedBy: "penalties",
    regularTimeUserGoals: userGoals,
    regularTimeOpponentGoals: opponentGoals,
    penaltyShootout,
  };
}
