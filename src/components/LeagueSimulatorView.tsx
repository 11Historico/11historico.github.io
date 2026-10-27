// src/components/LeagueSimulatorView.tsx

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  Formation,
  GameDifficulty,
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
  getCupStatusLabel,
  getCurrentLeagueDiagnosis,
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
import { simulateEuropeanMatch } from "../europe/europeanMatchEngine";
import { applyEuropeanMatchResult, isEuropeanKnockoutMatch } from "../europe/europeanTournament";
import type { EuropeanTournamentMatch, EuropeanTournamentState } from "../europe/europeanTypes";
import EuropeanMatchEvent from "./EuropeanMatchEvent";
import { CompetitionIcon } from "./CompetitionIcon";
import EuropeanLeagueTable from "./EuropeanLeagueTable";
import {
  MATCH_SEQUENCE_TICK_MS,
  countGoalsForTeam,
  getMatchSequenceDurationMs,
  getMatchSequenceFrame,
} from "./matchSequenceTimeline";
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

function getResultBadge(result: MatchResult): string {
  if (result.userTeamWon) return "Victoria";
  if (result.userTeamDrew) return "Empate";
  return "Derrota";
}

function getResultClass(result: MatchResult): string {
  if (result.userTeamWon) return "result-badge result-badge-win";
  if (result.userTeamDrew) return "result-badge result-badge-draw";
  return "result-badge result-badge-loss";
}

function getDifficultyLabel(difficulty: GameDifficulty): string {
  if (difficulty === "normal") return "Fácil";
  if (difficulty === "leyenda") return "Leyenda";
  return "Normal";
}

