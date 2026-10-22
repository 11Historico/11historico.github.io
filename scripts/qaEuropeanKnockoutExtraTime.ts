// scripts/qaEuropeanKnockoutExtraTime.ts
// QA de v0.24.9f: empate en semifinal/final = prórroga 2x15' y, si sigue igual, penaltis.

import { readFileSync } from "node:fs";
import { simulateEuropeanMatch } from "../src/europe/europeanMatchEngine";
import {
  EUROPEAN_KNOCKOUT_TIE_RULE_TEXT,
  applyEuropeanMatchResult,
  createEuropeanTournamentForQualification,
  getEuropeanMatchDecisionText,
  isEuropeanKnockoutMatch,
} from "../src/europe/europeanTournament";
import type { EuropeanQualificationResult, EuropeanTournamentState } from "../src/europe/europeanTypes";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

const SEEDS = Array.from({ length: 600 }, (_, index) => `qa_et_${index}`);
const BASE = { userTeamRating: 86, opponentRating: 86, isHome: true, competition: "champions_league" } as const;

function testKnockoutNeverDraws(): void {
  const decisions = { regular_time: 0, extra_time: 0, penalties: 0 };

  for (const seed of SEEDS) {
    const out = simulateEuropeanMatch({ ...BASE, seed, isKnockout: true });
    assert(out.result === "win" || out.result === "loss", `Una eliminatoria nunca puede terminar en empate (${seed}).`);
    assert(out.decidedBy !== undefined, `Una eliminatoria debe informar decidedBy (${seed}).`);
    decisions[out.decidedBy!] += 1;

    if (out.decidedBy === "regular_time") {
      assert(out.userGoals !== out.opponentGoals, "Decidido a los 90' implica marcador distinto.");
      assert(out.penaltyShootout === undefined, "Sin penaltis si se decide a los 90'.");
    }

    if (out.decidedBy === "extra_time") {
      assert(out.userGoals !== out.opponentGoals, "Decidido en prórroga implica marcador distinto.");
      assert(out.regularTimeUserGoals === out.regularTimeOpponentGoals, "Prórroga solo si hubo empate a los 90'.");
      assert(out.penaltyShootout === undefined, "Sin penaltis si se decide en la prórroga.");
      assert(out.userGoals >= out.regularTimeUserGoals! && out.opponentGoals >= out.regularTimeOpponentGoals!, "La prórroga solo suma goles.");
    }

    if (out.decidedBy === "penalties") {
      const shootout = out.penaltyShootout;
      assert(shootout !== undefined, "Penaltis requiere tanda.");
      assert(shootout!.userScored !== shootout!.opponentScored, "La tanda siempre debe tener ganador.");
      assert(out.userGoals === out.opponentGoals, "Los penaltis solo ocurren con empate tras la prórroga.");
      assert((out.result === "win") === (shootout!.userScored > shootout!.opponentScored), "El resultado debe seguir a la tanda.");
    }
  }

  assert(decisions.regular_time > 0, "Debe haber eliminatorias decididas a los 90'.");
  assert(decisions.extra_time > 0, "Debe haber eliminatorias decididas en prórroga.");
  assert(decisions.penalties > 0, "Debe haber eliminatorias decididas en penaltis.");
}

function testDeterministicAndLeaguePhaseUnchanged(): void {
  for (const seed of SEEDS.slice(0, 80)) {
    const a = simulateEuropeanMatch({ ...BASE, seed, isKnockout: true });
    const b = simulateEuropeanMatch({ ...BASE, seed, isKnockout: true });
    assert(JSON.stringify(a) === JSON.stringify(b), `Misma semilla debe dar el mismo resultado (${seed}).`);

    const league = simulateEuropeanMatch({ ...BASE, seed });
    assert(league.decidedBy === undefined && league.penaltyShootout === undefined, "Fase inicial no usa prórroga ni penaltis.");
    if (a.decidedBy === "regular_time") {
      assert(a.userGoals === league.userGoals && a.opponentGoals === league.opponentGoals, "El marcador a los 90' no cambia.");
    }
  }

  assert(SEEDS.some((seed) => simulateEuropeanMatch({ ...BASE, seed }).result === "draw"), "La fase inicial debe seguir pudiendo empatar.");
}

