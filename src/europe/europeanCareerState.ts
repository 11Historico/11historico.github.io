// src/europe/europeanCareerState.ts
//
// Europa Career Foundation (v0.24.0c) — persistencia del estado europeo
// dentro de la carrera. Desde v0.24.1c también persiste el torneo europeo
// jugable de la temporada en curso (`currentTournament`).

import { markEuropeanMatchScheduledMatchday } from "./europeanCalendar";
import { compareEuropeanQualificationPriority } from "./europeanQualification";
import type {
  EuropeanCareerState,
  EuropeanCompetition,
  EuropeanSeasonEntry,
  EuropeanTournamentState,
} from "./europeanTypes";

export function createEmptyEuropeanCareerState(): EuropeanCareerState {
  return {
    currentQualification: null,
    history: [],
    bestCompetition: null,
    totalQualifications: 0,
    currentTournament: null,
  };
}

function normalizeEuropeanTournament(
  tournament: Partial<EuropeanTournamentState> | null | undefined,
): EuropeanTournamentState | null {
  if (!tournament || !Array.isArray(tournament.matches)) return null;

  const withDefaults: EuropeanTournamentState = {
    seasonNumber: tournament.seasonNumber ?? 0,
    competition: tournament.competition ?? "conference_league",
    phase: tournament.phase ?? "league_phase",
    matches: tournament.matches,
    leaguePhasePoints: tournament.leaguePhasePoints ?? 0,
    leaguePhasePlayed: tournament.leaguePhasePlayed ?? 0,
    wins: tournament.wins ?? 0,
    draws: tournament.draws ?? 0,
    losses: tournament.losses ?? 0,
    goalsFor: tournament.goalsFor ?? 0,
    goalsAgainst: tournament.goalsAgainst ?? 0,
    qualifiedForSemifinal: tournament.qualifiedForSemifinal ?? false,
    eliminated: tournament.eliminated ?? false,
    completed: tournament.completed ?? false,
    champion: tournament.champion ?? false,
    currentMatchId: tournament.currentMatchId ?? null,
    europeanTrophyAwarded: tournament.europeanTrophyAwarded ?? false,
    europeanTrophyAwardedAt: tournament.europeanTrophyAwardedAt,
    europeanPrestigeAwarded: tournament.europeanPrestigeAwarded ?? false,
    europeanPrestigeAwardedAt: tournament.europeanPrestigeAwardedAt,
    drawSeed: tournament.drawSeed,
  };

  // Normalizador defensivo: rellena matchday en partidos que no lo tengan
  // (por ejemplo datos guardados antes de v0.24.1c).
  return markEuropeanMatchScheduledMatchday(withDefaults);
}

/**
 * Normaliza un estado europeo potencialmente ausente o incompleto (partidas
 * antiguas guardadas antes de v0.24.0c / v0.24.1c) a una forma segura y
 * completa.
 */
export function normalizeEuropeanCareerState(
  state: Partial<EuropeanCareerState> | null | undefined,
): EuropeanCareerState {
  if (!state) return createEmptyEuropeanCareerState();

  const history = Array.isArray(state.history) ? state.history : [];

  return {
    currentQualification: state.currentQualification ?? null,
    history,
    bestCompetition: state.bestCompetition ?? null,
    totalQualifications: Number.isFinite(state.totalQualifications)
      ? Number(state.totalQualifications)
      : history.filter((entry) => entry.qualified).length,
    currentTournament: normalizeEuropeanTournament(state.currentTournament),
  };
}

/**
 * Añade la clasificación europea de una temporada al histórico. Si ya existe
 * una entrada para el mismo `seasonNumber` (por ejemplo por un doble render),
 * la sustituye en lugar de duplicarla.
 */
export function appendEuropeanQualification(
  state: EuropeanCareerState | null | undefined,
  entry: EuropeanSeasonEntry,
): EuropeanCareerState {
  const current = normalizeEuropeanCareerState(state);
  const historyWithoutSameSeason = current.history.filter(
    (existing) => existing.seasonNumber !== entry.seasonNumber,
  );
  const nextHistory = [...historyWithoutSameSeason, entry];

  const bestCompetition = nextHistory.reduce<EuropeanCompetition | null>((best, item) => {
    if (!item.competition) return best;
    return compareEuropeanQualificationPriority(item.competition, best) > 0 ? item.competition : best;
  }, current.bestCompetition ?? null);

  return {
    ...current,
    currentQualification: entry,
    history: nextHistory,
    bestCompetition,
    totalQualifications: nextHistory.filter((item) => item.qualified).length,
  };
}

export function getLatestEuropeanQualification(
  state: EuropeanCareerState | null | undefined,
): EuropeanSeasonEntry | null {
  return state?.currentQualification ?? null;
}

/**
 * Guarda (o sustituye) el torneo europeo de la temporada en curso.
 */
export function setEuropeanCurrentTournament(
  state: EuropeanCareerState | null | undefined,
  tournament: EuropeanTournamentState | null,
): EuropeanCareerState {
  const current = normalizeEuropeanCareerState(state);

  return {
    ...current,
    currentTournament: tournament,
  };
}

export function getEuropeanCurrentTournament(
  state: EuropeanCareerState | null | undefined,
): EuropeanTournamentState | null {
  return state?.currentTournament ?? null;
}
