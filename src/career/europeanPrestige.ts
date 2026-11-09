// src/career/europeanPrestige.ts
//
// v0.24.4a European Rewards / Prestige.
//
// Traduce el resultado final de una campaña europea (campeón, finalista,
// eliminado en semifinales o eliminado en fase inicial) en una recompensa de
// prestigio: un bonus de rating puntual para la siguiente temporada (nunca
// acumulable, con techo por Math.max) más un texto narrativo. No añade
// títulos al palmarés (eso lo hace europeanTrophies.ts): esto es prestigio y
// forma, no honores.
//
// Reglas (roadmap v0.24.4a):
// - Campeón: bonus según competición, sin superar +1.0 (Champions), +0.75
//   (Europa League) o +0.5 (Conference).
// - Final perdida: bonus menor fijo +0.25, con texto de prestigio.
// - Semifinal o previa perdidas, o eliminación en fase inicial: sin bonus,
//   solo texto narrativo de prestigio.
// - Idempotente: una vez otorgado (europeanPrestigeAwarded), no vuelve a
//   concederse aunque se recalcule sobre el mismo torneo.

import { getEuropeanCareerTrophyLabel } from "./europeanTrophies";
import { getEuropeanLeaguePhaseUserPosition } from "../europe/europeanTournament";
import type { EuropeanTournamentState } from "../europe/europeanTypes";

export type EuropeanPrestigeTier = "champion" | "runner_up" | "semifinal" | "playoff" | "league_phase";

export interface EuropeanPrestigeReward {
  tier: EuropeanPrestigeTier;
  competitionLabel: string;
  ratingBonus: number;
  narrative: string;
}

const CHAMPION_RATING_BONUS: Record<EuropeanTournamentState["competition"], number> = {
  champions_league: 1.0,
  europa_league: 0.75,
  conference_league: 0.5,
};

const RUNNER_UP_RATING_BONUS = 0.25;

function reachedPhase(tournament: EuropeanTournamentState, phase: "playoff" | "semifinal" | "final"): boolean {
  return tournament.matches.some((match) => match.phase === phase);
}

export function hasPendingEuropeanPrestige(
  tournament: EuropeanTournamentState | null | undefined,
): tournament is EuropeanTournamentState {
  return Boolean(
    tournament &&
      (tournament.completed || tournament.eliminated) &&
      !tournament.europeanPrestigeAwarded,
  );
}

export function getEuropeanPrestigeTier(tournament: EuropeanTournamentState): EuropeanPrestigeTier {
  if (tournament.completed && tournament.champion) return "champion";
  // Tanto perder la final como perder la semifinal dejan el torneo
  // "completed" con champion=false (ver europeanTournament.ts), así que hay
  // que distinguirlos por si llegó a disputarse la final, no solo por
  // completed/champion.
  if (reachedPhase(tournament, "final")) return "runner_up";
  if (reachedPhase(tournament, "semifinal")) return "semifinal";
  if (reachedPhase(tournament, "playoff")) return "playoff";
  return "league_phase";
}

export function buildEuropeanPrestigeReward(tournament: EuropeanTournamentState): EuropeanPrestigeReward {
  const tier = getEuropeanPrestigeTier(tournament);
  const competitionLabel = getEuropeanCareerTrophyLabel(tournament.competition);

  if (tier === "champion") {
    return {
      tier,
      competitionLabel,
      ratingBonus: CHAMPION_RATING_BONUS[tournament.competition],
      narrative: `Campeón de ${competitionLabel}: el prestigio europeo conquistado da un impulso de forma al equipo la próxima temporada.`,
    };
  }

  if (tier === "runner_up") {
    return {
      tier,
      competitionLabel,
      ratingBonus: RUNNER_UP_RATING_BONUS,
      narrative: `Finalista de ${competitionLabel}: la final europea deja prestigio y un pequeño empujón de forma, aunque el título se resistiera.`,
    };
  }

  if (tier === "semifinal") {
    return {
      tier,
      competitionLabel,
      ratingBonus: 0,
      narrative: `Semifinalista de ${competitionLabel}: la eliminatoria europea queda en el recuerdo, pero no deja un bonus de forma medible.`,
    };
  }

  if (tier === "playoff") {
    return {
      tier,
      competitionLabel,
      ratingBonus: 0,
      narrative: `Eliminado en la previa de ${competitionLabel}: a un partido de semifinales, sin prestigio adicional para la próxima temporada.`,
    };
  }

  // v0.25.92: el puesto en la tabla dice lo cerca que se quedó de semifinales.
  const position = getEuropeanLeaguePhaseUserPosition(tournament);
  const teams = tournament.matches.filter((match) => match.phase === "league_phase").length + 1;
  const place = position > 0 ? ` (${position}.º de ${teams})` : "";

  return {
    tier,
    competitionLabel,
    ratingBonus: 0,
    narrative: `Eliminado en la fase inicial de ${competitionLabel}${place}: sin prestigio adicional para la próxima temporada.`,
  };
}

export function markEuropeanPrestigeAwarded(
  tournament: EuropeanTournamentState,
  awardedAt = new Date().toISOString(),
): EuropeanTournamentState {
  if (!hasPendingEuropeanPrestige(tournament)) return tournament;

  return {
    ...tournament,
    europeanPrestigeAwarded: true,
    europeanPrestigeAwardedAt: awardedAt,
  };
}

export function awardEuropeanPrestigeToCareer(params: {
  previousRatingBonus: number;
  tournament: EuropeanTournamentState | null | undefined;
  awardedAt?: string;
}): {
  nextRatingBonus: number;
  tournament: EuropeanTournamentState | null | undefined;
  reward: EuropeanPrestigeReward | null;
  awarded: boolean;
} {
  if (!hasPendingEuropeanPrestige(params.tournament)) {
    return {
      nextRatingBonus: params.previousRatingBonus,
      tournament: params.tournament,
      reward: null,
      awarded: false,
    };
  }

  const reward = buildEuropeanPrestigeReward(params.tournament);

  return {
    nextRatingBonus: Math.max(params.previousRatingBonus, reward.ratingBonus),
    tournament: markEuropeanPrestigeAwarded(params.tournament, params.awardedAt),
    reward,
    awarded: true,
  };
}
