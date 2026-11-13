// src/simulation/decisionBalance.ts
//
// Balance de decisiones de la temporada (v0.25.96). Cada partido ya guarda qué habría pasado
// sin tu planteamiento (approachEffect), sin tu decisión del descanso (halfTimeEffect) o, desde
// la v0.25.114, sin tu carta (cardEffect, también en Liga). Aquí se suman: en cuántos partidos
// decidiste y cuántos resultados a los 90 minutos cambiaron, a favor o en contra. Solo informa.

import type { MatchApproachEffect, MatchCardComparison, MatchHalfTimeEffect } from "../types/game";

interface DecidedMatch {
  approachEffect?: MatchApproachEffect;
  halfTimeEffect?: MatchHalfTimeEffect;
  cardEffect?: MatchCardComparison;
}

export interface DecisionBalance {
  /** Partidos con planteamiento distinto de equilibrado, con cambio en el descanso o con carta. */
  decided: number;
  /** Resultados a los 90 minutos que mejoraron (derrota → empate o victoria, empate → victoria). */
  better: number;
  /** Resultados a los 90 minutos que empeoraron. */
  worse: number;
}

/**
 * El resultado con tus decisiones frente al de no tocar nada: equilibrado y seguir igual.
 * Si el descanso cambió el marcador, el partido ya no guarda la comparación del planteamiento
 * ni la de la carta jugada antes (applyHalfTimeChoice las quita), así que se compara con el
 * marcador antes del descanso.
 *
 * Con carta (v0.25.114): la carta del descanso va después de la decisión del descanso, así que
 * su marcador es el final. Una carta jugada antes del partido se compara con el partido sin ella;
 * si además hubo planteamiento, ese partido sin carta lo conserva.
 */
function getOutcomes(match: DecidedMatch): { final: number; baseline: number } | undefined {
  const { approachEffect, halfTimeEffect, cardEffect } = match;

  if (cardEffect && !cardEffect.halftime) {
    return {
      final: Math.sign(cardEffect.userGoals - cardEffect.rivalGoals),
      baseline: Math.sign(cardEffect.withoutUserGoals - cardEffect.withoutRivalGoals),
    };
  }

  if (halfTimeEffect) {
    const baseline = approachEffect
      ? approachEffect.balancedUserGoals - approachEffect.balancedRivalGoals
      : halfTimeEffect.keptUserGoals - halfTimeEffect.keptRivalGoals;
    const final = cardEffect ? cardEffect.userGoals - cardEffect.rivalGoals : halfTimeEffect.userGoals - halfTimeEffect.rivalGoals;
    return { final: Math.sign(final), baseline: Math.sign(baseline) };
  }

  // Carta del descanso sin cambio de planteamiento ni de descanso.
  if (cardEffect) {
    const baseline = approachEffect
      ? approachEffect.balancedUserGoals - approachEffect.balancedRivalGoals
      : cardEffect.withoutUserGoals - cardEffect.withoutRivalGoals;
    return { final: Math.sign(cardEffect.userGoals - cardEffect.rivalGoals), baseline: Math.sign(baseline) };
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
