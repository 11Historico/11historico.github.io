import { describe, expect, it } from "vitest";
import { buildEuropeanPrestigeReward } from "../../src/career/europeanPrestige";
import { buildEuropeanBracketColumns } from "../../src/career/seasonBrackets";
import { getEuropeanVerdict } from "../../src/components/matchVerdict";
import { getEuropeanMatchdaySlots } from "../../src/europe/europeanCalendar";
import { normalizeEuropeanCareerState } from "../../src/europe/europeanCareerState";
import { buildEuropeanLeaguePhaseTable } from "../../src/europe/europeanLeagueTable";
import { getEuropeanSeasonBalanceText } from "../../src/europe/europeanSemifinalChance";
import {
  applyEuropeanMatchResult,
  createEuropeanTournamentForQualification,
  getEuropeanLeaguePhaseUserPosition,
  isEuropeanKnockoutMatch,
} from "../../src/europe/europeanTournament";
import type { EuropeanMatchOutcome, EuropeanQualificationResult, EuropeanTournamentState } from "../../src/europe/europeanTypes";

type Score = [number, number];
const outcome = ([userGoals, opponentGoals]: Score) => ({
  userGoals,
  opponentGoals,
  result: (userGoals > opponentGoals ? "win" : userGoals === opponentGoals ? "draw" : "loss") as EuropeanMatchOutcome,
});

function playLeaguePhase(seed: string, scores: Score[]): EuropeanTournamentState {
  const created = createEuropeanTournamentForQualification({
    seasonNumber: 1,
    qualification: { qualified: true, competition: "europa_league" } as EuropeanQualificationResult,
    seed,
    totalLeagueMatchdays: 38,
  });
  if (!created) throw new Error("No se creó el torneo.");
  return created.matches.reduce((state, match, index) => applyEuropeanMatchResult(state, match.id, outcome(scores[index]), 38), created);
}

// Busca, con semillas y marcadores fijos, una fase inicial que acabe en el puesto pedido.
const PATTERNS: Score[][] = [
  [[2, 0], [2, 0], [2, 0], [0, 2], [0, 2], [0, 2]],
  [[2, 0], [2, 0], [1, 1], [0, 2], [0, 2], [0, 2]],
  [[2, 0], [1, 1], [1, 1], [0, 2], [0, 2], [0, 2]],
  [[2, 0], [2, 0], [2, 0], [1, 1], [0, 2], [0, 2]],
  [[1, 1], [1, 1], [1, 1], [1, 1], [0, 1], [1, 0]],
];
function finishing(position: number): EuropeanTournamentState {
  for (let seed = 0; seed < 50; seed += 1) {
    for (const scores of PATTERNS) {
      const tournament = playLeaguePhase(`playoff_${seed}`, scores);
      if (getEuropeanLeaguePhaseUserPosition(tournament) === position) return tournament;
    }
  }
  throw new Error(`No se encontró una fase inicial que acabe ${position}.º.`);
}

const playoffOf = (tournament: EuropeanTournamentState) => tournament.matches.find((match) => match.phase === "playoff");

