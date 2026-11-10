// scripts/auditCareerRunner.ts
//
// Carrera completa con las funciones reales del juego, compartida por las auditorías
// audit:career y audit:linecap.
//
// Simplificaciones respecto a una carrera real: el once no cambia entre temporadas
// (ni premios de plantilla ni formación) y la ruleta de temporada siempre se rechaza.

import { readFileSync } from "node:fs";

import { createRandomPlayerRoundSeasons } from "../src/app/draftSeasons";
import { calculateCareerArcadeScore, getFinalCareerTrophyCounts } from "../src/career/careerRanking";
import { applyCareerRivalProgression, CAREER_RELEGATION_POSITION, evaluateCareerObjective, getEuropeanQualification } from "../src/career/careerRules";
import { awardEuropeanPrestigeToCareer } from "../src/career/europeanPrestige";
import { awardEuropeanTrophyToCareer } from "../src/career/europeanTrophies";
import { createCareerSupercopaQualification, getSupercopaSemifinalPreview, simulateCareerSupercopa } from "../src/career/supercopaRules";
import { applyCareerRatingBonus, applyDifficultyModifier, applyDifficultyToTeamRating } from "../src/career/teamPower";
import { ATHLETIC_SEASONS } from "../src/data/athletic/seasons";
import { getAvailableSlotsForPlayer, isPlayerAlreadySelected, resolvePlayerSlotPlacement } from "../src/domain/positionRules";
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
import { getPendingFixturesForCurrentMatchday } from "../src/simulation/leagueTable";
import { applyHalfTimeChoice, getAverageUserRating, type MatchOdds } from "../src/simulation/matchEngine";
import type { CareerSupercopaQualification, CareerTrophyCounts } from "../src/types/career";
import type { FinalGameSummary, Formation, FormationSlot, GameDifficulty, HalfTimeChoice, MatchApproach, MatchResult, PlayerSeason, RivalTeam, SeasonId, SelectedCoach, SelectedPlayer, TeamRating } from "../src/types/game";
import { auditGameId } from "./auditSeeds";

// Tope por carrera: sin él, un equipo muy fuerte puede no terminar nunca. La tabla dice cuántas llegan.
const MAX_SEASONS = 25;
const APPROACHES: MatchApproach[] = ["balanced", "attacking", "defensive"];

type ApproachPolicy = "balanced" | "best" | "worst";
type HalfTimePolicy = "keep" | "good" | "bad";

export interface Policy {
  label: string;
  approach: ApproachPolicy;
  halfTime: HalfTimePolicy;
  /** Europa como antes de las fases 2 y 4: solo la media, sin +1 del entrenador. */
  legacyEurope?: boolean;
}

export interface CareerTeam {
  formation: Formation;
  selectedPlayers: SelectedPlayer[];
  selectedCoach: SelectedCoach;
  teamRating: TeamRating;
  /** Cambio de líneas después de la compresión de carrera, para probar alternativas. */
  effectiveLineShift?: Partial<Record<"attack" | "defense" | "control", number>>;
  /** Rating de simulación en lugar de la compresión de carrera, para probar alternativas (auditSimulationRating). */
  simulationRating?: (seasonRating: TeamRating, difficulty: GameDifficulty) => TeamRating;
}

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

export function seedCareer(seed: number): void {
  randomState = (seed * 48271 + 11) % 2147483647 || 1;
  clock = 1_700_000_000_000 + seed * 1_000_003;
}

export type DraftStyle = "best" | "random" | "attack" | "defense" | "attackExtreme" | "defenseExtreme";

export interface DraftedTeam {
  formation: Formation;
  selectedPlayers: SelectedPlayer[];
  selectedCoach: SelectedCoach;
}

const seasonsById = new Map(ATHLETIC_SEASONS.map((season) => [season.season as SeasonId, season]));
const FRONT_LINES: FormationSlot["line"][] = ["attack", "midfield"];

/** Cuánto le gusta a cada estilo poner a este jugador en este hueco. */
function pickScore(player: PlayerSeason, slot: FormationSlot, style: DraftStyle): number {
  const isFront = FRONT_LINES.includes(slot.line);

  if (style === "best") return player.overall;
  if (style === "random") return Math.random();
  if (style === "attack") return player.overall + (isFront ? 100 : 0);
  if (style === "defense") return player.overall + (isFront ? 0 : 100);
  if (style === "attackExtreme") return isFront ? 100 + player.overall : -player.overall;
  return isFront ? -player.overall : 100 + player.overall;
}

