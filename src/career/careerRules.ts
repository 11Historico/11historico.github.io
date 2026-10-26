import { getLeagueCompetitionSpot } from "../europe/europeanQualification";
import type { Formation, RivalTeam } from "../types/game";
import type {
  CareerObjectiveResult,
  CareerSeasonResult,
  CareerTrophyCounts,
  EuropeanCompetition,
  FormationChangeEligibility,
  FormationLineCounts,
} from "../types/career";

export const CAREER_INITIAL_SEASON_LABEL = "2025/26";
export const CAREER_RELEGATION_POSITION = 18;

export const CAREER_PALMARES_POINTS: CareerTrophyCounts = {
  champions: 10,
  liga: 8,
  europaLeague: 6,
  copa: 5,
  conference: 4,
  supercopa: 2,
};

export function getEuropeanQualification(
  leaguePosition: number,
  wonCopa: boolean,
  copaWinnerLeaguePosition?: number | null,
): EuropeanCompetition {
  if (leaguePosition >= 1 && leaguePosition <= 4) return "champions";

  // Ganar la Copa del Rey garantiza como mínimo Europa League, sea cual sea
  // la posición de Liga (docs/v0_11_2_european_qualification_rules.md,
  // ejemplo: "Athletic gana Copa y queda 8º -> Athletic: Europa League por
  // campeón de Copa"). Antes, esta función solo aplicaba el ascenso a las
  // posiciones 5-6, así que un campeón de Copa que acababa 7º o peor se
  // mostraba sin plaza europea.
  if (wonCopa) return "europa_league";

  // Mismo reparto que `getLeagueCompetitionSpot` en src/europe/europeanQualification.ts,
  // que es el módulo que decide el torneo europeo jugable.
  const spot = getLeagueCompetitionSpot(leaguePosition, copaWinnerLeaguePosition);
  if (!spot) return "none";
  if (spot.competition === "champions_league") return "champions";
  if (spot.competition === "europa_league") return "europa_league";
  return "conference";
}

function getCareerObjectiveSuccessReason(result: CareerSeasonResult): string {
  if (result.wonCopa) return "Objetivo cumplido: campeón de Copa del Rey.";
  if (result.europeanQualification === "champions") {
    return "Objetivo cumplido: clasificación a Champions League.";
  }
  if (result.europeanQualification === "europa_league") {
    return "Objetivo cumplido: clasificación a Europa League.";
  }
  if (result.europeanQualification === "conference") {
    return "Objetivo cumplido: clasificación a Conference League.";
  }

  return "Objetivo cumplido: clasificación europea.";
}

export function evaluateCareerObjective(
  result: CareerSeasonResult,
): CareerObjectiveResult {
  if (result.isRelegated) {
    return {
      survives: false,
      reason: "Descenso: Game Over aunque haya ganado Copa.",
      isGameOver: true,
      qualifiedForEurope: result.europeanQualification !== "none",
      wonCopa: result.wonCopa,
      isRelegated: true,
    };
  }

  const qualifiedForEurope = result.europeanQualification !== "none";
  const survives = qualifiedForEurope || result.wonCopa;

  return {
    survives,
    reason: survives
      ? getCareerObjectiveSuccessReason(result)
      : "Objetivo fallido: no clasificó a Europa ni ganó Copa.",
    isGameOver: !survives,
    qualifiedForEurope,
    wonCopa: result.wonCopa,
    isRelegated: false,
  };
}

export function getRivalDifficultyBonus(completedSeasons: number): number {
  if (completedSeasons <= 0) return 0;

  let bonus = 0;
  for (let season = 1; season <= completedSeasons; season += 1) {
    if (season <= 3) bonus += 0.5;
    else if (season <= 6) bonus += 1;
    else bonus += 1.5;
  }

  return Math.min(bonus, 3);
}

export function getCupDifficultyBonus(completedSeasons: number): number {
  return Math.max(0, completedSeasons) * 0.15;
}

/**
 * Sube la valoración de los rivales según las temporadas superadas (curva de getRivalDifficultyBonus).
 * Devuelve copias: la lista de rivales guardada no cambia.
 */
