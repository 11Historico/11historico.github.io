// src/simulation/leagueSimulator.ts

import type {
  CupFixture,
  CupSimulationState,
  FinalGameSummary,
  LeagueFixture,
  LeagueSimulationState,
  MatchResult,
  RivalTeam,
  SelectedPlayer,
  SelectedCoach,
  TeamRating,
  UserPlayerSeasonStats,
  UserTeamSeasonStats,
  LeagueTableRow,
} from "../types/game";
import type { SeasonLuckWheelState } from "../career/seasonLuckWheel";

import {
  getLaliga2526TeamById,
  getLaliga2526RivalsExcludingAthletic,
  USER_TEAM_ID,
} from "../data/laliga2526Teams";

import {
  getLaliga2526UserTeamFixtures,
  type SourcedLeagueFixture,
} from "../data/laliga2526Calendar";

import {
  applyMatchResultToLeagueState,
  createLeagueSimulationState,
  getPendingFixturesForCurrentMatchday,
  getUserLeagueSummary,
  sortLeagueTable,
  USER_TEAM_NAME,
} from "./leagueTable";

import {
  simulateMatch,
  updateUserPlayerStatsFromMatch,
  type MatchVenue,
} from "./matchEngine";

export interface CreateUserLeagueSimulationParams {
  userTeamName?: string;
  rivals?: RivalTeam[];
  fixtures?: SourcedLeagueFixture[];
}

export interface UserLeagueSimulationContext {
  state: LeagueSimulationState;
  userTeamStats: UserTeamSeasonStats;
  cupState: CupSimulationState;
  leagueSeasonSalt?: number;
  selectedCoach?: SelectedCoach;
  rivals?: RivalTeam[];
  seasonLuckWheel?: SeasonLuckWheelState;
}

export interface SimulateNextUserMatchParams {
  context: UserLeagueSimulationContext;
  teamRating: TeamRating;
  selectedPlayers: SelectedPlayer[];
  userTeamName?: string;
  seed?: number;
}

export interface SimulateFullUserLeagueParams {
  context: UserLeagueSimulationContext;
  teamRating: TeamRating;
  selectedPlayers: SelectedPlayer[];
  userTeamName?: string;
  seed?: number;
}

export interface SimulateCupParams {
  context: UserLeagueSimulationContext;
  teamRating: TeamRating;
  selectedPlayers: SelectedPlayer[];
  userTeamName?: string;
  seed?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Solo se usa como sal de temporada de reserva para contextos guardados sin
// `leagueSeasonSalt`. `seededRandom` NO la suma: debe ser determinista para que
// una partida recargada conserve la forma de los equipos y los resultados.
const SIMULATION_SESSION_SALT = Date.now() + Math.floor(Math.random() * 1000000);

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const CAREER_PROMOTION_CANDIDATES: RivalTeam[] = [
  createCupTeam("real_valladolid", "Real Valladolid", 74, "purple_white_shirt"),
  createCupTeam("cd_leganes", "CD Leganés", 73, "blue_white_shirt"),
  createCupTeam("ud_las_palmas_career", "UD Las Palmas", 74, "yellow_blue_shirt"),
  createCupTeam("granada_cf_career", "Granada CF", 72, "red_white_shirt"),
  createCupTeam("sd_eibar_career", "SD Eibar", 72, "blue_red_shirt"),
  createCupTeam("real_zaragoza_career", "Real Zaragoza", 73, "white_blue_shirt"),
  createCupTeam("racing_santander_career", "Racing de Santander", 72, "green_white_shirt"),
  createCupTeam("deportivo_coruna_career", "Deportivo de La Coruña", 72, "blue_white_shirt"),
  createCupTeam("malaga_cf_career", "Málaga CF", 70, "blue_white_shirt"),
  createCupTeam("sporting_gijon_career", "Sporting de Gijón", 72, "red_white_shirt"),
];

const EXTRA_COPA_TEAMS: RivalTeam[] = [
  createCupTeam("cd_mirandes", "Club Deportivo Mirandés", 72, "red_shirt"),
  createCupTeam("real_zaragoza", "Real Zaragoza", 73, "white_blue_shirt"),
  createCupTeam("sporting_gijon", "Real Sporting de Gijón", 72, "red_white_shirt"),
  createCupTeam("cd_tenerife", "Club Deportivo Tenerife", 71, "white_blue_shirt"),
  createCupTeam("racing_santander", "Real Racing Club de Santander", 72, "green_white_shirt"),
  createCupTeam("deportivo_coruna", "Real Club Deportivo de La Coruña", 72, "blue_white_shirt"),
  createCupTeam("albacete", "Albacete Balompié", 70, "white_shirt"),
  createCupTeam("cd_alcoyano", "Club Deportivo Alcoyano", 65, "blue_white_shirt"),
  createCupTeam("cultural_leonesa", "Cultural y Deportiva Leonesa", 67, "white_shirt"),
  createCupTeam("cadiz_cf", "Cádiz Club de Fútbol", 72, "yellow_blue_shirt"),
  createCupTeam("malaga_cf", "Málaga Club de Fútbol", 70, "blue_white_shirt"),
  createCupTeam("cd_numancia", "Club Deportivo Numancia de Soria", 66, "red_shirt"),
  createCupTeam("ud_almeria", "Unión Deportiva Almería", 73, "red_white_shirt"),
  createCupTeam("ad_alcorcon", "Agrupación Deportiva Alcorcón", 65, "yellow_blue_shirt"),
  createCupTeam("cd_badajoz", "Club Deportivo Badajoz", 64, "black_white_shirt"),
  createCupTeam("cd_castellon", "Club Deportivo Castellón", 67, "white_black_shirt"),
  createCupTeam("sd_eibar", "Sociedad Deportiva Eibar", 72, "blue_red_shirt"),
  createCupTeam("burgos_cf", "Burgos Club de Fútbol", 70, "white_black_shirt"),
  createCupTeam("ud_las_palmas", "Unión Deportiva Las Palmas", 74, "yellow_blue_shirt"),
  createCupTeam("cordoba_cf", "Córdoba Club de Fútbol", 68, "green_white_shirt"),
  createCupTeam("granada_cf", "Granada Club de Fútbol", 72, "red_white_shirt"),
  createCupTeam("sd_huesca", "Sociedad Deportiva Huesca", 70, "blue_red_shirt"),
  createCupTeam("barakaldo_cf", "Barakaldo Club de Fútbol", 62, "yellow_black_shirt"),
  createCupTeam("sestao_river", "Sestao River Club", 62, "green_black_shirt"),
  createCupTeam("club_portugalete", "Club Portugalete", 61, "yellow_black_shirt"),
];

function createCupTeam(
  id: string,
  name: string,
  overall: number,
  shirtIcon: string
): RivalTeam {
  const attack = clamp(overall + seededSignedOffset(id, 1), 55, 88);
  const midfield = clamp(overall + seededSignedOffset(id, 2), 55, 88);
  const defense = clamp(overall + seededSignedOffset(id, 3), 55, 88);
  const goalkeeping = clamp(overall + seededSignedOffset(id, 4), 55, 88);
  const mentality = clamp(overall + seededSignedOffset(id, 5), 55, 90);

  return {
    id,
    name,
    shirtIcon,
    ratings: {
      attack,
      midfield,
      defense,
      goalkeeping,
      mentality,
      overall,
    },
  };
}

function seededSignedOffset(id: string, salt: number): number {
  const seed = id.split("").reduce((sum, char) => sum + char.charCodeAt(0), salt * 19);
  return Math.round(seededRandom(seed) * 6 - 3);
}

function createLeagueSeasonSalt(): number {
  return Date.now() + Math.floor(Math.random() * 1000000);
}

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1000003;
  }

  return hash;
}

