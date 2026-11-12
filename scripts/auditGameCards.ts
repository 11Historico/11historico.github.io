// scripts/auditGameCards.ts
//
// Las cartas tal como están en el juego: el mazo, los sorteos, el efecto de cada carta y lo que pasa
// después del partido salen de src/career/matchCards.ts, y el motor es el del juego. El jugador de la
// auditoría decide qué carta usar y cuándo. No cambia el juego.
// Desde la v0.25.110 mide también las cartas jugadas en el descanso de Copa y Europa, con las
// funciones del juego (getMatchCardHalftimePlay y applyHalftimeCard).
// Reproducible: npm run audit:game-cards (o node .audit-dist/auditGameCards.js --careers=N --only=texto)

import {
  MATCH_CARDS,
  armMatchCard,
  closeMatchCardDraw,
  createSeasonMatchCards,
  getArmedMatchCard,
  getArmedMatchCardPlay,
  getMatchCardHalftimePlay,
  getMatchCardPlay,
  getPendingMatchCardDraw,
  pickMatchCard,
  resolveMatchCards,
  type MatchCardDrawReason,
  type MatchCardId,
  type MatchCardSituation,
  type MatchCardsState,
} from "../src/career/matchCards";
import { FORMATIONS } from "../src/data/formations";
import type { MatchHalftimeCardEffect } from "../src/simulation/matchEngine";
import { calculateTeamRating } from "../src/simulation/teamRating";
import type { GameDifficulty } from "../src/types/game";

import {
  draftTeam,
  mean,
  meanWithMargin,
  playCareer,
  seedCareer,
  share,
  type CardHook,
  type CardMatch,
  type DraftStyle,
  type Policy,
} from "./auditCareerRunner";

const CAREERS_PER_CELL = Number(process.argv.find((arg) => arg.startsWith("--careers="))?.split("=")[1] ?? 300);
const ONLY = process.argv.find((arg) => arg.startsWith("--only="))?.split("=")[1] ?? "";

// Para decidir qué carta jugar: «+N de media equivalente» de la sonda del informe
// (INFORME_TIPOS_CARTAS_v0_25_107, con los retoques), al doble desde la v0.25.110 en las que se
// duplicaron. Clásico y San Mamés valen su media.
const VALUE: Record<MatchCardId, { league: number; knockout: number }> = {
  plus2: { league: 4, knockout: 4 },
  attack_total: { league: 4.4, knockout: 4.2 },
  inspired_keeper: { league: 0, knockout: 2.2 },
  scout: { league: 0, knockout: 0 },
  midfield: { league: 5, knockout: 5.4 },
  plus4: { league: 8, knockout: 8 },
  defense_total: { league: 9.4, knockout: 8.4 },
  classic: { league: 10, knockout: 10 },
  revenge: { league: 6, knockout: 6 },
  // La Remontada con gol, medida en INFORME_REMONTADA_v0_25_108 («se gasta siempre»).
  comeback: { league: 4.5, knockout: 5.5 },
  plus6: { league: 12, knockout: 12 },
  san_mames: { league: 0, knockout: 0 },
  away_fortress: { league: 7.4, knockout: 6.3 },
  double_or_nothing: { league: 12, knockout: 12 },
};const AVERAGE_VALUE = mean(MATCH_CARDS.filter((card) => card.id !== "scout").map((card) => VALUE[card.id].knockout));
const LAST_LEAGUE_MATCHDAYS_FROM = 36;

type Use = "smart" | "next";
interface CardPolicy {
  label: string;
  use: Use;
  /** En Copa y Europa se guarda la carta para el descanso y se juega si no vas ganando (v0.25.110). */
  halftime?: boolean;
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
  halftime: number;
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
    halftime: 0,
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
function createGameCards(policy: CardPolicy, seed: number, stats: Stats): CardHook {
  let cards: MatchCardsState | undefined;
  let season = 0;
  let situation: MatchCardSituation | undefined;
  const cardValue = valueFor;
  // Copa y Europa con descanso: la carta se guarda para el descanso.
  const holdsForHalftime = (match: CardMatch) => Boolean(policy.halftime) && (match.competition === "copa" || match.competition === "europe");

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
      if (holdsForHalftime(match)) return 0;

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
      return { lines: play.lineBonus, engine: play.effect };
    },
    halftime(match) {
      if (!holdsForHalftime(match)) return undefined;
      let decided = false;
      let chosen: MatchHalftimeCardEffect | undefined;

      // Se llama una vez por partido jugado (y otra, con las mismas tiradas, si cambia el descanso).
      return (margin) => {
        if (decided) return chosen;
        decided = true;
        if (margin > 0 || !cards || !situation) return undefined;
        const current = situation;

        // La carta del descanso del juego (getMatchCardHalftimePlay); para elegir, lo que vale.
        const playable = cards.hand
          .map((id, index) => ({ id, index, effect: getMatchCardHalftimePlay(id, current).play?.effect, value: cardValue(id, current) }))
          .filter((item): item is { id: MatchCardId; index: number; effect: MatchHalftimeCardEffect; value: number } => Boolean(item.effect));
        // Fuera de las eliminatorias, solo con cartas de sobra, como antes del partido.
        const ahead = match.knockoutsAhead ?? 0;
        if (playable.length === 0 || (!match.knockout && playable.length <= ahead)) return undefined;

        const best = [...playable].sort((a, b) => b.value - a.value)[0];
        cards = armMatchCard(cards, best.index);
        stats.used += 1;
        stats.halftime += 1;
        if (match.knockout) stats.usedKnockout += 1;
        chosen = best.effect;
        return chosen;
      };
    },
    afterMatch(match, won, lost, cameBack) {
      if (!cards || !situation) return;

      const armedId = getArmedMatchCard(cards);
      const pendingBefore = cards.pendingDraws.length;
      cards = resolveMatchCards(cards, { situation, won, lost, comebackActivated: cameBack, rivalIsLeader: match.rivalIsLeader, cupRoundId: match.roundId });
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
  // v0.25.110: las cartas también en el descanso de Copa y Europa.
  { label: "Cartas del juego con descanso, uso sensato", use: "smart", halftime: true },
];

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
    console.log("| Cartas | Ganadas por temporada (al empezar · cuartos · final · líder · racha · Europa) | Perdidas por mano llena | Usadas · en eliminatorias · en el descanso · caducadas · vuelven · quemadas | Temporadas superadas | Pasa la 1.ª | Puntos en la 1.ª | Copas por temporada | Títulos europeos por temporada | Títulos por temporada | Puntuación | Rechazadas |");
    console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

    for (const policy of POLICIES.filter((item) => !ONLY || ONLY.split("|").some((part) => (item?.label ?? "Sin cartas (hoy)").includes(part)))) {
      const label = policy?.label ?? "Sin cartas (hoy)";
      const stats = emptyStats();
      const careers = Array.from({ length: CAREERS_PER_CELL }, (_, index) => {
        const seed = index + 1;
        seedCareer(seed + 7_000_000);
        const team = draftTeam(FORMATIONS[index % FORMATIONS.length], style);
        return playCareer({ policy: CUPS_WELL, seed, difficulty, team: { ...team, teamRating: calculateTeamRating(team) }, cards: policy ? createGameCards(policy, seed, stats) : undefined });
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
        policy ? [stats.used, stats.usedKnockout, stats.halftime, stats.expired, stats.returned, stats.burned].map(perSeason).join(" · ") : "-",
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
