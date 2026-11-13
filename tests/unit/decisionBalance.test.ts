import { describe, expect, it } from "vitest";
import { getDecisionBalance, getDecisionBalanceText } from "../../src/simulation/decisionBalance";

const approach = (userGoals: number, rivalGoals: number, balancedUserGoals: number, balancedRivalGoals: number) => ({
  approachEffect: { approach: "defensive" as const, userGoals, rivalGoals, balancedUserGoals, balancedRivalGoals },
});
const halfTime = (userGoals: number, rivalGoals: number, keptUserGoals: number, keptRivalGoals: number) => ({
  halfTimeEffect: { choice: "push" as const, userGoals, rivalGoals, keptUserGoals, keptRivalGoals },
});

describe("balance de decisiones de la temporada (v0.25.96)", () => {
  it("cuenta los partidos decididos y los resultados que cambiaron a favor o en contra", () => {
    const balance = getDecisionBalance([
      approach(1, 1, 0, 1), // derrota → empate: a favor
      approach(2, 1, 2, 0), // victoria → victoria: sin cambio
      halfTime(1, 2, 1, 1), // empate → derrota: en contra
      halfTime(2, 1, 1, 1), // empate → victoria: a favor
      {}, // equilibrado y seguir igual: no cuenta
    ]);

    expect(balance).toEqual({ decided: 4, better: 2, worse: 1 });
  });

  it("con planteamiento y descanso, compara con no haber tocado nada", () => {
    // El descanso no cambió el marcador, así que el partido conserva la comparación del planteamiento.
    const match = { ...approach(1, 0, 0, 0), ...halfTime(1, 0, 1, 0) };
    expect(getDecisionBalance([match])).toEqual({ decided: 1, better: 1, worse: 0 });
  });

  // v0.25.114: la temporada de prueba dijo «ningún resultado habría sido distinto» con una Revancha que salvó un empate.
  it("cuenta las cartas, antes del partido y en el descanso", () => {
    const card = (userGoals: number, rivalGoals: number, withoutUserGoals: number, withoutRivalGoals: number, halftime?: boolean) => ({
      cardEffect: { userGoals, rivalGoals, withoutUserGoals, withoutRivalGoals, ...(halftime ? { halftime } : {}) },
    });

    expect(getDecisionBalance([
      card(1, 1, 0, 1), // derrota → empate: a favor
      card(2, 0, 1, 0), // victoria → victoria: sin cambio
      card(2, 1, 1, 1, true), // descanso, empate → victoria: a favor
    ])).toEqual({ decided: 3, better: 2, worse: 0 });

    // Carta del descanso tras arriesgar: se compara con el marcador de antes del descanso.
    expect(getDecisionBalance([{ ...halfTime(1, 1, 1, 1), ...card(2, 1, 1, 1, true) }])).toEqual({ decided: 1, better: 1, worse: 0 });
    // Con planteamiento, la carta del descanso se compara con el partido equilibrado.
    expect(getDecisionBalance([{ ...approach(1, 1, 1, 2), ...card(2, 1, 1, 1, true) }])).toEqual({ decided: 1, better: 1, worse: 0 });
  });

  it("lo cuenta en una frase, y no dice nada si no has decidido", () => {
    expect(getDecisionBalanceText({ decided: 0, better: 0, worse: 0 })).toBeUndefined();
    expect(getDecisionBalanceText({ decided: 5, better: 2, worse: 1 })).toBe(
      "Tus decisiones esta temporada: decidiste en 5 partidos y cambiaste 3 resultados: 2 a favor y 1 en contra.",
    );
    expect(getDecisionBalanceText({ decided: 1, better: 1, worse: 0 })).toBe(
      "Tus decisiones esta temporada: decidiste en 1 partido y cambiaste 1 resultado: 1 a favor.",
    );
    expect(getDecisionBalanceText({ decided: 2, better: 0, worse: 0 })).toBe(
      "Tus decisiones esta temporada: decidiste en 2 partidos y ningún resultado habría sido distinto sin tocar nada.",
    );
  });
});