function getTeamSeasonForm(team: RivalTeam, seasonSalt: number): number {
  const roll = seededRandom(seasonSalt + hashString(team.id) * 17);
  const overall = team.ratings.overall;

  // Soft fix Villarreal v0.15.4:
  // Villarreal no debe ser inmune, pero con su nivel 25/26 no puede aparecer
  // como candidato frecuente al descenso. Se elimina la cola negativa y se
  // estabiliza su temporada media sin convertirlo en candidato fijo al título.
  if (team.id === "villarreal_cf") {
    // v0.15.8: microestabilidad adicional. En v0.15.7 volvía a 6/100
    // descensos en algunos tests; el objetivo es 0-3/100 sin hacerlo inmune.
    if (roll < 0.12) return 0;
    if (roll < 0.56) return 1;
    if (roll < 0.88) return 2;
    return 3;
  }

  // v0.15.8: Betis no debe compartir riesgo con zona baja. Puede tener
  // temporada mala, pero no bajar ~20/100 como en v0.15.7.
  if (team.id === "real_betis") {
    if (roll < 0.05) return -2;
    if (roll < 0.16) return -1;
    if (roll < 0.46) return 0;
    if (roll < 0.72) return 1;
    if (roll < 0.9) return 2;
    return 3;
  }

  // v0.15.8: Rayo estaba disparado a 41/100 descensos. Se le da
  // resistencia de equipo competitivo de permanencia sin blindarlo.
  if (team.id === "rayo_vallecano") {
    if (roll < 0.07) return -3;
    if (roll < 0.19) return -1;
    if (roll < 0.43) return 0;
    if (roll < 0.66) return 2;
    if (roll < 0.86) return 4;
    return 5;
  }

  // v0.15.7: Osasuna seguía algo alto (33/100). Se mejora
  // la temporada media sin eliminar malas campañas.
  if (team.id === "ca_osasuna") {
    if (roll < 0.04) return -2;
    if (roll < 0.16) return -1;
    if (roll < 0.48) return 0;
    if (roll < 0.74) return 2;
    if (roll < 0.9) return 4;
    return 5;
  }

  // v0.15.6: Sevilla no puede descender con frecuencia de zona baja.
  // Se mantiene una mala temporada ocasional, pero con suelo más realista.
  if (team.id === "sevilla_fc") {
    if (roll < 0.06) return -2;
    if (roll < 0.18) return -1;
    if (roll < 0.52) return 0;
    if (roll < 0.78) return 2;
    if (roll < 0.94) return 4;
    return 5;
  }

  // v0.15.6: Alavés conserva riesgo alto, pero con mejor resistencia
  // para evitar descensos excesivos frente a rivales directos.
  if (team.id === "deportivo_alaves") {
    if (roll < 0.08) return -3;
    if (roll < 0.22) return -1;
    if (roll < 0.48) return 0;
    if (roll < 0.7) return 2;
    if (roll < 0.9) return 4;
    return 5;
  }

  // v0.15.7: Oviedo debe seguir siendo candidato muy claro al descenso,
  // pero el objetivo es bajar la condena desde ~73/100 a una zona 55-65/100.
  if (team.id === "real_oviedo") {
    if (roll < 0.06) return -3;
    if (roll < 0.17) return -1;
    if (roll < 0.4) return 0;
    if (roll < 0.64) return 2;
    if (roll < 0.84) return 4;
    if (roll < 0.95) return 5;
    return 6;
  }

  // v0.15.7: Elche seguía demasiado alto en descensos. Mantiene
  // riesgo, pero con algo más de resistencia de temporada.
  if (team.id === "elche_cf") {
    if (roll < 0.08) return -4;
    if (roll < 0.22) return -2;
    if (roll < 0.44) return -1;
    if (roll < 0.62) return 0;
    if (roll < 0.8) return 2;
    if (roll < 0.94) return 4;
    return 5;
  }

  // v0.15.7: microayuda para Girona/Getafe. No se blindan,
  // solo se reduce un poco la cola negativa.
  if (team.id === "girona_fc" || team.id === "getafe_cf") {
    if (roll < 0.08) return -4;
    if (roll < 0.22) return -2;
    if (roll < 0.42) return -1;
    if (roll < 0.6) return 0;
    if (roll < 0.78) return 2;
    if (roll < 0.93) return 4;
    return 5;
  }

  // Elite: pueden tener anos mejores o peores, pero no deben hundirse.
  if (overall >= 86) {
    if (roll < 0.12) return -2;
    if (roll < 0.34) return -1;
    if (roll < 0.72) return 0;
    if (roll < 0.92) return 1;
    return 2;
  }

  // Zona europea / media-alta. Ej: Villarreal, Betis, Real Sociedad, Sevilla.
  // Se permite mala temporada, pero no una caida sistematica a descenso.
  if (overall >= 81) {
    if (roll < 0.08) return -3;
    if (roll < 0.25) return -2;
    if (roll < 0.48) return -1;
    if (roll < 0.72) return 0;
    if (roll < 0.9) return 2;
    return 3;
  }

  // Media. Puede sufrir o acercarse a Europa segun el ano.
  if (overall >= 78) {
    if (roll < 0.1) return -4;
    if (roll < 0.25) return -2;
    if (roll < 0.45) return -1;
    if (roll < 0.62) return 0;
    if (roll < 0.8) return 2;
    if (roll < 0.94) return 4;
    return 5;
  }

  // Zona baja-media. Aqui si debe haber mas movimiento.
  if (overall >= 76) {
    if (roll < 0.1) return -5;
    if (roll < 0.24) return -3;
    if (roll < 0.42) return -1;
    if (roll < 0.58) return 0;
    if (roll < 0.76) return 2;
    if (roll < 0.91) return 4;
    return 6;
  }

  // Zona baja. Alta elasticidad para evitar descensos clavados.
  if (roll < 0.1) return -6;
  if (roll < 0.22) return -4;
  if (roll < 0.38) return -2;
  if (roll < 0.55) return 0;
  if (roll < 0.73) return 3;
  if (roll < 0.9) return 5;
  return 7;
}

function applyRatingDelta(value: number, delta: number): number {
  return clamp(Math.round(value + delta), 45, 99);
}

function applySeasonFormToRival(team: RivalTeam, seasonSalt: number): RivalTeam {
  const form = getTeamSeasonForm(team, seasonSalt);

  if (form === 0) return team;

  return {
    ...team,
    ratings: {
      attack: applyRatingDelta(team.ratings.attack, form * 0.9),
      midfield: applyRatingDelta(team.ratings.midfield, form),
      defense: applyRatingDelta(team.ratings.defense, form),
      goalkeeping: applyRatingDelta(team.ratings.goalkeeping, form * 0.65),
      mentality: applyRatingDelta(team.ratings.mentality, form * 0.8),
      overall: applyRatingDelta(team.ratings.overall, form),
    },
  };
}

function getMatchNoise(seed: number, amplitude = 0.16): number {
  return (seededRandom(seed) - 0.5) * amplitude;
}
function getAllCupTeams(): RivalTeam[] {
  const laligaTeams = getLaliga2526RivalsExcludingAthletic();

  const extraById = new Map(EXTRA_COPA_TEAMS.map((team) => [team.id, team]));

  // Real Oviedo y Elche ya están en Primera en esta simulación; no los duplicamos.
  // El listado adicional del usuario se integra con equipos modestos/históricos.
  return [...laligaTeams, ...extraById.values()];
}


export function getCupRivalDisplayName(teamId: string): string {
  return getCupTeamById(teamId)?.name ?? teamId.replace(/_/g, " ");
}

function getCupTeamById(teamId: string): RivalTeam | undefined {
  return getLaliga2526TeamById(teamId) ?? EXTRA_COPA_TEAMS.find((team) => team.id === teamId);
}

function pickCupRival(params: {
  pool: RivalTeam[];
  minOverall: number;
  maxOverall: number;
  usedTeamIds: Set<string>;
  seed: number;
}): RivalTeam {
  const { pool, minOverall, maxOverall, usedTeamIds, seed } = params;

  const candidates = pool.filter(
    (team) =>
      !usedTeamIds.has(team.id) &&
      team.ratings.overall >= minOverall &&
      team.ratings.overall <= maxOverall
  );

  const fallbackCandidates = pool.filter((team) => !usedTeamIds.has(team.id));
  const source = candidates.length > 0 ? candidates : fallbackCandidates;

  const index = Math.floor(seededRandom(seed) * source.length);
  const selected = source[index] ?? source[0];

  usedTeamIds.add(selected.id);

  return selected;
}

function createCupPathSeed(): number {
  return Math.floor(Date.now() % 100000) + Math.floor(Math.random() * 100000);
}

function getCupVenue(params: {
  rival: RivalTeam;
  roundId: CupFixture["roundId"];
  seed: number;
}): CupFixture["venue"] {
  const { rival, roundId, seed } = params;

  if (roundId === "final") return "away";

  const rivalOverall = rival.ratings.overall;
  const roll = seededRandom(seed);

  // En Copa, si el rival es modesto, aumenta la probabilidad de jugar fuera.
  // Esto genera más eliminatorias trampa y más opciones de sorpresa.
  if (rivalOverall <= 66) return roll < 0.78 ? "away" : "home";
  if (rivalOverall <= 72) return roll < 0.66 ? "away" : "home";
  if (rivalOverall <= 78) return roll < 0.56 ? "away" : "home";

  return roll < 0.5 ? "away" : "home";
}

