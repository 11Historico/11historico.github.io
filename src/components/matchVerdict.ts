// src/components/matchVerdict.ts
//
// Qué dice el cartel al final de un partido de eliminatoria (v0.25.86). Lo pinta MatchVerdictBanner.

import { getEuropeanCompetitionLabel } from "../europe/europeanQualification";
import type { EuropeanTournamentMatch, EuropeanTournamentState } from "../europe/europeanTypes";
import type { MatchResult } from "../types/game";

export interface MatchVerdict {
  kind: "out" | "through" | "champion";
  title: string;
  detail: string;
}

/** Copa del Rey: cada partido es una eliminatoria. La Supercopa ya tiene su propio veredicto. */
export function getCupVerdict(result: MatchResult): MatchVerdict | undefined {
  if (result.competition !== "cup" || result.roundName?.startsWith("Supercopa") || result.userTeamPlayed === false) {
    return undefined;
  }

  const isFinal = result.roundName === "Final";
  if (result.userTeamLost) {
    return isFinal
      ? { kind: "out", title: "Subcampeón", detail: "Has perdido la final de la Copa del Rey." }
      : { kind: "out", title: "Has sido eliminado", detail: `Fuera de la Copa del Rey en ${result.roundName ?? "Copa"}.` };
  }
  if (!result.userTeamWon) return undefined;

  if (isFinal) return { kind: "champion", title: "¡Campeón de Copa!", detail: "Has ganado la Copa del Rey." };
  return {
    kind: "through",
    title: "Has clasificado",
    detail: result.roundName === "Semifinal" ? "Estás en la final de la Copa del Rey." : "Sigues vivo en la Copa del Rey.",
  };
}

/**
 * Europa: en la fase inicial solo decide el último partido; en la previa, la semifinal y la final, cada partido.
 * `tournament` es el estado después del partido.
 */
export function getEuropeanVerdict(
  tournament: EuropeanTournamentState,
  match: EuropeanTournamentMatch,
): MatchVerdict | undefined {
  const competition = getEuropeanCompetitionLabel(match.competition);

  if (match.phase === "league_phase") {
    const lastLeagueMatch = tournament.matches.filter((candidate) => candidate.phase === "league_phase").at(-1);
    if (lastLeagueMatch?.id !== match.id) return undefined;
    if (tournament.qualifiedForSemifinal) {
      return { kind: "through", title: "Has clasificado", detail: `Pasas a semifinales de la ${competition}.` };
    }
    if (tournament.phase === "playoff") {
      return { kind: "through", title: "Juegas la previa", detail: `Un partido más por entrar en las semifinales de la ${competition}.` };
    }
    if (tournament.eliminated) {
      return { kind: "out", title: "Has sido eliminado", detail: `Fuera de la ${competition} en la fase inicial.` };
    }
    return undefined;
  }

  if (match.phase === "playoff") {
    if (match.result === "win") return { kind: "through", title: "Has clasificado", detail: `Pasas a semifinales de la ${competition}.` };
    if (match.result === "loss") return { kind: "out", title: "Has sido eliminado", detail: `Fuera de la ${competition} en la previa.` };
    return undefined;
  }

  if (match.phase === "semifinal") {
    if (match.result === "win") return { kind: "through", title: "Has clasificado", detail: `Estás en la final de la ${competition}.` };
    if (match.result === "loss") return { kind: "out", title: "Has sido eliminado", detail: `Fuera de la ${competition} en semifinales.` };
    return undefined;
  }

  if (match.phase === "final") {
    if (match.result === "win") return { kind: "champion", title: `¡Campeón de la ${competition}!`, detail: "Se sumará al palmarés al cerrar la temporada." };
    if (match.result === "loss") return { kind: "out", title: "Subcampeón", detail: `Has perdido la final de la ${competition}.` };
  }

  return undefined;
}
