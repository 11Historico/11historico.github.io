// src/components/LeagueSimulatorView.tsx

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import type {
  Formation,
  GameDifficulty,
  HalfTimeChoice,
  MatchApproach,
  MatchResult,
  SelectedCoach,
  SelectedPlayer,
  TeamRating,
  RivalTeam,
} from "../types/game";
import type { CareerTrophyCounts } from "../types/career";
import PalmaresTrophyCase from "./PalmaresTrophyCase";

import {
  canFinishSeason,
  createFinalLeagueSummary,
  createUserLeagueSimulation,
  getCupRivalDisplayName,
  getCoachCompetitionBoost,
  getCupStatusLabel,
  getCurrentLeagueDiagnosis,
  getNextUserMatchPreview,
  getPendingCupFixture,
  simulateNextCupMatch,
  simulateNextUserLeagueMatch,
  type UserLeagueSimulationContext,
} from "../simulation/leagueSimulator";

import {
  getDisplayTable,
  getUserLeagueSummary,
  USER_TEAM_NAME,
} from "../simulation/leagueTable";
import { applyHalfTimeChoice } from "../simulation/matchEngine";
import { applyDifficultyToTeamRating } from "../career/teamPower";
import { applyCareerRivalProgression } from "../career/careerRules";
import {
  applySeasonLuckWheelRatingDelta,
  buildAcceptedSeasonLuckWheelState,
  buildSeasonLuckWheelOffer,
  type SeasonLuckWheelOffer,
  type SeasonLuckWheelResolvedResult,
  type SeasonLuckWheelState,
} from "../career/seasonLuckWheel";
import SeasonLuckWheelModal from "./SeasonLuckWheelModal";
import { EUROPEAN_DEFAULT_LEAGUE_MATCHDAYS, shouldPlayEuropeanMatchAtLeagueMatchday } from "../europe/europeanCalendar";
import {
  estimateEuropeanMatchOdds,
  getEuropeanLineDuel,
  simulateEuropeanMatch,
  type SimulateEuropeanMatchInput,
} from "../europe/europeanMatchEngine";
import {
  applyEuropeanMatchResult,
  getEuropeanTournamentPhaseLabel,
  getNextEuropeanMatch,
  isEuropeanKnockoutMatch,
} from "../europe/europeanTournament";
import { getEuropeanCompetitionIconKind, getEuropeanCompetitionLabel } from "../europe/europeanQualification";
import type { EuropeanTournamentMatch, EuropeanTournamentState } from "../europe/europeanTypes";
import EuropeanMatchEvent from "./EuropeanMatchEvent";
import { CompetitionIcon } from "./CompetitionIcon";
import EuropeanLeagueTable from "./EuropeanLeagueTable";
import { MatchApproachControl } from "./MatchApproachControl";
import { MatchOddsBar } from "./MatchOddsBar";
import { MatchSequence } from "./MatchSequence";
import { TeamWithKit } from "./TeamKitIcon";
import { getLineDuelSummary, getResultBadge, getResultClass } from "./matchSequenceTimeline";
import { getLeagueEventSlots, type LeagueEventKind } from "./leagueEventOrder";
import {
  MATCH_PLAYBACK_SPEED_OPTIONS,
  getMatchPlaybackMultiplier,
  setMatchPlaybackSpeed,
  useMatchPlaybackSpeed,
} from "./matchPlaybackSpeed";

import "./LeagueSimulatorView.css";

interface LeagueSimulatorViewProps {
  gameId: string;
  difficulty: GameDifficulty;
  formation: Formation;
  selectedPlayers: SelectedPlayer[];
  selectedCoach: SelectedCoach;
  teamRating: TeamRating;
  isCareerMode?: boolean;
  leagueRivals?: RivalTeam[];
  careerCompletedSeasons?: number;
  careerTrophyCounts?: CareerTrophyCounts;
  initialContext?: UserLeagueSimulationContext;
  onContextChange?: (context: UserLeagueSimulationContext) => void;
  onSeasonLuckWheelPlayerChange?: (context: UserLeagueSimulationContext) => void;
  onSeasonLuckWheelCoachChange?: (context: UserLeagueSimulationContext) => void;
  onFinishLeague?: (summary: ReturnType<typeof createFinalLeagueSummary>) => void;
  europeanTournament?: EuropeanTournamentState | null;
  onEuropeanTournamentChange?: (tournament: EuropeanTournamentState) => void;
  /**
   * Oferta de ruleta pendiente de una sesión anterior (partida guardada).
   * Sin esto, recargar la página mientras el modal de la ruleta está
   * abierto (o justo después de cruzar el disparador de mitad de temporada)
   * pierde la oportunidad para el resto de la temporada: el disparador es
   * un evento puntual al cruzar la jornada, no se repite.
   */
  initialPendingSeasonLuckWheelOffer?: SeasonLuckWheelOffer;
  onPendingSeasonLuckWheelOfferChange?: (offer: SeasonLuckWheelOffer | undefined) => void;
}

const AUTO_SIMULATION_DELAY_MS = 1300;

/**
 * Partido parado en el descanso (v0.25.78). El resultado ya está guardado como si se
 * siguiera igual, así que recargar aquí no permite repetir una primera parte mala.
 */
type PendingHalfTime =
  | { kind: "cup"; contextBefore: UserLeagueSimulationContext; regularTimeResult: MatchResult }
  | { kind: "europe"; tournamentBefore: EuropeanTournamentState; matchId: string; input: SimulateEuropeanMatchInput };

