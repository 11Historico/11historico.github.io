// scripts/auditMatchApproach.ts
//
// Auditoría del planteamiento y del entrenador (v0.25.75). Mide, con semillas fijas
// y las mismas tiradas para cada opción, cuánto cambia el resultado en Copa, Europa
// y Supercopa. Reproducible: npm run audit:approach

import { simulateCareerSupercopa } from "../src/career/supercopaRules";
import { USER_TEAM_ID } from "../src/data/laliga2526Teams";
import { simulateEuropeanMatch } from "../src/europe/europeanMatchEngine";
import {
  createUserLeagueSimulation,
  getInitialCareerLeagueRivals,
  simulateNextCupMatch,
  type UserLeagueSimulationContext,
} from "../src/simulation/leagueSimulator";
import type { CoachSkills, MatchApproach, TeamRating } from "../src/types/game";

const SAMPLES = 4000;
const CONTEXTS = 40;
const LEVELS = [76, 82, 88];
const CUP_ROUND_NAMES = ["Dieciseisavos", "Octavos", "Cuartos", "Semifinal", "Final"];
const PLAIN_COACH: CoachSkills = { attack: 80, defense: 80, management: 80, mentality: 80 };
const SPECIALIST_COACH: CoachSkills = { attack: 92, defense: 92, management: 80, mentality: 80 };

const OPTIONS: { label: string; approach: MatchApproach; coachSkills: CoachSkills }[] = [
  { label: "Defensivo", approach: "defensive", coachSkills: PLAIN_COACH },
  { label: "Defensivo + especialista", approach: "defensive", coachSkills: SPECIALIST_COACH },
  { label: "Equilibrado", approach: "balanced", coachSkills: PLAIN_COACH },
  { label: "Ofensivo", approach: "attacking", coachSkills: PLAIN_COACH },
  { label: "Ofensivo + especialista", approach: "attacking", coachSkills: SPECIALIST_COACH },
];

// Los cuadros de Copa se sortean con Math.random y Date.now: se fijan para que el informe sea reproducible.
Date.now = () => 1_700_000_000_000;
let randomState = 12345;
Math.random = () => {
  randomState = (randomState * 16807) % 2147483647;
  return randomState / 2147483647;
};

const rivals = getInitialCareerLeagueRivals();

function uniformTeam(overall: number): TeamRating {
  return { attack: overall, defense: overall, control: overall, physical: overall, mentality: overall, goalkeeping: overall, overall, profileLabel: "", strengths: [], weaknesses: [] };
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)} %`;
}

function printTable(title: string, headers: string[], rows: string[][]): void {
  console.log(`\n### ${title}\n`);
  console.log(`| ${headers.join(" | ")} |`);
  console.log(`|${headers.map(() => " --- ").join("|")}|`);
  rows.forEach((row) => console.log(`| ${row.join(" | ")} |`));
}

function contextAtCupRound(base: UserLeagueSimulationContext, roundIndex: number, coachSkills: CoachSkills): UserLeagueSimulationContext {
  const gate = base.cupState.fixtures[roundIndex].gateMatchday;

  return {
    ...base,
    selectedCoach: { coachSeason: { skills: coachSkills } } as UserLeagueSimulationContext["selectedCoach"],
    cupState: { ...base.cupState, currentRoundIndex: roundIndex },
    state: {
      ...base.state,
      table: base.state.table.map((row) => (row.teamId === USER_TEAM_ID ? { ...row, played: gate } : row)),
    },
  };
}

function auditCup(): void {
  const contexts = Array.from({ length: CONTEXTS }, () => createUserLeagueSimulation({ rivals }));

  for (const level of LEVELS) {
    const teamRating = uniformTeam(level);
    const rows = OPTIONS.map(({ label, approach, coachSkills }) => {
      let title = 1;
      const rounds = CUP_ROUND_NAMES.map((_, roundIndex) => {
        let advanced = 0;

        for (let sample = 0; sample < SAMPLES; sample += 1) {
          const base = contexts[sample % CONTEXTS];
          const { result } = simulateNextCupMatch({
            context: contextAtCupRound(base, roundIndex, coachSkills),
            teamRating,
            selectedPlayers: [],
            seed: 10_000 + sample * 37 + roundIndex * 1009,
            approach,
          });
          if (result?.userTeamWon) advanced += 1;
        }

        title *= advanced / SAMPLES;
        return percent(advanced / SAMPLES);
      });

      return [label, ...rounds, percent(title)];
    });

    printTable(`Copa · media ${level} · probabilidad de pasar cada ronda`, ["Opción", ...CUP_ROUND_NAMES, "Título"], rows);
  }
}

