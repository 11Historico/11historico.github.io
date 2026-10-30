// scripts/auditCareerDecisions.ts
//
// Auditoría conjunta de las decisiones de partido (v0.25.78): juega carreras completas
// con las funciones reales del juego y compara a un jugador que decide bien, a uno que
// nunca decide y a uno que decide mal. Reproducible: npm run audit:career
//
// Simplificaciones respecto a una carrera real: el once no cambia entre temporadas
// (ni premios de plantilla ni formación) y la ruleta de temporada siempre se rechaza.

import { readFileSync } from "node:fs";

import { calculateCareerArcadeScore, getFinalCareerTrophyCounts } from "../src/career/careerRanking";
import { applyCareerRivalProgression, CAREER_RELEGATION_POSITION, evaluateCareerObjective, getEuropeanQualification } from "../src/career/careerRules";
import { awardEuropeanPrestigeToCareer } from "../src/career/europeanPrestige";
import { awardEuropeanTrophyToCareer } from "../src/career/europeanTrophies";
import { createCareerSupercopaQualification, getSupercopaSemifinalPreview, simulateCareerSupercopa } from "../src/career/supercopaRules";
import { applyCareerRatingBonus, applyDifficultyToTeamRating } from "../src/career/teamPower";
import { ATHLETIC_SEASONS } from "../src/data/athletic/seasons";
import { FORMATIONS, getFormationById } from "../src/data/formations";
import { resolvePlayerSlotPlacement } from "../src/domain/positionRules";
import { EUROPEAN_DEFAULT_LEAGUE_MATCHDAYS, shouldPlayEuropeanMatchAtLeagueMatchday } from "../src/europe/europeanCalendar";
import {
  appendEuropeanQualification,
  createEmptyEuropeanCareerState,
  getLatestEuropeanQualification,
  setEuropeanCurrentTournament,
} from "../src/europe/europeanCareerState";
import { estimateEuropeanMatchOdds, simulateEuropeanMatch, type SimulateEuropeanMatchInput } from "../src/europe/europeanMatchEngine";
import { resolveEuropeanQualification } from "../src/europe/europeanQualification";
import { applyEuropeanMatchResult, createEuropeanTournamentForQualification, isEuropeanKnockoutMatch } from "../src/europe/europeanTournament";
import type { EuropeanSeasonEntry, EuropeanTournamentState } from "../src/europe/europeanTypes";
import {
  createFinalLeagueSummary,
  createNextCareerLeagueTransition,
  createUserLeagueSimulation,
  getCoachCompetitionBoost,
  getInitialCareerLeagueRivals,
  getInitialCareerSecondDivisionPool,
  getNextUserMatchPreview,
  getPendingCupFixture,
  simulateNextCupMatch,
  simulateNextUserLeagueMatch,
} from "../src/simulation/leagueSimulator";
import { USER_TEAM_ID } from "../src/data/laliga2526Teams";
import { applyHalfTimeChoice, type MatchOdds } from "../src/simulation/matchEngine";
import { calculateTeamRating } from "../src/simulation/teamRating";
import type { CareerSupercopaQualification, CareerTrophyCounts } from "../src/types/career";
import type { FinalGameSummary, GameDifficulty, HalfTimeChoice, MatchApproach, MatchResult, RivalTeam, SelectedCoach, SelectedPlayer, TeamRating } from "../src/types/game";

const CAREERS_PER_CELL = Number(process.argv.find((arg) => arg.startsWith("--careers="))?.split("=")[1] ?? 200);
// Tope por carrera: sin él, un equipo muy fuerte puede no terminar nunca. La tabla dice cuántas llegan.
const MAX_SEASONS = 25;
const APPROACHES: MatchApproach[] = ["balanced", "attacking", "defensive"];

type ApproachPolicy = "balanced" | "best" | "worst";
type HalfTimePolicy = "keep" | "good" | "bad";

interface Policy {
  label: string;
  approach: ApproachPolicy;
  halfTime: HalfTimePolicy;
  /** Europa como antes de las fases 2 y 4: solo la media, sin +1 del entrenador. */
  legacyEurope?: boolean;
}

const POLICIES: Policy[] = [
  { label: "Como antes (v0.25.74)", approach: "balanced", halfTime: "keep", legacyEurope: true },
  { label: "Nunca decide", approach: "balanced", halfTime: "keep" },
  { label: "Solo planteamiento", approach: "best", halfTime: "keep" },
  { label: "Solo descanso", approach: "balanced", halfTime: "good" },
  { label: "Decide bien", approach: "best", halfTime: "good" },
  { label: "Decide mal", approach: "worst", halfTime: "bad" },
];

