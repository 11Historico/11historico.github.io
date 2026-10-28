// src/europe/europeanQualification.ts
//
// Europa Career Foundation (v0.24.0a) — reglas puras de clasificación europea.
//
// Reglas de Liga (v0.24.9h, reparto real de LaLiga: 7 plazas europeas):
//   1º-4º  -> Champions League
//   5º     -> Europa League
//   6º     -> Conference League
//   7º o peor -> sin Europa, salvo reasignación (ver abajo)
//
// Reasignación por campeón de Copa externo (no el usuario):
//   La plaza de Copa es de Europa League. Si el campeón ya está en Europa por
//   Liga (1º-5º), esa plaza pasa al 6º (Europa League) y el 7º recibe la
//   Conference. Si el campeón queda 6º, conserva la plaza de Copa y el 7º
//   recibe la Conference. Si el campeón está fuera de Europa, la plaza de Copa
//   es suya y la tabla base no cambia.
//   Sin posición conocida del campeón se asume que está fuera de Europa.
//
// Regla de Copa del Rey del usuario:
//   Ganar la Copa garantiza como mínimo Europa League. Si la plaza de Liga ya
//   es igual o mejor (Champions o Europa League), la Copa no cambia nada. Si
//   la plaza de Liga es peor (Conference o ninguna), la Copa la mejora hasta
//   Europa League.
//
// Fuentes: prensa deportiva (Goal, BeIN Sports, Wikipedia de la Copa del Rey).
// No se ha encontrado el reglamento oficial de LaLiga/UEFA en fuentes abiertas.

import type {
  EuropeanCompetition,
  EuropeanQualificationResult,
} from "./europeanTypes";

export interface ResolveEuropeanQualificationInput {
  leaguePosition: number;
  userWonCopa: boolean;
  /** Posición final en Liga del campeón de Copa externo. Ausente o null = fuera de Europa por Liga. */
  copaWinnerLeaguePosition?: number | null;
  seasonNumber?: number;
}

export interface LeagueCompetitionSpot {
  competition: EuropeanCompetition;
  reallocated: boolean;
}

const COMPETITION_PRIORITY: Record<EuropeanCompetition, number> = {
  champions_league: 3,
  europa_league: 2,
  conference_league: 1,
};

const NO_QUALIFICATION_PRIORITY = 0;

/** Icono de cada competición (ver CompetitionIconKind en src/components/CompetitionIcon.tsx). */
export function getEuropeanCompetitionIconKind(competition: EuropeanCompetition): "champions" | "europa" | "conference" {
  if (competition === "champions_league") return "champions";
  if (competition === "europa_league") return "europa";
  return "conference";
}

export function getEuropeanCompetitionLabel(competition: EuropeanCompetition | null): string {
  if (competition === "champions_league") return "Champions League";
  if (competition === "europa_league") return "Europa League";
  if (competition === "conference_league") return "Conference League";
  return "Sin clasificación europea";
}

export function getEuropeanCompetitionShortLabel(competition: EuropeanCompetition | null): string {
  if (competition === "champions_league") return "Champions";
  if (competition === "europa_league") return "Europa League";
  if (competition === "conference_league") return "Conference";
  return "Sin Europa";
}

export function getEuropeanCompetitionBadgeLabel(competition: EuropeanCompetition | null): string {
  if (competition === "champions_league") return "UCL";
  if (competition === "europa_league") return "UEL";
  if (competition === "conference_league") return "UECL";
  return "—";
}

export function compareEuropeanQualificationPriority(
  a: EuropeanCompetition | null,
  b: EuropeanCompetition | null,
): number {
  const priorityA = a ? COMPETITION_PRIORITY[a] : NO_QUALIFICATION_PRIORITY;
  const priorityB = b ? COMPETITION_PRIORITY[b] : NO_QUALIFICATION_PRIORITY;
  return priorityA - priorityB;
}

export function isEuropeanQualified(input: { qualified: boolean } | null | undefined): boolean {
  return Boolean(input?.qualified);
}

/** Plaza europea que da la Liga a una posición, con la reasignación de la Copa externa. */
export function getLeagueCompetitionSpot(
  leaguePosition: number,
  copaWinnerLeaguePosition?: number | null,
): LeagueCompetitionSpot | null {
  const copaWinnerInEuropeByLeague = copaWinnerLeaguePosition != null && copaWinnerLeaguePosition >= 1 && copaWinnerLeaguePosition <= 5;
  const copaWinnerInTopSix = copaWinnerLeaguePosition != null && copaWinnerLeaguePosition >= 1 && copaWinnerLeaguePosition <= 6;

  if (leaguePosition >= 1 && leaguePosition <= 4) return { competition: "champions_league", reallocated: false };
  if (leaguePosition === 5) return { competition: "europa_league", reallocated: false };
  if (leaguePosition === 6) {
    return copaWinnerInEuropeByLeague
      ? { competition: "europa_league", reallocated: true }
      : { competition: "conference_league", reallocated: false };
  }
  if (leaguePosition === 7 && copaWinnerInTopSix) return { competition: "conference_league", reallocated: true };
  return null;
}