function makeTournament(): EuropeanTournamentState {
  const qualification: EuropeanQualificationResult = {
    qualified: true,
    competition: "champions_league",
    source: "league_position",
    label: "Champions League",
    shortLabel: "UCL",
    explanation: "QA",
    priority: 1,
  };
  const tournament = createEuropeanTournamentForQualification({ seasonNumber: 1, qualification, seed: "qa_et_t", totalLeagueMatchdays: 38 });
  assert(tournament !== null, "Debe crearse el torneo.");
  return tournament;
}

function testTournamentStoresDecisionAndProgress(): void {
  let tournament = makeTournament();

  for (let index = 0; index < 6; index += 1) {
    const match = tournament.matches.find((candidate) => candidate.status === "scheduled" && candidate.phase === "league_phase")!;
    tournament = applyEuropeanMatchResult(tournament, match.id, { userGoals: 2, opponentGoals: 0, result: "win" }, 38);
  }

  const semifinal = tournament.matches.find((match) => match.phase === "semifinal")!;
  assert(isEuropeanKnockoutMatch(semifinal), "La semifinal es eliminatoria.");

  const penaltyWin = applyEuropeanMatchResult(tournament, semifinal.id, {
    userGoals: 1,
    opponentGoals: 1,
    result: "win",
    decidedBy: "penalties",
    regularTimeUserGoals: 1,
    regularTimeOpponentGoals: 1,
    penaltyShootout: { userScored: 4, opponentScored: 3 },
  }, 38);
  const stored = penaltyWin.matches.find((match) => match.id === semifinal.id)!;
  assert(penaltyWin.phase === "final", "Ganar en penaltis avanza a la final.");
  assert(stored.decidedBy === "penalties" && stored.penaltyShootout?.userScored === 4, "El torneo guarda la tanda.");
  assert(getEuropeanMatchDecisionText(stored)?.includes("Penaltis: 4-3") === true, "Texto de penaltis.");

  const extraLoss = applyEuropeanMatchResult(tournament, semifinal.id, {
    userGoals: 1,
    opponentGoals: 2,
    result: "loss",
    decidedBy: "extra_time",
    regularTimeUserGoals: 1,
    regularTimeOpponentGoals: 1,
  }, 38);
  assert(extraLoss.eliminated, "Perder en prórroga elimina.");
  assert(getEuropeanMatchDecisionText(extraLoss.matches.find((match) => match.id === semifinal.id)!)?.startsWith("Prórroga") === true, "Texto de prórroga.");

  const finalMatch = penaltyWin.matches.find((match) => match.phase === "final")!;
  const champion = applyEuropeanMatchResult(penaltyWin, finalMatch.id, {
    userGoals: 0,
    opponentGoals: 0,
    result: "win",
    decidedBy: "penalties",
    regularTimeUserGoals: 0,
    regularTimeOpponentGoals: 0,
    penaltyShootout: { userScored: 5, opponentScored: 4 },
  }, 38);
  assert(champion.champion && champion.completed, "Ganar la final en penaltis da el título.");

  const plain = penaltyWin.matches.find((match) => match.phase === "league_phase")!;
  assert(getEuropeanMatchDecisionText(plain) === null, "Sin decisión especial no hay texto.");
}

function testWiringAndCopy(): void {
  assert(EUROPEAN_KNOCKOUT_TIE_RULE_TEXT.includes("prórroga") && EUROPEAN_KNOCKOUT_TIE_RULE_TEXT.includes("penaltis"), "La regla debe explicarse.");
  assert(read("src/components/LeagueSimulatorView.tsx").includes("isKnockout: isEuropeanKnockoutMatch(pendingEuropeanMatch),"), "El simulador debe marcar las eliminatorias.");
  const event = read("src/components/EuropeanMatchEvent.tsx");
  assert(event.includes("EUROPEAN_KNOCKOUT_TIE_RULE_TEXT") && event.includes("getEuropeanMatchDecisionText(match)"), "La tarjeta debe mostrar regla y decisión.");
  assert(read("src/components/EuropeanProgressPanel.tsx").includes("(prórroga)"), "El panel debe etiquetar la prórroga.");
}

testKnockoutNeverDraws();
testDeterministicAndLeaguePhaseUnchanged();
testTournamentStoresDecisionAndProgress();
testWiringAndCopy();
console.log("European knockout extra time QA OK");