export function applyCareerRivalProgression(rivals: RivalTeam[], completedSeasons: number): RivalTeam[] {
  const bonus = getRivalDifficultyBonus(completedSeasons);
  if (bonus <= 0) return rivals;

  const boost = (value: number) => Math.min(99, value + bonus);

  return rivals.map((rival) => ({
    ...rival,
    ratings: {
      attack: boost(rival.ratings.attack),
      midfield: boost(rival.ratings.midfield),
      defense: boost(rival.ratings.defense),
      goalkeeping: boost(rival.ratings.goalkeeping),
      mentality: boost(rival.ratings.mentality),
      overall: boost(rival.ratings.overall),
    },
  }));
}

export function calculatePalmaresScore(trophies: CareerTrophyCounts): number {
  return (
    trophies.champions * CAREER_PALMARES_POINTS.champions +
    trophies.liga * CAREER_PALMARES_POINTS.liga +
    trophies.europaLeague * CAREER_PALMARES_POINTS.europaLeague +
    trophies.copa * CAREER_PALMARES_POINTS.copa +
    trophies.conference * CAREER_PALMARES_POINTS.conference +
    trophies.supercopa * CAREER_PALMARES_POINTS.supercopa
  );
}


export function canUnlockCareerFormationChange(
  seasonResult: CareerSeasonResult,
  objectiveResult: CareerObjectiveResult,
): boolean {
  return (
    seasonResult.wonLeague ||
    seasonResult.wonCopa ||
    (seasonResult.wonSupercopa && objectiveResult.qualifiedForEurope)
  );
}

export function getCareerFormationChangeUnlockReason(
  seasonResult: CareerSeasonResult,
  objectiveResult: CareerObjectiveResult,
): string {
  if (seasonResult.wonLeague) return "Desbloqueado por ganar Liga.";
  if (seasonResult.wonCopa) return "Desbloqueado por ganar Copa del Rey.";
  if (seasonResult.wonSupercopa && objectiveResult.qualifiedForEurope) {
    return "Desbloqueado por ganar Supercopa y clasificarse para Europa.";
  }

  return "Solo se desbloquea ganando Liga, Copa, o Supercopa + clasificación europea.";
}

export function getFormationLineCounts(formation: Formation): FormationLineCounts {
  return formation.slots.reduce<FormationLineCounts>(
    (counts, slot) => ({
      ...counts,
      [slot.line]: counts[slot.line] + 1,
    }),
    { goalkeeper: 0, defense: 0, midfield: 0, attack: 0 },
  );
}

export function canChangeFormationWithOnePlayer(
  fromFormation: Formation,
  toFormation: Formation,
): FormationChangeEligibility {
  const fromCounts = getFormationLineCounts(fromFormation);
  const toCounts = getFormationLineCounts(toFormation);

  if (fromCounts.goalkeeper !== 1 || toCounts.goalkeeper !== 1) {
    return {
      canChange: false,
      reason: "Todas las formaciones de carrera deben tener exactamente un portero.",
      from: fromFormation.id,
      to: toFormation.id,
    };
  }

  const lines = ["defense", "midfield", "attack"] as const;
  const removedLines = lines.filter((line) => fromCounts[line] - toCounts[line] === 1);
  const addedLines = lines.filter((line) => toCounts[line] - fromCounts[line] === 1);
  const changedTooMuch = lines.some(
    (line) => Math.abs(fromCounts[line] - toCounts[line]) > 1,
  );

  if (changedTooMuch || removedLines.length > 1 || addedLines.length > 1) {
    return {
      canChange: false,
      reason: "La nueva formación exige cambiar más de un jugador de línea.",
      from: fromFormation.id,
      to: toFormation.id,
    };
  }

  const unchanged = removedLines.length === 0 && addedLines.length === 0;
  if (unchanged) {
    return {
      canChange: true,
      reason: "La formación no cambia la estructura de líneas.",
      from: fromFormation.id,
      to: toFormation.id,
    };
  }

  const canChange = removedLines.length === 1 && addedLines.length === 1;

  return {
    canChange,
    reason: canChange
      ? "Cambio compatible: sale un jugador de una línea y entra otro en otra línea."
      : "La nueva formación no encaja con un único cambio de jugador.",
    from: fromFormation.id,
    to: toFormation.id,
    removedLine: removedLines[0],
    addedLine: addedLines[0],
  };
}
