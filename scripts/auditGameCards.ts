// scripts/auditGameCards.ts
//
// Las cartas tal como están en el juego (v0.25.108): el mazo, los sorteos, el efecto de cada carta
// y lo que pasa después del partido salen de src/career/matchCards.ts, y el motor es el del juego
// (la Remontada juega de verdad la segunda parte con +12). El jugador de la auditoría decide qué
// carta usar y cuándo. No cambia el juego.
// Reproducible: npm run audit:game-cards (o node .audit-dist/auditGameCards.js --careers=N --only=texto)

import {
  MATCH_CARDS,
  applyMatchCardLineBonus,
  armMatchCard,
  closeMatchCardDraw,
  createSeasonMatchCards,
  getArmedMatchCard,
  getArmedMatchCardPlay,
  getMatchCardPlay,
  getPendingMatchCardDraw,
  pickMatchCard,
  resolveMatchCards,
  type MatchCardDrawReason,
  type MatchCardId,
  type MatchCardSituation,
  type MatchCardsState,
} from "../src/career/matchCards";
import { applyDifficultyToTeamRating } from "../src/career/teamPower";
import { FORMATIONS } from "../src/data/formations";
import { simulateEuropeanMatch } from "../src/europe/europeanMatchEngine";
import { simulateMatch, type MatchCardEffect } from "../src/simulation/matchEngine";
import { calculateTeamRating } from "../src/simulation/teamRating";
import type { GameDifficulty, RivalTeam, SelectedPlayer, TeamRating } from "../src/types/game";

import { draftTeam, mean, meanWithMargin, playCareer, seedCareer, share, type CardHook, type CardMatch, type DraftStyle, type Policy } from "./auditCareerRunner";

const CAREERS_PER_CELL = Number(process.argv.find((arg) => arg.startsWith("--careers="))?.split("=")[1] ?? 300);
const ONLY = process.argv.find((arg) => arg.startsWith("--only="))?.split("=")[1] ?? "";

// Para decidir qué carta jugar: «+N de media equivalente» de la sonda del informe
// (INFORME_TIPOS_CARTAS_v0_25_107, con los retoques). Clásico y San Mamés valen su media.
const VALUE: Record<MatchCardId, { league: number; knockout: number }> = {
  plus2: { league: 2, knockout: 2 },
  attack_total: { league: 2.2, knockout: 2.1 },
  inspired_keeper: { league: 0, knockout: 2.2 },
  scout: { league: 0, knockout: 0 },
  midfield: { league: 2.5, knockout: 2.7 },
  plus4: { league: 4, knockout: 4 },
  defense_total: { league: 4.7, knockout: 4.2 },
  classic: { league: 5, knockout: 5 },
  revenge: { league: 3, knockout: 3 },
  comeback: { league: 1.6, knockout: 1.5 },
  plus6: { league: 6, knockout: 6 },
  san_mames: { league: 0, knockout: 0 },
  away_fortress: { league: 7.4, knockout: 6.3 },
  double_or_nothing: { league: 6, knockout: 6 },
};
const AVERAGE_VALUE = mean(MATCH_CARDS.filter((card) => card.id !== "scout").map((card) => VALUE[card.id].knockout));
const LAST_LEAGUE_MATCHDAYS_FROM = 36;

type Use = "smart" | "next";
/** Remontada: la del juego (+12 la segunda parte), con +24, o con un gol en la segunda parte (propuesta A). */
type ComebackVariant = "plus12" | "plus24" | "goal" | "goalAlways" | "goalHalf";
interface CardPolicy { label: string; use: Use; comeback?: ComebackVariant }

const COMEBACK_EFFECT: Record<ComebackVariant, MatchCardEffect> = {
  plus12: { comeback: 12 },
  plus24: { comeback: 24 },
  goal: { comebackGoal: true } as MatchCardEffect,
  // Con gol, pero la carta se gasta aunque no vayas perdiendo.
  goalAlways: { comebackGoal: true } as MatchCardEffect,
  // Con un 50 % de marcar; se gasta si ibas perdiendo.
  goalHalf: { comebackGoal: 0.5 } as MatchCardEffect,
};