describe("previa europea del 3.º contra el 4.º (v0.25.107)", () => {
  it("el 3.º juega la previa en casa contra el 4.º de su tabla, en la jornada 27", () => {
    const tournament = finishing(3);
    const playoff = playoffOf(tournament)!;
    const table = buildEuropeanLeaguePhaseTable(tournament, "user");

    expect(tournament.phase).toBe("playoff");
    expect(tournament.eliminated).toBe(false);
    expect(tournament.qualifiedForSemifinal).toBe(false);
    expect(tournament.currentMatchId).toBe(playoff.id);
    expect(playoff).toMatchObject({ isHome: true, matchday: 27, status: "scheduled" });
    expect(playoff.opponent.id).toBe(table[3].teamId);
    expect(isEuropeanKnockoutMatch(playoff)).toBe(true);
  });

  it("el 4.º la juega fuera contra el 3.º", () => {
    const tournament = finishing(4);
    const playoff = playoffOf(tournament)!;

    expect(tournament.phase).toBe("playoff");
    expect(playoff.isHome).toBe(false);
    expect(playoff.opponent.id).toBe(buildEuropeanLeaguePhaseTable(tournament, "user")[2].teamId);
  });

  it("del 5.º en adelante, eliminado como antes y sin previa", () => {
    const tournament = playLeaguePhase("playoff_out", Array.from({ length: 6 }, (): Score => [0, 3]));

    expect(getEuropeanLeaguePhaseUserPosition(tournament)).toBeGreaterThan(4);
    expect(tournament.phase).toBe("eliminated");
    expect(playoffOf(tournament)).toBeUndefined();
  });

  it("ganar la previa lleva a semifinales contra un club que no estaba en la fase inicial", () => {
    const tournament = finishing(3);
    const after = applyEuropeanMatchResult(tournament, playoffOf(tournament)!.id, outcome([2, 1]), 38);
    const semifinal = after.matches.find((match) => match.phase === "semifinal")!;
    const leagueOpponents = tournament.matches.filter((match) => match.phase === "league_phase").map((match) => match.opponent.id);

    expect(after).toMatchObject({ phase: "semifinal", qualifiedForSemifinal: true, eliminated: false, currentMatchId: semifinal.id });
    expect(leagueOpponents).not.toContain(semifinal.opponent.id);
    expect(getEuropeanVerdict(after, after.matches.find((match) => match.phase === "playoff")!)).toMatchObject({ kind: "through", title: "Has clasificado" });
    expect(getEuropeanSeasonBalanceText(after, 0.4)).toMatch(/^Europa: pasaste a semifinales\./);
  });

  it("perderla elimina, y el cierre de temporada habla de la previa, no de la fase inicial", () => {
    const tournament = finishing(4);
    const after = applyEuropeanMatchResult(tournament, playoffOf(tournament)!.id, outcome([0, 1]), 38);

    expect(after).toMatchObject({ phase: "eliminated", eliminated: true, completed: true, qualifiedForSemifinal: false });
    expect(after.matches.some((match) => match.phase === "semifinal")).toBe(false);
    expect(getEuropeanVerdict(after, playoffOf(after)!)).toMatchObject({ kind: "out", detail: "Fuera de la Europa League en la previa." });
    expect(buildEuropeanPrestigeReward(after)).toMatchObject({ tier: "playoff", ratingBonus: 0 });
    expect(getEuropeanSeasonBalanceText(after, 0.4)).toMatch(/^Europa: caíste en la previa \(4\.º de 7\)\./);
  });

  it("el último partido de la fase inicial avisa de la previa", () => {
    const tournament = finishing(3);
    const last = tournament.matches.filter((match) => match.phase === "league_phase").at(-1)!;

    expect(getEuropeanVerdict(tournament, last)).toMatchObject({ kind: "through", title: "Juegas la previa" });
  });

  it("el cuadro de la temporada solo enseña la previa si se jugó", () => {
    expect(buildEuropeanBracketColumns(finishing(3)).playoff?.match?.phase).toBe("playoff");
    const first = playLeaguePhase("playoff_first", Array.from({ length: 6 }, (): Score => [5, 0]));
    expect(buildEuropeanBracketColumns(first).playoff).toBeUndefined();
  });

  it("una partida guardada a mitad de previa se recupera igual, y sin jornada la recibe del calendario", () => {
    const tournament = finishing(3);
    const withoutMatchday = {
      ...tournament,
      matches: tournament.matches.map((match) => (match.phase === "playoff" ? { ...match, matchday: 0 } : match)),
    };
    const restored = normalizeEuropeanCareerState({ history: [], currentTournament: withoutMatchday }).currentTournament!;

    expect(restored.phase).toBe("playoff");
    expect(playoffOf(restored)!.matchday).toBe(27);
  });

  it("con ligas de otro tamaño, la previa cae entre la fase inicial y la semifinal", () => {
    for (const total of [20, 30, 42]) {
      const slots = getEuropeanMatchdaySlots(total);
      expect(slots.playoff).toBeGreaterThan(slots.leaguePhase.at(-1)!);
      expect(slots.semifinal).toBeGreaterThan(slots.playoff);
    }
  });
});