const TEAMS: { label: string; percentile: number; defensivePercentile?: number }[] = [
  { label: "Flojo", percentile: 0.25 },
  { label: "Medio", percentile: 0.5 },
  { label: "Bueno", percentile: 0.75 },
  { label: "Élite", percentile: 1 },
  // Delanteros y medios buenos con defensa floja: el caso en el que el perfil real pesa en Europa.
  { label: "Desequilibrado", percentile: 0.95, defensivePercentile: 0.15 },
];

const DIFFICULTIES: { label: string; value: GameDifficulty }[] = [
  { label: "Normal", value: "dificil" },
  { label: "Fácil", value: "normal" },
];

// Azar fijado por carrera: la misma carrera empieza igual en todas las políticas. El reloj
// avanza porque el juego lo usa de semilla (Supercopa, desempates de Copa): con uno fijo,
// esos sorteos darían siempre lo mismo.
let randomState = 1;
let clock = 0;
Math.random = () => {
  randomState = (randomState * 16807) % 2147483647;
  return randomState / 2147483647;
};
Date.now = () => {
  clock += 1379;
  return clock;
};

function seedCareer(seed: number): void {
  randomState = (seed * 48271 + 11) % 2147483647 || 1;
  clock = 1_700_000_000_000 + seed * 1_000_003;
}

const trophyPlausibilitySource = readFileSync("apps-script/globalRankingBackend.gs", "utf8").replace(/\r\n/g, "\n").match(/function checkTrophyPlausibility_\([\s\S]*?\n\}\n/);
if (!trophyPlausibilitySource) throw new Error("No se encuentra checkTrophyPlausibility_ en globalRankingBackend.gs.");
const checkTrophyPlausibility = new Function(`${trophyPlausibilitySource[0]}\nreturn checkTrophyPlausibility_;`)() as (seasons: number, trophies: CareerTrophyCounts) => void;

function buildTeam(percentile: number, defensivePercentile = percentile) {
  const formation = getFormationById("4-3-3") ?? FORMATIONS.find((candidate) => candidate.name === "4-3-3");
  if (!formation) throw new Error("Falta la formación 4-3-3.");

  const used = new Set<string>();
  const selectedPlayers: SelectedPlayer[] = [];

  for (const slot of formation.slots) {
    const candidates: { playerSeason: SelectedPlayer["playerSeason"]; position: SelectedPlayer["position"] }[] = [];

    for (const season of ATHLETIC_SEASONS) {
      for (const playerSeason of season.players) {
        if (used.has(playerSeason.canonicalPlayerId)) continue;
        const placement = resolvePlayerSlotPlacement(playerSeason, slot);
        if (placement.canPlace) candidates.push({ playerSeason, position: placement.assignedPosition as SelectedPlayer["position"] });
      }
    }

    candidates.sort((a, b) => a.playerSeason.overall - b.playerSeason.overall);
    const slotPercentile = slot.line === "defense" || slot.line === "goalkeeper" ? defensivePercentile : percentile;
    const pick = candidates[Math.min(candidates.length - 1, Math.floor(slotPercentile * candidates.length))];
    used.add(pick.playerSeason.canonicalPlayerId);
    selectedPlayers.push({ slotId: slot.id, position: pick.position, playerSeason: pick.playerSeason });
  }

  const coaches = [...ATHLETIC_SEASONS.map((season) => season.coach)].sort((a, b) => a.overall - b.overall);
  const selectedCoach: SelectedCoach = { coachSeason: coaches[Math.min(coaches.length - 1, Math.floor(percentile * coaches.length))] };

  return { formation, selectedPlayers, selectedCoach, teamRating: calculateTeamRating({ selectedPlayers, selectedCoach, formation }) };
}

function pickApproach(policy: ApproachPolicy, oddsFor: (approach: MatchApproach) => MatchOdds | undefined, value: (odds: MatchOdds) => number): MatchApproach {
  if (policy === "balanced") return "balanced";

  const ranked = APPROACHES.map((approach) => {
    const odds = oddsFor(approach);
    return { approach, score: odds ? value(odds) : 0 };
  }).sort((a, b) => (policy === "best" ? b.score - a.score : a.score - b.score));

  return ranked[0].approach;
}

function pickHalfTime(policy: HalfTimePolicy, margin: number, userIsWeaker: boolean): HalfTimeChoice {
  if (policy === "keep") return "keep";

  const good: HalfTimeChoice = margin < 0 ? "push" : margin > 0 ? "close" : userIsWeaker ? "close" : "keep";
  if (policy === "good") return good;

  return margin < 0 ? "close" : margin > 0 ? "push" : userIsWeaker ? "push" : "close";
}