const COMEBACK_LABEL: Record<ComebackVariant, string> = {
  plus12: "+12 la segunda parte (juego)",
  plus24: "+24 la segunda parte",
  goal: "Un gol en la segunda parte (A)",
  goalAlways: "Un gol, pero se gasta siempre",
  goalHalf: "50 % de marcar un gol",
};

// ---------------------------------------------------------------------------------------------
// Sonda de la Remontada: cada variante en un partido suelto, como la sonda de INFORME_TIPOS_CARTAS.
// ---------------------------------------------------------------------------------------------

const PROBE_SEEDS = Number(process.argv.find((arg) => arg.startsWith("--probe="))?.split("=")[1] ?? 250);
const BONUS_CURVE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

interface ProbeCell { knockout: boolean; gap: number; venue: "home" | "away" }

function uniformRival(overall: number): RivalTeam {
  return { id: "probe_rival", name: "Rival", shirtIcon: "⚽", ratings: { attack: overall, midfield: overall, defense: overall, goalkeeping: overall, mentality: overall, overall } };
}

/** Liga: puntos. Eliminatoria (motor europeo, con prórroga y penaltis): pasar. */
function probeMatch(cell: ProbeCell, team: { rating: TeamRating; selectedPlayers: SelectedPlayer[] }, bonus: number, card: MatchCardEffect | undefined, seed: number) {
  const userOverall = Math.round(team.rating.overall);
  const rating = applyMatchCardLineBonus(team.rating, bonus ? { attack: bonus, defense: bonus, control: bonus, physical: bonus, mentality: bonus, goalkeeping: bonus } : undefined);

  if (cell.knockout) {
    const outcome = simulateEuropeanMatch({ userTeamRating: rating.overall, opponentRating: userOverall + cell.gap, isHome: cell.venue === "home", competition: "champions_league", seed: `probe_${seed}`, isKnockout: true, userProfile: rating, selectedPlayers: team.selectedPlayers, card });
    return { value: outcome.result === "win" ? 1 : 0, activated: Boolean(outcome.comebackActivated) };
  }

  const result = simulateMatch({ fixtureId: "probe", matchday: 1, rival: uniformRival(userOverall + cell.gap), venue: cell.venue, teamRating: rating, selectedPlayers: team.selectedPlayers, seed, card });
  return { value: result.userTeamWon ? 3 : result.userTeamDrew ? 1 : 0, activated: Boolean(result.comebackActivated) };
}

function equivalent(delta: number, curve: number[]): number {
  if (delta <= 0) return delta / Math.max(1e-9, curve[1] - curve[0]);
  for (let index = 1; index < curve.length; index += 1) {
    if (delta <= curve[index] - curve[0]) {
      const low = curve[index - 1] - curve[0];
      const high = curve[index] - curve[0];
      return BONUS_CURVE[index - 1] + ((delta - low) / Math.max(1e-9, high - low)) * (BONUS_CURVE[index] - BONUS_CURVE[index - 1]);
    }
  }
  return BONUS_CURVE[BONUS_CURVE.length - 1];
}