function createRealisticCupPath(seed = createCupPathSeed()): CupFixture[] {
  const pool = getAllCupTeams();
  const usedTeamIds = new Set<string>();

  const roundOf32 = pickCupRival({
    pool,
    minOverall: 60,
    maxOverall: 73,
    usedTeamIds,
    seed: seed + 32,
  });

  const roundOf16 = pickCupRival({
    pool,
    minOverall: 64,
    maxOverall: 80,
    usedTeamIds,
    seed: seed + 116,
  });

  const quarterFinal = pickCupRival({
    pool,
    minOverall: 68,
    maxOverall: 86,
    usedTeamIds,
    seed: seed + 208,
  });

  const semiFinal = pickCupRival({
    pool,
    minOverall: 72,
    maxOverall: 90,
    usedTeamIds,
    seed: seed + 304,
  });

  const final = pickCupRival({
    pool,
    minOverall: 74,
    maxOverall: 92,
    usedTeamIds,
    seed: seed + 402,
  });

  return [
    {
      id: `copa_round_of_32_${roundOf32.id}_${seed}`,
      roundId: "round_of_32",
      roundName: "Dieciseisavos",
      order: 1,
      gateMatchday: 18,
      rivalTeamId: roundOf32.id,
      venue: getCupVenue({ rival: roundOf32, roundId: "round_of_32", seed: seed + 321 }),
      played: false,
    },
    {
      id: `copa_round_of_16_${roundOf16.id}_${seed}`,
      roundId: "round_of_16",
      roundName: "Octavos",
      order: 2,
      gateMatchday: 22,
      rivalTeamId: roundOf16.id,
      venue: getCupVenue({ rival: roundOf16, roundId: "round_of_16", seed: seed + 1616 }),
      played: false,
    },
    {
      id: `copa_quarter_final_${quarterFinal.id}_${seed}`,
      roundId: "quarter_final",
      roundName: "Cuartos",
      order: 3,
      gateMatchday: 26,
      rivalTeamId: quarterFinal.id,
      venue: getCupVenue({ rival: quarterFinal, roundId: "quarter_final", seed: seed + 808 }),
      played: false,
    },
    {
      id: `copa_semi_final_${semiFinal.id}_${seed}`,
      roundId: "semi_final",
      roundName: "Semifinal",
      order: 4,
      gateMatchday: 31,
      rivalTeamId: semiFinal.id,
      venue: getCupVenue({ rival: semiFinal, roundId: "semi_final", seed: seed + 404 }),
      played: false,
    },
    {
      id: `copa_final_${final.id}_${seed}`,
      roundId: "final",
      roundName: "Final",
      order: 5,
      gateMatchday: 35,
      rivalTeamId: final.id,
      venue: "away",
      played: false,
    },
  ];
}


export function createInitialUserTeamStats(
  selectedPlayers: SelectedPlayer[] = []
): UserTeamSeasonStats {
  const initialPlayerStats: UserPlayerSeasonStats[] = selectedPlayers.map((selected) => ({
    playerId: selected.playerSeason.playerId,
    playerName: selected.playerSeason.name,
    goals: 0,
    assists: 0,
    cleanSheets: 0,
  }));

  return {
    goalsFor: 0,
    goalsAgainst: 0,
    cleanSheets: 0,
    topScorers: initialPlayerStats,
    topAssisters: initialPlayerStats,
  };
}

function createSyntheticFullLeagueCalendar(params: {
  userFixtures: SourcedLeagueFixture[];
  rivals: RivalTeam[];
}): SourcedLeagueFixture[] {
  const { userFixtures, rivals } = params;
  const rivalIds = rivals.map((rival) => rival.id).filter((id) => id !== USER_TEAM_ID);

  const fullFixtures: SourcedLeagueFixture[] = [];

  for (const userFixture of userFixtures) {
    fullFixtures.push(userFixture);

    const alreadyPlaying = new Set([userFixture.homeTeamId, userFixture.awayTeamId]);
    const available = rivalIds.filter((teamId) => !alreadyPlaying.has(teamId));

    const rotation = userFixture.matchday % available.length;
    const rotated = [...available.slice(rotation), ...available.slice(0, rotation)];

    for (let i = 0; i < rotated.length; i += 2) {
      const first = rotated[i];
      const second = rotated[i + 1];

      if (!first || !second) continue;

      const flipHome = (userFixture.matchday + i) % 2 === 0;
      const homeTeamId = flipHome ? first : second;
      const awayTeamId = flipHome ? second : first;

      fullFixtures.push({
        id: `md${String(userFixture.matchday).padStart(2, "0")}_${homeTeamId}_vs_${awayTeamId}`,
        matchday: userFixture.matchday,
        date: userFixture.date,
        homeTeamId,
        awayTeamId,
        includesUserTeam: false,
        sourceRefs: ["synthetic-balanced-full-laliga-calendar"],
      });
    }
  }

  return fullFixtures.sort((a, b) => {
    if (a.matchday !== b.matchday) return a.matchday - b.matchday;
    if (a.includesUserTeam !== b.includesUserTeam) return a.includesUserTeam ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
}

function createInitialCupState(): CupSimulationState {
  return {
    status: "active",
    currentRoundIndex: 0,
    fixtures: createRealisticCupPath(),
    results: [],
    simulatedRemainingResults: [],
  };
}

function createCareerUserTeamFixtures(rivals: RivalTeam[]): SourcedLeagueFixture[] {
  const cleanRivals = dedupeRivalTeams(rivals).slice(0, 19);
  const baseFixtures = getLaliga2526UserTeamFixtures();

  return baseFixtures.map((baseFixture, index) => {
    const rival = cleanRivals[index % cleanRivals.length];

    if (!rival) return baseFixture;

    const userIsHome = baseFixture.homeTeamId === USER_TEAM_ID;
    const homeTeamId = userIsHome ? USER_TEAM_ID : rival.id;
    const awayTeamId = userIsHome ? rival.id : USER_TEAM_ID;

    return {
      ...baseFixture,
      id: `md${String(baseFixture.matchday).padStart(2, "0")}_${homeTeamId}_vs_${awayTeamId}`,
      homeTeamId,
      awayTeamId,
      includesUserTeam: true,
      sourceRefs: ["career-dynamic-league-calendar"],
    };
  });
}



export function getInitialCareerLeagueRivals(): RivalTeam[] {
  return getLaliga2526RivalsExcludingAthletic();
}

export function getInitialCareerSecondDivisionPool(): RivalTeam[] {
  return [...CAREER_PROMOTION_CANDIDATES];
}

function dedupeRivalTeams(teams: RivalTeam[]): RivalTeam[] {
  const usedIds = new Set<string>();
  const uniqueTeams: RivalTeam[] = [];

  for (const team of teams) {
    if (team.id === USER_TEAM_ID || usedIds.has(team.id)) continue;
    uniqueTeams.push(team);
    usedIds.add(team.id);
  }

  return uniqueTeams;
}

function rotateTeams(teams: RivalTeam[], rotation: number): RivalTeam[] {
  if (teams.length === 0) return [];
  const safeRotation = rotation % teams.length;
  return [...teams.slice(safeRotation), ...teams.slice(0, safeRotation)];
}

function getCareerRivalById(teamId: string, currentRivals: RivalTeam[], secondDivisionPool: RivalTeam[]): RivalTeam | undefined {
  return (
    currentRivals.find((team) => team.id === teamId) ??
    secondDivisionPool.find((team) => team.id === teamId) ??
    getLaliga2526TeamById(teamId) ??
    CAREER_PROMOTION_CANDIDATES.find((team) => team.id === teamId)
  );
}

export function createNextCareerLeagueTransition(params: {
  previousTable: LeagueTableRow[];
  currentRivals: RivalTeam[];
  secondDivisionPool: RivalTeam[];
  completedSeasons: number;
}): {
  nextRivals: RivalTeam[];
  nextSecondDivisionPool: RivalTeam[];
  promoted: RivalTeam[];
  relegated: RivalTeam[];
} {
  const { previousTable, currentRivals, secondDivisionPool, completedSeasons } = params;
  const sortedTable = [...previousTable].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });

  const relegatedRows = sortedTable
    .filter((row) => row.teamId !== USER_TEAM_ID)
    .slice(-3);

  const baseSecondDivisionPool = secondDivisionPool.length > 0
    ? secondDivisionPool
    : getInitialCareerSecondDivisionPool();
  const relegated = relegatedRows
    .map((row) => getCareerRivalById(row.teamId, currentRivals, baseSecondDivisionPool))
    .filter((team): team is RivalTeam => Boolean(team));
  const relegatedIds = new Set(relegated.map((team) => team.id));
  const survivingRivals = currentRivals.filter((team) => !relegatedIds.has(team.id));
  const firstDivisionIds = new Set(survivingRivals.map((team) => team.id));

  const promotionPool = rotateTeams(
    dedupeRivalTeams([...baseSecondDivisionPool, ...CAREER_PROMOTION_CANDIDATES]),
    completedSeasons,
  );
  const promoted: RivalTeam[] = [];

  for (const candidate of promotionPool) {
    if (promoted.length >= 3) break;
    if (firstDivisionIds.has(candidate.id) || relegatedIds.has(candidate.id)) continue;
    promoted.push(candidate);
    firstDivisionIds.add(candidate.id);
  }

  const fallbackTeams = sortedTable
    .map((row) => getCareerRivalById(row.teamId, currentRivals, baseSecondDivisionPool))
    .filter((team): team is RivalTeam => Boolean(team))
    .filter((team) => !firstDivisionIds.has(team.id) && !relegatedIds.has(team.id));

  for (const fallback of fallbackTeams) {
    if (promoted.length >= 3) break;
    promoted.push(fallback);
    firstDivisionIds.add(fallback.id);
  }

  const promotedIds = new Set(promoted.map((team) => team.id));
  const nextSecondDivisionPool = dedupeRivalTeams([
    ...baseSecondDivisionPool.filter((team) => !promotedIds.has(team.id)),
    ...relegated,
  ]);

  return {
    nextRivals: [...survivingRivals, ...promoted].slice(0, 19),
    nextSecondDivisionPool,
    promoted,
    relegated,
  };
}

