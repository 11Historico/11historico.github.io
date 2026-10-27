import { sortCareerLocalRanking } from "./careerRanking";
import type { CareerLocalRankingEntry, CareerTrophyCounts } from "../types/career";

export interface CareerAchievement {
  id: string;
  label: string;
  description: string;
}

const NO_TROPHIES_LABEL = "Sin títulos todavía";

export function formatCareerTrophyCounts(trophyCounts: CareerTrophyCounts): string {
  const parts = [
    [`Liga`, trophyCounts.liga],
    [`Copa`, trophyCounts.copa],
    [`Supercopa`, trophyCounts.supercopa],
    [`Champions`, trophyCounts.champions],
    [`Europa League`, trophyCounts.europaLeague],
    [`Conference`, trophyCounts.conference],
  ]
    .filter(([, count]) => Number(count) > 0)
    .map(([label, count]) => `${count} ${label}`);

  return parts.length > 0 ? parts.join(" · ") : NO_TROPHIES_LABEL;
}

export function getBestEuropeanAchievement(trophyCounts: CareerTrophyCounts): string | undefined {
  if (trophyCounts.champions > 0) return "Campeón de Champions";
  if (trophyCounts.europaLeague > 0) return "Campeón de Europa League";
  if (trophyCounts.conference > 0) return "Campeón de Conference";

  return undefined;
}

export function buildCareerShareText(entry: CareerLocalRankingEntry): string {
  const europeanAchievement = getBestEuropeanAchievement(entry.trophyCounts);
  const lines = [
    "🏆 Mi Athletic Histórico",
    "",
    `Temporadas superadas: ${entry.completedSeasons}`,
    `Puntos: ${entry.arcadeScore}`,
    `Palmarés: ${formatCareerTrophyCounts(entry.trophyCounts)}`,
    `Mejor Liga: ${entry.bestLeaguePosition}.º`,
    `Última temporada: ${entry.lastSeasonLabel} · ${entry.lastLeaguePosition}.º`,
  ];

  if (europeanAchievement) {
    lines.push(`Mejor hito europeo: ${europeanAchievement}`);
  }

  lines.push("", "¿Lo superas?");
  return lines.join("\n");
}

export function getCareerAchievements(params: {
  completedSeasons: number;
  trophyCounts: CareerTrophyCounts;
  qualifiedForEurope: boolean;
  reachedEuropeanFinal?: boolean;
  rankingPosition?: number;
}): CareerAchievement[] {
  const achievements: CareerAchievement[] = [];
  const { completedSeasons, trophyCounts, qualifiedForEurope, reachedEuropeanFinal, rankingPosition } = params;
  const europeanChampion = trophyCounts.champions > 0 || trophyCounts.europaLeague > 0 || trophyCounts.conference > 0;

  if (qualifiedForEurope || europeanChampion) {
    achievements.push({
      id: "first_european_qualification",
      label: "Primera clasificación europea",
      description: "La carrera consiguió billete europeo al menos una vez.",
    });
  }

  if (reachedEuropeanFinal || europeanChampion) {
    achievements.push({
      id: "first_european_final",
      label: "Primera final europea",
      description: "La carrera alcanzó al menos una final europea.",
    });
  }

  if (europeanChampion) {
    achievements.push({
      id: "first_european_title",
      label: "Primer título europeo",
      description: "El palmarés incluye al menos una competición europea.",
    });
  }

  if (trophyCounts.champions > 0) {
    achievements.push({
      id: "champions_winner",
      label: "Campeón de Champions",
      description: "Ganaste la competición europea más exigente.",
    });
  }

  if (trophyCounts.europaLeague > 0) {
    achievements.push({
      id: "europa_league_winner",
      label: "Campeón de Europa League",
      description: "Ganaste una Europa League en carrera.",
    });
  }

  if (trophyCounts.conference > 0) {
    achievements.push({
      id: "conference_winner",
      label: "Campeón de Conference",
      description: "Ganaste una Conference League en carrera.",
    });
  }

  if (completedSeasons >= 5) {
    achievements.push({
      id: "five_seasons_survivor",
      label: "Sobrevive 5 temporadas",
      description: "Mantener la carrera viva 5 temporadas ya es una marca seria.",
    });
  }

  if (rankingPosition !== undefined && rankingPosition > 0 && rankingPosition <= 10) {
    achievements.push({
      id: "local_top_10",
      label: "Top 10 local",
      description: "La carrera entra en el Top 10 del ranking local.",
    });
  }

  const seen = new Set<string>();
  return achievements.filter((achievement) => {
    if (seen.has(achievement.id)) return false;
    seen.add(achievement.id);
    return true;
  });
}

export function getCareerRankingPosition(
  entry: CareerLocalRankingEntry | undefined,
  entries: CareerLocalRankingEntry[],
): number | undefined {
  if (!entry) return undefined;

  const sorted = sortCareerLocalRanking(entries);
  const index = sorted.findIndex((candidate) => candidate.id === entry.id);

  return index >= 0 ? index + 1 : undefined;
}

export function isNewCareerPersonalRecord(
  entry: CareerLocalRankingEntry | undefined,
  entries: CareerLocalRankingEntry[],
): boolean {
  const position = getCareerRankingPosition(entry, entries);

  return position === 1 && entries
    .filter((candidate) => candidate.id !== entry?.id)
    .every((candidate) => (entry?.arcadeScore ?? -Infinity) > candidate.arcadeScore);
}