/** Valor de cada variante de la Remontada, por partido en que se juega (se active o no). */
function probeComeback(): Record<ComebackVariant, { league: number; knockout: number }> {
  seedCareer(424242);
  const teams = Array.from({ length: 12 }, (_, index) => {
    const team = draftTeam(FORMATIONS[index % FORMATIONS.length], "best");
    return { rating: applyDifficultyToTeamRating(calculateTeamRating(team), "dificil", true), selectedPlayers: team.selectedPlayers };
  });
  const values = {} as Record<ComebackVariant, { league: number; knockout: number }>;

  console.log("## Sonda de la Remontada\n");
  console.log(`12 equipos (draft de mejor media, Normal), ${PROBE_SEEDS} partidos por equipo y caso; rivales de tu media −4, igual, +4 y +8, en casa y fuera.`);
  console.log("Liga en puntos por partido; eliminatoria en probabilidad de pasar. «Si se activa»: solo los partidos que ibas perdiendo al descanso.\n");
  console.log("| Remontada | Se activa | Liga: + puntos por partido | Liga: si se activa | Liga: equivale a | Eliminatoria: + pasar | Eliminatoria: si se activa | Eliminatoria: equivale a | Por carta gastada (Liga · eliminatoria) |");
  console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");

  const signed = (value: number, digits: number) => `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;

  // Los partidos sin carta y la curva +0…+12, una vez para todas las variantes.
  const kinds = [false, true].map((knockout) => {
    const samples: { cell: ProbeCell; team: (typeof teams)[number]; seed: number; base: number }[] = [];
    const curve = BONUS_CURVE.map(() => 0);
    for (const cell of [-4, 0, 4, 8].flatMap((gap) => (["home", "away"] as const).map((venue): ProbeCell => ({ knockout, gap, venue })))) {
      for (const team of teams) {
        for (let seed = 1; seed <= PROBE_SEEDS; seed += 1) {
          const base = probeMatch(cell, team, 0, undefined, seed).value;
          samples.push({ cell, team, seed, base });
          BONUS_CURVE.forEach((bonus, index) => { curve[index] += index === 0 ? base : probeMatch(cell, team, bonus, undefined, seed).value; });
        }
      }
    }
    return { samples, curve: curve.map((point) => point / samples.length) };
  });

  for (const variant of Object.keys(COMEBACK_LABEL) as ComebackVariant[]) {
    const [league, knockout] = kinds.map(({ samples, curve }) => {
      let delta = 0;
      let activatedDelta = 0;
      let activated = 0;
      for (const { cell, team, seed, base } of samples) {
        const withCard = probeMatch(cell, team, 0, COMEBACK_EFFECT[variant], seed);
        delta += withCard.value - base;
        if (withCard.activated) {
          activated += 1;
          activatedDelta += withCard.value - base;
        }
      }
      const perMatch = delta / samples.length;
      return { delta: perMatch, activatedDelta: activatedDelta / Math.max(1, activated), equivalent: equivalent(perMatch, curve), rate: activated / samples.length };
    });

    values[variant] = { league: league.equivalent, knockout: knockout.equivalent };
    // Por carta gastada: la que se gasta siempre, lo de un partido; las demás, solo cuando se activan.
    const perSpent = (kind: typeof league) => (variant === "goalAlways" ? kind.equivalent : kind.equivalent / Math.max(1e-9, kind.rate));
    console.log(`| ${[
      COMEBACK_LABEL[variant],
      share(Math.round(((league.rate + knockout.rate) / 2) * 1000), 1000),
      signed(league.delta, 3),
      signed(league.activatedDelta, 2),
      signed(league.equivalent, 1),
      `${signed(knockout.delta * 100, 1)} pts`,
      `${signed(knockout.activatedDelta * 100, 1)} pts`,
      signed(knockout.equivalent, 1),
      `${signed(perSpent(league), 1)} · ${signed(perSpent(knockout), 1)}`,
    ].join(" | ")} |`);
  }

  return values;
}

interface Stats {
  seasons: number;
  earned: Record<MatchCardDrawReason, number>;
  lostFull: number;
  used: number;
  usedKnockout: number;
  expired: number;
  returned: number;
  burned: number;
  scouted: number;
  byCard: Map<MatchCardId, { used: number; won: number; lost: number }>;
}

function emptyStats(): Stats {
  return {
    seasons: 0,
    earned: { season_start: 0, cup_quarter_final: 0, cup_final: 0, league_leader: 0, unbeaten_streak: 0, european_giant: 0 },
    lostFull: 0,
    used: 0,
    usedKnockout: 0,
    expired: 0,
    returned: 0,
    burned: 0,
    scouted: 0,
    byCard: new Map(),
  };
}

function toSituation(match: CardMatch): MatchCardSituation | undefined {
  if (!match.venue || match.userOverall === undefined || match.rivalOverall === undefined) return undefined;
  return {
    competition: match.competition === "copa" ? "cup" : match.competition,
    knockout: match.knockout,
    venue: match.venue,
    userOverall: match.userOverall,
    rivalOverall: match.rivalOverall,
  };
}

function valueFor(id: MatchCardId, situation: MatchCardSituation): number {
  const play = getMatchCardPlay(id, situation).play;
  if (!play) return -Infinity;
  if (id === "san_mames" || id === "classic") return play.lineBonus.attack ?? 0;
  return situation.knockout ? VALUE[id].knockout : VALUE[id].league;
}

/** Una carrera con las cartas del juego. */
function createGameCards(policy: CardPolicy, seed: number, stats: Stats, comebackValues?: Record<ComebackVariant, { league: number; knockout: number }>): CardHook {
  let cards: MatchCardsState | undefined;
  // Con variante, la Remontada vale lo que mide la sonda; sin ella, el valor del informe anterior (+1,6 / +1,5).
  const comebackValue = policy.comeback && comebackValues?.[policy.comeback];
  const cardValue = (id: MatchCardId, current: MatchCardSituation) =>
    id === "comeback" && comebackValue ? (current.knockout ? comebackValue.knockout : comebackValue.league) : valueFor(id, current);
  let season = 0;
  let situation: MatchCardSituation | undefined;

  // Elige en los sorteos pendientes: a ciegas, o la que enseña el Ojeador si vale más que la media.
  const drawAll = () => {
    for (let draw = cards && getPendingMatchCardDraw(cards); cards && draw; draw = getPendingMatchCardDraw(cards)) {
      let index = 0;
      if (draw.revealedIndex !== undefined) {
        stats.scouted += 1;
        const revealed = draw.options[draw.revealedIndex];
        index = VALUE[revealed].knockout >= AVERAGE_VALUE ? draw.revealedIndex : (draw.revealedIndex + 1) % draw.options.length;
      }
      cards = closeMatchCardDraw(pickMatchCard(cards, index));
    }
  };

  return {
    detailed: true,
    gameInfo: true,
    startSeason() {
      if (cards) stats.expired += cards.hand.length;
      stats.seasons += 1;
      season += 1;
      cards = createSeasonMatchCards(`audit_${seed}_${season}`);
      stats.earned.season_start += cards.pendingDraws.length;
      drawAll();
    },
    bonusFor(match) {
      situation = toSituation(match);
      if (!cards || !situation) return 0;
      const current = situation;

      const playable = cards.hand.map((id, index) => ({ id, index, value: cardValue(id, current) })).filter((card) => card.value > 0);
      if (playable.length === 0) return 0;

      const ahead = match.knockoutsAhead ?? 0;
      const surplus = playable.length > ahead || (match.competition === "league" && match.leagueMatchday >= LAST_LEAGUE_MATCHDAYS_FROM);
      if (policy.use === "smart" && !match.knockout && !surplus) return 0;

      // En una eliminatoria, la mejor. En Liga, con cartas de sobra, la que menos vale en una eliminatoria.
      const best = match.knockout || policy.use === "next" || ahead === 0;
      const chosen = [...playable].sort((a, b) => (best ? b.value - a.value : VALUE[a.id].knockout - VALUE[b.id].knockout))[0];
      cards = armMatchCard(cards, chosen.index);
      const play = getArmedMatchCardPlay(cards, current);
      if (!play) return 0;

      stats.used += 1;
      if (match.knockout) stats.usedKnockout += 1;
      return { lines: play.lineBonus, engine: chosen.id === "comeback" && policy.comeback ? COMEBACK_EFFECT[policy.comeback] : play.effect };
    },
    afterMatch(match, won, lost, cameBack) {
      if (!cards || !situation) return;

      const armedId = getArmedMatchCard(cards);
      const pendingBefore = cards.pendingDraws.length;
      // "Se gasta siempre": la carta cuenta como activada aunque no fueras perdiendo.
      const spentAnyway = policy.comeback === "goalAlways" && armedId === "comeback";
      cards = resolveMatchCards(cards, { situation, won, lost, comebackActivated: cameBack || spentAnyway, rivalIsLeader: match.rivalIsLeader, cupRoundId: match.roundId });
      const notes = cards.lastNotes ?? [];

      for (const reason of cards.pendingDraws.slice(pendingBefore)) stats.earned[reason] += 1;
      stats.lostFull += notes.filter((note) => note.includes("mano llena")).length;
      stats.burned += notes.filter((note) => note.startsWith("Doble o nada: pierdes")).length;

      if (armedId) {
        const returned = notes.some((note) => note.includes("vuelve a tu mano"));
        const activated = !(armedId === "comeback" && returned);
        if (returned) {
          stats.returned += 1;
          stats.used -= 1;
          if (match.knockout) stats.usedKnockout -= 1;
        }
        if (activated) {
          const usage = stats.byCard.get(armedId) ?? { used: 0, won: 0, lost: 0 };
          stats.byCard.set(armedId, { used: usage.used + 1, won: usage.won + (won ? 1 : 0), lost: usage.lost + (lost ? 1 : 0) });
        }
      }

      situation = undefined;
      drawAll();
    },
  };
}

const POLICIES: (CardPolicy | null)[] = [
  null,
  { label: "Cartas del juego, uso sensato", use: "smart" },
  { label: "Cartas del juego, en el siguiente partido", use: "next" },
  // Remontada medida de nuevo (2026-11-11). La primera fila es la del juego con su valor real.
  { label: "Remontada del juego (+12), uso sensato", use: "smart", comeback: "plus12" },
  { label: "Remontada +24, uso sensato", use: "smart", comeback: "plus24" },
  { label: "Remontada con gol, uso sensato", use: "smart", comeback: "goal" },
  { label: "Remontada con gol, en el siguiente partido", use: "next", comeback: "goal" },
  { label: "Remontada con gol que se gasta siempre, uso sensato", use: "smart", comeback: "goalAlways" },
  { label: "Remontada con 50 % de gol, uso sensato", use: "smart", comeback: "goalHalf" },
];

// La sonda solo hace falta para las filas con variante de la Remontada.
const ACTIVE_POLICIES = POLICIES.filter((item) => !ONLY || ONLY.split("|").some((part) => (item?.label ?? "Sin cartas (hoy)").includes(part)));
const comebackValues = ACTIVE_POLICIES.some((policy) => policy?.comeback) ? probeComeback() : undefined;

const CUPS_WELL: Policy = { label: "Decide bien", approach: "best", halfTime: "good" };
const DIFFICULTIES: { label: string; value: GameDifficulty }[] = [
  { label: "Normal", value: "dificil" },
  { label: "Fácil", value: "normal" },
];
const DRAFTS: { label: string; style: DraftStyle }[] = [
  { label: "Mejor media", style: "best" },
  { label: "Al azar", style: "random" },
];
const REASONS: MatchCardDrawReason[] = ["season_start", "cup_quarter_final", "cup_final", "league_leader", "unbeaten_streak", "european_giant"];

interface RowSummary { seasons: number; points: number; copa: number; europe: number; titles: number; score: number }
const summaries = new Map<string, RowSummary[]>();
const cardTotals = new Map<string, Stats>();
let played = 0;
let rejected = 0;

for (const { label: difficultyLabel, value: difficulty } of DIFFICULTIES) {
  for (const { label: draftLabel, style } of DRAFTS) {
    console.log(`\n### Dificultad ${difficultyLabel} · draft «${draftLabel}»\n`);
    console.log("| Cartas | Ganadas por temporada (al empezar · cuartos · final · líder · racha · Europa) | Perdidas por mano llena | Usadas · en eliminatorias · caducadas · vuelven · quemadas | Temporadas superadas | Pasa la 1.ª | Puntos en la 1.ª | Copas por temporada | Títulos europeos por temporada | Títulos por temporada | Puntuación | Rechazadas |");
    console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

    for (const policy of ACTIVE_POLICIES) {
      const label = policy?.label ?? "Sin cartas (hoy)";
      const stats = emptyStats();
      const careers = Array.from({ length: CAREERS_PER_CELL }, (_, index) => {
        const seed = index + 1;
        seedCareer(seed + 7_000_000);
        const team = draftTeam(FORMATIONS[index % FORMATIONS.length], style);
        return playCareer({ policy: CUPS_WELL, seed, difficulty, team: { ...team, teamRating: calculateTeamRating(team) }, cards: policy ? createGameCards(policy, seed, stats, comebackValues) : undefined });
      });
      const seasons = careers.reduce((sum, career) => sum + career.completedSeasons + 1, 0);
      const count = (pick: (trophies: (typeof careers)[number]["trophies"]) => number) => careers.reduce((sum, career) => sum + pick(career.trophies), 0) / Math.max(1, seasons);
      const perSeason = (value: number) => (value / Math.max(1, stats.seasons)).toFixed(1);
      const summary: RowSummary = {
        seasons: mean(careers.map((career) => career.completedSeasons)),
        points: mean(careers.map((career) => career.firstSeasonPoints)),
        copa: count((trophies) => trophies.copa),
        europe: count((trophies) => trophies.champions + trophies.europaLeague + trophies.conference),
        titles: count((trophies) => trophies.liga + trophies.copa + trophies.supercopa + trophies.champions + trophies.europaLeague + trophies.conference),
        score: mean(careers.map((career) => career.score)),
      };
      summaries.set(label, [...(summaries.get(label) ?? []), summary]);
      if (policy) {
        const totals = cardTotals.get(label) ?? emptyStats();
        totals.seasons += stats.seasons;
        totals.burned += stats.burned;
        totals.scouted += stats.scouted;
        for (const [id, usage] of stats.byCard) {
          const total = totals.byCard.get(id) ?? { used: 0, won: 0, lost: 0 };
          totals.byCard.set(id, { used: total.used + usage.used, won: total.won + usage.won, lost: total.lost + usage.lost });
        }
        cardTotals.set(label, totals);
      }

      played += careers.length;
      rejected += careers.filter((career) => !career.plausible).length;
      const earned = Object.values(stats.earned).reduce((sum, value) => sum + value, 0);

      console.log(`| ${[
        label,
        policy ? `${perSeason(earned)} (${REASONS.map((reason) => perSeason(stats.earned[reason])).join(" · ")})` : "-",
        policy ? perSeason(stats.lostFull) : "-",
        policy ? [stats.used, stats.usedKnockout, stats.expired, stats.returned, stats.burned].map(perSeason).join(" · ") : "-",
        meanWithMargin(careers.map((career) => career.completedSeasons)),
        share(careers.filter((career) => career.completedSeasons >= 1).length, careers.length),
        meanWithMargin(careers.map((career) => career.firstSeasonPoints)),
        summary.copa.toFixed(2),
        summary.europe.toFixed(2),
        summary.titles.toFixed(2),
        meanWithMargin(careers.map((career) => career.score)),
        String(careers.filter((career) => !career.plausible).length),
      ].join(" | ")} |`);
    }
  }
}

