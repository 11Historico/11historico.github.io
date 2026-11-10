// scripts/auditCardTypes.ts
//
// Los 14 tipos de carta (idea del usuario, 2026-11-10): las 6 suyas y las 8 que se propusieron.
// 1) Sonda: cuánto vale cada carta en un partido, en «+N de media equivalente».
// 2) Carreras: el mazo completo con las reglas nuevas para ganar cartas (4 al empezar,
//    cuartos y final de Copa, ganar al líder, racha sin perder, ganar a un grande en Europa).
// No cambia el juego: los efectos solo existen en esta auditoría (scripts/auditCardTypes.vite.ts).
// Reproducible: npm run audit:card-types (o node .audit-dist/auditCardTypes.js --careers=N --only=texto)

import { FORMATIONS } from "../src/data/formations";
import { applyDifficultyToTeamRating } from "../src/career/teamPower";
import { simulateEuropeanMatch } from "../src/europe/europeanMatchEngine";
import { simulateMatch } from "../src/simulation/matchEngine";
import { calculateTeamRating } from "../src/simulation/teamRating";
import type { GameDifficulty, MatchResult, RivalTeam, SelectedPlayer, TeamRating } from "../src/types/game";

import {
  draftTeam,
  getHalfTimeMargin,
  mean,
  meanWithMargin,
  playCareer,
  seedCareer,
  setCardEngine,
  share,
  withCard,
  type CardEffect,
  type CardHook,
  type CardMatch,
  type DraftStyle,
  type Policy,
} from "./auditCareerRunner";

const CAREERS_PER_CELL = Number(process.argv.find((arg) => arg.startsWith("--careers="))?.split("=")[1] ?? 300);
const ONLY = process.argv.find((arg) => arg.startsWith("--only="))?.split("=")[1] ?? "";
const PROBE_TEAMS = 12;
const PROBE_SEEDS = Number(process.argv.find((arg) => arg.startsWith("--probe="))?.split("=")[1] ?? 250);
const HAND_LIMIT = 6;
const DRAW_SIZE = 6;
const RARITY_WEIGHTS = [0.5, 0.35, 0.15];
const RARITY_LABELS = ["Común", "Rara", "Épica"];

// ---------------------------------------------------------------------------------------------
// Las cartas
// ---------------------------------------------------------------------------------------------

type CardId =
  | "plus2" | "mediocampo" | "fortin" | "revancha" | "ojeador"
  | "plus4" | "defensa" | "ataque" | "clasico" | "remontada" | "portero"
  | "plus6" | "sanMames" | "dobleONada";

interface CardType {
  id: CardId;
  label: string;
  rarity: 0 | 1 | 2;
  description: string;
  /** El efecto en este partido, o undefined si no se puede usar en él. */
  effect(match: CardMatch): CardEffect | undefined;
}

