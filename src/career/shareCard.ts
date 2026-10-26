// src/career/shareCard.ts
//
// Contenido de la imagen para compartir una carrera (v0.25.37). Función pura: no lee el DOM
// ni el almacenamiento. No incluye el nick ni identificadores de partida.

import type { CareerLocalRankingEntry } from "../types/career";
import { formatCareerTrophyCounts, getBestEuropeanAchievement } from "./shareRetention";

export interface ShareCardContent {
  title: string;
  seasons: string;
  points: string;
  palmares: string;
  bestLeague: string;
  lastSeason: string;
  europe?: string;
  footer: string;
}

export function getShareCardContent(entry: CareerLocalRankingEntry): ShareCardContent {
  const europe = getBestEuropeanAchievement(entry.trophyCounts);
  const seasons = entry.completedSeasons === 1 ? "1 temporada superada" : `${entry.completedSeasons} temporadas superadas`;

  return {
    title: "Mi Once Histórico",
    seasons,
    points: `Puntos: ${entry.arcadeScore}`,
    palmares: `Palmarés: ${formatCareerTrophyCounts(entry.trophyCounts)}`,
    bestLeague: `Mejor Liga: ${entry.bestLeaguePosition}.º`,
    lastSeason: `Última temporada: ${entry.lastSeasonLabel} · ${entry.lastLeaguePosition}.º`,
    europe: europe ? `Mejor hito europeo: ${europe}` : undefined,
    footer: "Once Histórico · ikeritu.github.io/11Historico",
  };
}

export function getShareCardFileName(entry: CareerLocalRankingEntry): string {
  return `futbol11-carrera-${entry.completedSeasons}-temporadas.png`;
}
