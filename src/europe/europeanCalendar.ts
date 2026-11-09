// src/europe/europeanCalendar.ts
//
// European Calendar Integration (v0.24.1c) — como todavía no hay un
// calendario europeo global independiente, los partidos europeos se anclan
// a jornadas concretas de Liga (matchdays 1-38). Si la Liga tuviera un
// número distinto de jornadas, los huecos se recalculan por porcentaje.

import type { EuropeanTournamentMatch, EuropeanTournamentState } from "./europeanTypes";

export const EUROPEAN_DEFAULT_LEAGUE_MATCHDAYS = 38;
export const EUROPEAN_LEAGUE_PHASE_MATCH_COUNT = 6;

const DEFAULT_LEAGUE_PHASE_MATCHDAYS = [4, 8, 12, 16, 20, 24];
const DEFAULT_PLAYOFF_MATCHDAY = 27;
const DEFAULT_SEMIFINAL_MATCHDAY = 30;
const DEFAULT_FINAL_MATCHDAY = 36;

const LEAGUE_PHASE_RATIOS = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65];
const PLAYOFF_RATIO = 0.72;
const SEMIFINAL_RATIO = 0.8;
const FINAL_RATIO = 0.95;

export interface EuropeanMatchdaySlots {
  leaguePhase: number[];
  /** Eliminatoria previa del 3.º y el 4.º (v0.25.107). */
  playoff: number;
  semifinal: number;
  final: number;
}

function clampMatchday(value: number, totalLeagueMatchdays: number): number {
  const minMatchday = 2;
  const maxMatchday = Math.max(totalLeagueMatchdays - 1, minMatchday);

  return Math.min(Math.max(Math.round(value), minMatchday), maxMatchday);
}

/**
 * Devuelve las jornadas de Liga objetivo para la fase inicial (6 partidos),
 * la previa (v0.25.107), la semifinal y la final europeas. Usa los huecos
 * recomendados (4, 8, 12, 16, 20, 24 / 27 / 30 / 36) para una Liga estándar
 * de 38 jornadas, y recalcula por porcentaje (15/25/35/45/55/65/72/80/95%)
 * para cualquier otro tamaño de Liga, evitando la primera y la última jornada.
 */
export function getEuropeanMatchdaySlots(totalLeagueMatchdays: number = EUROPEAN_DEFAULT_LEAGUE_MATCHDAYS): EuropeanMatchdaySlots {
  if (totalLeagueMatchdays === EUROPEAN_DEFAULT_LEAGUE_MATCHDAYS) {
    return {
      leaguePhase: [...DEFAULT_LEAGUE_PHASE_MATCHDAYS],
      playoff: DEFAULT_PLAYOFF_MATCHDAY,
      semifinal: DEFAULT_SEMIFINAL_MATCHDAY,
      final: DEFAULT_FINAL_MATCHDAY,
    };
  }

  // Cada hueco debe caer en una jornada distinta y posterior a la anterior:
  // `shouldPlayEuropeanMatchAtLeagueMatchday` solo devuelve un partido por
  // jornada, así que dos partidos en la misma jornada dejarían uno sin jugar.
  const maxMatchday = Math.max(totalLeagueMatchdays - 1, 2);
  let previous = 1;
  const nextSlot = (ratio: number): number => {
    const slot = Math.min(
      Math.max(clampMatchday(totalLeagueMatchdays * ratio, totalLeagueMatchdays), previous + 1),
      maxMatchday,
    );
    previous = slot;
    return slot;
  };

  const leaguePhase = LEAGUE_PHASE_RATIOS.map(nextSlot);

  return {
    leaguePhase,
    playoff: nextSlot(PLAYOFF_RATIO),
    semifinal: nextSlot(SEMIFINAL_RATIO),
    final: nextSlot(FINAL_RATIO),
  };
}

/**
 * Devuelve el partido europeo `scheduled` que toca jugar en una jornada de
 * Liga concreta, si existe. `null` si no hay torneo o no toca nada esa
 * jornada.
 */
export function shouldPlayEuropeanMatchAtLeagueMatchday(
  tournament: EuropeanTournamentState | null | undefined,
  leagueMatchday: number,
): EuropeanTournamentMatch | null {
  if (!tournament) return null;

  const match = tournament.matches.find(
    (candidate) => candidate.matchday === leagueMatchday && candidate.status === "scheduled",
  );

  return match ?? null;
}

/**
 * Normalizador defensivo: asigna matchday a cualquier partido europeo que no
 * lo tenga todavía (por ejemplo datos incompletos de una versión anterior).
 * Idempotente: si todos los partidos ya tienen matchday, no cambia nada.
 */
export function markEuropeanMatchScheduledMatchday(
  tournament: EuropeanTournamentState,
  totalLeagueMatchdays: number = EUROPEAN_DEFAULT_LEAGUE_MATCHDAYS,
): EuropeanTournamentState {
  const slots = getEuropeanMatchdaySlots(totalLeagueMatchdays);
  let leaguePhaseIndex = 0;
  let changed = false;

  const matches = tournament.matches.map((match) => {
    if (match.matchday && match.matchday > 0) {
      if (match.phase === "league_phase") leaguePhaseIndex += 1;
      return match;
    }

    changed = true;

    if (match.phase === "league_phase") {
      const matchday = slots.leaguePhase[leaguePhaseIndex] ?? slots.leaguePhase[slots.leaguePhase.length - 1];
      leaguePhaseIndex += 1;
      return { ...match, matchday };
    }

    if (match.phase === "playoff") {
      return { ...match, matchday: slots.playoff };
    }

    if (match.phase === "semifinal") {
      return { ...match, matchday: slots.semifinal };
    }

    if (match.phase === "final") {
      return { ...match, matchday: slots.final };
    }

    return match;
  });

  if (!changed) return tournament;

  return { ...tournament, matches };
}