const all = (value: number): CardEffect => ({ lines: { attack: value, defense: value, control: value, physical: value, mentality: value, goalkeeping: value } });
const signed = (value: number, digits: number) => `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;
const rivalIsStronger = (match: CardMatch) => match.rivalOverall !== undefined && match.userOverall !== undefined && match.rivalOverall > match.userOverall;

const CARDS: CardType[] = [
  { id: "plus2", label: "+2", rarity: 0, description: "+2 a toda la media", effect: () => all(2) },
  { id: "mediocampo", label: "Mediocampo", rarity: 0, description: "+6 solo en el control", effect: () => ({ lines: { control: 6 } }) },
  { id: "fortin", label: "Fortín fuera", rarity: 0, description: "fuera de casa, campo neutral", effect: (match) => (match.venue === "away" ? { engine: { neutralVenue: true } } : undefined) },
  { id: "revancha", label: "Revancha", rarity: 0, description: "+3; si pierdes, vuelve a la mano", effect: () => all(3) },
  { id: "ojeador", label: "Ojeador", rarity: 0, description: "en el siguiente sorteo ves 1 de las 6", effect: () => undefined },
  { id: "plus4", label: "+4", rarity: 1, description: "+4 a toda la media", effect: () => all(4) },
  { id: "defensa", label: "Defensa total", rarity: 1, description: "el rival marca un 40 % menos", effect: () => ({ engine: { rivalGoals: 0.6 } }) },
  { id: "ataque", label: "Ataque total", rarity: 1, description: "marcas un 40 % más y el rival un 10 % más", effect: () => ({ engine: { userGoals: 1.4, rivalGoals: 1.1 } }) },
  { id: "clasico", label: "Clásico", rarity: 1, description: "+5 contra un rival con más media", effect: (match) => (rivalIsStronger(match) ? all(5) : undefined) },
  { id: "remontada", label: "Remontada", rarity: 1, description: "si pierdes al descanso, +6 la segunda parte; si no, no se gasta", effect: () => ({ comeback: 3 }) },
  { id: "portero", label: "Portero inspirado", rarity: 1, description: "en eliminatorias, la prórroga o los penaltis", effect: (match) => (match.knockout ? { engine: { shootout: true } } : undefined) },
  { id: "plus6", label: "+6", rarity: 2, description: "+6 a toda la media", effect: () => all(6) },
  {
    id: "sanMames",
    label: "Efecto San Mamés",
    rarity: 2,
    description: "en casa, subes a la media del rival",
    effect: (match) => (match.venue === "home" && rivalIsStronger(match) ? all((match.rivalOverall ?? 0) - (match.userOverall ?? 0)) : undefined),
  },
  { id: "dobleONada", label: "Doble o nada", rarity: 2, description: "+6; si pierdes, el siguiente partido −2", effect: () => all(6) },
];
const CARD_BY_ID = new Map(CARDS.map((card) => [card.id, card]));
const PLUS_ONLY: CardId[] = ["plus2", "plus4", "plus6"];

function mergeEffects(a: CardEffect | undefined, b: CardEffect | undefined): CardEffect | undefined {
  if (!a) return b;
  if (!b) return a;
  const lines = { ...a.lines };
  for (const [line, value] of Object.entries(b.lines ?? {}) as [keyof NonNullable<CardEffect["lines"]>, number][]) lines[line] = (lines[line] ?? 0) + value;
  return { lines, engine: { ...a.engine, ...b.engine }, comeback: a.comeback ?? b.comeback };
}

// ---------------------------------------------------------------------------------------------
// 1) Sonda: cada carta en un partido
// ---------------------------------------------------------------------------------------------

interface ProbeTeam { rating: TeamRating; selectedPlayers: SelectedPlayer[] }

const GAPS = [-4, 0, 4, 8];
const VENUES: ("home" | "away")[] = ["home", "away"];
const BONUS_CURVE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

function uniformRival(overall: number): RivalTeam {
  return { id: "probe_rival", name: "Rival", shirtIcon: "⚽", ratings: { attack: overall, midfield: overall, defense: overall, goalkeeping: overall, mentality: overall, overall } };
}

interface ProbeCell { knockout: boolean; gap: number; venue: "home" | "away" }
interface ProbeOutcome { value: number; lost: number; cameBack: number }

/** Liga: puntos por partido. Eliminatoria (motor europeo, con prórroga y penaltis): probabilidad de pasar. */
function playProbe(cell: ProbeCell, team: ProbeTeam, effect: CardEffect | undefined, seed: number): { value: number; lost: boolean; cameBack: boolean } {
  const userOverall = Math.round(team.rating.overall);
  const rivalOverall = userOverall + cell.gap;
  const card = effect ?? 0;
  const play = (extra: number) => {
    setCardEngine(card);
    const rating = withCard(team.rating, card, extra);
    if (cell.knockout) {
      const outcome = simulateEuropeanMatch({
        userTeamRating: rating.overall,
        opponentRating: rivalOverall,
        isHome: cell.venue === "home",
        competition: "champions_league",
        seed: `probe_${seed}`,
        isKnockout: true,
        userProfile: rating,
        selectedPlayers: team.selectedPlayers,
      });
      const firstHalf = outcome.goalEvents.filter((goal) => goal.minute <= 45);
      setCardEngine(undefined);
      return { value: outcome.result === "win" ? 1 : 0, lost: outcome.result === "loss", margin: firstHalf.filter((goal) => goal.isUserGoal).length * 2 - firstHalf.length };
    }
    const result: MatchResult = simulateMatch({ fixtureId: "probe", matchday: 1, rival: uniformRival(rivalOverall), venue: cell.venue, teamRating: rating, selectedPlayers: team.selectedPlayers, seed });
    setCardEngine(undefined);
    return { value: result.userTeamWon ? 3 : result.userTeamDrew ? 1 : 0, lost: Boolean(result.userTeamLost), margin: getHalfTimeMargin(result) };
  };

  const base = play(0);
  const comeback = effect?.comeback ?? 0;
  if (comeback && base.margin < 0) return { ...play(comeback), cameBack: true };
  return { ...base, cameBack: false };
}

function probeCell(cell: ProbeCell, teams: ProbeTeam[], effectFor: (match: CardMatch) => CardEffect | undefined): ProbeOutcome | undefined {
  let value = 0;
  let lost = 0;
  let cameBack = 0;
  let count = 0;

  for (const team of teams) {
    const userOverall = Math.round(team.rating.overall);
    const effect = effectFor({ competition: cell.knockout ? "copa" : "league", knockout: cell.knockout, leagueMatchday: 1, venue: cell.venue, userOverall, rivalOverall: userOverall + cell.gap });
    if (effect === undefined) return undefined;

    for (let seed = 1; seed <= PROBE_SEEDS; seed += 1) {
      const outcome = playProbe(cell, team, effect, seed);
      value += outcome.value;
      lost += outcome.lost ? 1 : 0;
      cameBack += outcome.cameBack ? 1 : 0;
      count += 1;
    }
  }

  return { value: value / count, lost: lost / count, cameBack: cameBack / count };
}

/** «+N equivalente»: el bonus de media que da lo mismo, interpolando en la curva +0…+12. */
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

interface CardValue { league?: number; knockout?: number; leagueDelta?: number; knockoutDelta?: number; lostWithCard?: number; cameBack?: number }

function runProbe(): Map<CardId, CardValue> {
  seedCareer(424242);
  const teams: ProbeTeam[] = Array.from({ length: PROBE_TEAMS }, (_, index) => {
    const team = draftTeam(FORMATIONS[index % FORMATIONS.length], "best");
    return { rating: applyDifficultyToTeamRating(calculateTeamRating(team), "dificil", true), selectedPlayers: team.selectedPlayers };
  });
  const cells: ProbeCell[] = [false, true].flatMap((knockout) => GAPS.flatMap((gap) => VENUES.map((venue) => ({ knockout, gap, venue }))));
  const curves = cells.map((cell) => BONUS_CURVE.map((bonus) => probeCell(cell, teams, () => (bonus ? all(bonus) : {}))?.value ?? 0));
  const values = new Map<CardId, CardValue>();

  console.log(`## 1) Sonda: cada carta en un partido\n`);
  console.log(`${teams.length} equipos (draft de mejor media, dificultad Normal; media de simulación ${mean(teams.map((team) => team.rating.overall)).toFixed(1)}), ${PROBE_SEEDS} partidos por equipo y caso. Rivales con su media igual en todas las líneas: tu media −4, igual, +4 y +8, en casa y fuera.`);
  console.log("Liga: puntos por partido. Eliminatoria: probabilidad de pasar, con el motor europeo (prórroga y penaltis).\n");
  console.log("| Carta | Rareza | Efecto | Vale en | Liga: puntos por partido | Liga: + de media equivalente | Eliminatoria: pasar | Eliminatoria: + equivalente | Pierdes con ella | Se activa (Remontada) |");
  console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

  for (const card of CARDS) {
    if (card.id === "ojeador") {
      console.log(`| ${card.label} | ${RARITY_LABELS[card.rarity]} | ${card.description} | sorteo | - | - | - | - | - | - |`);
      continue;
    }
    const value: CardValue = {};
    const validIn: string[] = [];
    let lostSum = 0;
    let lostCount = 0;
    let cameBackSum = 0;

    for (const knockout of [false, true]) {
      const deltas: number[] = [];
      const curveSum = BONUS_CURVE.map(() => 0);
      cells.forEach((cell, index) => {
        if (cell.knockout !== knockout) return;
        const outcome = probeCell(cell, teams, card.effect);
        if (!outcome) return;
        deltas.push(outcome.value - curves[index][0]);
        curves[index].forEach((point, at) => { curveSum[at] += point; });
        lostSum += outcome.lost;
        cameBackSum += outcome.cameBack;
        lostCount += 1;
      });
      if (deltas.length === 0) continue;
      const delta = mean(deltas);
      const curve = curveSum.map((point) => point / deltas.length);
      if (knockout) {
        value.knockoutDelta = delta;
        value.knockout = equivalent(delta, curve);
      } else {
        value.leagueDelta = delta;
        value.league = equivalent(delta, curve);
      }
      validIn.push(knockout ? `eliminatorias (${deltas.length}/8)` : `Liga (${deltas.length}/8)`);
    }
    value.lostWithCard = lostSum / Math.max(1, lostCount);
    value.cameBack = cameBackSum / Math.max(1, lostCount);
    values.set(card.id, value);

    console.log(`| ${[
      card.label,
      RARITY_LABELS[card.rarity],
      card.description,
      validIn.join(", "),
      value.leagueDelta === undefined ? "-" : `${value.leagueDelta >= 0 ? "+" : ""}${value.leagueDelta.toFixed(2)}`,
      value.league === undefined ? "-" : signed(value.league, 1),
      value.knockoutDelta === undefined ? "-" : `${value.knockoutDelta >= 0 ? "+" : ""}${(value.knockoutDelta * 100).toFixed(1)} pts`,
      value.knockout === undefined ? "-" : signed(value.knockout, 1),
      share(Math.round(value.lostWithCard * 1000), 1000),
      card.id === "remontada" ? share(Math.round(value.cameBack * 1000), 1000) : "-",
    ].join(" | ")} |`);
  }

  // Doble o nada: lo que cuesta el −2 del partido siguiente, en Liga.
  const leagueCells = cells.map((cell, index) => ({ cell, index })).filter(({ cell }) => !cell.knockout);
  const minusTwo = mean(leagueCells.map(({ cell, index }) => (probeCell(cell, teams, () => all(-2))?.value ?? 0) - curves[index][0]));
  const doble = values.get("dobleONada");
  if (doble) console.log(`\nDoble o nada: con ella pierdes el ${((doble.lostWithCard ?? 0) * 100).toFixed(0)} % de los partidos, y el −2 del siguiente cuesta ${minusTwo.toFixed(2)} puntos en Liga: ${(minusTwo * (doble.lostWithCard ?? 0)).toFixed(2)} por carta usada.`);
  const revancha = values.get("revancha");
  if (revancha) console.log(`Revancha: vuelve a la mano en el ${((revancha.lostWithCard ?? 0) * 100).toFixed(0)} % de los partidos.`);

  return values;
}

