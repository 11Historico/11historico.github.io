// src/simulation/expectedLeagueRange.ts
//
// Rango esperado en Liga (v0.25.88): dónde suele acabar este once con estos rivales.
// Juega la Liga entera varias veces con la simulación del juego, sin tocar la partida.
// Cada vuelta usa otra forma de los rivales: con la de esta temporada, los partidos entre
// rivales (que ya están decididos por su semilla) se colarían en el cálculo.

import { getLaliga2526RivalsExcludingAthletic } from "../data/laliga2526Teams";
import type { LeagueFixture, RivalTeam, SelectedCoach, SelectedPlayer, TeamRating } from "../types/game";
import { createInitialUserTeamStats, simulateFullUserLeague, type UserLeagueSimulationContext } from "./leagueSimulator";
import { createLeagueSimulationState, getUserLeagueSummary } from "./leagueTable";

/** Puestos entre los que acaba la mitad central de las temporadas simuladas. */
export interface ExpectedLeagueRange {
  best: number;
  worst: number;
}

const SIMULATED_SEASONS = 100;

/**
 * Usa el calendario y los rivales de la temporada en curso, con la Liga a cero. No crea una
 * temporada nueva: eso gastaría tiradas de Math.random y cambiaría el azar de la partida.
 */
export function estimateExpectedLeagueRange(params: {
  fixtures: LeagueFixture[];
  rivals?: RivalTeam[];
  teamRating: TeamRating;
  selectedPlayers: SelectedPlayer[];
  /** v0.25.115: el entrenador gestor (Gestión 86+) suma +1 en Liga. */
  selectedCoach?: SelectedCoach;
  seasons?: number;
}): ExpectedLeagueRange {
  const { fixtures, teamRating, selectedPlayers, selectedCoach, seasons = SIMULATED_SEASONS } = params;
  const rivals = params.rivals ?? getLaliga2526RivalsExcludingAthletic();
  const restart: UserLeagueSimulationContext = {
    state: createLeagueSimulationState({ fixtures, rivals }),
    userTeamStats: createInitialUserTeamStats(),
    // Sin Copa: la Liga se juega de corrido, y la Copa no cambia sus resultados.
    cupState: { status: "eliminated", currentRoundIndex: 0, fixtures: [], results: [] },
    rivals,
    selectedCoach,
  };

  const positions = Array.from({ length: seasons }, (_, index) => {
    const season = simulateFullUserLeague({
      context: { ...restart, leagueSeasonSalt: 7919 * (index + 1) },
      teamRating,
      selectedPlayers,
      seed: 100_003 * (index + 1),
    });
    return getUserLeagueSummary({ table: season.state.table }).position ?? 20;
  }).sort((a, b) => a - b);

  return {
    best: positions[Math.floor(seasons * 0.25)],
    worst: positions[Math.min(seasons - 1, Math.floor(seasons * 0.75))],
  };
}

/** Sin posición actual (jornada 0) solo dice el rango. */
export function getExpectedLeagueRangeText(range: ExpectedLeagueRange, position?: number): string {
  const span = range.best === range.worst ? `el ${range.best}.º` : `entre el ${range.best}.º y el ${range.worst}.º`;
  const expected = `Lo normal con este once y estos rivales: acabar ${span}.`;

  if (!position) return expected;
  if (position < range.best) return `${expected} Vas ${position}.º, por encima de lo esperado.`;
  if (position > range.worst) return `${expected} Vas ${position}.º, por debajo de lo esperado.`;
  return `${expected} Vas ${position}.º, dentro de lo esperado.`;
}