export function createNextCareerLeagueRivals(params: {
  previousTable: LeagueTableRow[];
  currentRivals: RivalTeam[];
  completedSeasons: number;
}): RivalTeam[] {
  return createNextCareerLeagueTransition({
    ...params,
    secondDivisionPool: getInitialCareerSecondDivisionPool(),
  }).nextRivals;
}

export function createUserLeagueSimulation(
  params: CreateUserLeagueSimulationParams = {}
): UserLeagueSimulationContext {
  const {
    userTeamName = USER_TEAM_NAME,
    rivals = getLaliga2526RivalsExcludingAthletic(),
  } = params;
  const fixtures = params.fixtures ?? (params.rivals
    ? createCareerUserTeamFixtures(rivals)
    : getLaliga2526UserTeamFixtures());

  const leagueSeasonSalt = createLeagueSeasonSalt();

  const fullCalendar = createSyntheticFullLeagueCalendar({
    userFixtures: fixtures,
    rivals,
  });

  const state = createLeagueSimulationState({
    fixtures: fullCalendar,
    rivals,
    userTeamName,
  });

  return {
    state,
    userTeamStats: createInitialUserTeamStats(),
    cupState: createInitialCupState(),
    leagueSeasonSalt,
    rivals,
  };
}

function getSimulationRivalById(teamId: string, rivals: RivalTeam[] = []): RivalTeam | undefined {
  return (
    rivals.find((team) => team.id === teamId) ??
    getLaliga2526TeamById(teamId) ??
    CAREER_PROMOTION_CANDIDATES.find((team) => team.id === teamId)
  );
}

function getRivalFromFixture(fixture: LeagueFixture, rivals: RivalTeam[] = []): {
  rival: RivalTeam;
  venue: MatchVenue;
} {
  const userIsHome = fixture.homeTeamId === USER_TEAM_ID;
  const userIsAway = fixture.awayTeamId === USER_TEAM_ID;

  if (!userIsHome && !userIsAway) {
    throw new Error(
      `El fixture ${fixture.id} no incluye al equipo del usuario (${USER_TEAM_ID}).`
    );
  }

  const rivalTeamId = userIsHome ? fixture.awayTeamId : fixture.homeTeamId;
  const rival = getSimulationRivalById(rivalTeamId, rivals);

  if (!rival) {
    throw new Error(`No se encontró el rival con id: ${rivalTeamId}`);
  }

  return {
    rival,
    venue: userIsHome ? "home" : "away",
  };
}


function getAverageRivalRating(team: RivalTeam): number {
  const baseRating = (
    team.ratings.attack * 0.24 +
    team.ratings.midfield * 0.22 +
    team.ratings.defense * 0.22 +
    team.ratings.goalkeeping * 0.16 +
    team.ratings.mentality * 0.16
  );

  // v0.15.4: corrección de realismo. El calendario sintético y la varianza
  // estaban castigando demasiado al Villarreal en simulaciones largas.
  if (team.id === "villarreal_cf") return baseRating + 2.4;

  // v0.15.6-v0.15.7: apoyos estructurales de zona baja/media tras auditoría 100 sims.
  if (team.id === "ca_osasuna") return baseRating + 3.7;
  if (team.id === "deportivo_alaves") return baseRating + 2.0;
  if (team.id === "sevilla_fc") return baseRating + 2.4;
  if (team.id === "real_oviedo") return baseRating + 2.4;
  if (team.id === "elche_cf") return baseRating + 1.2;
  if (team.id === "girona_fc") return baseRating + 0.7;
  if (team.id === "getafe_cf") return baseRating + 0.7;

  return baseRating;
}

function sampleGoals(expectedGoals: number, seedBase: number): number {
  const roll = seededRandom(seedBase);
  const variance = seededRandom(seedBase + 9) - 0.5;
  const raw = expectedGoals + variance * 0.85;

  if (roll < 0.16) return Math.max(0, Math.floor(raw - 0.55));
  if (roll > 0.91) return clamp(Math.round(raw + 1), 0, 5);

  return clamp(Math.round(raw), 0, 5);
}

function simulateRivalVsRivalMatch(params: {
  fixture: LeagueFixture;
  seedOffset: number;
  seasonSalt?: number;
  rivals?: RivalTeam[];
}): MatchResult {
  const { fixture, seedOffset, seasonSalt = SIMULATION_SESSION_SALT, rivals = [] } = params;

  const home = getSimulationRivalById(fixture.homeTeamId, rivals);
  const away = getSimulationRivalById(fixture.awayTeamId, rivals);

  if (!home || !away) {
    throw new Error(`No se pudo simular el partido: ${fixture.homeTeamId} vs ${fixture.awayTeamId}`);
  }

  const homeAverage = getAverageRivalRating(home) + getTeamSeasonForm(home, seasonSalt);
  const awayAverage = getAverageRivalRating(away) + getTeamSeasonForm(away, seasonSalt);
  const homeDiff = homeAverage - awayAverage;
  const awayDiff = awayAverage - homeAverage;

  const homeExpected = clamp(1.15 + homeDiff / 38 + 0.16, 0.25, 3.1);
  const awayExpected = clamp(1.05 + awayDiff / 38 - 0.14, 0.2, 2.9);

  // Cada partido reserva un bloque de 211 semillas (offsets usados: 0, 5, 9, 13,
  // 17, 26 y 31) para que ninguna tirada se reutilice ni se solape con otro
  // partido de la misma jornada.
  const matchSeed = fixture.matchday * 1009 + seedOffset * 211 + Math.floor(seasonSalt % 100000);
  const homeExpectedWithNoise = clamp(homeExpected + getMatchNoise(matchSeed + 5), 0.2, 3.25);
  const awayExpectedWithNoise = clamp(awayExpected + getMatchNoise(matchSeed + 13), 0.18, 3.05);

  let homeGoals = sampleGoals(homeExpectedWithNoise, matchSeed);
  let awayGoals = sampleGoals(awayExpectedWithNoise, matchSeed + 17);

  if (Math.abs(homeGoals - awayGoals) >= 4) {
    const normalizeRoll = seededRandom(matchSeed + 31);
    if (normalizeRoll < 0.55) {
      if (homeGoals > awayGoals) homeGoals -= 1;
      else awayGoals -= 1;
    }
  }

  return {
    fixtureId: fixture.id,
    matchday: fixture.matchday,
    competition: "league",
    homeTeamName: home.name,
    awayTeamName: away.name,
    homeGoals,
    awayGoals,
    goalEvents: [],
    userTeamPlayed: false,
  };
}