function auditEurope(): void {
  const rows: string[][] = [];

  for (const [userRating, opponentRating] of [[76, 84], [82, 82], [88, 80]]) {
    for (const { label, approach, coachSkills } of OPTIONS) {
      let points = 0;
      let knockoutWins = 0;
      let improved = 0;
      let worsened = 0;

      for (let sample = 0; sample < SAMPLES; sample += 1) {
        const shared = { userTeamRating: userRating, opponentRating, isHome: sample % 2 === 0, competition: "europa_league" as const, seed: `audit_${sample}`, approach, coachSkills };
        const league = simulateEuropeanMatch(shared);
        points += league.result === "win" ? 3 : league.result === "draw" ? 1 : 0;
        if (simulateEuropeanMatch({ ...shared, isKnockout: true }).result === "win") knockoutWins += 1;

        const effect = league.approachEffect;
        if (effect) {
          const change = Math.sign(effect.userGoals - effect.rivalGoals) - Math.sign(effect.balancedUserGoals - effect.balancedRivalGoals);
          if (change > 0) improved += 1;
          if (change < 0) worsened += 1;
        }
      }

      rows.push([
        `${userRating} vs ${opponentRating}`,
        label,
        (points / SAMPLES).toFixed(2),
        percent(knockoutWins / SAMPLES),
        percent(improved / SAMPLES),
        percent(worsened / SAMPLES),
      ]);
    }
  }

  printTable(
    "Europa · la mitad en casa y la mitad fuera",
    ["Cruce", "Opción", "Puntos por partido (fase de liga)", "Pasa en semifinal o final", "Mejora el resultado", "Empeora el resultado"],
    rows,
  );

  // Entrenador con habilidad europea de 86 o más: +1 a la media en Europa.
  const boostRows = [[76, 84], [82, 82], [88, 80]].map(([userRating, opponentRating]) => {
    const passRate = (rating: number) => {
      let wins = 0;

      for (let sample = 0; sample < SAMPLES; sample += 1) {
        const outcome = simulateEuropeanMatch({ userTeamRating: rating, opponentRating, isHome: sample % 2 === 0, competition: "europa_league", seed: `audit_${sample}`, isKnockout: true });
        if (outcome.result === "win") wins += 1;
      }

      return percent(wins / SAMPLES);
    };

    return [`${userRating} vs ${opponentRating}`, passRate(userRating), passRate(userRating + 1)];
  });

  printTable("Europa · entrenador especialista (+1 a la media)", ["Cruce", "Sin especialista", "Con especialista"], boostRows);
}

function auditSupercopa(): void {
  const participants = [
    { teamId: USER_TEAM_ID, teamName: "Athletic Club Histórico", source: "league_champion" as const, sourceLabel: "" },
    { teamId: rivals[0].id, teamName: rivals[0].name, source: "league_runner_up" as const, sourceLabel: "" },
    { teamId: rivals[1].id, teamName: rivals[1].name, source: "cup_champion" as const, sourceLabel: "" },
    { teamId: rivals[2].id, teamName: rivals[2].name, source: "cup_runner_up" as const, sourceLabel: "" },
  ];

  const rows = OPTIONS.map(({ label, approach, coachSkills }) => [
    label,
    ...LEVELS.map((level) => {
      let titles = 0;

      for (let sample = 0; sample < SAMPLES; sample += 1) {
        const result = simulateCareerSupercopa({
          qualification: { seasonLabel: "audit", participants, userQualified: true, reason: "" },
          teamRating: uniformTeam(level),
          selectedPlayers: [],
          rivals,
          seed: 20_000 + sample * 41,
          approach,
          coachSkills,
        });
        if (result.won) titles += 1;
      }

      return percent(titles / SAMPLES);
    }),
  ]);

  printTable("Supercopa · probabilidad de título", ["Opción", ...LEVELS.map((level) => `Media ${level}`)], rows);
}

auditCup();
auditEurope();
auditSupercopa();
