// src/simulation/decisionBalance.ts
//
// Balance de decisiones de la temporada (v0.25.96). Cada partido de Copa, Europa o
// Supercopa ya guarda qué habría pasado sin tu planteamiento (approachEffect) o sin tu
// decisión del descanso (halfTimeEffect). Aquí se suman: en cuántos partidos decidiste y
// cuántos resultados a los 90 minutos cambiaron, a favor o en contra. Solo informa.

import type { MatchApproachEffect, MatchHalfTimeEffect } from "../types/game";

interface DecidedMatch {
  approachEffect?: MatchApproachEffect;
  halfTimeEffect?: MatchHalfTimeEffect;
}

export interface DecisionBalance {
  /** Partidos con planteamiento distinto de equilibrado o con cambio en el descanso. */
  decided: number;
  /** Resultados a los 90 minutos que mejoraron (derrota → empate o victoria, empate → victoria). */
  better: number;
  /** Resultados a los 90 minutos que empeoraron. */
  worse: number;
}

/**
 * El resultado con tus decisiones frente al de no tocar nada: equilibrado y seguir igual.
 * Si el descanso cambió el marcador, el partido ya no guarda la comparación del planteamiento
 * (applyHalfTimeChoice la quita), así que se compara con el marcador antes del descanso.
 */
function getOutcomes(match: DecidedMatch): { final: number; baseline: number } | undefined {
  const { approachEffect, halfTimeEffect } = match;

  if (halfTimeEffect) {
    const baseline = approachEffect
      ? approachEffect.balancedUserGoals - approachEffect.balancedRivalGoals
      : halfTimeEffect.keptUserGoals - halfTimeEffect.keptRivalGoals;
    return { final: Math.sign(halfTimeEffect.userGoals - halfTimeEffect.rivalGoals), baseline: Math.sign(baseline) };
  }

  if (approachEffect) {
    return {
      final: Math.sign(approachEffect.userGoals - approachEffect.rivalGoals),
      baseline: Math.sign(approachEffect.balancedUserGoals - approachEffect.balancedRivalGoals),
    };
  }

  return undefined;
}

export function getDecisionBalance(matches: DecidedMatch[]): DecisionBalance {
  const balance: DecisionBalance = { decided: 0, better: 0, worse: 0 };

  for (const match of matches) {
    const outcomes = getOutcomes(match);
    if (!outcomes) continue;

    balance.decided += 1;
    if (outcomes.final > outcomes.baseline) balance.better += 1;
    if (outcomes.final < outcomes.baseline) balance.worse += 1;
  }

  return balance;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** Undefined si no has decidido en ningún partido: no hay nada que contar. */
export function getDecisionBalanceText(balance: DecisionBalance): string | undefined {
  if (balance.decided === 0) return undefined;

  const decided = `Tus decisiones esta temporada: decidiste en ${plural(balance.decided, "partido", "partidos")}`;
  const changed = balance.better + balance.worse;

  if (changed === 0) return `${decided} y ningún resultado habría sido distinto sin tocar nada.`;

  const parts = [
    balance.better > 0 ? `${balance.better} a favor` : undefined,
    balance.worse > 0 ? `${balance.worse} en contra` : undefined,
  ].filter(Boolean).join(" y ");

  return `${decided} y cambiaste ${plural(changed, "resultado", "resultados")}: ${parts}.`;
}