function applyResultsToState(params: {
  state: LeagueSimulationState;
  results: MatchResult[];
  userTeamName: string;
}): LeagueSimulationState {
  const { results, userTeamName } = params;

  return results.reduce(
    (currentState, result) =>
      applyMatchResultToLeagueState({
        state: currentState,
        result,
        userTeamName,
      }),
    params.state
  );
}

function updateUserTeamStats(params: {
  currentStats: UserTeamSeasonStats;
  result: MatchResult;
  selectedPlayers: SelectedPlayer[];
  userTeamName: string;
}): UserTeamSeasonStats {
  const { currentStats, result, selectedPlayers, userTeamName } = params;

  const userIsHome = result.homeTeamName === userTeamName;
  const userGoals = userIsHome ? result.homeGoals : result.awayGoals;
  const rivalGoals = userIsHome ? result.awayGoals : result.homeGoals;

  const updatedPlayerStats = updateUserPlayerStatsFromMatch({
    currentStats: currentStats.topScorers,
    matchResult: result,
    selectedPlayers,
    userTeamName,
  });

  const sortedTopScorers = [...updatedPlayerStats].sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (b.assists !== a.assists) return b.assists - a.assists;
    return a.playerName.localeCompare(b.playerName);
  });

  const sortedTopAssisters = [...updatedPlayerStats].sort((a, b) => {
    if (b.assists !== a.assists) return b.assists - a.assists;
    if (b.goals !== a.goals) return b.goals - a.goals;
    return a.playerName.localeCompare(b.playerName);
  });

  return {
    goalsFor: currentStats.goalsFor + userGoals,
    goalsAgainst: currentStats.goalsAgainst + rivalGoals,
    cleanSheets: currentStats.cleanSheets + (rivalGoals === 0 ? 1 : 0),
    topScorers: sortedTopScorers,
    topAssisters: sortedTopAssisters,
  };
}


export function getPendingCupFixture(
  context: UserLeagueSimulationContext
): CupFixture | undefined {
  if (context.cupState.status !== "active") return undefined;

  const currentFixture = context.cupState.fixtures[context.cupState.currentRoundIndex];

  if (!currentFixture || currentFixture.played) return undefined;

  const userRow = context.state.table.find((row) => row.teamId === USER_TEAM_ID);
  const playedLeagueMatches = userRow?.played ?? 0;

  if (playedLeagueMatches >= currentFixture.gateMatchday) {
    return currentFixture;
  }

  return undefined;
}


export function canFinishSeason(context: UserLeagueSimulationContext): boolean {
  return context.state.completed && context.cupState.status !== "active";
}


export function getCupStatusLabel(cupState: CupSimulationState): string {
  if (cupState.status === "won") return "Campeón de Copa";
  if (cupState.status === "eliminated") {
    const lastResult = cupState.results[cupState.results.length - 1];
    const eliminatedLabel = lastResult?.roundName ? `Eliminado en ${lastResult.roundName}` : "Eliminado en Copa";
    return cupState.championTeamName
      ? `${eliminatedLabel} · Campeón: ${cupState.championTeamName}`
      : eliminatedLabel;
  }

  const nextFixture = cupState.fixtures[cupState.currentRoundIndex];
  return nextFixture ? `Pendiente: ${nextFixture.roundName}` : "Copa pendiente";
}


export function simulateNextUserLeagueMatch(
  params: SimulateNextUserMatchParams
): {
  context: UserLeagueSimulationContext;
  result?: MatchResult;
  stoppedForCup?: boolean;
} {
  const {
    context,
    teamRating,
    selectedPlayers,
    userTeamName = USER_TEAM_NAME,
    seed,
  } = params;

  if (context.state.completed) {
    return { context };
  }

  if (getPendingCupFixture(context)) {
    return { context, stoppedForCup: true };
  }

  const pendingFixtures = getPendingFixturesForCurrentMatchday(context.state);

  if (pendingFixtures.length === 0) {
    return {
      context: {
        ...context,
        state: {
          ...context.state,
          completed: true,
        },
      },
    };
  }

  const userFixture = pendingFixtures.find((fixture) => fixture.includesUserTeam);
  const otherFixtures = pendingFixtures.filter((fixture) => !fixture.includesUserTeam);

  if (!userFixture) {
    throw new Error(`No se encontró partido del Athletic Club Histórico en la jornada ${context.state.currentMatchday}.`);
  }

  const { rival, venue } = getRivalFromFixture(userFixture, context.rivals);
  const leagueSeasonSalt = context.leagueSeasonSalt ?? SIMULATION_SESSION_SALT;
  const formAdjustedRival = applySeasonFormToRival(rival, leagueSeasonSalt);

  const userResult = simulateMatch({
    fixtureId: userFixture.id,
    matchday: userFixture.matchday,
    userTeamName,
    rival: formAdjustedRival,
    venue,
    teamRating,
    selectedPlayers,
    seed: typeof seed === "number" ? seed + context.state.results.length : undefined,
  });

  const leagueUserResult: MatchResult = {
    ...userResult,
    competition: "league",
  };

  const otherResults = otherFixtures.map((fixture, index) =>
    simulateRivalVsRivalMatch({
      fixture,
      seedOffset: context.state.results.length + index + 1,
      seasonSalt: leagueSeasonSalt,
      rivals: context.rivals,
    })
  );

  const nextState = applyResultsToState({
    state: context.state,
    results: [leagueUserResult, ...otherResults],
    userTeamName,
  });

  const nextUserTeamStats = updateUserTeamStats({
    currentStats: context.userTeamStats,
    result: leagueUserResult,
    selectedPlayers,
    userTeamName,
  });

  return {
    context: {
      ...context,
      state: nextState,
      userTeamStats: nextUserTeamStats,
    },
    result: leagueUserResult,
  };
}


export function simulateFullUserLeague(
  params: SimulateFullUserLeagueParams
): UserLeagueSimulationContext {
  const {
    teamRating,
    selectedPlayers,
    userTeamName = USER_TEAM_NAME,
    seed,
  } = params;

  let context = params.context;

  while (!context.state.completed) {
    if (getPendingCupFixture(context)) {
      break;
    }

    const simulation = simulateNextUserLeagueMatch({
      context,
      teamRating,
      selectedPlayers,
      userTeamName,
      seed,
    });

    context = simulation.context;

    if (!simulation.result || simulation.stoppedForCup) {
      break;
    }
  }

  return context;
}

function getCoachCompetitionBoost(
  context: Pick<UserLeagueSimulationContext, "selectedCoach">,
  competition: "league" | "cup" | "europe"
): number {
  const coach = context.selectedCoach?.coachSeason;

  if (!coach?.skills) return 0;

  const competitionSkill =
    competition === "cup"
      ? coach.skills.cup
      : competition === "europe"
        ? coach.skills.europe
        : coach.skills.management;

  // v0.18.3 — bonus específico de competición limitado:
  // solo +1 si el entrenador es realmente fuerte en esa competición.
  return typeof competitionSkill === "number" && competitionSkill >= 86 ? 1 : 0;
}

function applyCoachCompetitionBoostToTeamRating(
  teamRating: TeamRating,
  boost: number
): TeamRating {
  if (boost === 0) return teamRating;

  return {
    ...teamRating,
    attack: clamp(teamRating.attack + boost, 40, 99),
    defense: clamp(teamRating.defense + boost, 40, 99),
    control: clamp(teamRating.control + boost, 40, 99),
    physical: clamp(teamRating.physical + boost, 40, 99),
    mentality: clamp(teamRating.mentality + boost, 40, 99),
    goalkeeping: clamp(teamRating.goalkeeping + boost, 40, 99),
    overall: clamp(teamRating.overall + boost, 40, 99),
  };
}
function getCupRoundChaos(roundId: CupFixture["roundId"]): number {
  // v0.16.0 Copa realista: más volatilidad en las primeras rondas y
  // eliminatorias fuertes algo menos deterministas, sin tocar la Liga.
  if (roundId === "round_of_32") return 0.66;
  if (roundId === "round_of_16") return 0.54;
  if (roundId === "quarter_final") return 0.39;
  if (roundId === "semi_final") return 0.26;
  return 0.15;
}

function getCupUnderdogBoost(params: {
  underdogAverage: number;
  favoriteAverage: number;
  underdogIsHome: boolean;
  roundId: CupFixture["roundId"];
}): number {
  const { underdogAverage, favoriteAverage, underdogIsHome, roundId } = params;
  const ratingGap = favoriteAverage - underdogAverage;

  if (ratingGap < 4) return underdogIsHome ? 1 : 0;

  const roundChaos = getCupRoundChaos(roundId);
  // v0.16.0: el equipo pequeño en casa debe sentirse peligroso, sobre todo
  // en dieciseisavos/octavos. La subida es limitada para no convertir la Copa
  // en una lotería absurda.
  const baseBoost = ratingGap * roundChaos * 0.15;
  const homeBoost = underdogIsHome ? 2.7 : 0.55;

  return clamp(Math.round(baseBoost + homeBoost), 0, 9);
}