// ---------------------------------------------------------------------------------------------
// 2) Carreras
// ---------------------------------------------------------------------------------------------

type Source = "base" | "copa" | "leader" | "streak" | "europe";
const SOURCE_LABELS: Record<Source, string> = { base: "al empezar", copa: "Copa", leader: "líder", streak: "racha", europe: "Europa" };

interface CardPolicy {
  label: string;
  deck: CardId[];
  perSeason: number;
  earn: { copa: boolean; leader: boolean; streak: number; europe: boolean };
  use: "smart" | "next";
}

interface Stats {
  seasons: number;
  earned: Record<Source, number>;
  lostFull: number;
  used: number;
  usedKnockout: number;
  expired: number;
  returned: number;
  byCard: Map<CardId, { used: number; won: number; lost: number }>;
}

function emptyStats(): Stats {
  return { seasons: 0, earned: { base: 0, copa: 0, leader: 0, streak: 0, europe: 0 }, lostFull: 0, used: 0, usedKnockout: 0, expired: 0, returned: 0, byCard: new Map() };
}

function createCards(policy: CardPolicy, seed: number, stats: Stats, values: Map<CardId, CardValue>): CardHook {
  let state = (seed * 69621 + 7) % 2147483647 || 1;
  const random = () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
  const deck = policy.deck.map((id) => CARD_BY_ID.get(id)!);
  const byRarity = [0, 1, 2].map((rarity) => deck.filter((card) => card.rarity === rarity));
  const drawOne = (): CardType => {
    const roll = random();
    const rarity = roll < RARITY_WEIGHTS[0] ? 0 : roll < RARITY_WEIGHTS[0] + RARITY_WEIGHTS[1] ? 1 : 2;
    const pool = byRarity[rarity].length ? byRarity[rarity] : deck;
    return pool[Math.floor(random() * pool.length)];
  };
  const genericValue = (card: CardType) => values.get(card.id)?.knockout ?? values.get(card.id)?.league ?? 0;
  const averageValue = mean(deck.filter((card) => card.id !== "ojeador").map(genericValue));

  let hand: CardType[] = [];
  let streak = 0;
  let pendingPenalty = false;
  let inPlay: CardType | undefined;

  const draw = (source: Source) => {
    if (hand.length >= HAND_LIMIT) {
      stats.lostFull += 1;
      return;
    }
    const cards = Array.from({ length: DRAW_SIZE }, drawOne);
    const scout = hand.findIndex((card) => card.id === "ojeador");
    let picked = cards[0];
    if (scout >= 0) {
      // Ojeador: ves la primera; si vale más que la media, te la quedas; si no, eliges otra a ciegas.
      hand.splice(scout, 1);
      const usage = stats.byCard.get("ojeador") ?? { used: 0, won: 0, lost: 0 };
      stats.byCard.set("ojeador", { ...usage, used: usage.used + 1 });
      picked = genericValue(cards[0]) >= averageValue ? cards[0] : cards[1 + Math.floor(random() * (DRAW_SIZE - 1))];
    }
    hand.push(picked);
    stats.earned[source] += 1;
  };

  const valueFor = (card: CardType, match: CardMatch): number => {
    const effect = card.effect(match);
    if (!effect) return -Infinity;
    if (card.id === "sanMames" || card.id === "clasico") return effect.lines?.attack ?? 0;
    const value = values.get(card.id);
    return (match.knockout ? value?.knockout : value?.league) ?? -Infinity;
  };

  return {
    detailed: true,
    startSeason() {
      stats.expired += hand.length;
      stats.seasons += 1;
      hand = [];
      streak = 0;
      pendingPenalty = false;
      for (let index = 0; index < policy.perSeason; index += 1) draw("base");
    },
    bonusFor(match) {
      const penalty = pendingPenalty ? all(-2) : undefined;
      pendingPenalty = false;
      inPlay = undefined;

      const playable = hand.filter((card) => valueFor(card, match) > 0);
      if (playable.length === 0) return penalty ?? 0;

      const ahead = match.knockoutsAhead ?? 0;
      const surplus = playable.length > ahead || (match.competition === "league" && match.leagueMatchday >= 36);
      if (policy.use === "smart" && !match.knockout && !surplus) return penalty ?? 0;

      // En una eliminatoria, la mejor. En Liga, con cartas de sobra, la que menos vale en una eliminatoria
      // (si aún quedan), para guardar las buenas.
      const ranked = [...playable].sort((a, b) =>
        match.knockout || policy.use === "next" || ahead === 0
          ? valueFor(b, match) - valueFor(a, match)
          : (values.get(a.id)?.knockout ?? 0) - (values.get(b.id)?.knockout ?? 0));
      inPlay = ranked[0];
      hand.splice(hand.indexOf(inPlay), 1);
      stats.used += 1;
      if (match.knockout) stats.usedKnockout += 1;

      return mergeEffects(inPlay.effect(match), penalty) ?? 0;
    },
    afterMatch(match, won, lost, cameBack) {
      if (inPlay) {
        // Remontada no se activa (ni se gasta) si no ibas perdiendo al descanso; Revancha vuelve si pierdes.
        const activated = inPlay.id !== "remontada" || Boolean(cameBack);
        if (activated) {
          const usage = stats.byCard.get(inPlay.id) ?? { used: 0, won: 0, lost: 0 };
          usage.used += 1;
          usage.won += won ? 1 : 0;
          usage.lost += lost ? 1 : 0;
          stats.byCard.set(inPlay.id, usage);
        }
        if (!activated || (inPlay.id === "revancha" && lost)) {
          hand.push(inPlay);
          stats.returned += 1;
          stats.used -= 1;
          if (match.knockout) stats.usedKnockout -= 1;
        }
        if (inPlay.id === "dobleONada" && lost) pendingPenalty = true;
        inPlay = undefined;
      }

      streak = lost ? 0 : streak + 1;
      if (policy.earn.streak && streak >= policy.earn.streak) {
        streak = 0;
        draw("streak");
      }
      if (policy.earn.copa && match.competition === "copa" && won && (match.roundId === "round_of_16" || match.roundId === "semi_final")) draw("copa");
      if (policy.earn.leader && match.competition === "league" && won && match.rivalIsLeader) draw("leader");
      if (policy.earn.europe && match.competition === "europe" && won && rivalIsStronger(match)) draw("europe");
    },
  };
}