/** Explica por qué un Athletic sin plaza europea se queda fuera, según el reparto y el campeón de Copa. */
export function getNoEuropeanQualificationExplanation(
  leaguePosition: number,
  copaWinnerLeaguePosition?: number | null,
): string {
  const winner = copaWinnerLeaguePosition ?? null;
  const cupRule = "Para entrar necesitabas quedar entre los 7 primeros";

  if (winner !== null && winner >= 1 && winner <= 5) {
    return `Quedaste ${leaguePosition}.º. El campeón de Copa ya estaba en Europa por Liga, así que su plaza de Copa pasó al 6.º (Europa League) y la Conference al 7.º. ${cupRule}.`;
  }

  if (winner === 6) {
    return `Quedaste ${leaguePosition}.º. El campeón de Copa, 6.º en Liga, conserva su plaza de Copa y la Conference pasó al 7.º. ${cupRule}.`;
  }

  if (winner !== null) {
    return `Quedaste ${leaguePosition}.º. El campeón de Copa no estaba en Europa por Liga, así que su plaza de Copa fue para él. Europa por Liga: 1.º-4.º Champions, 5.º Europa League y 6.º Conference. Para entrar necesitabas quedar entre los 6 primeros.`;
  }

  return `Quedaste ${leaguePosition}.º. Europa por Liga: 1.º-4.º Champions, 5.º Europa League y 6.º Conference.`;
}

export function resolveEuropeanQualification(
  input: ResolveEuropeanQualificationInput,
): EuropeanQualificationResult {
  const { leaguePosition, userWonCopa, copaWinnerLeaguePosition } = input;
  const leagueSpot = getLeagueCompetitionSpot(leaguePosition, copaWinnerLeaguePosition);
  const leagueCompetition = leagueSpot?.competition ?? null;
  const leaguePriority = leagueCompetition ? COMPETITION_PRIORITY[leagueCompetition] : NO_QUALIFICATION_PRIORITY;
  const copaGuaranteedPriority = COMPETITION_PRIORITY.europa_league;

  if (userWonCopa && leaguePriority < copaGuaranteedPriority) {
    const upgradedFromConference = leagueCompetition === "conference_league";

    return {
      qualified: true,
      competition: "europa_league",
      source: "copa_winner",
      label: "Clasificado a Europa League",
      shortLabel: "Europa League",
      explanation: upgradedFromConference
        ? "La Copa del Rey mejora tu plaza europea: pasas de Conference League a Europa League."
        : "Clasificado a Europa League por ganar la Copa del Rey.",
      priority: copaGuaranteedPriority,
    };
  }

  if (leagueSpot) {
    const { competition, reallocated } = leagueSpot;

    return {
      qualified: true,
      competition,
      source: reallocated ? "league_reallocation" : "league_position",
      label: `Clasificado a ${getEuropeanCompetitionLabel(competition)}`,
      shortLabel: getEuropeanCompetitionShortLabel(competition),
      explanation: reallocated
        ? `Clasificado a ${getEuropeanCompetitionLabel(competition)} por reasignación de la plaza de Copa del Rey (${leaguePosition}.º en Liga).`
        : `Clasificado a ${getEuropeanCompetitionLabel(competition)} por posición final en Liga (${leaguePosition}.º).`,
      priority: leaguePriority,
    };
  }

  return {
    qualified: false,
    competition: null,
    source: "none",
    label: "Sin clasificación europea",
    shortLabel: "Sin Europa",
    explanation: getNoEuropeanQualificationExplanation(leaguePosition, copaWinnerLeaguePosition),
    priority: NO_QUALIFICATION_PRIORITY,
  };
}

export interface FinalTableEuropeanSpot extends LeagueCompetitionSpot {
  /** La plaza la da ser campeón de Copa (no la posición de Liga). */
  viaCopa: boolean;
}

/**
 * Plaza europea que se muestra en la tabla final. Usa el mismo reparto que el juego
 * (getLeagueCompetitionSpot) y añade el campeón de Copa: si no estaba ya en Champions o
 * Europa League por Liga, su plaza de Copa es de Europa League.
 */
export function getFinalTableEuropeanSpot(
  position: number,
  cupWinnerLeaguePosition: number | null,
): FinalTableEuropeanSpot | null {
  const spot = getLeagueCompetitionSpot(position, cupWinnerLeaguePosition);

  if (position === cupWinnerLeaguePosition) {
    if (spot?.competition === "champions_league" || spot?.competition === "europa_league") {
      return { ...spot, viaCopa: false };
    }

    return { competition: "europa_league", reallocated: false, viaCopa: true };
  }

  return spot ? { ...spot, viaCopa: false } : null;
}
