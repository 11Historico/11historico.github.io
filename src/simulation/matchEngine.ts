// src/simulation/matchEngine.ts

import type {
  CoachSkills,
  GoalEvent,
  MatchApproach,
  MatchKeyFactor,
  MatchResult,
  RivalTeam,
  TeamRating,
  UserPlayerSeasonStats,
  SelectedPlayer,
} from "../types/game";

export type MatchVenue = "home" | "away";

export interface SimulateMatchParams {
  fixtureId: string;
  matchday: number;

  userTeamName?: string;
  rival: RivalTeam;
  venue: MatchVenue;

  teamRating: TeamRating;
  selectedPlayers: SelectedPlayer[];

  /**
   * Semilla opcional para hacer resultados reproducibles en tests.
   * Si no se pasa, usa Math.random().
   */
  seed?: number;

  /** Planteamiento (v0.25.75). Sin él o con "balanced", el partido es el de siempre. */
  approach?: MatchApproach;
  /** Las habilidades de ataque y defensa del entrenador refuerzan el planteamiento. */
  coachSkills?: CoachSkills;
}

interface RandomGenerator {
  next(): number;
}

/**
 * Generador pseudoaleatorio simple para tests reproducibles.
 */
class SeededRandom implements RandomGenerator {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

class NativeRandom implements RandomGenerator {
  next(): number {
    return Math.random();
  }
}

function createRandom(seed?: number): RandomGenerator {
  return typeof seed === "number" ? new SeededRandom(seed) : new NativeRandom();
}

/** Lee las tiradas de `draws` y pide a `source` solo las que faltan: dos lecturas ven las mismas. */
function createReplayRandom(source: RandomGenerator, draws: number[]): RandomGenerator {
  let index = 0;

  return {
    next() {
      if (index === draws.length) draws.push(source.next());
      return draws[index++];
    },
  };
}

/** Habilidad a partir de la cual un entrenador cuenta como especialista (v0.18.3). */
export const COACH_SPECIALIST_SKILL = 86;

export function coachReinforcesApproach(approach: MatchApproach, coachSkills?: CoachSkills): boolean {
  if (approach === "attacking") return (coachSkills?.attack ?? 0) >= COACH_SPECIALIST_SKILL;
  if (approach === "defensive") return (coachSkills?.defense ?? 0) >= COACH_SPECIALIST_SKILL;
  return false;
}

const APPROACH_GOALS_CHANGE = 0.1;
const APPROACH_EDGE_EFFECT = 0.1;
const APPROACH_EDGE_RATING_GAP = 10;
const COACH_APPROACH_EXTRA = 0.05;

/**
 * Planteamiento (v0.25.75). Ofensivo: más goles en los dos lados. Defensivo: menos.
 * En un partido igualado es ±10 % para los dos, sin ventaja. Según la diferencia de
 * nivel (`edge`, de -1 a 1), atacar rinde más al favorito y cerrarse al inferior; el
 * planteamiento contrario se paga. Un entrenador especialista suma un extra.
 */
function getApproachGoalMultipliers(params: {
  approach?: MatchApproach;
  coachSkills?: CoachSkills;
  userAverage: number;
  rivalAverage: number;
}): { user: number; rival: number } {
  const { approach, coachSkills, userAverage, rivalAverage } = params;

  if (!approach || approach === "balanced") return { user: 1, rival: 1 };

  const edge = clamp((userAverage - rivalAverage) / APPROACH_EDGE_RATING_GAP, -1, 1) * APPROACH_EDGE_EFFECT;
  const coachExtra = coachReinforcesApproach(approach, coachSkills) ? COACH_APPROACH_EXTRA : 0;

  return approach === "attacking"
    ? { user: 1 + APPROACH_GOALS_CHANGE + edge + coachExtra, rival: 1 + APPROACH_GOALS_CHANGE - edge }
    : { user: 1 - APPROACH_GOALS_CHANGE - edge, rival: 1 - APPROACH_GOALS_CHANGE + edge - coachExtra };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundToOne(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Convierte una ventaja de rating a goles esperados.
 *
 * La idea es:
 * - Equipo muy superior: xG claramente mayor.
 * - Equipo inferior: aún puede marcar.
 * - Mantener marcadores realistas tipo 0-0, 1-0, 2-1, 3-1.
 */
function calculateExpectedGoals(params: {
  attack: number;
  control: number;
  mentality: number;
  opponentDefense: number;
  opponentGoalkeeping: number;
  opponentMentality: number;
  isHome: boolean;
  riskModifier?: number;
}): number {
  const {
    attack,
    control,
    mentality,
    opponentDefense,
    opponentGoalkeeping,
    opponentMentality,
    isHome,
    riskModifier = 0,
  } = params;

  /**
   * Balance v2:
   * - Se reduce la sensibilidad de la diferencia de rating.
   * - El visitante tiene una penalización algo más realista.
   * - Los partidos tienden más a 0-0, 1-0, 1-1, 2-1 y menos a goleada.
   */
  const attackingPower =
    attack * 0.52 +
    control * 0.2 +
    mentality * 0.12 +
    riskModifier * 0.05;

  const defensiveResistance =
    opponentDefense * 0.5 +
    opponentGoalkeeping * 0.3 +
    opponentMentality * 0.2;

  const ratingDiff = attackingPower - defensiveResistance;
  const homeBonus = isHome ? 0.14 : -0.18;

  const expectedGoals = 1.08 + ratingDiff / 34 + homeBonus;

  return roundToOne(clamp(expectedGoals, 0.28, 3.05));
}

function getAverageUserRating(teamRating: TeamRating): number {
  return (
    teamRating.attack * 0.22 +
    teamRating.defense * 0.22 +
    teamRating.control * 0.18 +
    teamRating.physical * 0.1 +
    teamRating.mentality * 0.13 +
    teamRating.goalkeeping * 0.15
  );
}

function getAverageRivalRating(rival: RivalTeam): number {
  return (
    rival.ratings.attack * 0.22 +
    rival.ratings.defense * 0.22 +
    rival.ratings.midfield * 0.2 +
    rival.ratings.mentality * 0.16 +
    rival.ratings.goalkeeping * 0.2
  );
}

function getFixtureDifficultyModifier(params: {
  teamRating: TeamRating;
  rival: RivalTeam;
  userIsHome: boolean;
}): {
  userAttackPenalty: number;
  userDefensePenalty: number;
  rivalAttackBonus: number;
} {
  const { teamRating, rival, userIsHome } = params;

  const userAverage = getAverageUserRating(teamRating);
  const rivalAverage = getAverageRivalRating(rival);
  const rivalIsStrong = rivalAverage >= 84;
  const rivalIsVeryStrong = rivalAverage >= 88;
  const userIsHugeFavorite = userAverage - rivalAverage >= 10;

  let userAttackPenalty = 0;
  let userDefensePenalty = 0;
  let rivalAttackBonus = 0;

  if (!userIsHome) {
    userAttackPenalty += 2.2;
    userDefensePenalty += 1.4;
    rivalAttackBonus += 0.7;
  }

  if (rivalIsStrong) {
    userAttackPenalty += 1.2;
    userDefensePenalty += 0.8;
    rivalAttackBonus += 0.9;
  }

  if (rivalIsVeryStrong) {
    userAttackPenalty += 1.2;
    userDefensePenalty += 1.0;
    rivalAttackBonus += 0.8;
  }

  // Evita que un once legendario aplaste siempre a rivales medios.
  if (userIsHugeFavorite) {
    userAttackPenalty += 0.9;
    rivalAttackBonus += 0.5;
  }

  return {
    userAttackPenalty,
    userDefensePenalty,
    rivalAttackBonus,
  };
}

/**
 * Muestra algo de varianza sin que el partido sea puro azar.
 */
function sampleGoalsFromExpectedGoals(expectedGoals: number, random: RandomGenerator): number {
  const roll = random.next();

  const lowBlock = Math.max(0, expectedGoals - 1.05);
  const normal = expectedGoals;
  const high = expectedGoals + 0.7;
  const veryHigh = expectedGoals + 1.25;

  let rawGoals: number;

  if (roll < 0.18) {
    rawGoals = lowBlock;
  } else if (roll < 0.78) {
    rawGoals = normal + (random.next() - 0.5) * 0.75;
  } else if (roll < 0.94) {
    rawGoals = high + random.next() * 0.45;
  } else {
    rawGoals = veryHigh + random.next() * 0.65;
  }

  return clamp(Math.round(rawGoals), 0, 5);
}

function applyUnderdogAndDrawVariance(params: {
  userGoals: number;
  rivalGoals: number;
  teamRating: TeamRating;
  rival: RivalTeam;
  userIsHome: boolean;
  random: RandomGenerator;
}): {
  userGoals: number;
  rivalGoals: number;
  /** El rival sumó un gol a una victoria del usuario (solo informa; ver getMatchKeyFactor). */
  rivalClosedGap: boolean;
  /** El rival sumó un gol a un empate. */
  upset: boolean;
} {
  const { userGoals } = params;
  let { rivalGoals } = params;
  const { teamRating, rival, userIsHome, random } = params;
  let rivalClosedGap = false;
  let upset = false;

  const userAverage = getAverageUserRating(teamRating);
  const rivalAverage = getAverageRivalRating(rival);
  const diff = userAverage - rivalAverage;
  const rivalIsStrong = rivalAverage >= 84;

  /**
   * Más empates realistas:
   * - Fuera de casa cuesta cerrar partidos.
   * - Contra rivales fuertes hay más riesgo de empate.
   */
  if (userGoals > rivalGoals) {
    const lead = userGoals - rivalGoals;

    let drawChance = 0.04;

    if (!userIsHome) drawChance += 0.07;
    if (rivalIsStrong) drawChance += 0.06;
    if (diff < 8) drawChance += 0.05;
    if (lead >= 2) drawChance *= 0.45;

    if (random.next() < drawChance) {
      rivalGoals += 1;
      rivalClosedGap = true;
    }
  }

  /**
   * Alguna sorpresa: un rival fuerte o un desplazamiento complicado
   * puede convertir un empate en derrota.
   */
  if (userGoals === rivalGoals) {
    let upsetChance = 0.035;

    if (!userIsHome) upsetChance += 0.04;
    if (rivalIsStrong) upsetChance += 0.04;
    if (diff <= 4) upsetChance += 0.035;

    if (random.next() < upsetChance) {
      rivalGoals += 1;
      upset = true;
    }
  }

  return {
    userGoals,
    rivalGoals,
    rivalClosedGap,
    upset,
  };
}

/**
 * Factor que decidió el partido (v0.25.74). Solo lee lo que ya ha pasado en
 * simulateMatch: no tira ningún número aleatorio, así que no cambia resultados.
 */
function getMatchKeyFactor(params: {
  userGoals: number;
  rivalGoals: number;
  userIsHome: boolean;
  userAverage: number;
  rivalAverage: number;
  userIsHugeFavorite: boolean;
  rivalClosedGap: boolean;
  upset: boolean;
  mentalityGoal?: "user" | "rival";
}): MatchKeyFactor {
  const { userGoals, rivalGoals, userIsHome, userAverage, rivalAverage } = params;
  const rivalIsStronger = rivalAverage >= userAverage + 3;

  if (userGoals > rivalGoals) {
    if (params.mentalityGoal === "user") return "mentality_win";
    if (rivalIsStronger) return "giant_killing";
    if (userGoals >= 3) return "attack_win";
    if (rivalGoals === 0) return "clean_sheet_win";
    return userIsHome ? "home_win" : "away_win";
  }

  if (params.mentalityGoal === "rival" && userGoals < rivalGoals) return "mentality_loss";
  if (params.userIsHugeFavorite) return "overconfidence";

  if (userGoals === rivalGoals) {
    if (params.rivalClosedGap) return "lead_lost";
    return userIsHome ? "even_draw" : "away_draw";
  }

  if (params.upset) return "upset";
  if (rivalIsStronger) return "stronger_rival";
  return userIsHome ? "bad_day" : "away_loss";
}

/**
 * Ajusta partidos muy extremos para que sean menos frecuentes.
 */
function normalizeScore(homeGoals: number, awayGoals: number, random: RandomGenerator): {
  homeGoals: number;
  awayGoals: number;
} {
  let normalizedHome = homeGoals;
  let normalizedAway = awayGoals;

  const totalGoals = normalizedHome + normalizedAway;

  if (totalGoals >= 7 && random.next() < 0.7) {
    if (normalizedHome > normalizedAway) {
      normalizedHome -= 1;
    } else if (normalizedAway > normalizedHome) {
      normalizedAway -= 1;
    } else {
      normalizedHome -= 1;
    }
  }

  if (normalizedHome >= 5 && random.next() < 0.45) {
    normalizedHome -= 1;
  }

  if (normalizedAway >= 5 && random.next() < 0.45) {
    normalizedAway -= 1;
  }

  return {
    homeGoals: clamp(normalizedHome, 0, 6),
    awayGoals: clamp(normalizedAway, 0, 6),
  };
}

/**
 * Devuelve jugadores candidatos a marcar en el Athletic histórico.
 */
function getScorerCandidates(selectedPlayers: SelectedPlayer[]): Array<{
  playerName: string;
  playerId: string;
  weight: number;
}> {
  return selectedPlayers.map((selected) => {
    const player = selected.playerSeason;
    const position = selected.position;

    let positionWeight = 1;

    if (position === "DC") positionWeight = 5;
    else if (position === "SD" || position === "EI" || position === "ED") positionWeight = 3.5;
    else if (position === "MP") positionWeight = 2.8;
    else if (position === "MC" || position === "MI" || position === "MD") positionWeight = 1.7;
    else if (position === "MCD") positionWeight = 1.1;
    else if (position === "LD" || position === "LI" || position === "CAD" || position === "CAI") positionWeight = 0.7;
    else if (position === "DFC") positionWeight = 0.45;
    else if (position === "POR") positionWeight = 0.02;

    const weight =
      positionWeight *
      (player.skills.shooting * 0.45 +
        player.skills.mentality * 0.2 +
        player.skills.physical * 0.15 +
        player.skills.dribbling * 0.12 +
        player.overall * 0.08);

    return {
      playerName: player.name,
      playerId: player.playerId,
      weight,
    };
  });
}

/**
 * Devuelve jugadores candidatos a asistir en el Athletic histórico.
 */
function getAssistCandidates(selectedPlayers: SelectedPlayer[]): Array<{
  playerName: string;
  playerId: string;
  weight: number;
}> {
  return selectedPlayers.map((selected) => {
    const player = selected.playerSeason;
    const position = selected.position;

    let positionWeight = 1;

    if (position === "MP") positionWeight = 4.5;
    else if (position === "MC") positionWeight = 3.2;
    else if (position === "EI" || position === "ED" || position === "MI" || position === "MD") positionWeight = 3.0;
    else if (position === "MCD") positionWeight = 2.0;
    else if (position === "LD" || position === "LI" || position === "CAD" || position === "CAI") positionWeight = 1.9;
    else if (position === "SD") positionWeight = 2.5;
    else if (position === "DC") positionWeight = 1.3;
    else if (position === "DFC") positionWeight = 0.8;
    else if (position === "POR") positionWeight = 0.05;

    const weight =
      positionWeight *
      (player.skills.passing * 0.5 +
        player.skills.dribbling * 0.2 +
        player.skills.mentality * 0.15 +
        player.overall * 0.15);

    return {
      playerName: player.name,
      playerId: player.playerId,
      weight,
    };
  });
}

function pickWeighted<T extends { weight: number }>(items: T[], random: RandomGenerator): T | undefined {
  const totalWeight = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);

  if (totalWeight <= 0) return undefined;

  let target = random.next() * totalWeight;

  for (const item of items) {
    target -= Math.max(0, item.weight);

    if (target <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

function randomMinute(random: RandomGenerator): number {
  return clamp(Math.round(1 + random.next() * 93), 1, 95);
}

function generateUserGoalEvents(params: {
  goals: number;
  teamName: string;
  selectedPlayers: SelectedPlayer[];
  random: RandomGenerator;
}): GoalEvent[] {
  const { goals, teamName, selectedPlayers, random } = params;

  const scorerCandidates = getScorerCandidates(selectedPlayers);
  const assistCandidates = getAssistCandidates(selectedPlayers);

  const events: GoalEvent[] = [];

  for (let i = 0; i < goals; i += 1) {
    const scorer = pickWeighted(scorerCandidates, random);

    const possibleAssisters = assistCandidates.filter(
      (candidate) => candidate.playerId !== scorer?.playerId
    );

    const hasAssist = random.next() < 0.72;
    const assistant = hasAssist ? pickWeighted(possibleAssisters, random) : undefined;

    events.push({
      minute: randomMinute(random),
      teamName,
      scorerName: scorer?.playerName,
      assistName: assistant?.playerName,
    });
  }

  return events.sort((a, b) => a.minute - b.minute);
}

function generateRivalGoalEvents(params: {
  goals: number;
  teamName: string;
  random: RandomGenerator;
}): GoalEvent[] {
  const { goals, teamName, random } = params;

  const events: GoalEvent[] = [];

  for (let i = 0; i < goals; i += 1) {
    events.push({
      minute: randomMinute(random),
      teamName,
    });
  }

  return events.sort((a, b) => a.minute - b.minute);
}

function playMatch(params: SimulateMatchParams, random: RandomGenerator): MatchResult {
  const {
    fixtureId,
    matchday,
    userTeamName = "Once histórico Zurigorri",
    rival,
    venue,
    teamRating,
    selectedPlayers,
    approach,
    coachSkills,
  } = params;

  const userIsHome = venue === "home";
  const difficulty = getFixtureDifficultyModifier({
    teamRating,
    rival,
    userIsHome,
  });

  const userExpectedGoals = calculateExpectedGoals({
    attack: teamRating.attack - difficulty.userAttackPenalty,
    control: teamRating.control - difficulty.userAttackPenalty * 0.35,
    mentality: teamRating.mentality,
    opponentDefense: rival.ratings.defense,
    opponentGoalkeeping: rival.ratings.goalkeeping,
    opponentMentality: rival.ratings.mentality,
    isHome: userIsHome,
    riskModifier: (teamRating.attack - teamRating.defense) * 0.65,
  });

  const rivalExpectedGoals = calculateExpectedGoals({
    attack: rival.ratings.attack + difficulty.rivalAttackBonus,
    control: rival.ratings.midfield + difficulty.rivalAttackBonus * 0.5,
    mentality: rival.ratings.mentality,
    opponentDefense: teamRating.defense - difficulty.userDefensePenalty,
    opponentGoalkeeping: teamRating.goalkeeping,
    opponentMentality: teamRating.mentality,
    isHome: !userIsHome,
    riskModifier: (rival.ratings.attack - rival.ratings.defense) * 0.65,
  });

  const approachMultipliers = getApproachGoalMultipliers({
    approach,
    coachSkills,
    userAverage: getAverageUserRating(teamRating),
    rivalAverage: getAverageRivalRating(rival),
  });
  let userGoals = sampleGoalsFromExpectedGoals(userExpectedGoals * approachMultipliers.user, random);
  let rivalGoals = sampleGoalsFromExpectedGoals(rivalExpectedGoals * approachMultipliers.rival, random);

  const varianceAdjusted = applyUnderdogAndDrawVariance({
    userGoals,
    rivalGoals,
    teamRating,
    rival,
    userIsHome,
    random,
  });

  userGoals = varianceAdjusted.userGoals;
  rivalGoals = varianceAdjusted.rivalGoals;

  /**
   * Mentalidad en partidos igualados:
   * si el partido está empatado y hay diferencia de mentalidad notable,
   * existe una pequeña probabilidad de gol decisivo.
   */
  const mentalityDiff = teamRating.mentality - rival.ratings.mentality;
  let mentalityGoal: "user" | "rival" | undefined;

  if (userGoals === rivalGoals && Math.abs(mentalityDiff) >= 8 && random.next() < 0.18) {
    if (mentalityDiff > 0) {
      userGoals += 1;
      mentalityGoal = "user";
    } else {
      rivalGoals += 1;
      mentalityGoal = "rival";
    }
  }

  const normalized =
    userIsHome
      ? normalizeScore(userGoals, rivalGoals, random)
      : normalizeScore(rivalGoals, userGoals, random);

  const homeGoals = normalized.homeGoals;
  const awayGoals = normalized.awayGoals;

  userGoals = userIsHome ? homeGoals : awayGoals;
  rivalGoals = userIsHome ? awayGoals : homeGoals;

  const userGoalEvents = generateUserGoalEvents({
    goals: userGoals,
    teamName: userTeamName,
    selectedPlayers,
    random,
  });

  const rivalGoalEvents = generateRivalGoalEvents({
    goals: rivalGoals,
    teamName: rival.name,
    random,
  });

  const goalEvents = [...userGoalEvents, ...rivalGoalEvents].sort(
    (a, b) => a.minute - b.minute
  );

  const userTeamWon = userGoals > rivalGoals;
  const userTeamDrew = userGoals === rivalGoals;
  const userTeamLost = userGoals < rivalGoals;
  const userAverage = getAverageUserRating(teamRating);
  const rivalAverage = getAverageRivalRating(rival);
  const keyFactor = getMatchKeyFactor({
    userGoals,
    rivalGoals,
    userIsHome,
    userAverage,
    rivalAverage,
    userIsHugeFavorite: userAverage - rivalAverage >= 10,
    rivalClosedGap: varianceAdjusted.rivalClosedGap,
    upset: varianceAdjusted.upset,
    mentalityGoal,
  });

  return {
    fixtureId,
    matchday,
    homeTeamName: userIsHome ? userTeamName : rival.name,
    awayTeamName: userIsHome ? rival.name : userTeamName,
    homeGoals,
    awayGoals,
    goalEvents,
    userTeamPlayed: true,
    userTeamWon,
    userTeamDrew,
    userTeamLost,
    cleanSheetForUserTeam: rivalGoals === 0,
    keyFactor,
  };
}

/**
 * Simula un partido individual del Athletic histórico contra un rival 25/26.
 */
export function simulateMatch(params: SimulateMatchParams): MatchResult {
  const random = createRandom(params.seed);

  if (!params.approach || params.approach === "balanced") {
    return playMatch(params, random);
  }

  // El mismo partido con planteamiento equilibrado y las mismas tiradas: lo que
  // cambie entre los dos es efecto real del planteamiento (v0.25.75).
  const draws: number[] = [];
  const result = playMatch(params, createReplayRandom(random, draws));
  const balanced = playMatch({ ...params, approach: undefined }, createReplayRandom(random, draws));
  const userIsHome = params.venue === "home";

  return {
    ...result,
    approachEffect: {
      approach: params.approach,
      userGoals: userIsHome ? result.homeGoals : result.awayGoals,
      rivalGoals: userIsHome ? result.awayGoals : result.homeGoals,
      balancedUserGoals: userIsHome ? balanced.homeGoals : balanced.awayGoals,
      balancedRivalGoals: userIsHome ? balanced.awayGoals : balanced.homeGoals,
    },
  };
}

export interface MatchOdds {
  win: number;
  draw: number;
  loss: number;
}

/**
 * Probabilidad aproximada de victoria, empate y derrota en 90 minutos para la
 * previa (v0.25.74). Simula el mismo partido con semillas fijas: usa todas las
 * reglas del motor y no toca el partido real, que se juega con su propia semilla.
 */
export function estimateMatchOdds(
  params: Omit<SimulateMatchParams, "fixtureId" | "matchday" | "seed">,
  samples = 300,
): MatchOdds {
  let win = 0;
  let draw = 0;

  for (let seed = 1; seed <= samples; seed += 1) {
    const result = simulateMatch({ ...params, fixtureId: "odds", matchday: 0, seed });
    if (result.userTeamWon) win += 1;
    else if (result.userTeamDrew) draw += 1;
  }

  return { win: win / samples, draw: draw / samples, loss: (samples - win - draw) / samples };
}

/**
 * Actualiza estadísticas individuales del Athletic histórico tras un partido.
 */
export function updateUserPlayerStatsFromMatch(params: {
  currentStats: UserPlayerSeasonStats[];
  matchResult: MatchResult;
  selectedPlayers: SelectedPlayer[];
  userTeamName?: string;
}): UserPlayerSeasonStats[] {
  const {
    currentStats,
    matchResult,
    selectedPlayers,
    userTeamName = "Once histórico Zurigorri",
  } = params;

  const statsByPlayerId = new Map<string, UserPlayerSeasonStats>();

  for (const stat of currentStats) {
    statsByPlayerId.set(stat.playerId, { ...stat });
  }

  for (const selected of selectedPlayers) {
    const player = selected.playerSeason;

    if (!statsByPlayerId.has(player.playerId)) {
      statsByPlayerId.set(player.playerId, {
        playerId: player.playerId,
        playerName: player.name,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
      });
    }
  }

  for (const event of matchResult.goalEvents) {
    if (event.teamName !== userTeamName) continue;

    if (event.scorerName) {
      const scorer = selectedPlayers.find(
        (selected) => selected.playerSeason.name === event.scorerName
      );

      if (scorer) {
        const stat = statsByPlayerId.get(scorer.playerSeason.playerId);

        if (stat) {
          stat.goals += 1;
        }
      }
    }

    if (event.assistName) {
      const assistant = selectedPlayers.find(
        (selected) => selected.playerSeason.name === event.assistName
      );

      if (assistant) {
        const stat = statsByPlayerId.get(assistant.playerSeason.playerId);

        if (stat) {
          stat.assists += 1;
        }
      }
    }
  }

  if (matchResult.cleanSheetForUserTeam) {
    for (const selected of selectedPlayers) {
      if (selected.position !== "POR") continue;

      const stat = statsByPlayerId.get(selected.playerSeason.playerId);

      if (stat) {
        stat.cleanSheets += 1;
      }
    }
  }

  return Array.from(statsByPlayerId.values());
}