const advanceValue = (odds: MatchOdds) => odds.win + odds.draw / 2;
const pointsValue = (odds: MatchOdds) => 3 * odds.win + odds.draw;

function getHalfTimeMargin(result: MatchResult): number {
  const userName = result.expectedGoals?.userIsHome ? result.homeTeamName : result.awayTeamName;
  const firstHalf = result.goalEvents.filter((goal) => goal.minute <= 45);
  const userGoals = firstHalf.filter((goal) => goal.teamName === userName).length;

  return userGoals - (firstHalf.length - userGoals);
}

function getCopaWinnerLeaguePosition(summary: FinalGameSummary): number | null {
  if (!summary.cupChampionTeamId || !summary.table) return null;
  const index = summary.table.findIndex((row) => row.teamId === summary.cupChampionTeamId);
  return index >= 0 ? index + 1 : null;
}

function playSeason(params: {
  policy: Policy;
  gameId: string;
  baseRating: TeamRating;
  difficulty: GameDifficulty;
  formationName: string;
  selectedPlayers: SelectedPlayer[];
  selectedCoach: SelectedCoach;
  rivals: RivalTeam[];
  completedSeasons: number;
  tournament: EuropeanTournamentState | null;
}) {
  const { policy, gameId, baseRating, difficulty, formationName, selectedPlayers, selectedCoach, rivals, completedSeasons } = params;
  const effectiveRating = applyDifficultyToTeamRating(baseRating, difficulty, true);
  const coachSkills = selectedCoach.coachSeason.skills;
  let tournament = params.tournament;
  let context = {
    ...createUserLeagueSimulation({ rivals: applyCareerRivalProgression(rivals, completedSeasons) }),
    selectedCoach,
  };

  for (let guard = 0; guard < 200; guard += 1) {
    const pendingCup = getPendingCupFixture(context);

    if (pendingCup) {
      const approach = pickApproach(
        policy.approach,
        (option) => getNextUserMatchPreview({ context, teamRating: effectiveRating, selectedPlayers, approach: option })?.odds,
        advanceValue,
      );
      const before = context;
      const base = { context: before, teamRating: effectiveRating, selectedPlayers, approach };
      const played = simulateNextCupMatch(base);
      const regular = played.regularTimeResult;
      const choice = regular
        ? pickHalfTime(policy.halfTime, getHalfTimeMargin(regular), (regular.expectedGoals?.user ?? 0) < (regular.expectedGoals?.rival ?? 0))
        : "keep";

      context = regular && choice !== "keep"
        ? simulateNextCupMatch({ ...base, regularTimeResult: applyHalfTimeChoice({ result: regular, choice, selectedPlayers }) }).context
        : played.context;
      continue;
    }

    const leaguePlayed = context.state.table.find((row) => row.teamId === USER_TEAM_ID)?.played ?? 0;
    const pendingEuropean = shouldPlayEuropeanMatchAtLeagueMatchday(tournament, leaguePlayed + 1);

    if (pendingEuropean && tournament) {
      const legacy = policy.legacyEurope;
      const shared = {
        userTeamRating: effectiveRating.overall + (legacy ? 0 : getCoachCompetitionBoost(context, "europe")),
        opponentRating: pendingEuropean.opponent.rating,
        isHome: pendingEuropean.isHome,
        competition: pendingEuropean.competition,
        coachSkills,
        ...(legacy ? {} : { userProfile: effectiveRating, selectedPlayers }),
      };
      const isKnockout = isEuropeanKnockoutMatch(pendingEuropean);
      const approach = pickApproach(
        policy.approach,
        (option) => estimateEuropeanMatchOdds({ ...shared, approach: option }),
        isKnockout ? advanceValue : pointsValue,
      );
      const input: SimulateEuropeanMatchInput = { ...shared, approach, isKnockout, seed: `${gameId}_${pendingEuropean.id}` };
      const base = simulateEuropeanMatch(input);
      const firstHalf = base.goalEvents.filter((goal) => goal.minute <= 45);
      const margin = firstHalf.filter((goal) => goal.isUserGoal).length - firstHalf.filter((goal) => !goal.isUserGoal).length;
      const choice = pickHalfTime(policy.halfTime, margin, (base.expectedGoals?.user ?? 0) < (base.expectedGoals?.rival ?? 0));
      const outcome = choice === "keep" ? base : simulateEuropeanMatch({ ...input, halfTimeChoice: choice });

      tournament = applyEuropeanMatchResult(tournament, pendingEuropean.id, outcome, EUROPEAN_DEFAULT_LEAGUE_MATCHDAYS);
      continue;
    }

    if (context.state.completed) break;

    context = simulateNextUserLeagueMatch({ context, teamRating: effectiveRating, selectedPlayers }).context;
  }

  return {
    tournament,
    summary: createFinalLeagueSummary({ gameId, formationName, coachName: selectedCoach.coachSeason.name, context }),
  };
}

