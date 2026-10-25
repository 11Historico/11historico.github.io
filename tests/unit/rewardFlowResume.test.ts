import { describe, expect, it } from "vitest";
import { getRewardFlowResumeScreen } from "../../src/app/careerRewardFlow";
import type { SelectedPlayer } from "../../src/types/game";

const removed = { slotId: "lw" } as unknown as SelectedPlayer;

describe("getRewardFlowResumeScreen", () => {
  it("sin flujo de recompensa usa la fase guardada", () => {
    expect(getRewardFlowResumeScreen({})).toBeUndefined();
    expect(getRewardFlowResumeScreen({ careerRewardFlow: "luck_wheel_coach" })).toBeUndefined();
  });

  it("reemplazo de jugador sin temporada sorteada vuelve al selector", () => {
    expect(getRewardFlowResumeScreen({ careerRewardFlow: "luck_wheel_player" })).toBe("career_player_replacement_pick");
    expect(getRewardFlowResumeScreen({ careerRewardFlow: "standard_player" })).toBe("career_player_replacement_pick");
  });

  it("reemplazo con temporada sorteada vuelve al draft del sustituto", () => {
    expect(
      getRewardFlowResumeScreen({ careerRewardFlow: "luck_wheel_player", replacementDraftSeason: "2028/29" as never, replacementRemovedPlayer: removed }),
    ).toBe("career_player_replacement_draft");
  });

  it("cambio de formación con jugador retirado vuelve al selector de formación", () => {
    expect(getRewardFlowResumeScreen({ careerRewardFlow: "player_formation", replacementRemovedPlayer: removed })).toBe("career_formation_change");
    expect(getRewardFlowResumeScreen({ careerRewardFlow: "player_formation" })).toBe("career_player_replacement_pick");
  });
});
