// src/data/sources.ts

import type { DataSource, RatingMethod } from "../types/game";

/** Texto visible del método de valoración en las tarjetas de jugador y entrenador. */
export const RATING_METHOD_LABELS: Record<RatingMethod, string> = {
  official: "Valoración oficial",
  stats: "Por estadísticas",
  mixed: "Estadísticas + estimación",
  manual_estimate: "Estimación manual",
};

/**
 * Fuentes base para construir el dataset de Once histórico Zurigorri.
 *
 * Regla del proyecto:
 * - Los datos objetivos deben salir de fuentes reales y trazables.
 * - Los skills 0-100 no son datos oficiales universales; se derivarán mediante fórmula.
 * - Cuando una temporada tenga datos incompletos, se marcará como "mixed" o "manual_estimate"
 *   en cada PlayerSeason/CoachSeason.
 */
export const DATA_SOURCES: Record<string, DataSource> = {
  // ==========================
  // ATHLETIC CLUB — FUENTE OFICIAL
  // ==========================

  "athletic-official-1983-84-squad": {
    id: "athletic-official-1983-84-squad",
    name: "Athletic Club official squad 1983/84",
    url: "https://www.athletic-club.eus/en/teams/athletic-club/1983-84/squad/",
    type: "official_squad",
    description:
      "Plantilla oficial del Athletic Club para la temporada 1983/84.",
  },

  "athletic-official-1997-98-squad": {
    id: "athletic-official-1997-98-squad",
    name: "Athletic Club official squad 1997/98",
    url: "https://www.athletic-club.eus/en/teams/athletic-club/1997-98/squad/",
    type: "official_squad",
    description:
      "Plantilla oficial del Athletic Club para la temporada 1997/98.",
  },

  "athletic-official-1997-98-matches": {
    id: "athletic-official-1997-98-matches",
    name: "Athletic Club official matches 1997/98",
    url: "https://www.athletic-club.eus/en/teams/athletic-club/1997-98/matches/",
    type: "official_matches",
    description:
      "Partidos oficiales del Athletic Club para la temporada 1997/98.",
  },

  "athletic-official-2011-12-squad": {
    id: "athletic-official-2011-12-squad",
    name: "Athletic Club official squad 2011/12",
    url: "https://www.athletic-club.eus/en/teams/athletic-club/2011-12/squad/",
    type: "official_squad",
    description:
      "Plantilla oficial del Athletic Club para la temporada 2011/12.",
  },

  "athletic-official-2015-16-squad": {
    id: "athletic-official-2015-16-squad",
    name: "Athletic Club official squad 2015/16",
    url: "https://www.athletic-club.eus/equipos/athletic-club/2015-16/plantilla/",
    type: "official_squad",
    description:
      "Plantilla oficial del Athletic Club para la temporada 2015/16.",
  },

  "athletic-official-2023-24-squad": {
    id: "athletic-official-2023-24-squad",
    name: "Athletic Club official squad 2023/24",
    url: "https://www.athletic-club.eus/en/teams/athletic-club/2023-24/squad/",
    type: "official_squad",
    description:
      "Plantilla oficial del Athletic Club para la temporada 2023/24.",
  },

  // ==========================
  // REFERENCIAS ESTADÍSTICAS / COMPLEMENTARIAS
  // ==========================

  "espn-athletic-2015-16-squad-stats": {
    id: "espn-athletic-2015-16-squad-stats",
    name: "ESPN Athletic Club squad stats 2015/16",
    url: "https://www.espn.com/soccer/team/squad/_/id/93/season/2015",
    type: "stats",
    description:
      "Referencia complementaria para apariciones, minutos, goles y asistencias de Athletic Club 2015/16.",
  },

  "transfermarkt-athletic": {
    id: "transfermarkt-athletic",
    name: "Transfermarkt Athletic Club squad and player statistics",
    url: "https://www.transfermarkt.com/athletic-bilbao/startseite/verein/621",
    type: "market_reference",
    description:
      "Referencia complementaria para plantillas, posiciones y estadísticas por temporada.",
  },

  "bdfutbol-athletic": {
    id: "bdfutbol-athletic",
    name: "BDFutbol Athletic Club historical data",
    url: "https://www.bdfutbol.com/en/e/e1.html",
    type: "historical_reference",
    description:
      "Referencia histórica complementaria para temporadas antiguas, jugadores, partidos y entrenadores.",
  },

  "worldfootball-athletic": {
    id: "worldfootball-athletic",
    name: "worldfootball.net Athletic Club historical squads",
    url: "https://www.worldfootball.net/teams/athletic-bilbao/",
    type: "historical_reference",
    description:
      "Referencia histórica complementaria para plantillas y datos de temporadas.",
  },

  "wikipedia-athletic-1983-84-season": {
    id: "wikipedia-athletic-1983-84-season",
    name: "1983/84 Athletic Bilbao season reference",
    url: "https://en.wikipedia.org/wiki/1983%E2%80%9384_Athletic_Bilbao_season",
    type: "historical_reference",
    description:
      "Referencia complementaria para la temporada 1983/84. No debe ser fuente única si hay alternativa oficial.",
  },

  "wikipedia-athletic-2011-12-season": {
    id: "wikipedia-athletic-2011-12-season",
    name: "2011/12 Athletic Bilbao season reference",
    url: "https://en.wikipedia.org/wiki/2011%E2%80%9312_Athletic_Bilbao_season",
    type: "historical_reference",
    description:
      "Referencia complementaria para la temporada 2011/12. No debe ser fuente única si hay alternativa oficial.",
  },

  // ==========================
  // REVISIÓN MANUAL
  // ==========================

  "manual-rating-review": {
    id: "manual-rating-review",
    name: "Manual historical rating review",
    url: "internal://manual-rating-review",
    type: "manual_review",
    description:
      "Revisión manual razonada para convertir contexto histórico y datos incompletos en skills 0-100. Debe justificarse en notes.",
  },
};

export function getDataSourceById(sourceId: string): DataSource | undefined {
  return DATA_SOURCES[sourceId];
}

export function getDataSourcesByIds(sourceIds: string[]): DataSource[] {
  return sourceIds
    .map((sourceId) => DATA_SOURCES[sourceId])
    .filter((source): source is DataSource => Boolean(source));
}
