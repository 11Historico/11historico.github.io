// src/components/leagueEventOrder.ts
//
// Orden de las tarjetas de la jornada (v0.25.69): arriba lo que se juega antes,
// después la siguiente competición y luego la siguiente. No cambia ninguna regla:
// un partido europeo pendiente sigue bloqueando la Liga.

import type { EuropeanTournamentMatch } from "../europe/europeanTypes";
import type { CupFixture } from "../types/game";

export type LeagueEventKind = "copa" | "europa" | "liga";

export interface LeagueEventSlot {
  kind: LeagueEventKind;
  /** Partidos de Liga jugados cuando el evento se puede jugar. */
  at: number;
}

// En empate va antes lo que bloquea la Liga, en el mismo orden que la tarjeta de acciones.
const TIE_ORDER: Record<LeagueEventKind, number> = { copa: 0, europa: 1, liga: 2 };

export function getLeagueEventSlots(params: {
  leagueMatchesPlayed: number;
  leagueCompleted: boolean;
  hasLastResult: boolean;
  /** Ronda de Copa sin jugar (pendiente o próxima). */
  cupFixture?: CupFixture;
  /** Partido europeo recién jugado: va arriba hasta que se juega el siguiente partido. */
  justPlayedEuropeanMatch?: EuropeanTournamentMatch;
  /** Siguiente partido europeo sin jugar. Se juega antes de su jornada de Liga. */
  nextEuropeanMatch?: EuropeanTournamentMatch | null;
}): LeagueEventSlot[] {
  const slots: LeagueEventSlot[] = [];

  if (params.hasLastResult) {
    slots.push({ kind: "liga", at: params.leagueCompleted ? Number.POSITIVE_INFINITY : params.leagueMatchesPlayed });
  }

  if (params.cupFixture) {
    slots.push({ kind: "copa", at: params.cupFixture.gateMatchday });
  }

  if (params.justPlayedEuropeanMatch) {
    slots.push({ kind: "europa", at: Number.NEGATIVE_INFINITY });
  } else if (params.nextEuropeanMatch) {
    slots.push({ kind: "europa", at: params.nextEuropeanMatch.matchday - 1 });
  }

  return slots.sort((left, right) => left.at - right.at || TIE_ORDER[left.kind] - TIE_ORDER[right.kind]);
}