function getDifficultyLabel(difficulty: GameDifficulty): string {
  if (difficulty === "normal") return "Fácil";
  if (difficulty === "leyenda") return "Leyenda";
  return "Normal";
}

function PlaybackSpeedControl() {
  const speed = useMatchPlaybackSpeed();

  return (
    <div className="playback-speed-control" role="group" aria-label="Velocidad de la simulación">
      <span>Velocidad</span>
      {MATCH_PLAYBACK_SPEED_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={speed === option.value ? "playback-speed-option playback-speed-option-active" : "playback-speed-option"}
          aria-pressed={speed === option.value}
          onClick={() => setMatchPlaybackSpeed(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function normalizeLeagueContext(
  initialContext: UserLeagueSimulationContext | undefined,
  selectedCoach: SelectedCoach,
  leagueRivals?: RivalTeam[]
): UserLeagueSimulationContext {
  if (!initialContext || !initialContext.cupState) {
    return {
      ...createUserLeagueSimulation({ rivals: leagueRivals }),
      selectedCoach,
    };
  }

  return {
    ...initialContext,
    selectedCoach,
  };
}

export function LeagueSimulatorView({
  gameId,
  difficulty,
  formation,
  selectedPlayers,
  selectedCoach,
  teamRating,
  isCareerMode = false,
  leagueRivals,
  careerCompletedSeasons = 0,
  careerTrophyCounts,
  initialContext,
  onContextChange,
  onSeasonLuckWheelPlayerChange,
  onSeasonLuckWheelCoachChange,
  onFinishLeague,
  europeanTournament,
  onEuropeanTournamentChange,
  initialPendingSeasonLuckWheelOffer,
  onPendingSeasonLuckWheelOfferChange,
}: LeagueSimulatorViewProps) {
  const [context, setContext] = useState<UserLeagueSimulationContext>(
    () => normalizeLeagueContext(initialContext, selectedCoach, leagueRivals && applyCareerRivalProgression(leagueRivals, careerCompletedSeasons))
  );

  const [lastResult, setLastResult] = useState<MatchResult | undefined>(undefined);
  // Contexto justo antes de lastResult: se muestra mientras se reproduce el partido (ver shownContext).
  const [contextBeforeResult, setContextBeforeResult] = useState<UserLeagueSimulationContext | undefined>(undefined);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  // Pestaña de consulta bajo las acciones: la jornada (por defecto), la clasificación europea o el palmarés.
  const [consultTab, setConsultTab] = useState<"jornada" | "europa" | "palmares">("jornada");
  const [isSequencePlaying, setIsSequencePlaying] = useState(false);
  const playbackMultiplier = getMatchPlaybackMultiplier(useMatchPlaybackSpeed());
  const [pendingWheelOffer, setPendingWheelOfferState] = useState<SeasonLuckWheelOffer | undefined>(
    () => initialPendingSeasonLuckWheelOffer
  );
  const [justPlayedEuropeanMatch, setJustPlayedEuropeanMatch] = useState<EuropeanTournamentMatch | undefined>();
  // Planteamiento para Copa y Europa (v0.25.75). Se mantiene hasta que el usuario lo cambie.
  const [approach, setApproach] = useState<MatchApproach>("balanced");
  const coachSkills = selectedCoach.coachSeason.skills;
  const [pendingHalfTime, setPendingHalfTime] = useState<PendingHalfTime | undefined>();
  // Torneo antes del partido europeo: se enseña mientras se juega, como shownContext en Liga (v0.25.78).
  const [tournamentBeforeMatch, setTournamentBeforeMatch] = useState<EuropeanTournamentState | undefined>();
  const [isEuropeanSequencePlaying, setIsEuropeanSequencePlaying] = useState(false);
  const shownEuropeanTournament = isEuropeanSequencePlaying && tournamentBeforeMatch ? tournamentBeforeMatch : europeanTournament;
  const isMatchPlaying = isSequencePlaying || isEuropeanSequencePlaying;
  // El siguiente partido no se enseña hasta que acaba el actual (v0.25.82).
  // En la simulación automática tampoco entre jornadas: la página daría un salto en cada una.
  const hideNextMatch = isMatchPlaying || isAutoSimulating;

  // Envuelve el setter de estado para que la oferta pendiente también se
  // persista fuera de este componente (ver `initialPendingSeasonLuckWheelOffer`).
  const setPendingWheelOffer = useCallback((offer: SeasonLuckWheelOffer | undefined) => {
    setPendingWheelOfferState(offer);
    onPendingSeasonLuckWheelOfferChange?.(offer);
  }, [onPendingSeasonLuckWheelOfferChange]);

  const teamRatingWithLuckWheel = useMemo(
    () => applySeasonLuckWheelRatingDelta(teamRating, context.seasonLuckWheel?.accepted ? context.seasonLuckWheel.ratingDelta ?? 0 : 0),
    [teamRating, context.seasonLuckWheel]
  );

  const effectiveTeamRating = useMemo(
    () => applyDifficultyToTeamRating(teamRatingWithLuckWheel, difficulty, isCareerMode),
    [teamRatingWithLuckWheel, difficulty, isCareerMode]
  );

  const userSummary = useMemo(
    () =>
      getUserLeagueSummary({
        table: context.state.table,
      }),
    [context.state.table]
  );

  // Mientras se reproduce el partido, la clasificación, los puntos y los resultados siguen
  // como antes de jugarlo: así no se ve el +3 antes del final (v0.25.70).
  const shownContext = isSequencePlaying && contextBeforeResult ? contextBeforeResult : context;

  const shownUserSummary = useMemo(
    () =>
      getUserLeagueSummary({
        table: shownContext.state.table,
      }),
    [shownContext.state.table]
  );

  const displayTable = useMemo(
    () => getDisplayTable(shownContext.state.table),
    [shownContext.state.table]
  );

  const recentResults = useMemo(
    () => [...shownContext.state.results].filter((result) => result.userTeamPlayed).reverse().slice(0, 5),
    [shownContext.state.results]
  );

  const recentCupResults = useMemo(
    () => [...shownContext.cupState.results].reverse().slice(0, 3),
    [shownContext.cupState.results]
  );

  const diagnosis = getCurrentLeagueDiagnosis(shownContext);
  // Previa del siguiente partido de Liga o Copa (v0.25.74).
  const matchPreview = useMemo(
    () => getNextUserMatchPreview({ context, teamRating: effectiveTeamRating, selectedPlayers, approach }),
    [approach, context, effectiveTeamRating, selectedPlayers]
  );
  const pendingCupFixture = getPendingCupFixture(context);
  const userRow = userSummary.row;
  const leagueMatchesPlayed = userRow?.played ?? 0;
  const shownUserRow = shownUserSummary.row;
  const shownMatchesPlayed = shownUserRow?.played ?? 0;
  const leagueProgressLabel = `Jornada ${Math.min(shownMatchesPlayed + 1, 38)} / 38`;

  const pendingEuropeanMatch = shouldPlayEuropeanMatchAtLeagueMatchday(europeanTournament, leagueMatchesPlayed + 1);
  const europeanEventMatch = justPlayedEuropeanMatch ?? (hideNextMatch ? undefined : pendingEuropeanMatch);
  // Un entrenador especialista en Europa suma +1, como el de Copa en la Copa (v0.25.75).
  const europeanUserRating = effectiveTeamRating.overall + getCoachCompetitionBoost(context, "europe");
  const europeanOdds = useMemo(
    () => pendingEuropeanMatch && estimateEuropeanMatchOdds({
      userTeamRating: europeanUserRating,
      opponentRating: pendingEuropeanMatch.opponent.rating,
      isHome: pendingEuropeanMatch.isHome,
      competition: pendingEuropeanMatch.competition,
      approach,
      coachSkills,
      userProfile: effectiveTeamRating,
      selectedPlayers,
    }),
    [approach, coachSkills, effectiveTeamRating, europeanUserRating, pendingEuropeanMatch, selectedPlayers]
  );
  const nextEuropeanMatch = getNextEuropeanMatch(europeanTournament);
  // Con shownContext: la ronda siguiente no debe delatar el resultado mientras se juega.
  const currentCupFixture = shownContext.cupState.status === "active" ? shownContext.cupState.fixtures[shownContext.cupState.currentRoundIndex] : undefined;
  const upcomingCupFixture = currentCupFixture && !currentCupFixture.played ? currentCupFixture : undefined;
  const eventSlots = getLeagueEventSlots({
    leagueMatchesPlayed,
    leagueCompleted: context.state.completed,
    hasLastResult: Boolean(lastResult),
    cupFixture: upcomingCupFixture,
    justPlayedEuropeanMatch,
    nextEuropeanMatch,
  });

  const commitContext = useCallback((nextContext: UserLeagueSimulationContext) => {
    const contextWithCoach = {
      ...nextContext,
      selectedCoach,
    };

    setContext(contextWithCoach);
    onContextChange?.(contextWithCoach);
  }, [onContextChange, selectedCoach]);

  const getLeagueMatchesPlayed = useCallback((targetContext: UserLeagueSimulationContext): number => {
    return targetContext.state.table.find((row) => row.teamId === "athletic_historico")?.played ?? 0;
  }, []);

  const getSeasonLuckWheelTriggerDeadlineMatchday = useCallback((targetContext: UserLeagueSimulationContext): number => {
    const maxMatchday = Math.max(...targetContext.state.fixtures.map((fixture) => fixture.matchday), 38);
    return Math.floor(maxMatchday * 2 / 3);
  }, []);

  const isWithinSeasonLuckWheelTriggerWindow = useCallback((targetContext: UserLeagueSimulationContext): boolean => {
    return getLeagueMatchesPlayed(targetContext) <= getSeasonLuckWheelTriggerDeadlineMatchday(targetContext);
  }, [getLeagueMatchesPlayed, getSeasonLuckWheelTriggerDeadlineMatchday]);

  const careerSeasonKey = useCallback((targetContext: UserLeagueSimulationContext): string => {
    return String(targetContext.leagueSeasonSalt ?? targetContext.state.currentMatchday ?? 0);
  }, []);

  const maybeOfferSeasonLuckWheel = useCallback((params: {
    previousContext: UserLeagueSimulationContext;
    nextContext: UserLeagueSimulationContext;
    result?: MatchResult;
  }): boolean => {
    if (!isCareerMode || pendingWheelOffer || params.nextContext.seasonLuckWheel?.used) {
      return false;
    }

    if (!isWithinSeasonLuckWheelTriggerWindow(params.nextContext)) {
      return false;
    }

    const triggerEvent = (() => {
      if (params.result?.competition === "cup" && params.result.userTeamLost) {
        return "copa_elimination" as const;
      }

      const previousPlayed = getLeagueMatchesPlayed(params.previousContext);
      const nextPlayed = getLeagueMatchesPlayed(params.nextContext);

      if (previousPlayed < 19 && nextPlayed >= 19) {
        return "mid_season" as const;
      }

      return undefined;
    })();

    if (!triggerEvent) return false;

    const offer = buildSeasonLuckWheelOffer({
      seasonId: `${gameId}_${params.nextContext.leagueSeasonSalt ?? careerSeasonKey(params.nextContext)}`,
      triggerEvent,
      currentState: params.nextContext.seasonLuckWheel,
    });

    if (!offer) return false;

    setPendingWheelOffer(offer);
    setIsAutoSimulating(false);
    return true;
  }, [careerSeasonKey, gameId, getLeagueMatchesPlayed, isCareerMode, isWithinSeasonLuckWheelTriggerWindow, pendingWheelOffer, setPendingWheelOffer]);

  function applySeasonLuckWheelState(nextState: SeasonLuckWheelState) {
    const nextContext = {
      ...context,
      seasonLuckWheel: nextState,
    };

    setPendingWheelOffer(undefined);
    commitContext(nextContext);
    finishIfReady(nextContext);
  }

  function handleResolveSeasonLuckWheel(result: SeasonLuckWheelResolvedResult) {
    const nextState = buildAcceptedSeasonLuckWheelState(result, new Date().toISOString());
    const nextContext = {
      ...context,
      seasonLuckWheel: nextState,
    };

    setPendingWheelOffer(undefined);
    commitContext(nextContext);

    if (result.requiresPlayerChange) {
      setIsAutoSimulating(false);
      onSeasonLuckWheelPlayerChange?.(nextContext);
      return;
    }

    if (result.requiresCoachChange) {
      setIsAutoSimulating(false);
      onSeasonLuckWheelCoachChange?.(nextContext);
      return;
    }

    finishIfReady(nextContext);
  }

  const finishIfReady = useCallback((nextContext: UserLeagueSimulationContext) => {
    if (!canFinishSeason(nextContext)) return false;

    const summary = createFinalLeagueSummary({
      gameId,
      formationName: formation.name,
      coachName: selectedCoach.coachSeason.name,
      context: nextContext,
    });

    summary.difficulty = difficulty;
    onFinishLeague?.(summary);

    return true;
  }, [difficulty, formation.name, gameId, onFinishLeague, selectedCoach.coachSeason.name]);

  function handleSimulateEuropeanMatch() {
    if (!europeanTournament || !pendingEuropeanMatch) return;

    const input: SimulateEuropeanMatchInput = {
      userTeamRating: europeanUserRating,
      opponentRating: pendingEuropeanMatch.opponent.rating,
      isHome: pendingEuropeanMatch.isHome,
      competition: pendingEuropeanMatch.competition,
      seed: `${gameId}_${pendingEuropeanMatch.id}`,
      isKnockout: isEuropeanKnockoutMatch(pendingEuropeanMatch),
      approach,
      coachSkills,
      userProfile: effectiveTeamRating,
      selectedPlayers,
    };

    setTournamentBeforeMatch(europeanTournament);
    commitEuropeanOutcome(europeanTournament, pendingEuropeanMatch.id, simulateEuropeanMatch(input));
    setPendingHalfTime({ kind: "europe", tournamentBefore: europeanTournament, matchId: pendingEuropeanMatch.id, input });
  }

  function commitEuropeanOutcome(
    tournamentBefore: EuropeanTournamentState,
    matchId: string,
    outcome: ReturnType<typeof simulateEuropeanMatch>,
  ) {
    const nextTournament = applyEuropeanMatchResult(tournamentBefore, matchId, outcome, EUROPEAN_DEFAULT_LEAGUE_MATCHDAYS);
    onEuropeanTournamentChange?.(nextTournament);
    setJustPlayedEuropeanMatch(nextTournament.matches.find((match) => match.id === matchId));
  }

  // Seguir igual no recalcula nada. Arriesgar y cerrar sustituyen el resultado ya guardado.
  function handleHalfTimeChoice(choice: HalfTimeChoice) {
    if (!pendingHalfTime) return;

    setPendingHalfTime(undefined);

    if (pendingHalfTime.kind === "europe") {
      if (choice !== "keep") {
        const outcome = simulateEuropeanMatch({ ...pendingHalfTime.input, halfTimeChoice: choice });
        commitEuropeanOutcome(pendingHalfTime.tournamentBefore, pendingHalfTime.matchId, outcome);
      }
      return;
    }

    const { contextBefore, regularTimeResult } = pendingHalfTime;
    const simulation = choice === "keep"
      ? { context, result: lastResult }
      : simulateNextCupMatch({
          context: contextBefore,
          teamRating: effectiveTeamRating,
          selectedPlayers,
          regularTimeResult: applyHalfTimeChoice({ result: regularTimeResult, choice, selectedPlayers }),
        });

    if (choice !== "keep") {
      commitContext(simulation.context);
      setLastResult(simulation.result);
    }

    // La ruleta y el fin de temporada esperan a la decisión: dependen del resultado final.
    const wheelOffered = maybeOfferSeasonLuckWheel({
      previousContext: contextBefore,
      nextContext: simulation.context,
      result: simulation.result,
    });

    if (!wheelOffered) {
      finishIfReady(simulation.context);
    }
  }

  function handleContinueAfterEuropeanMatch() {
    setJustPlayedEuropeanMatch(undefined);
  }

  useEffect(() => {
    // La siguiente jornada espera a que termine la secuencia del partido actual.
    if (!isAutoSimulating || isSequencePlaying) return undefined;

    if (context.state.completed || getPendingCupFixture(context) || pendingEuropeanMatch) {
      const stopTimeoutId = window.setTimeout(() => {
        setIsAutoSimulating(false);
      }, 0);

      return () => window.clearTimeout(stopTimeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      const simulation = simulateNextUserLeagueMatch({
        context,
        teamRating: effectiveTeamRating,
        selectedPlayers,
      });

      commitContext(simulation.context);
      setLastResult(simulation.result);
      setContextBeforeResult(context);
      setJustPlayedEuropeanMatch(undefined);

      const wheelOffered = maybeOfferSeasonLuckWheel({
        previousContext: context,
        nextContext: simulation.context,
        result: simulation.result,
      });

      // finishIfReady no debe quedar como el último operando de un || junto a
      // simulation.context.state.completed: si la temporada se completa
      // justo en este partido de la simulación automática, el cortocircuito
      // del || nunca llegaba a invocarlo, dejando la carrera bloqueada en
      // "Liga terminada" sin poder avanzar. Se llama aparte, igual que en
      // handleSimulateFullSeason/handleSimulateNextCupMatch/
      // handleSimulateFullCupAndFinishSeason (guardado solo por
      // !wheelOffered, para no disparar el fin de temporada mientras hay una
      // oferta de ruleta pendiente de resolver).
      const finished = wheelOffered ? false : finishIfReady(simulation.context);

      const shouldStop =
        wheelOffered ||
        !simulation.result ||
        Boolean(simulation.stoppedForCup) ||
        simulation.context.state.completed ||
        Boolean(getPendingCupFixture(simulation.context)) ||
        finished;

      if (shouldStop) {
        setIsAutoSimulating(false);
      }
    }, AUTO_SIMULATION_DELAY_MS * playbackMultiplier);

    return () => window.clearTimeout(timeoutId);
  }, [commitContext, context, effectiveTeamRating, finishIfReady, isAutoSimulating, isSequencePlaying, maybeOfferSeasonLuckWheel, pendingEuropeanMatch, playbackMultiplier, selectedPlayers]);

  function simulateLeagueUntilNextEvent(params: {
    initialContext: UserLeagueSimulationContext;
  }): {
    nextContext: UserLeagueSimulationContext;
    lastResult?: MatchResult;
    contextBeforeLastResult?: UserLeagueSimulationContext;
    wheelOffered: boolean;
  } {
    let nextContext = params.initialContext;
    let lastResult: MatchResult | undefined;
    let contextBeforeLastResult: UserLeagueSimulationContext | undefined;
    let wheelOffered = false;

    while (
      !nextContext.state.completed &&
      !getPendingCupFixture(nextContext) &&
      !shouldPlayEuropeanMatchAtLeagueMatchday(europeanTournament, getLeagueMatchesPlayed(nextContext) + 1)
    ) {
      const previousContext = nextContext;
      const simulation = simulateNextUserLeagueMatch({
        context: nextContext,
        teamRating: effectiveTeamRating,
        selectedPlayers,
      });

      nextContext = simulation.context;
      lastResult = simulation.result;
      contextBeforeLastResult = previousContext;

      if (!simulation.result || simulation.stoppedForCup) {
        break;
      }

      wheelOffered = maybeOfferSeasonLuckWheel({
        previousContext,
        nextContext,
        result: simulation.result,
      });

      if (wheelOffered) {
        break;
      }
    }

    return { nextContext, lastResult, contextBeforeLastResult, wheelOffered };
  }

  function handleSimulateFullSeason() {
    setIsAutoSimulating(false);

    const simulation = simulateLeagueUntilNextEvent({ initialContext: context });

    commitContext(simulation.nextContext);
    setLastResult(simulation.lastResult);
    setContextBeforeResult(simulation.contextBeforeLastResult);
    setJustPlayedEuropeanMatch(undefined);

    if (!simulation.wheelOffered) {
      finishIfReady(simulation.nextContext);
    }
  }

  function handleSimulateNextCupMatch() {
    setIsAutoSimulating(false);

    const simulation = simulateNextCupMatch({
      context,
      teamRating: effectiveTeamRating,
      selectedPlayers,
      approach,
    });

    commitContext(simulation.context);
    setLastResult(simulation.result);
    setContextBeforeResult(context);
    setJustPlayedEuropeanMatch(undefined);

    if (simulation.regularTimeResult) {
      setPendingHalfTime({ kind: "cup", contextBefore: context, regularTimeResult: simulation.regularTimeResult });
    }
  }

  function handleSimulateFullCupAndFinishSeason() {
    setIsAutoSimulating(false);

    let nextContext = context;
    let lastUserResult: MatchResult | undefined;
    let contextBeforeLastResult: UserLeagueSimulationContext | undefined;
    let wheelOffered = false;

    while (nextContext.cupState.status === "active") {
      const pendingCup = getPendingCupFixture(nextContext);

      if (!pendingCup) {
        const leagueSimulation = simulateLeagueUntilNextEvent({ initialContext: nextContext });
        nextContext = leagueSimulation.nextContext;
        if (leagueSimulation.lastResult) {
          lastUserResult = leagueSimulation.lastResult;
          contextBeforeLastResult = leagueSimulation.contextBeforeLastResult;
        }
        wheelOffered = leagueSimulation.wheelOffered;

        if (wheelOffered || !getPendingCupFixture(nextContext)) {
          break;
        }
      }

      const previousContext = nextContext;
      const cupSimulation = simulateNextCupMatch({
        context: nextContext,
        teamRating: effectiveTeamRating,
        selectedPlayers,
        approach,
      });

      nextContext = cupSimulation.context;
      lastUserResult = cupSimulation.result;
      contextBeforeLastResult = previousContext;

      if (!cupSimulation.result) {
        break;
      }

      wheelOffered = maybeOfferSeasonLuckWheel({
        previousContext,
        nextContext,
        result: cupSimulation.result,
      });

      if (wheelOffered) {
        break;
      }
    }

    if (!wheelOffered && nextContext.cupState.status !== "active") {
      const leagueSimulation = simulateLeagueUntilNextEvent({ initialContext: nextContext });
      nextContext = leagueSimulation.nextContext;
      if (leagueSimulation.lastResult) {
        lastUserResult = leagueSimulation.lastResult;
        contextBeforeLastResult = leagueSimulation.contextBeforeLastResult;
      }
      wheelOffered = leagueSimulation.wheelOffered;
    }

    commitContext(nextContext);
    setLastResult(lastUserResult);
    setContextBeforeResult(contextBeforeLastResult);
    setJustPlayedEuropeanMatch(undefined);

    if (!wheelOffered) {
      finishIfReady(nextContext);
    }
  }

  function handleToggleAutoSimulation() {
    if (context.state.completed || pendingCupFixture || pendingEuropeanMatch) return;
    setIsAutoSimulating((current) => !current);
  }

  // Una tarjeta por competición. Lo pendiente usa la tarjeta completa; lo que viene después, una compacta.
  const eventCards: Record<LeagueEventKind, ReactNode> = {
    copa: !hideNextMatch && upcomingCupFixture && (pendingCupFixture ? (
      <section key="copa" className="cup-event-card">
        <span>
          <CompetitionIcon kind="copa" />
          Copa del Rey
        </span>
        <h2>{pendingCupFixture.roundName}</h2>
        <p>
          Rival: {getCupRivalDisplayName(pendingCupFixture.rivalTeamId)} · Partido {pendingCupFixture.venue === "home" ? "en San Mamés" : "fuera de casa"}
        </p>
      </section>
    ) : (
      <section key="copa" className="cup-event-card next-event-card" aria-label="Próximo partido de Copa">
        <span>
          <CompetitionIcon kind="copa" />
          Próximo · Copa del Rey
        </span>
        <h2>{upcomingCupFixture.roundName}</h2>
        <p>
          Tras la jornada {upcomingCupFixture.gateMatchday} de Liga · Rival: {getCupRivalDisplayName(upcomingCupFixture.rivalTeamId)} ·{" "}
          {upcomingCupFixture.venue === "home" ? "En San Mamés" : "Fuera de casa"}
        </p>
      </section>
    )),
    europa: shownEuropeanTournament && (europeanEventMatch ? (
      <EuropeanMatchEvent
        key="europa"
        tournament={shownEuropeanTournament}
        match={europeanEventMatch}
        userTeamRating={europeanUserRating}
        pitch={{ formation, selectedPlayers }}
        onHalfTimeChoice={pendingHalfTime?.kind === "europe" ? handleHalfTimeChoice : undefined}
        onPlayingChange={setIsEuropeanSequencePlaying}
        onContinue={handleContinueAfterEuropeanMatch}
      />
    ) : !hideNextMatch && nextEuropeanMatch && (
      <section key="europa" className="cup-event-card next-event-card" aria-label="Próximo partido europeo">
        <span>
          <CompetitionIcon kind={getEuropeanCompetitionIconKind(nextEuropeanMatch.competition)} />
          Próximo · {getEuropeanCompetitionLabel(nextEuropeanMatch.competition)}
        </span>
        <h2>{getEuropeanTournamentPhaseLabel(nextEuropeanMatch.phase)}</h2>
        <p>
          Antes de la jornada {nextEuropeanMatch.matchday} de Liga · Rival: {nextEuropeanMatch.opponent.name} ·{" "}
          {nextEuropeanMatch.isHome ? "En San Mamés" : "Fuera de casa"}
        </p>
      </section>
    )),
    liga: lastResult && (
      <MatchSequence
        key={lastResult.fixtureId}
        result={lastResult}
        onPlayingChange={setIsSequencePlaying}
        pitch={{ formation, selectedPlayers }}
        onHalfTimeChoice={pendingHalfTime?.kind === "cup" ? handleHalfTimeChoice : undefined}
      />
    ),
  };

  return (
    <section className="league-simulator-view">
      {pendingWheelOffer && (
        <SeasonLuckWheelModal
          offer={pendingWheelOffer}
          onDecline={applySeasonLuckWheelState}
          onResolve={handleResolveSeasonLuckWheel}
        />
      )}

      <header className="league-header">
        <div>
          <p className="eyebrow">LaLiga 25/26 + Copa del Rey</p>
          <h1>Simulación de temporada</h1>
          <p>
            {isCareerMode ? "Carrera" : "Partida rápida"}: simula Liga y Copa con ritmo partido a partido. Puedes dejar correr
            la simulación automática o saltar hasta el próximo evento.
          </p>
        </div>

        <div className="league-main-card">
          <span>Posición actual</span>
          <strong>{shownUserSummary.position ?? "--"}º</strong>
          <small>{shownUserRow ? `${shownUserRow.points} puntos · ${shownMatchesPlayed}/38` : "Sin partidos"}</small>
          <em>Dificultad {getDifficultyLabel(difficulty)}</em>
        </div>
      </header>

      <div className="league-layout">
        <main className="league-main-panel">
          <div className={`league-actions-card ${isAutoSimulating ? "league-actions-card-running" : ""}`}>
            <div>
              <h2>{hideNextMatch ? "Partido en juego" : pendingCupFixture ? "Toca Copa del Rey" : pendingEuropeanMatch ? "Noche europea" : context.state.completed ? "Liga terminada" : "Próximo paso"}</h2>
              <p>{isAutoSimulating ? `${leagueProgressLabel} · Simulación automática en marcha.` : diagnosis}</p>
              {!hideNextMatch && matchPreview && (pendingCupFixture || !pendingEuropeanMatch) && (
                <section className="next-match-preview" aria-label="Previa del próximo partido">
                  <span>
                    Próximo partido · {matchPreview.competition === "cup" ? "Copa del Rey" : "LaLiga"} · {matchPreview.label} ·{" "}
                    {matchPreview.venue === "home" ? "En San Mamés" : "Fuera de casa"}
                  </span>
                  <strong>
                    {matchPreview.venue === "home"
                      ? `${USER_TEAM_NAME} (${matchPreview.userOverall}) vs ${matchPreview.rivalName} (${matchPreview.rivalOverall})`
                      : `${matchPreview.rivalName} (${matchPreview.rivalOverall}) vs ${USER_TEAM_NAME} (${matchPreview.userOverall})`}
                  </strong>
                  <small className="next-match-lines">{getLineDuelSummary(matchPreview.lineDuel)}</small>
                  {matchPreview.competition === "cup" && (
                    <MatchApproachControl value={approach} onChange={setApproach} competition="cup" coachSkills={coachSkills} />
                  )}
                  <MatchOddsBar
                    odds={matchPreview.odds}
                    note={matchPreview.competition === "cup" ? "en 90 minutos; si hay empate, prórroga" : undefined}
                  />
                </section>
              )}
              {!hideNextMatch && pendingEuropeanMatch && europeanOdds && !pendingCupFixture && (
                <section className="next-match-preview" aria-label="Previa del próximo partido">
                  <span>
                    Próximo partido · {getEuropeanCompetitionLabel(pendingEuropeanMatch.competition)} ·{" "}
                    {getEuropeanTournamentPhaseLabel(pendingEuropeanMatch.phase)} · {pendingEuropeanMatch.isHome ? "En San Mamés" : "Fuera de casa"}
                  </span>
                  <strong>
                    {pendingEuropeanMatch.isHome
                      ? `${USER_TEAM_NAME} (${Math.round(europeanUserRating)}) vs ${pendingEuropeanMatch.opponent.name} (${pendingEuropeanMatch.opponent.rating})`
                      : `${pendingEuropeanMatch.opponent.name} (${pendingEuropeanMatch.opponent.rating}) vs ${USER_TEAM_NAME} (${Math.round(europeanUserRating)})`}
                  </strong>
                  <small className="next-match-lines">
                    {getLineDuelSummary(getEuropeanLineDuel({
                      userTeamRating: europeanUserRating,
                      opponentRating: pendingEuropeanMatch.opponent.rating,
                      competition: pendingEuropeanMatch.competition,
                      userProfile: effectiveTeamRating,
                    }))}
                  </small>
                  <MatchApproachControl value={approach} onChange={setApproach} competition="europe" coachSkills={coachSkills} />
                  <MatchOddsBar
                    odds={europeanOdds}
                    note={isEuropeanKnockoutMatch(pendingEuropeanMatch) ? "en 90 minutos; si hay empate, prórroga y penaltis" : undefined}
                  />
                </section>
              )}
              <PlaybackSpeedControl />
            </div>

            {pendingCupFixture ? (
              <div className="league-buttons">
                <button type="button" onClick={handleSimulateNextCupMatch} disabled={isMatchPlaying}>
                  Simular partido de Copa
                </button>

                <button
                  type="button"
                  className="secondary-league-button"
                  onClick={handleSimulateFullCupAndFinishSeason}
                  disabled={isMatchPlaying}
                >
                  Simular Copa y terminar temporada
                </button>
              </div>
            ) : (
              <div className="league-buttons">
                {pendingEuropeanMatch && (
                  <button type="button" onClick={handleSimulateEuropeanMatch} disabled={isMatchPlaying}>
                    Simular partido europeo
                  </button>
                )}

                <button
                  type="button"
                  className={isAutoSimulating ? "stop-league-button" : "secondary-league-button"}
                  onClick={handleToggleAutoSimulation}
                  disabled={context.state.completed || Boolean(pendingWheelOffer) || Boolean(pendingEuropeanMatch) || Boolean(pendingHalfTime)}
                >
                  {isAutoSimulating ? "Parar simulación" : "Simular"}
                </button>

                <button
                  type="button"
                  className="tertiary-league-button"
                  onClick={handleSimulateFullSeason}
                  disabled={context.state.completed || isAutoSimulating || Boolean(pendingWheelOffer) || Boolean(pendingEuropeanMatch) || Boolean(pendingHalfTime)}
                >
                  Saltar hasta próximo evento
                </button>
              </div>
            )}
          </div>

          {(europeanTournament || (isCareerMode && careerTrophyCounts)) && (
            <div className="league-consult-tabs" role="tablist" aria-label="Consultar">
              <button
                type="button"
                role="tab"
                className="league-consult-tab"
                aria-selected={consultTab === "jornada"}
                onClick={() => setConsultTab("jornada")}
              >
                Jornada
              </button>
              {europeanTournament && (
                <button
                  type="button"
                  role="tab"
                  className="league-consult-tab"
                  aria-selected={consultTab === "europa"}
                  onClick={() => setConsultTab("europa")}
                >
                  Clasificación europea
                </button>
              )}
              {isCareerMode && careerTrophyCounts && (
                <button
                  type="button"
                  role="tab"
                  className="league-consult-tab"
                  aria-selected={consultTab === "palmares"}
                  onClick={() => setConsultTab("palmares")}
                >
                  Palmarés
                </button>
              )}
            </div>
          )}

          {consultTab === "europa" && shownEuropeanTournament && (
            <div role="tabpanel" aria-label="Clasificación europea">
              <EuropeanLeagueTable tournament={shownEuropeanTournament} />
            </div>
          )}

          {consultTab === "palmares" && isCareerMode && careerTrophyCounts && (
            <div role="tabpanel" aria-label="Palmarés">
              <PalmaresTrophyCase trophyCounts={careerTrophyCounts} variant="career" />
            </div>
          )}

          {/* Tarjetas de partido en el orden en que se juegan (v0.25.69, leagueEventOrder.ts). */}
          {eventSlots.map(({ kind }) => eventCards[kind])}
          {context.seasonLuckWheel?.used && (
            <section className="season-luck-wheel-status-card">
              <span>Ruleta de la temporada</span>
              <h2>{context.seasonLuckWheel.accepted ? "Resultado aplicado" : "Oportunidad rechazada"}</h2>
              <p>
                {context.seasonLuckWheel.accepted
                  ? `${context.seasonLuckWheel.resultText ?? "La ruleta ya ha marcado esta temporada."} ${context.seasonLuckWheel.ratingDelta ? `Efecto de media: ${context.seasonLuckWheel.ratingDelta > 0 ? "+" : ""}${context.seasonLuckWheel.ratingDelta.toFixed(1)}.` : ""} ${context.seasonLuckWheel.requiresPlayerChange ? "Cambio de jugador ejecutable disponible." : ""} ${context.seasonLuckWheel.requiresCoachChange ? "Cambio de entrenador ejecutable disponible." : ""}`
                  : "Decidiste no jugar la ruleta. Esta temporada ya no volverá a aparecer."}
              </p>
            </section>
          )}

          <section className="season-stats-card">
            <h2>Estadísticas del Athletic Club Histórico</h2>

            <div className="season-stats-grid">
              <div>
                <span>Goles a favor</span>
                <strong>{shownContext.userTeamStats.goalsFor}</strong>
              </div>
              <div>
                <span>Goles en contra</span>
                <strong>{shownContext.userTeamStats.goalsAgainst}</strong>
              </div>
              <div>
                <span>Porterías a cero</span>
                <strong>{shownContext.userTeamStats.cleanSheets}</strong>
              </div>
              <div>
                <span>Partidos Liga</span>
                <strong>{shownMatchesPlayed}/38</strong>
              </div>
            </div>
          </section>

          <section className="scorers-card">
            <div>
              <h2>Máximos goleadores</h2>
              <ol>
                {shownContext.userTeamStats.topScorers.slice(0, 5).map((player) => (
                  <li key={`scorer_${player.playerId}`}>
                    <span>{player.playerName}</span>
                    <strong>{player.goals}</strong>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h2>Máximos asistentes</h2>
              <ol>
                {shownContext.userTeamStats.topAssisters.slice(0, 5).map((player) => (
                  <li key={`assist_${player.playerId}`}>
                    <span>{player.playerName}</span>
                    <strong>{player.assists}</strong>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </main>

        <aside className="league-side-panel">
          <section className="table-card">
            <h2>Clasificación</h2>

            <div className="league-table">
              <div className="league-table-head">
                <span>#</span>
                <span>Equipo</span>
                <span>Pts</span>
                <span>DG</span>
              </div>

              {displayTable.map((row, index) => (
                <div
                  key={row.teamId}
                  className={`league-table-row ${
                    row.teamName === USER_TEAM_NAME ? "league-table-row-user" : ""
                  }`}
                >
                  <span>{index + 1}</span>
                  <span>{row.teamName}</span>
                  <strong>{row.points}</strong>
                  <span>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="recent-results-card">
            <h2>Copa del Rey</h2>
            <p className="cup-status-text">{getCupStatusLabel(shownContext.cupState)}</p>

            <div className="recent-results-list">
              {recentCupResults.map((result) => (
                <article key={result.fixtureId}>
                  <span>{result.roundName}</span>
                  <strong className="recent-result-scoreline">
                    <TeamWithKit teamName={result.homeTeamName} />
                    <span>{result.homeGoals}-{result.awayGoals}</span>
                    <TeamWithKit teamName={result.awayTeamName} />
                  </strong>
                  <small className={getResultClass(result)}>{getResultBadge(result)}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="recent-results-card">
            <div className="recent-results-heading">
              <h2>Últimos resultados de Liga</h2>
              <span>{shownMatchesPlayed}/38</span>
            </div>

            {recentResults.length === 0 && (
              <p className="empty-league-message">Aún no se ha simulado ningún partido.</p>
            )}

            <div className="recent-results-list">
              {recentResults.map((result) => (
                <article key={result.fixtureId}>
                  <span>J{result.matchday}</span>
                  <strong className="recent-result-scoreline">
                    <TeamWithKit teamName={result.homeTeamName} />
                    <span>{result.homeGoals}-{result.awayGoals}</span>
                    <TeamWithKit teamName={result.awayTeamName} />
                  </strong>
                  <small className={getResultClass(result)}>{getResultBadge(result)}</small>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

export default LeagueSimulatorView;