function playCareer(params: {
  policy: Policy;
  seed: number;
  difficulty: GameDifficulty;
  team: ReturnType<typeof buildTeam>;
}) {
  const { policy, seed, difficulty, team } = params;
  const gameId = `audit_${seed}`;
  let completedSeasons = 0;
  let trophies: CareerTrophyCounts = { champions: 0, liga: 0, europaLeague: 0, copa: 0, conference: 0, supercopa: 0 };
  let rivals = getInitialCareerLeagueRivals();
  let secondDivision = getInitialCareerSecondDivisionPool();
  let europeanCareer = createEmptyEuropeanCareerState();
  let ratingBonus = 0;
  let pendingSupercopa: CareerSupercopaQualification | undefined;
  let leaguePositions = 0;

  seedCareer(seed);

  for (;;) {
    const seasonRating = applyCareerRatingBonus(team.teamRating, ratingBonus);
    let wonSupercopa = false;

    if (pendingSupercopa) {
      const qualification = pendingSupercopa;
      const approach = pickApproach(
        policy.approach,
        (option) => getSupercopaSemifinalPreview({ qualification, teamRating: seasonRating, selectedPlayers: team.selectedPlayers, rivals, approach: option, coachSkills: team.selectedCoach.coachSeason.skills })?.odds,
        advanceValue,
      );
      wonSupercopa = simulateCareerSupercopa({ qualification, teamRating: seasonRating, selectedPlayers: team.selectedPlayers, rivals, approach, coachSkills: team.selectedCoach.coachSeason.skills }).won;
    }

    const { summary, tournament } = playSeason({
      policy,
      gameId,
      baseRating: seasonRating,
      difficulty,
      formationName: team.formation.name,
      selectedPlayers: team.selectedPlayers,
      selectedCoach: team.selectedCoach,
      rivals,
      completedSeasons,
      tournament: europeanCareer.currentTournament,
    });
    europeanCareer = setEuropeanCurrentTournament(europeanCareer, tournament);
    leaguePositions += summary.leaguePosition;

    const wonCopa = Boolean(summary.cupTrophyWon);
    const copaWinnerLeaguePosition = getCopaWinnerLeaguePosition(summary);
    const seasonResult = {
      seasonLabel: String(completedSeasons),
      leaguePosition: summary.leaguePosition,
      wonLeague: summary.leaguePosition === 1,
      wonCopa,
      wonSupercopa,
      isRelegated: summary.leaguePosition >= CAREER_RELEGATION_POSITION,
      europeanQualification: getEuropeanQualification(summary.leaguePosition, wonCopa, copaWinnerLeaguePosition),
      copaWinnerLeaguePosition,
    };
    const objective = evaluateCareerObjective(seasonResult);
    const seasonsPlayed = completedSeasons + 1;

    if (objective.isGameOver || seasonsPlayed >= MAX_SEASONS) {
      const finalTrophies = getFinalCareerTrophyCounts(trophies, seasonResult, europeanCareer.currentTournament);
      const finalCompleted = objective.isGameOver ? completedSeasons : seasonsPlayed;
      let plausible = true;

      try {
        checkTrophyPlausibility(finalCompleted, finalTrophies);
      } catch {
        plausible = false;
      }

      return {
        completedSeasons: finalCompleted,
        trophies: finalTrophies,
        score: calculateCareerArcadeScore({ completedSeasons: finalCompleted, trophyCounts: finalTrophies }).arcadeScore,
        reachedCap: !objective.isGameOver,
        plausible,
        averagePosition: leaguePositions / seasonsPlayed,
      };
    }

    const europeanResult = resolveEuropeanQualification({
      leaguePosition: seasonResult.leaguePosition,
      userWonCopa: wonCopa,
      copaWinnerLeaguePosition,
      seasonNumber: completedSeasons,
    });
    const entry: EuropeanSeasonEntry = {
      seasonNumber: completedSeasons,
      qualified: europeanResult.qualified,
      competition: europeanResult.competition,
      source: europeanResult.source,
      explanation: europeanResult.explanation,
      achievedFromLeaguePosition: seasonResult.leaguePosition,
      achievedFromCopa: wonCopa,
    };
    europeanCareer = appendEuropeanQualification(europeanCareer, entry);

    const nextCompleted = completedSeasons + 1;
    const trophyAward = awardEuropeanTrophyToCareer({ trophyCounts: trophies, tournament: europeanCareer.currentTournament });
    trophies = getFinalCareerTrophyCounts(trophyAward.trophyCounts, seasonResult);
    const prestige = awardEuropeanPrestigeToCareer({ previousRatingBonus: 0, tournament: trophyAward.tournament });
    ratingBonus = prestige.nextRatingBonus;
    europeanCareer = setEuropeanCurrentTournament(europeanCareer, prestige.tournament ?? null);

    const latest = getLatestEuropeanQualification(europeanCareer);
    europeanCareer = setEuropeanCurrentTournament(
      europeanCareer,
      latest?.qualified ? createEuropeanTournamentForQualification({ seasonNumber: nextCompleted, qualification: latest, seed: `${gameId}_${nextCompleted}` }) : null,
    );

    if (summary.table) {
      const transition = createNextCareerLeagueTransition({ previousTable: summary.table, currentRivals: rivals, secondDivisionPool: secondDivision, completedSeasons: nextCompleted });
      rivals = transition.nextRivals;
      secondDivision = transition.nextSecondDivisionPool;
    }

    const supercopa = createCareerSupercopaQualification({ seasonLabel: String(nextCompleted), previousSummary: summary });
    pendingSupercopa = supercopa.userQualified ? supercopa : undefined;
    completedSeasons = nextCompleted;
  }
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))] ?? 0;
}