const FULL_DECK = CARDS.map((card) => card.id);
const ALL_EXTRAS = { copa: true, leader: true, streak: 8, europe: true };
const NO_EXTRAS = { copa: false, leader: false, streak: 0, europe: false };
const smart = { deck: FULL_DECK, perSeason: 4, earn: ALL_EXTRAS, use: "smart" } as const;
const POLICIES: (CardPolicy | null)[] = [
  null,
  { ...smart, label: "Mazo completo, uso sensato" },
  { ...smart, label: "Mazo completo, en el siguiente partido", use: "next" },
  { ...smart, label: "Solo +2 / +4 / +6, uso sensato", deck: PLUS_ONLY },
  { ...smart, label: "5 al empezar", perSeason: 5 },
  { ...smart, label: "Racha de 6", earn: { ...ALL_EXTRAS, streak: 6 } },
  { ...smart, label: "Racha de 10", earn: { ...ALL_EXTRAS, streak: 10 } },
  { ...smart, label: "Sin extras (solo las 4)", earn: NO_EXTRAS },
  { ...smart, label: "Extra: solo Copa", earn: { ...NO_EXTRAS, copa: true } },
  { ...smart, label: "Extra: solo líder", earn: { ...NO_EXTRAS, leader: true } },
  { ...smart, label: "Extra: solo racha de 8", earn: { ...NO_EXTRAS, streak: 8 } },
  { ...smart, label: "Extra: solo Europa", earn: { ...NO_EXTRAS, europe: true } },
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

interface RowSummary { seasons: number; points: number; copa: number; europe: number; titles: number; score: number }

const values = runProbe();
const summaries = new Map<string, RowSummary[]>();
const cardTotals = new Map<CardId, { used: number; won: number; lost: number }>();
let cardSeasons = 0;
let played = 0;
let rejected = 0;

console.log(`\n## 2) Carreras\n`);
console.log(`Mano máxima: ${HAND_LIMIT}; caducan al acabar la temporada. Sorteo: ${DRAW_SIZE} boca abajo, eliges 1 (común / rara / épica al ${RARITY_WEIGHTS.map((weight) => weight * 100).join(" / ")} %).`);

for (const { label: difficultyLabel, value: difficulty } of DIFFICULTIES) {
  for (const { label: draftLabel, style } of DRAFTS) {
    console.log(`\n### Dificultad ${difficultyLabel} · draft «${draftLabel}»\n`);
    console.log("| Cartas | Ganadas por temporada (al empezar · Copa · líder · racha · Europa) | Perdidas por mano llena | Usadas · en eliminatorias · caducadas | Temporadas superadas | Pasa la 1.ª | Puntos en la 1.ª | Copas por temporada | Títulos europeos por temporada | Títulos por temporada | Puntuación | Rechazadas |");
    console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

    for (const policy of POLICIES.filter((item) => !ONLY || ONLY.split("|").some((part) => (item?.label ?? "Sin cartas (hoy)").includes(part)))) {
      const label = policy?.label ?? "Sin cartas (hoy)";
      const stats = emptyStats();
      const careers = Array.from({ length: CAREERS_PER_CELL }, (_, index) => {
        const seed = index + 1;
        seedCareer(seed + 7_000_000);
        const team = draftTeam(FORMATIONS[index % FORMATIONS.length], style);
        return playCareer({ policy: CUPS_WELL, seed, difficulty, team: { ...team, teamRating: calculateTeamRating(team) }, cards: policy ? createCards(policy, seed, stats, values) : undefined });
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
      if (policy?.label === "Mazo completo, uso sensato") {
        cardSeasons += stats.seasons;
        for (const [id, usage] of stats.byCard) {
          const total = cardTotals.get(id) ?? { used: 0, won: 0, lost: 0 };
          cardTotals.set(id, { used: total.used + usage.used, won: total.won + usage.won, lost: total.lost + usage.lost });
        }
      }

      played += careers.length;
      rejected += careers.filter((career) => !career.plausible).length;
      const earned = Object.values(stats.earned).reduce((sum, value) => sum + value, 0);

      console.log(`| ${[
        label,
        policy ? `${perSeason(earned)} (${(Object.keys(SOURCE_LABELS) as Source[]).map((source) => perSeason(stats.earned[source])).join(" · ")})` : "-",
        policy ? perSeason(stats.lostFull) : "-",
        policy ? `${perSeason(stats.used)} · ${perSeason(stats.usedKnockout)} · ${perSeason(stats.expired)}` : "-",
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
    baseline && label !== "Sin cartas (hoy)" ? `${signed(((score - baseScore) / baseScore) * 100, 0)} %` : "-",
  ].join(" | ")} |`);
}

if (cardSeasons) {
  console.log(`\n### Qué cartas se usan (mazo completo, uso sensato, los 4 casos)\n`);
  console.log("| Carta | Rareza | Usadas por temporada | Ganados | Perdidos |");
  console.log("| --- | --- | --- | --- | --- |");
  for (const card of CARDS) {
    const usage = cardTotals.get(card.id);
    const isScout = card.id === "ojeador";
    console.log(`| ${card.label} | ${RARITY_LABELS[card.rarity]} | ${usage ? (usage.used / cardSeasons).toFixed(2) : "0.00"}${isScout ? " (en sorteos)" : ""} | ${usage && !isScout ? share(usage.won, usage.used) : "-"} | ${usage && !isScout ? share(usage.lost, usage.used) : "-"} |`);
  }
}

console.log(`\nCarreras simuladas: ${played}. Rechazadas por la regla de plausibilidad del ranking: ${rejected}.`);