function normalizeTeamNameForKit(teamName: string): string {
  return teamName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getTeamKitClass(teamName: string): string {
  const normalizedName = normalizeTeamNameForKit(teamName);

  if (
    normalizedName.includes("athletic club historico") ||
    normalizedName.includes("athletic historico") ||
    normalizedName.includes("zurigorri")
  ) {
    return "team-kit-athletic";
  }

  if (normalizedName.includes("sevilla")) {
    return "team-kit-sevilla";
  }

  if (normalizedName.includes("real madrid")) return "team-kit-real-madrid";
  if (normalizedName.includes("barcelona") || normalizedName.includes("fc barcelona")) return "team-kit-barcelona";
  if (normalizedName.includes("atletico")) return "team-kit-atletico";
  if (normalizedName.includes("valencia")) return "team-kit-valencia";
  if (normalizedName.includes("betis")) return "team-kit-betis";
  if (normalizedName.includes("real sociedad")) return "team-kit-sociedad";
  if (normalizedName.includes("osasuna")) return "team-kit-osasuna";
  if (normalizedName.includes("celta")) return "team-kit-celta";
  if (normalizedName.includes("alaves")) return "team-kit-alaves";
  if (normalizedName.includes("elche")) return "team-kit-elche";
  if (normalizedName.includes("getafe")) return "team-kit-getafe";
  if (normalizedName.includes("girona")) return "team-kit-girona";
  if (normalizedName.includes("levante")) return "team-kit-levante";
  if (normalizedName.includes("rayo")) return "team-kit-rayo";
  if (normalizedName.includes("espanyol")) return "team-kit-espanyol";
  if (normalizedName.includes("mallorca")) return "team-kit-mallorca";
  if (normalizedName.includes("oviedo")) return "team-kit-oviedo";
  if (normalizedName.includes("villarreal")) return "team-kit-villarreal";
  if (normalizedName.includes("mirandes")) return "team-kit-mirandes";
  if (normalizedName.includes("zaragoza")) return "team-kit-zaragoza";
  if (normalizedName.includes("sporting")) return "team-kit-sporting";
  if (normalizedName.includes("tenerife")) return "team-kit-tenerife";
  if (normalizedName.includes("racing")) return "team-kit-racing";
  if (normalizedName.includes("deportivo de la coruna") || normalizedName.includes("coruna")) return "team-kit-deportivo";
  if (normalizedName.includes("albacete")) return "team-kit-albacete";
  if (normalizedName.includes("alcoyano")) return "team-kit-alcoyano";
  if (normalizedName.includes("cultural")) return "team-kit-cultural";
  if (normalizedName.includes("cadiz")) return "team-kit-cadiz";
  if (normalizedName.includes("malaga")) return "team-kit-malaga";
  if (normalizedName.includes("numancia")) return "team-kit-numancia";
  if (normalizedName.includes("almeria")) return "team-kit-almeria";
  if (normalizedName.includes("alcorcon")) return "team-kit-alcorcon";
  if (normalizedName.includes("badajoz")) return "team-kit-badajoz";
  if (normalizedName.includes("castellon")) return "team-kit-castellon";
  if (normalizedName.includes("eibar")) return "team-kit-eibar";
  if (normalizedName.includes("burgos")) return "team-kit-burgos";
  if (normalizedName.includes("las palmas")) return "team-kit-las-palmas";
  if (normalizedName.includes("cordoba")) return "team-kit-cordoba";
  if (normalizedName.includes("granada")) return "team-kit-granada";
  if (normalizedName.includes("huesca")) return "team-kit-huesca";
  if (normalizedName.includes("barakaldo")) return "team-kit-barakaldo";
  if (normalizedName.includes("sestao")) return "team-kit-sestao";
  if (normalizedName.includes("portugalete")) return "team-kit-portugalete";

  return "team-kit-default";
}

export function TeamKitIcon({ teamName, compact = false }: { teamName: string; compact?: boolean }) {
  return (
    <span
      className={`team-kit-icon ${getTeamKitClass(teamName)} ${
        compact ? "team-kit-icon-compact" : ""
      }`}
      aria-label={`Camiseta ${teamName}`}
      title={teamName}
    >
      <span className="team-kit-sleeve team-kit-sleeve-left" />
      <span className="team-kit-body" />
      <span className="team-kit-sleeve team-kit-sleeve-right" />
    </span>
  );
}

function TeamWithKit({ teamName }: { teamName: string }) {
  return (
    <span className="team-with-kit">
      <TeamKitIcon teamName={teamName} />
      <span>{teamName}</span>
    </span>
  );
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

function getMatchSequenceTag(result: MatchResult): string {
  if (result.roundName?.startsWith("Supercopa")) return result.roundName;
  if (result.competition === "cup") return `Copa del Rey · ${result.roundName ?? ""}`.trim();
  return `LaLiga · Jornada ${result.matchday}`;
}

export function MatchSequence({
  result,
  onPlayingChange,
}: {
  result: MatchResult;
  onPlayingChange: (playing: boolean) => void;
}) {
  const playbackMultiplier = getMatchPlaybackMultiplier(useMatchPlaybackSpeed());
  const durationMs = getMatchSequenceDurationMs(playbackMultiplier);
  const [elapsedMs, setElapsedMs] = useState(() =>
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? durationMs : 0,
  );
  const frame = getMatchSequenceFrame(result.goalEvents, elapsedMs, playbackMultiplier);
  const isFinal = frame.stage === "final";
  const homeGoals = isFinal ? result.homeGoals : countGoalsForTeam(frame.visibleGoals, result.homeTeamName);
  const awayGoals = isFinal ? result.awayGoals : countGoalsForTeam(frame.visibleGoals, result.awayTeamName);

  useEffect(() => {
    onPlayingChange(!isFinal);
  }, [isFinal, onPlayingChange]);

  useEffect(() => {
    return () => onPlayingChange(false);
  }, [onPlayingChange]);

  useEffect(() => {
    if (isFinal) return undefined;

    const intervalId = window.setInterval(() => {
      setElapsedMs((current) => Math.min(durationMs, current + MATCH_SEQUENCE_TICK_MS));
    }, MATCH_SEQUENCE_TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [durationMs, isFinal]);

  return (
    <article className={`last-result-card match-sequence ${result.competition === "cup" ? "match-sequence-cup" : "match-sequence-league"}`}>
      <div className="last-result-top">
        {isFinal ? (
          result.userTeamPlayed === false ? (
            <span className="match-sequence-clock">Final</span>
          ) : (
            <span className={getResultClass(result)}>{getResultBadge(result)}</span>
          )
        ) : (
          <span className="match-sequence-clock">{frame.stage === "preview" ? "Previa" : `${frame.minute}'`}</span>
        )}
        <span className="match-sequence-tag">
          <CompetitionIcon kind={result.competition === "cup" ? "copa" : "liga"} />
          {getMatchSequenceTag(result)}
        </span>
      </div>

      <div className="last-result-scoreboard">
        <ScoreTeam teamName={result.homeTeamName} goals={homeGoals} />
        <span className="score-separator">-</span>
        <ScoreTeam teamName={result.awayTeamName} goals={awayGoals} />
      </div>

      <div className="match-sequence-progress" aria-hidden="true">
        <span style={{ width: `${(elapsedMs / durationMs) * 100}%` }} />
      </div>

      {frame.visibleGoals.length > 0 ? (
        <ul className="goal-events-list" aria-live="polite">
          {frame.visibleGoals.map((event, index) => (
            <li key={`${event.minute}_${event.teamName}_${index}`}>
              <strong>{event.minute}'</strong>
              <TeamWithKit teamName={event.teamName} />
              {event.scorerName && <em>{event.scorerName}</em>}
              {event.assistName && <small>Asistencia: {event.assistName}</small>}
            </li>
          ))}
        </ul>
      ) : (
        isFinal && <p className="empty-league-message">Partido sin goles.</p>
      )}

      {!isFinal && (
        <button
          type="button"
          className="secondary-league-button match-sequence-skip"
          onClick={() => setElapsedMs(durationMs)}
        >
          Saltar
        </button>
      )}
    </article>
  );
}

function ScoreTeam({ teamName, goals }: { teamName: string; goals: number }) {
  return (
    <span className="score-team">
      <TeamKitIcon teamName={teamName} />
      <span>{teamName}</span>
      <strong>{goals}</strong>
    </span>
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
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [isEuropeanTableOpen, setIsEuropeanTableOpen] = useState(false);
  const [isPalmaresOpen, setIsPalmaresOpen] = useState(false);
  const [isSequencePlaying, setIsSequencePlaying] = useState(false);
  const playbackMultiplier = getMatchPlaybackMultiplier(useMatchPlaybackSpeed());
  const [pendingWheelOffer, setPendingWheelOfferState] = useState<SeasonLuckWheelOffer | undefined>(
    () => initialPendingSeasonLuckWheelOffer
  );
  const [justPlayedEuropeanMatch, setJustPlayedEuropeanMatch] = useState<EuropeanTournamentMatch | undefined>();

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

  const displayTable = useMemo(
    () => getDisplayTable(context.state.table),
    [context.state.table]
  );

  const recentResults = useMemo(
    () => [...context.state.results].filter((result) => result.userTeamPlayed).reverse().slice(0, 5),
    [context.state.results]
  );

  const recentCupResults = useMemo(
    () => [...context.cupState.results].reverse().slice(0, 3),
    [context.cupState.results]
  );

  const diagnosis = getCurrentLeagueDiagnosis(context);
  const pendingCupFixture = getPendingCupFixture(context);
  const userRow = userSummary.row;
  const userPosition = userSummary.position;
  const leagueMatchesPlayed = userRow?.played ?? 0;
  const leagueProgressLabel = `Jornada ${Math.min(leagueMatchesPlayed + 1, 38)} / 38`;

  const pendingEuropeanMatch = shouldPlayEuropeanMatchAtLeagueMatchday(europeanTournament, leagueMatchesPlayed + 1);
  const europeanEventMatch = justPlayedEuropeanMatch ?? pendingEuropeanMatch;

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

    const outcome = simulateEuropeanMatch({
      userTeamRating: effectiveTeamRating.overall,
      opponentRating: pendingEuropeanMatch.opponent.rating,
      isHome: pendingEuropeanMatch.isHome,
      competition: pendingEuropeanMatch.competition,
      seed: `${gameId}_${pendingEuropeanMatch.id}`,
      isKnockout: isEuropeanKnockoutMatch(pendingEuropeanMatch),
    });

    const nextTournament = applyEuropeanMatchResult(
      europeanTournament,
      pendingEuropeanMatch.id,
      outcome,
      EUROPEAN_DEFAULT_LEAGUE_MATCHDAYS,
    );
    onEuropeanTournamentChange?.(nextTournament);

    const playedMatch = nextTournament.matches.find((match) => match.id === pendingEuropeanMatch.id);
    setJustPlayedEuropeanMatch(playedMatch);
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
  }): { nextContext: UserLeagueSimulationContext; lastResult?: MatchResult; wheelOffered: boolean } {
    let nextContext = params.initialContext;
    let lastResult: MatchResult | undefined;
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

    return { nextContext, lastResult, wheelOffered };
  }

  function handleSimulateFullSeason() {
    setIsAutoSimulating(false);

    const simulation = simulateLeagueUntilNextEvent({ initialContext: context });

    commitContext(simulation.nextContext);
    setLastResult(simulation.lastResult);

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
    });

    commitContext(simulation.context);
    setLastResult(simulation.result);

    const wheelOffered = maybeOfferSeasonLuckWheel({
      previousContext: context,
      nextContext: simulation.context,
      result: simulation.result,
    });

    if (!wheelOffered) {
      finishIfReady(simulation.context);
    }
  }

  function handleSimulateFullCupAndFinishSeason() {
    setIsAutoSimulating(false);

    let nextContext = context;
    let lastUserResult: MatchResult | undefined;
    let wheelOffered = false;

    while (nextContext.cupState.status === "active") {
      const pendingCup = getPendingCupFixture(nextContext);

      if (!pendingCup) {
        const leagueSimulation = simulateLeagueUntilNextEvent({ initialContext: nextContext });
        nextContext = leagueSimulation.nextContext;
        lastUserResult = leagueSimulation.lastResult ?? lastUserResult;
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
      });

      nextContext = cupSimulation.context;
      lastUserResult = cupSimulation.result;

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
      lastUserResult = leagueSimulation.lastResult ?? lastUserResult;
      wheelOffered = leagueSimulation.wheelOffered;
    }

    commitContext(nextContext);
    setLastResult(lastUserResult);

    if (!wheelOffered) {
      finishIfReady(nextContext);
    }
  }

  function handleToggleAutoSimulation() {
    if (context.state.completed || pendingCupFixture || pendingEuropeanMatch) return;
    setIsAutoSimulating((current) => !current);
  }

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
          <strong>{userPosition ?? "--"}º</strong>
          <small>{userRow ? `${userRow.points} puntos · ${leagueMatchesPlayed}/38` : "Sin partidos"}</small>
          <em>Dificultad {getDifficultyLabel(difficulty)}</em>
        </div>
      </header>

      <div className="league-layout">
        <main className="league-main-panel">
          <div className={`league-actions-card ${isAutoSimulating ? "league-actions-card-running" : ""}`}>
            <div>
              <h2>{pendingCupFixture ? "Toca Copa del Rey" : pendingEuropeanMatch ? "Noche europea" : context.state.completed ? "Liga terminada" : "Próximo paso"}</h2>
              <p>{isAutoSimulating ? `${leagueProgressLabel} · Simulación automática en marcha.` : diagnosis}</p>
              <PlaybackSpeedControl />
            </div>

            {pendingCupFixture ? (
              <div className="league-buttons">
                <button type="button" onClick={handleSimulateNextCupMatch}>
                  Simular partido de Copa
                </button>

                <button
                  type="button"
                  className="secondary-league-button"
                  onClick={handleSimulateFullCupAndFinishSeason}
                >
                  Simular Copa y terminar temporada
                </button>
              </div>
            ) : (
              <div className="league-buttons">
                {pendingEuropeanMatch && (
                  <button type="button" onClick={handleSimulateEuropeanMatch}>
                    Simular partido europeo
                  </button>
                )}

                <button
                  type="button"
                  className={isAutoSimulating ? "stop-league-button" : "secondary-league-button"}
                  onClick={handleToggleAutoSimulation}
                  disabled={context.state.completed || Boolean(pendingWheelOffer) || Boolean(pendingEuropeanMatch)}
                >
                  {isAutoSimulating ? "Parar simulación" : "Simular"}
                </button>

                <button
                  type="button"
                  className="tertiary-league-button"
                  onClick={handleSimulateFullSeason}
                  disabled={context.state.completed || isAutoSimulating || Boolean(pendingWheelOffer) || Boolean(pendingEuropeanMatch)}
                >
                  Saltar hasta próximo evento
                </button>

                {europeanTournament && (
                  <button type="button" className="tertiary-league-button" onClick={() => setIsEuropeanTableOpen((open) => !open)}>
                    {isEuropeanTableOpen ? "Ocultar clasificación europea" : "Ver clasificación europea"}
                  </button>
                )}

                {isCareerMode && careerTrophyCounts && (
                  <button type="button" className="tertiary-league-button" onClick={() => setIsPalmaresOpen((open) => !open)}>
                    {isPalmaresOpen ? "Ocultar palmarés" : "Ver palmarés"}
                  </button>
                )}
              </div>
            )}
          </div>

          {europeanTournament && isEuropeanTableOpen && <EuropeanLeagueTable tournament={europeanTournament} />}

          {isCareerMode && careerTrophyCounts && isPalmaresOpen && (
            <PalmaresTrophyCase trophyCounts={careerTrophyCounts} variant="career" />
          )}

          {pendingCupFixture && (
            <section className="cup-event-card">
              <span>
                <CompetitionIcon kind="copa" />
                Copa del Rey
              </span>
              <h2>{pendingCupFixture.roundName}</h2>
              <p>
                Rival: {getCupRivalDisplayName(pendingCupFixture.rivalTeamId)} · Partido {pendingCupFixture.venue === "home" ? "en San Mamés" : "fuera de casa"}
              </p>
            </section>
          )}

          {europeanTournament && europeanEventMatch && (
            <EuropeanMatchEvent
              tournament={europeanTournament}
              match={europeanEventMatch}
              userTeamRating={effectiveTeamRating.overall}
              onContinue={handleContinueAfterEuropeanMatch}
            />
          )}

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

          {lastResult && (
            <MatchSequence
              key={`${lastResult.competition}-${lastResult.matchday}-${lastResult.roundName ?? ""}-${lastResult.homeTeamName}-${lastResult.homeGoals}-${lastResult.awayGoals}`}
              result={lastResult}
              onPlayingChange={setIsSequencePlaying}
            />
          )}

          <section className="season-stats-card">
            <h2>Estadísticas del Athletic Club Histórico</h2>

            <div className="season-stats-grid">
              <div>
                <span>Goles a favor</span>
                <strong>{context.userTeamStats.goalsFor}</strong>
              </div>
              <div>
                <span>Goles en contra</span>
                <strong>{context.userTeamStats.goalsAgainst}</strong>
              </div>
              <div>
                <span>Porterías a cero</span>
                <strong>{context.userTeamStats.cleanSheets}</strong>
              </div>
              <div>
                <span>Partidos Liga</span>
                <strong>{userRow?.played ?? 0}/38</strong>
              </div>
            </div>
          </section>

          <section className="scorers-card">
            <div>
              <h2>Máximos goleadores</h2>
              <ol>
                {context.userTeamStats.topScorers.slice(0, 5).map((player) => (
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
                {context.userTeamStats.topAssisters.slice(0, 5).map((player) => (
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
            <p className="cup-status-text">{getCupStatusLabel(context.cupState)}</p>

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
              <span>{leagueMatchesPlayed}/38</span>
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