/** Draft simulado con las reglas del juego: una temporada al azar por ronda y un jugador que encaje. */
export function draftTeam(formation: Formation, style: DraftStyle): DraftedTeam {
  const seasons = createRandomPlayerRoundSeasons(formation.slots.length);
  const selectedPlayers: SelectedPlayer[] = [];

  for (const seasonId of seasons) {
    // Si la temporada no tiene a nadie que encaje, el juego ofrece otra.
    const pool = [seasonId, ...ATHLETIC_SEASONS.map((season) => season.season as SeasonId)];
    let best: { player: PlayerSeason; slot: FormationSlot; score: number } | undefined;

    for (const id of pool) {
      for (const player of seasonsById.get(id)?.players ?? []) {
        if (isPlayerAlreadySelected(player, selectedPlayers)) continue;

        for (const slot of getAvailableSlotsForPlayer({ player, formation, selectedPlayers })) {
          const score = pickScore(player, slot, style);
          if (!best || score > best.score) best = { player, slot, score };
        }
      }
      if (best) break;
    }

    if (!best) throw new Error("No se pudo completar el draft.");
    const placement = resolvePlayerSlotPlacement(best.player, best.slot);
    selectedPlayers.push({ slotId: best.slot.id, position: placement.assignedPosition as SelectedPlayer["position"], playerSeason: best.player });
  }

  // Tres entrenadores de temporadas al azar: se queda el de más media.
  const coaches = createRandomPlayerRoundSeasons(3)
    .map((id) => seasonsById.get(id)?.coach)
    .filter((coach) => coach !== undefined)
    .sort((a, b) => b.overall - a.overall);

  return { formation, selectedPlayers, selectedCoach: { coachSeason: coaches[0] } };
}

const trophyPlausibilitySource = readFileSync("apps-script/globalRankingBackend.gs", "utf8").replace(/\r\n/g, "\n").match(/function checkTrophyPlausibility_\([\s\S]*?\n\}\n/);
if (!trophyPlausibilitySource) throw new Error("No se encuentra checkTrophyPlausibility_ en globalRankingBackend.gs.");
const checkTrophyPlausibility = new Function(`${trophyPlausibilitySource[0]}\nreturn checkTrophyPlausibility_;`)() as (seasons: number, trophies: CareerTrophyCounts) => void;

function pickApproach(policy: ApproachPolicy, oddsFor: (approach: MatchApproach) => MatchOdds | undefined, value: (odds: MatchOdds) => number): MatchApproach {
  if (policy === "balanced") return "balanced";

  const ranked = APPROACHES.map((approach) => {
    const odds = oddsFor(approach);
    return { approach, score: odds ? value(odds) : 0 };
  }).sort((a, b) => (policy === "best" ? b.score - a.score : a.score - b.score));

  return ranked[0].approach;
}

export function pickHalfTime(policy: HalfTimePolicy, margin: number, userIsWeaker: boolean): HalfTimeChoice {
  if (policy === "keep") return "keep";

  const good: HalfTimeChoice = margin < 0 ? "push" : margin > 0 ? "close" : userIsWeaker ? "close" : "keep";
  if (policy === "good") return good;

  return margin < 0 ? "close" : margin > 0 ? "push" : userIsWeaker ? "push" : "close";
}

/**
 * Cartas (idea del usuario, 2026-11-10): un bonus de media para un partido. Solo existen en
 * audit:cards. Sin `cards`, la carrera es la de siempre.
 */
export interface CardMatch {
  competition: "league" | "copa" | "europe";
  knockout: boolean;
  /** Jornada de Liga que toca: la siguiente a las ya jugadas. */
  leagueMatchday: number;
  /** Solo en Liga: si el rival llega a tu media menos 1 (los «partidos grandes» de la v0.25.84). */
  bigRival?: boolean;
}

export interface CardHook {
  startSeason(): void;
  /** Bonus de media para este partido; 0 si no se usa carta. */
  bonusFor(match: CardMatch): number;
  /** Tras el partido: si lo ganó (en una eliminatoria, si pasó). */
  afterMatch(match: CardMatch, won: boolean): void;
}

/** La carta suma lo mismo a todas las líneas del rating de simulación (ya comprimido). */
function withCardBonus(rating: TeamRating, bonus: number): TeamRating {
  if (!bonus) return rating;

  return {
    ...rating,
    attack: rating.attack + bonus,
    defense: rating.defense + bonus,
    control: rating.control + bonus,
    physical: rating.physical + bonus,
    mentality: rating.mentality + bonus,
    goalkeeping: rating.goalkeeping + bonus,
    overall: rating.overall + bonus,
  };
}