function applyCupRivalContext(params: {
  rival: RivalTeam;
  userRating: TeamRating;
  venue: MatchVenue;
  roundId: CupFixture["roundId"];
}): { rival: RivalTeam; userRating: TeamRating } {
  const { rival, userRating, venue, roundId } = params;
  const rivalAverage = getAverageRivalRating(rival);
  const userAverage = userRating.overall;

  if (rivalAverage >= userAverage) {
    const userHomeUnderdogBoost = venue === "home"
      ? getCupUnderdogBoost({
          underdogAverage: userAverage,
          favoriteAverage: rivalAverage,
          underdogIsHome: true,
          roundId,
        })
      : 0;

    return {
      rival,
      userRating: {
        ...userRating,
        attack: clamp(userRating.attack + Math.round(userHomeUnderdogBoost * 0.35), 40, 99),
        defense: clamp(userRating.defense + Math.round(userHomeUnderdogBoost * 0.35), 40, 99),
        control: clamp(userRating.control + Math.round(userHomeUnderdogBoost * 0.25), 40, 99),
        mentality: clamp(userRating.mentality + userHomeUnderdogBoost, 40, 99),
        overall: clamp(userRating.overall + Math.round(userHomeUnderdogBoost * 0.25), 40, 99),
      },
    };
  }

  const rivalIsHome = venue === "away";
  const underdogBoost = getCupUnderdogBoost({
    underdogAverage: rivalAverage,
    favoriteAverage: userAverage,
    underdogIsHome: rivalIsHome,
    roundId,
  });

  const favoriteAwayPressure = rivalIsHome && underdogBoost >= 3 ? 1 : 0;

  const boostedRival: RivalTeam = {
    ...rival,
    ratings: {
      ...rival.ratings,
      attack: clamp(rival.ratings.attack + underdogBoost, 40, 99),
      midfield: clamp(rival.ratings.midfield + Math.round(underdogBoost * 0.75), 40, 99),
      defense: clamp(rival.ratings.defense + Math.round(underdogBoost * 0.75), 40, 99),
      goalkeeping: clamp(rival.ratings.goalkeeping + Math.round(underdogBoost * 0.45), 40, 99),
      mentality: clamp(rival.ratings.mentality + underdogBoost + (rivalIsHome ? 1 : 0), 40, 99),
      overall: clamp(rival.ratings.overall + Math.round(underdogBoost * 0.6), 40, 99),
    },
  };

  return {
    rival: boostedRival,
    userRating: {
      ...userRating,
      attack: clamp(userRating.attack - favoriteAwayPressure, 40, 99),
      defense: clamp(userRating.defense - favoriteAwayPressure, 40, 99),
      control: clamp(userRating.control - favoriteAwayPressure, 40, 99),
      mentality: clamp(userRating.mentality + 1, 40, 99),
      overall: clamp(userRating.overall - favoriteAwayPressure, 40, 99),
    },
  };
}

function applyCupEliteBalance(params: {
  expected: number;
  teamAverage: number;
  opponentAverage: number;
  roundId: CupFixture["roundId"];
  isHome: boolean;
}): number {
  const { expected, teamAverage, opponentAverage, roundId, isHome } = params;
  const ratingDiff = teamAverage - opponentAverage;

  let balancedExpected = expected;

  // En Copa, la elite no debe convertir semifinal/final en tramite.
  // No es un nerf por nombre: afecta a cualquier equipo de nivel elite.
  const teamIsEliteFavorite = teamAverage >= 89 && opponentAverage >= 80 && ratingDiff >= 4;

  if (teamIsEliteFavorite) {
    if (roundId === "final") {
      balancedExpected -= 0.22;
    } else if (roundId === "semi_final") {
      balancedExpected -= 0.17;
    } else if (roundId === "quarter_final") {
      balancedExpected -= 0.11;
    } else if (roundId === "round_of_16") {
      balancedExpected -= 0.06;
    }
  }

  // Equipos fuertes no elite deben poder competir mejor contra la elite a partido unico.
  const teamIsStrongUnderdog = teamAverage >= 80 && opponentAverage >= 89 && ratingDiff <= -4;

  if (teamIsStrongUnderdog) {
    if (roundId === "final") {
      balancedExpected += 0.24;
    } else if (roundId === "semi_final") {
      balancedExpected += 0.18;
    } else if (roundId === "quarter_final") {
      balancedExpected += 0.12;
    }
  }

  // En final neutral simplificada, evitamos que el equipo marcado como visitante
  // quede penalizado de mas por la estructura home/away artificial.
  if (roundId === "final" && !isHome) {
    balancedExpected += 0.06;
  }

  return balancedExpected;
}
function getCupTeamExpectedGoals(params: {
  team: RivalTeam;
  opponent: RivalTeam;
  isHome: boolean;
  roundId: CupFixture["roundId"];
  seed: number;
}): number {
  const { team, opponent, isHome, roundId, seed } = params;
  const teamAverage = getAverageRivalRating(team);
  const opponentAverage = getAverageRivalRating(opponent);
  const ratingDiff = teamAverage - opponentAverage;
  const teamIsUnderdog = teamAverage + 3 < opponentAverage;
  const teamIsFavorite = teamAverage > opponentAverage + 3;
  const roundChaos = getCupRoundChaos(roundId);
  const chaosRoll = seededRandom(seed + 53);

  let expected = 1.02 + ratingDiff / 48 + (isHome ? 0.16 : -0.05);

  if (teamIsUnderdog) {
    expected += roundChaos * 0.28;
    if (isHome) expected += 0.28 + roundChaos * 0.22;
    if (chaosRoll > 0.82 - roundChaos * 0.22) expected += 0.42;
  }

  if (teamIsFavorite && !isHome) {
    expected -= roundChaos * 0.13;
  }

  const balancedExpected = applyCupEliteBalance({
    expected,
    teamAverage,
    opponentAverage,
    roundId,
    isHome,
  });

  return clamp(balancedExpected, 0.22, 3.15);
}

function getCupUnderdogRoundFatigue(roundId: CupFixture["roundId"]): number {
  if (roundId === "quarter_final") return 1;
  if (roundId === "semi_final") return 2;
  if (roundId === "final") return 3;
  return 0;
}

function adjustCupRivalByVenueAndRound(params: {
  rival: RivalTeam;
  venue: MatchVenue;
  roundId: CupFixture["roundId"];
}): RivalTeam {
  const { rival, venue, roundId } = params;
  const overall = rival.ratings.overall;
  const isVerySmall = overall <= 70;
  const isSmall = overall <= 76;

  if (!isSmall) {
    return rival;
  }

  const fatigue = getCupUnderdogRoundFatigue(roundId);
  const homeUnderdogBoost = isVerySmall ? 5 : 3;
  const awayUnderdogPenalty = isVerySmall ? 6 : 3;

  // venue se interpreta desde el punto de vista del Athletic.
  // venue === "away": el rival pequeño juega en casa y puede dar sorpresa.
  // venue === "home": el rival pequeño juega fuera y su sorpresa baja.
  const adjustment =
    venue === "away"
      ? clamp(homeUnderdogBoost - fatigue, 0, 4)
      : -clamp(awayUnderdogPenalty + fatigue, 1, 8);

  const adjust = (value: number, min = 45, max = 92) =>
    clamp(value + adjustment, min, max);

  return {
    ...rival,
    ratings: {
      attack: adjust(rival.ratings.attack),
      midfield: adjust(rival.ratings.midfield),
      defense: adjust(rival.ratings.defense),
      goalkeeping: adjust(rival.ratings.goalkeeping),
      mentality: adjust(rival.ratings.mentality, 45, 94),
      overall: adjust(rival.ratings.overall),
    },
  };
}

function getCupRivalFromFixture(fixture: CupFixture): {
  rival: RivalTeam;
  venue: MatchVenue;
} {
  const rival = getCupTeamById(fixture.rivalTeamId);

  if (!rival) {
    throw new Error(`No se encontró el rival de Copa con id: ${fixture.rivalTeamId}`);
  }

  const venue = fixture.venue;
  const adjustedRival = adjustCupRivalByVenueAndRound({
    rival,
    venue,
    roundId: fixture.roundId,
  });

  return {
    rival: adjustedRival,
    venue,
  };
}