const baseline = summaries.get("Sin cartas (hoy)");
const average = (rows: RowSummary[], pick: (row: RowSummary) => number) => mean(rows.map(pick));
const signed = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(0)}`;

console.log(`\n### Media de los 4 casos\n`);
console.log("| Cartas | Temporadas superadas | Puntos en la 1.ª | Copas por temporada | Títulos europeos por temporada | Títulos por temporada | Puntuación | Puntuación frente a sin cartas |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- |");
for (const [label, rows] of summaries) {
  const score = average(rows, (row) => row.score);
  const baseScore = baseline ? average(baseline, (row) => row.score) : score;
  console.log(`| ${[
    label,
    average(rows, (row) => row.seasons).toFixed(2),
    average(rows, (row) => row.points).toFixed(1),
    average(rows, (row) => row.copa).toFixed(2),
    average(rows, (row) => row.europe).toFixed(2),
    average(rows, (row) => row.titles).toFixed(2),
    score.toFixed(1),
    baseline && label !== "Sin cartas (hoy)" ? `${signed(((score - baseScore) / baseScore) * 100)} %` : "-",
  ].join(" | ")} |`);
}

for (const [label, totals] of cardTotals) {
  console.log(`\n### Qué cartas se usan («${label}», los 4 casos)\n`);
  console.log("| Carta | Usadas por temporada | Ganados | Perdidos |");
  console.log("| --- | --- | --- | --- |");
  for (const card of MATCH_CARDS) {
    const usage = totals.byCard.get(card.id);
    if (card.id === "scout") {
      console.log(`| ${card.name} | ${(totals.scouted / Math.max(1, totals.seasons)).toFixed(2)} (en sorteos) | - | - |`);
      continue;
    }
    console.log(`| ${card.name} | ${usage ? (usage.used / totals.seasons).toFixed(2) : "0.00"} | ${usage ? share(usage.won, usage.used) : "-"} | ${usage ? share(usage.lost, usage.used) : "-"} |`);
  }
  console.log(`\nCartas quemadas por Doble o nada: ${(totals.burned / Math.max(1, totals.seasons)).toFixed(2)} por temporada.`);
}

console.log(`\nCarreras simuladas: ${played}. Rechazadas por la regla de plausibilidad del ranking: ${rejected}.`);