function isBigLeagueRival(context: ReturnType<typeof createUserLeagueSimulation>, teamRating: TeamRating): boolean {
  const fixture = getPendingFixturesForCurrentMatchday(context.state).find((item) => item.includesUserTeam);
  const rivalId = fixture?.homeTeamId === USER_TEAM_ID ? fixture.awayTeamId : fixture?.homeTeamId;
  const rival = context.rivals?.find((item) => item.id === rivalId);

  return Boolean(rival && rival.ratings.overall >= getAverageUserRating(teamRating) - 1);
}

export const advanceValue = (odds: MatchOdds) => odds.win + odds.draw / 2;
export const pointsValue = (odds: MatchOdds) => 3 * odds.win + odds.draw;

export function getHalfTimeMargin(result: MatchResult): number {
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
  lineShift: CareerTeam["effectiveLineShift"];
  simulationRating: CareerTeam["simulationRating"];
  difficulty: GameDifficulty;
  formationName: string;
  selectedPlayers: SelectedPlayer[];
  selectedCoach: SelectedCoach;
  rivals: RivalTeam[];
  completedSeasons: number;
  tournament: EuropeanTournamentState | null | undefined;
  cards?: CardHook;
}) {
  const { policy, gameId, baseRating, lineShift, simulationRating, difficulty, formationName, selectedPlayers, selectedCoach, rivals, completedSeasons, cards } = params;
  const compressedRating = simulationRating ? simulationRating(baseRating, difficulty) : applyDifficultyToTeamRating(baseRating, difficulty, true);
  const effectiveRating = lineShift
    ? {
      ...compressedRating,
      attack: compressedRating.attack + (lineShift.attack ?? 0),
      defense: compressedRating.defense + (lineShift.defense ?? 0),
      control: compressedRating.control + (lineShift.control ?? 0),
    }
    : compressedRating;
  const coachSkills = selectedCoach.coachSeason.skills;
  let tournament = params.tournament;
  let context: ReturnType<typeof createUserLeagueSimulation> = {
    ...createUserLeagueSimulation({ rivals: applyCareerRivalProgression(rivals, completedSeasons) }),
    selectedCoach,
  };
  cards?.startSeason();

  for (let guard = 0; guard < 200; guard += 1) {
    const pendingCup = getPendingCupFixture(context);
    const leaguePlayed = context.state.table.find((row) => row.teamId === USER_TEAM_ID)?.played ?? 0;

    if (pendingCup) {
      const cupMatch: CardMatch = { competition: "copa", knockout: true, leagueMatchday: leaguePlayed + 1 };
      const cupRating = withCardBonus(effectiveRating, cards?.bonusFor(cupMatch) ?? 0);
      const approach = pickApproach(
        policy.approach,
        (option) => getNextUserMatchPreview({ context, teamRating: cupRating, selectedPlayers, approach: option })?.odds,
        advanceValue,
      );
      const before = context;
      const base = { context: before, teamRating: cupRating, selectedPlayers, approach };
      const played = simulateNextCupMatch(base);
      const regular = played.regularTimeResult;
      const choice = regular
        ? pickHalfTime(policy.halfTime, getHalfTimeMargin(regular), (regular.expectedGoals?.user ?? 0) < (regular.expectedGoals?.rival ?? 0))
        : "keep";
      const decided = regular && choice !== "keep"
        ? simulateNextCupMatch({ ...base, regularTimeResult: applyHalfTimeChoice({ result: regular, choice, selectedPlayers }) })
        : played;

      context = decided.context;
      cards?.afterMatch(cupMatch, Boolean(decided.result?.userTeamWon));
      continue;
    }

    const pendingEuropean = shouldPlayEuropeanMatchAtLeagueMatchday(tournament, leaguePlayed + 1);

    if (pendingEuropean && tournament) {
      const legacy = policy.legacyEurope;
      const isKnockout = isEuropeanKnockoutMatch(pendingEuropean);
      const europeMatch: CardMatch = { competition: "europe", knockout: isKnockout, leagueMatchday: leaguePlayed + 1 };
      const bonus = cards?.bonusFor(europeMatch) ?? 0;
      const shared = {
        userTeamRating: effectiveRating.overall + bonus + (legacy ? 0 : getCoachCompetitionBoost(context, "europe")),
        opponentRating: pendingEuropean.opponent.rating,
        isHome: pendingEuropean.isHome,
        competition: pendingEuropean.competition,
        coachSkills,
        // El estilo del rival (v0.25.105) va con el juego actual, no con el «legacy».
        ...(legacy ? {} : { userProfile: withCardBonus(effectiveRating, bonus), selectedPlayers, opponentStyle: pendingEuropean.opponent.style }),
      };
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
      cards?.afterMatch(europeMatch, outcome.result === "win");
      continue;
    }

    if (context.state.completed) break;

    if (!cards) {
      context = simulateNextUserLeagueMatch({ context, teamRating: effectiveRating, selectedPlayers }).context;
      continue;
    }

    const leagueMatch: CardMatch = { competition: "league", knockout: false, leagueMatchday: leaguePlayed + 1, bigRival: isBigLeagueRival(context, effectiveRating) };
    const leagueResult = simulateNextUserLeagueMatch({ context, teamRating: withCardBonus(effectiveRating, cards.bonusFor(leagueMatch)), selectedPlayers });
    context = leagueResult.context;
    cards.afterMatch(leagueMatch, Boolean(leagueResult.result?.userTeamWon));
  }

  return {
    tournament,
    summary: createFinalLeagueSummary({ gameId, formationName, coachName: selectedCoach.coachSeason.name, context }),
  };
}