function resolveCupTie(result: MatchResult, seedBase: number): MatchResult {
  if (result.homeGoals !== result.awayGoals) return result;

  const homeWinsTieBreaker = seededRandom(seedBase) >= 0.5;

  return {
    ...result,
    homeGoals: homeWinsTieBreaker ? result.homeGoals + 1 : result.homeGoals,
    awayGoals: homeWinsTieBreaker ? result.awayGoals : result.awayGoals + 1,
  };
}

function getCupWinnerFromResult(result: MatchResult): {
  winnerName: string;
  runnerUpName: string;
  winnerIsHome: boolean;
} {
  const winnerIsHome = result.homeGoals > result.awayGoals;

  return {
    winnerName: winnerIsHome ? result.homeTeamName : result.awayTeamName,
    runnerUpName: winnerIsHome ? result.awayTeamName : result.homeTeamName,
    winnerIsHome,
  };
}


function simulateCupTeamVsTeam(params: {
  roundName: string;
  roundId: CupFixture["roundId"];
  matchday: number;
  home: RivalTeam;
  away: RivalTeam;
  seed: number;
}): MatchResult {
  const { roundName, roundId, matchday, home, away, seed } = params;

  const homeExpected = getCupTeamExpectedGoals({
    team: home,
    opponent: away,
    isHome: true,
    roundId,
    seed: seed + 11,
  });

  const awayExpected = getCupTeamExpectedGoals({
    team: away,
    opponent: home,
    isHome: false,
    roundId,
    seed: seed + 29,
  });

  const rawResult: MatchResult = {
    fixtureId: `copa_rest_${roundId}_${home.id}_vs_${away.id}`,
    matchday,
    competition: "cup",
    roundName,
    homeTeamName: home.name,
    awayTeamName: away.name,
    homeGoals: sampleGoals(homeExpected, seed + 11),
    awayGoals: sampleGoals(awayExpected, seed + 29),
    goalEvents: [],
    userTeamPlayed: false,
  };

  return resolveCupTie(rawResult, seed + 101);
}

function simulateRemainingCupAfterUserElimination(params: {
  cupState: CupSimulationState;
  eliminatedBy: RivalTeam;
  eliminatedRoundIndex: number;
  seed?: number;
}): CupSimulationState {
  const { cupState, eliminatedBy, eliminatedRoundIndex, seed } = params;
  const pool = getAllCupTeams();
  const usedTeamIds = new Set<string>([
    USER_TEAM_ID,
    eliminatedBy.id,
    ...cupState.fixtures.map((fixture) => fixture.rivalTeamId),
  ]);

  let aliveTeam = eliminatedBy;
  const simulatedRemainingResults: MatchResult[] = [];
  let runnerUpTeam: RivalTeam | undefined;

  for (let index = eliminatedRoundIndex + 1; index < cupState.fixtures.length; index += 1) {
    const fixture = cupState.fixtures[index];
    const minOverall = fixture.roundId === "final" ? 82 : fixture.roundId === "semi_final" ? 78 : 70;
    const maxOverall = fixture.roundId === "final" ? 94 : fixture.roundId === "semi_final" ? 90 : 86;
    const opponent = pickCupRival({
      pool,
      minOverall,
      maxOverall,
      usedTeamIds,
      seed: (seed ?? 1300) + index * 37,
    });

    const aliveAtHome = seededRandom((seed ?? 1300) + index * 53) >= 0.5;
    const home = aliveAtHome ? aliveTeam : opponent;
    const away = aliveAtHome ? opponent : aliveTeam;

    const result = simulateCupTeamVsTeam({
      roundName: fixture.roundName,
      roundId: fixture.roundId,
      matchday: fixture.gateMatchday,
      home,
      away,
      seed: (seed ?? 1300) + index * 101,
    });

    simulatedRemainingResults.push(result);

    const winner = getCupWinnerFromResult(result);
    const winnerTeam = winner.winnerName === aliveTeam.name ? aliveTeam : opponent;
    const loserTeam = winner.runnerUpName === aliveTeam.name ? aliveTeam : opponent;

    aliveTeam = winnerTeam;
    runnerUpTeam = loserTeam;
  }

  return {
    ...cupState,
    status: "eliminated",
    currentRoundIndex: Math.max(cupState.currentRoundIndex, eliminatedRoundIndex + 1),
    simulatedRemainingResults,
    championTeamId: aliveTeam.id,
    championTeamName: aliveTeam.name,
    runnerUpTeamId: runnerUpTeam?.id,
    runnerUpTeamName: runnerUpTeam?.name,
  };
}


export function simulateNextCupMatch(
  params: SimulateCupParams
): {
  context: UserLeagueSimulationContext;
  result?: MatchResult;
} {
  const {
    context,
    teamRating,
    selectedPlayers,
    userTeamName = USER_TEAM_NAME,
    seed,
  } = params;

  const pendingCupFixture = getPendingCupFixture(context);

  if (!pendingCupFixture) {
    return { context };
  }

  // Sin semilla explícita, la Copa restante necesita una aleatoria: al no sumar
  // `seededRandom` una sal de sesión, un valor fijo daría siempre el mismo campeón.
  const cupSimulationSeed = seed ?? createCupPathSeed();

  const { rival, venue } = getCupRivalFromFixture(pendingCupFixture);
  const cupContext = applyCupRivalContext({
    rival,
    userRating: teamRating,
    venue,
    roundId: pendingCupFixture.roundId,
  });

  const result = simulateMatch({
    fixtureId: pendingCupFixture.id,
    matchday: pendingCupFixture.gateMatchday,
    userTeamName,
    rival: cupContext.rival,
    venue,
    teamRating: applyCoachCompetitionBoostToTeamRating(cupContext.userRating, getCoachCompetitionBoost(context, "cup")),
    selectedPlayers,
    seed: typeof seed === "number" ? seed + context.cupState.results.length + 1000 : undefined,
  });

  let cupResult: MatchResult = {
    ...result,
    competition: "cup",
    roundName: pendingCupFixture.roundName,
  };

  // En Copa no puede quedar empate. Si el partido acaba igualado,
  // resolvemos la eliminatoria con una tanda/ prórroga simplificada.
  if (cupResult.userTeamDrew) {
    const tieBreakerSeed = (seed ?? Date.now()) + context.cupState.results.length * 73;
    const userIsHome = cupResult.homeTeamName === userTeamName;
    const rivalAverage = getAverageRivalRating(cupContext.rival);
    const userAverage = cupContext.userRating.overall;
    const rivalIsHomeUnderdog = !userIsHome && rivalAverage + 5 < userAverage;
    const roundTieChaos = getCupRoundChaos(pendingCupFixture.roundId);
    const userAdvantage = (cupContext.userRating.mentality - cupContext.rival.ratings.mentality) / 88;
    const underdogTiePenalty = rivalIsHomeUnderdog ? roundTieChaos * 0.12 : 0;
    const userWinsTieBreaker = seededRandom(tieBreakerSeed) < clamp(0.5 + userAdvantage - underdogTiePenalty, 0.32, 0.68);


    if (userWinsTieBreaker) {
      cupResult = {
        ...cupResult,
        homeGoals: userIsHome ? cupResult.homeGoals + 1 : cupResult.homeGoals,
        awayGoals: userIsHome ? cupResult.awayGoals : cupResult.awayGoals + 1,
        userTeamWon: true,
        userTeamDrew: false,
        userTeamLost: false,
      };
    } else {
      cupResult = {
        ...cupResult,
        homeGoals: userIsHome ? cupResult.homeGoals : cupResult.homeGoals + 1,
        awayGoals: userIsHome ? cupResult.awayGoals + 1 : cupResult.awayGoals,
        userTeamWon: false,
        userTeamDrew: false,
        userTeamLost: true,
        cleanSheetForUserTeam: false,
      };
    }
  }

  const nextFixtures = context.cupState.fixtures.map((fixture) =>
    fixture.id === pendingCupFixture.id ? { ...fixture, played: true } : fixture
  );

  const nextResults = [...context.cupState.results, cupResult];

  let nextCupState: CupSimulationState = {
    ...context.cupState,
    fixtures: nextFixtures,
    results: nextResults,
  };

  if (cupResult.userTeamLost) {
    const eliminatedBy = rival;
    nextCupState = simulateRemainingCupAfterUserElimination({
      cupState: {
        ...nextCupState,
        status: "eliminated",
        userEliminatedRoundName: pendingCupFixture.roundName,
      },
      eliminatedBy,
      eliminatedRoundIndex: context.cupState.currentRoundIndex,
      seed: cupSimulationSeed,
    });

    if (pendingCupFixture.roundId === "final") {
      nextCupState = {
        ...nextCupState,
        championTeamId: rival.id,
        championTeamName: rival.name,
        runnerUpTeamId: USER_TEAM_ID,
        runnerUpTeamName: userTeamName,
        simulatedRemainingResults: [],
      };
    }
  } else if (pendingCupFixture.roundId === "final") {
    nextCupState = {
      ...nextCupState,
      status: "won",
      currentRoundIndex: context.cupState.currentRoundIndex + 1,
      championTeamId: USER_TEAM_ID,
      championTeamName: userTeamName,
      runnerUpTeamId: rival.id,
      runnerUpTeamName: rival.name,
      simulatedRemainingResults: [],
    };
  } else {
    nextCupState = {
      ...nextCupState,
      currentRoundIndex: context.cupState.currentRoundIndex + 1,
    };
  }

  const nextUserTeamStats = updateUserTeamStats({
    currentStats: context.userTeamStats,
    result: cupResult,
    selectedPlayers,
    userTeamName,
  });

  return {
    context: {
      ...context,
      cupState: nextCupState,
      userTeamStats: nextUserTeamStats,
    },
    result: cupResult,
  };
}


