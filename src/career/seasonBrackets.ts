// src/career/seasonBrackets.ts
//
// Cuadros de fin de temporada (v0.25.11): lógica pura. Convierte los resultados
// guardados en columnas por ronda. La Copa muestra el camino del Athletic y los
// partidos simulados de las rondas siguientes; las rondas sin datos quedan pendientes.

import { USER_TEAM_NAME } from "../simulation/leagueTable";
import type { EuropeanTournamentMatch, EuropeanTournamentState } from "../europe/europeanTypes";
import type { MatchResult } from "../types/game";

export const CUP_ROUND_ORDER = ["Dieciseisavos", "Octavos", "Cuartos", "Semifinal", "Final"] as const;

export type BracketStatus = "played" | "simulated" | "pending";

export interface CupBracketRow {
  roundName: string;
  status: BracketStatus;
  result?: MatchResult;
}

export interface EuropeanBracketSlot {
  match?: EuropeanTournamentMatch;
  status: BracketStatus;
}

export interface EuropeanBracketColumns {
  leagueMatches: EuropeanTournamentMatch[];
  semifinal: EuropeanBracketSlot;
  final: EuropeanBracketSlot;
}

export function buildCupBracketRows(params: {
  cupResults?: MatchResult[];
  simulatedResults?: MatchResult[];
}): CupBracketRow[] {
  const played = new Map((params.cupResults ?? []).map((result) => [result.roundName ?? "", result]));
  const simulated = new Map((params.simulatedResults ?? []).map((result) => [result.roundName ?? "", result]));

  return CUP_ROUND_ORDER.map((roundName) => {
    const userResult = played.get(roundName);
    if (userResult) return { roundName, status: "played", result: userResult };

    const simulatedResult = simulated.get(roundName);
    if (simulatedResult) return { roundName, status: "simulated", result: simulatedResult };

    return { roundName, status: "pending" };
  });
}

/** Ganador de un partido de Copa a partir del marcador (la Copa no admite empate). */
export function getCupMatchWinner(result: MatchResult): "home" | "away" | undefined {
  if (result.homeGoals > result.awayGoals) return "home";
  if (result.awayGoals > result.homeGoals) return "away";
  return undefined;
}

export function isUserTeamName(teamName: string): boolean {
  return teamName === USER_TEAM_NAME;
}

export function buildEuropeanBracketColumns(tournament: EuropeanTournamentState): EuropeanBracketColumns {
  const slotFor = (phase: "semifinal" | "final"): EuropeanBracketSlot => {
    const match = tournament.matches.find((candidate) => candidate.phase === phase);
    if (!match) return { status: "pending" };

    return { match, status: match.status === "played" ? "played" : "pending" };
  };

  return {
    leagueMatches: tournament.matches.filter((match) => match.phase === "league_phase"),
    semifinal: slotFor("semifinal"),
    final: slotFor("final"),
  };
}