export function playCareer(params: {
  policy: Policy;
  seed: number;
  difficulty: GameDifficulty;
  team: CareerTeam;
  cards?: CardHook;
}) {
  const { policy, seed, difficulty, team, cards } = params;
  const gameId = auditGameId(seed);
  let completedSeasons = 0;
  let trophies: CareerTrophyCounts = { champions: 0, liga: 0, europaLeague: 0, copa: 0, conference: 0, supercopa: 0 };
  let rivals = getInitialCareerLeagueRivals();
  let secondDivision = getInitialCareerSecondDivisionPool();
  let europeanCareer = createEmptyEuropeanCareerState();
  let ratingBonus = 0;
  let pendingSupercopa: CareerSupercopaQualification | undefined;
  let leaguePositions = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let leagueMatches = 0;
  // La 1.ª temporada compara en igualdad: en las siguientes, quien sobrevive más se enfrenta a rivales mejores.
  let firstSeasonPosition = 0;
  let firstSeasonPoints = 0;

  seedCareer(seed);

  for (;;) {
    const seasonRating = applyCareerRatingBonus(team.teamRating, ratingBonus);
    let wonSupercopa = false;

    if (pendingSupercopa) {
      const qualification = pendingSupercopa;
      // Como el juego desde v0.25.101: la media visible con la dificultad.
      const supercopaRating = applyDifficultyModifier(seasonRating, difficulty);
      const approach = pickApproach(
        policy.approach,
        (option) => getSupercopaSemifinalPreview({ qualification, teamRating: supercopaRating, selectedPlayers: team.selectedPlayers, rivals, approach: option, coachSkills: team.selectedCoach.coachSeason.skills })?.odds,
        advanceValue,
      );
      wonSupercopa = simulateCareerSupercopa({ qualification, teamRating: supercopaRating, selectedPlayers: team.selectedPlayers, rivals, approach, coachSkills: team.selectedCoach.coachSeason.skills }).won;
    }

    const { summary, tournament } = playSeason({
      policy,
      gameId,
      baseRating: seasonRating,
      lineShift: team.effectiveLineShift,
      simulationRating: team.simulationRating,
      difficulty,
      formationName: team.formation.name,
      selectedPlayers: team.selectedPlayers,
      selectedCoach: team.selectedCoach,
      rivals,
      completedSeasons,
      tournament: europeanCareer.currentTournament,
      cards,
    });
    europeanCareer = setEuropeanCurrentTournament(europeanCareer, tournament ?? null);
    leaguePositions += summary.leaguePosition;

    const userRow = summary.table?.find((row) => row.teamId === USER_TEAM_ID);
    goalsFor += userRow?.goalsFor ?? 0;
    goalsAgainst += userRow?.goalsAgainst ?? 0;
    leagueMatches += userRow?.played ?? 0;
    if (completedSeasons === 0) {
      firstSeasonPosition = summary.leaguePosition;
      firstSeasonPoints = userRow?.points ?? 0;
    }

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
        firstSeasonPosition,
        firstSeasonPoints,
        goalsForPerMatch: goalsFor / Math.max(1, leagueMatches),
        goalsAgainstPerMatch: goalsAgainst / Math.max(1, leagueMatches),
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

export function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

export function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))] ?? 0;
}

/** Media con su margen al 95 %: las carreras varían mucho y hay que ver qué diferencias son reales. */
export function meanWithMargin(values: number[]): string {
  const average = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / Math.max(1, values.length - 1);

  return `${average.toFixed(2)} ±${(1.96 * Math.sqrt(variance / Math.max(1, values.length))).toFixed(2)}`;
}

export function share(count: number, total: number): string {
  return `${((count / Math.max(1, total)) * 100).toFixed(0)} %`;
}