/** Media con su margen al 95 %: las carreras varían mucho y hay que ver qué diferencias son reales. */
function meanWithMargin(values: number[]): string {
  const average = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / Math.max(1, values.length - 1);

  return `${average.toFixed(2)} ±${(1.96 * Math.sqrt(variance / Math.max(1, values.length))).toFixed(2)}`;
}

function share(count: number, total: number): string {
  return `${((count / Math.max(1, total)) * 100).toFixed(0)} %`;
}

let rejected = 0;
let played = 0;

for (const { label: difficultyLabel, value: difficulty } of DIFFICULTIES) {
  for (const { label: teamLabel, percentile: teamPercentile, defensivePercentile } of TEAMS) {
    const team = buildTeam(teamPercentile, defensivePercentile);
    const effective = applyDifficultyToTeamRating(team.teamRating, difficulty, true);

    console.log(`\n### Dificultad ${difficultyLabel} · equipo ${teamLabel} (media ${Math.round(team.teamRating.overall)}, ${effective.overall} en carrera; ataque ${effective.attack}, defensa ${effective.defense}) · ${team.selectedCoach.coachSeason.name}\n`);
    console.log("| Jugador | Temporadas superadas | Pasa la 1.ª | 5 o más | Puntuación media | Puntuación p90 | Liga | Copa | Supercopa | Europa | Títulos por temporada | Posición media | Llegan al tope |");
    console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

    for (const policy of POLICIES) {
      const careers = Array.from({ length: CAREERS_PER_CELL }, (_, index) => playCareer({ policy, seed: index + 1, difficulty, team }));
      const seasons = careers.map((career) => career.completedSeasons);
      const europe = careers.map((career) => career.trophies.champions + career.trophies.europaLeague + career.trophies.conference);
      const totalTrophies = careers.reduce(
        (sum, career, index) => sum + career.trophies.liga + career.trophies.copa + career.trophies.supercopa + europe[index],
        0,
      );
      const totalSeasons = seasons.reduce((sum, value) => sum + value + 1, 0);

      played += careers.length;
      rejected += careers.filter((career) => !career.plausible).length;

      console.log(
        `| ${[
          policy.label,
          meanWithMargin(seasons),
          share(seasons.filter((value) => value >= 1).length, careers.length),
          share(seasons.filter((value) => value >= 5).length, careers.length),
          meanWithMargin(careers.map((career) => career.score)),
          String(percentile(careers.map((career) => career.score), 0.9)),
          mean(careers.map((career) => career.trophies.liga)).toFixed(2),
          mean(careers.map((career) => career.trophies.copa)).toFixed(2),
          mean(careers.map((career) => career.trophies.supercopa)).toFixed(2),
          mean(europe).toFixed(2),
          (totalTrophies / totalSeasons).toFixed(2),
          mean(careers.map((career) => career.averagePosition)).toFixed(1),
          share(careers.filter((career) => career.reachedCap).length, careers.length),
        ].join(" | ")} |`,
      );
    }
  }
}

console.log(`\nCarreras simuladas: ${played}. Rechazadas por la regla de plausibilidad del ranking: ${rejected}.`);