export function simulateFullCupAndLeague(
  params: SimulateCupParams
): UserLeagueSimulationContext {
  let context = params.context;

  while (context.cupState.status === "active") {
    const pending = getPendingCupFixture(context);

    if (!pending) {
      const nextGate = context.cupState.fixtures[context.cupState.currentRoundIndex]?.gateMatchday;
      const userRow = context.state.table.find((row) => row.teamId === USER_TEAM_ID);
      const playedLeagueMatches = userRow?.played ?? 0;

      if (!nextGate || playedLeagueMatches >= nextGate) break;

      context = simulateFullUserLeague({
        context,
        teamRating: params.teamRating,
        selectedPlayers: params.selectedPlayers,
        userTeamName: params.userTeamName,
        seed: params.seed,
      });

      if (!getPendingCupFixture(context)) break;
    }

    const simulation = simulateNextCupMatch({
      ...params,
      context,
    });

    context = simulation.context;

    if (!simulation.result) break;
  }

  while (!context.state.completed && !getPendingCupFixture(context)) {
    const simulation = simulateNextUserLeagueMatch({
      context,
      teamRating: params.teamRating,
      selectedPlayers: params.selectedPlayers,
      userTeamName: params.userTeamName,
      seed: params.seed,
    });

    context = simulation.context;

    if (!simulation.result || simulation.stoppedForCup) break;
  }

  return context;
}


function createTrophiesWon(summary: {
  leaguePosition: number;
  cupTrophyWon: boolean;
}): FinalGameSummary["trophiesWon"] {
  return [
    {
      id: "liga",
      label: "Liga",
      count: summary.leaguePosition === 1 ? 1 : 0,
    },
    {
      id: "copa_del_rey",
      label: "Copa del Rey",
      count: summary.cupTrophyWon ? 1 : 0,
    },
    { id: "champions", label: "Champions League", count: 0 },
    { id: "europa_league", label: "Europa League", count: 0 },
    { id: "conference_league", label: "Conference League", count: 0 },
    { id: "supercopa", label: "Supercopa de España", count: 0 },
  ];
}


export function createFinalLeagueSummary(params: {
  gameId: string;
  formationName: string;
  coachName: string;
  context: UserLeagueSimulationContext;
  userTeamName?: string;
}): FinalGameSummary {
  const {
    gameId,
    formationName,
    coachName,
    context,
  } = params;

  const summary = getUserLeagueSummary({
    table: context.state.table,
    userTeamId: USER_TEAM_ID,
  });

  const row = summary.row;

  if (!row) {
    throw new Error("No se pudo generar el resumen final: Athletic Club Histórico no está en la tabla.");
  }

  const topScorer = context.userTeamStats.topScorers[0];
  const topAssister = context.userTeamStats.topAssisters[0];
  const cupRoundReached = getCupStatusLabel(context.cupState);
  const cupTrophyWon = context.cupState.status === "won";
  const leaguePosition = summary.position ?? 0;
  const trophiesWon = createTrophiesWon({ leaguePosition, cupTrophyWon });

  return {
    gameId,
    formationName,
    coachName,
    leaguePosition,
    points: row.points,
    wins: row.won,
    draws: row.drawn,
    losses: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    topScorer,
    topAssister,
    cleanSheets: context.userTeamStats.cleanSheets,
    table: sortLeagueTable(context.state.table),
    cupStatus: context.cupState.status,
    cupRoundReached,
    cupResults: context.cupState.results,
    cupTrophyWon,
    cupChampionTeamId: context.cupState.championTeamId,
    cupChampionTeamName: context.cupState.championTeamName,
    cupRunnerUpTeamId: context.cupState.runnerUpTeamId,
    cupRunnerUpTeamName: context.cupState.runnerUpTeamName,
    cupUserEliminatedRoundName: context.cupState.userEliminatedRoundName,
    cupSimulatedRemainingResults: context.cupState.simulatedRemainingResults,
    trophiesWon,
    finalLabel: createFinalLabel(row.points, leaguePosition || 20, cupTrophyWon),
    finalCategory: createFinalCategory(row.points, leaguePosition || 20, cupTrophyWon),
  };
}


export function createFinalLabel(points: number, position: number, cupWon = false): string {
  if (position === 1 && cupWon) return "Doblete histórico";
  if (position === 1 && points >= 90) return "Liga legendaria";
  if (position === 1) return "Campeón de Liga";
  if (cupWon && position <= 4) return "Temporada de título";
  if (position <= 4 && points >= 75) return "Temporada sobresaliente";
  if (position <= 4) return "Objetivo Champions conseguido";
  if (position <= 6) return "Temporada europea";
  if (position <= 10) return "Temporada correcta";
  if (position <= 15) return "Temporada irregular";

  return "Temporada decepcionante";
}


export function createFinalCategory(points: number, position: number, cupWon = false): string {
  if (position === 1 && cupWon) {
    return "Doblete eterno de San Mamés";
  }

  if (position === 1 && points >= 90) {
    return "Leyenda eterna de San Mamés";
  }

  if (position === 1) {
    return "Campeón histórico";
  }

  if (cupWon) {
    return "Campeón de Copa y temporada memorable";
  }

  if (position <= 4 && points >= 75) {
    return "Equipo de época";
  }

  if (position <= 4) {
    return "Gran Athletic competitivo";
  }

  if (position <= 6) {
    return "Athletic europeo";
  }

  if (position <= 10) {
    return "Equipo competitivo pero no diferencial";
  }

  if (position <= 15) {
    return "Once con talento, pero desequilibrado";
  }

  return "Proyecto fallido";
}


export function getCurrentLeagueDiagnosis(context: UserLeagueSimulationContext): string {
  const pendingCupFixture = getPendingCupFixture(context);

  if (pendingCupFixture) {
    return `Toca Copa del Rey: ${pendingCupFixture.roundName}. La Liga queda pausada hasta resolver la eliminatoria.`;
  }

  const summary = getUserLeagueSummary({
    table: context.state.table,
    userTeamId: USER_TEAM_ID,
  });

  if (!summary.row || !summary.position) {
    return "Todavía no hay datos suficientes para valorar la temporada.";
  }

  const { row } = summary;
  const position = summary.position;

  if (row.played === 0) {
    return "La Liga todavía no ha empezado.";
  }

  if (position === 1) {
    return "El Athletic Club Histórico lidera la Liga.";
  }

  if (position <= 4) {
    return "El Athletic Club Histórico está compitiendo en zona Champions.";
  }

  if (position <= 6) {
    return "El Athletic Club Histórico está en pelea europea.";
  }

  if (position <= 10) {
    return "El Athletic Club Histórico está haciendo una temporada correcta, pero le falta regularidad.";
  }

  return "El Athletic Club Histórico necesita mejorar resultados para acercarse a la zona alta.";
}


export function getSeasonProgressLabel(context: UserLeagueSimulationContext): string {
  const userRow = context.state.table.find((row) => row.teamId === USER_TEAM_ID);
  const played = userRow?.played ?? 0;

  return `Liga ${played}/38 · Copa: ${getCupStatusLabel(context.cupState)}`;
}






