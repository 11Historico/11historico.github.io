// src/career/matchCards.ts
//
// Cartas de partido (v0.25.108, idea del usuario). Una mano por temporada de carrera:
// 4 cartas al empezar y más al ganar partidos importantes. Cada carta vale para un partido.
// El mazo y sus reglas se midieron en docs/INFORME_TIPOS_CARTAS_v0_25_107.md («Retoques medidos»).
// Todo son funciones puras: el estado lo guarda la partida.

import type { MatchCardEffect } from "../simulation/matchEngine";
import type { TeamRating } from "../types/game";

export type MatchCardId =
  | "plus2" | "attack_total" | "inspired_keeper" | "scout" | "midfield"
  | "plus4" | "defense_total" | "classic" | "revenge" | "comeback"
  | "plus6" | "san_mames" | "away_fortress" | "double_or_nothing";

export type MatchCardRarity = "common" | "rare" | "epic";

export interface MatchCardDefinition {
  id: MatchCardId;
  name: string;
  rarity: MatchCardRarity;
  description: string;
}

export const MATCH_CARDS: MatchCardDefinition[] = [
  { id: "plus2", name: "+2", rarity: "common", description: "+2 a toda tu media." },
  // Los textos dicen el efecto en goles reales (unos +25 % y −30 %), no el del motor (×1,4 y ×0,6).
  { id: "attack_total", name: "Ataque total", rarity: "common", description: "Marcas más goles (unos +25 %), pero el rival también marca algo más." },
  { id: "inspired_keeper", name: "Portero inspirado", rarity: "common", description: "Solo en eliminatorias: casi seguro que ganas la prórroga o los penaltis." },
  { id: "scout", name: "Ojeador", rarity: "common", description: "En tu siguiente sorteo ves una de las 6 cartas boca arriba." },
  { id: "midfield", name: "Mediocampo", rarity: "common", description: "+6 en el control y +2 en el resto." },
  { id: "plus4", name: "+4", rarity: "rare", description: "+4 a toda tu media." },
  { id: "defense_total", name: "Defensa total", rarity: "rare", description: "El rival marca bastante menos (unos −30 % de goles)." },
  { id: "classic", name: "Clásico", rarity: "rare", description: "+5 contra un rival con más media que tú." },
  { id: "revenge", name: "Revancha", rarity: "rare", description: "+3. Si pierdes, la carta vuelve a tu mano." },
  { id: "comeback", name: "Remontada", rarity: "rare", description: "Si vas perdiendo al descanso, la segunda parte juegas con +12. Si no, no se gasta." },
  { id: "plus6", name: "+6", rarity: "epic", description: "+6 a toda tu media." },
  { id: "san_mames", name: "Efecto San Mamés", rarity: "epic", description: "En casa: subes a la media del rival si es mayor que la tuya." },
  { id: "away_fortress", name: "Fortín fuera", rarity: "epic", description: "Fuera de casa: juegas como en campo neutral." },
  { id: "double_or_nothing", name: "Doble o nada", rarity: "epic", description: "+6. Si pierdes, pierdes también otra carta de tu mano." },
];

const CARD_BY_ID = new Map(MATCH_CARDS.map((card) => [card.id, card]));

export function getMatchCard(id: MatchCardId): MatchCardDefinition {
  const card = CARD_BY_ID.get(id);
  if (!card) throw new Error(`Carta desconocida: ${id}`);
  return card;
}

export const MATCH_CARD_RARITY_LABEL: Record<MatchCardRarity, string> = { common: "Común", rare: "Rara", epic: "Épica" };
const RARITY_WEIGHTS: [MatchCardRarity, number][] = [["common", 0.5], ["rare", 0.35], ["epic", 0.15]];

export const MATCH_CARDS_PER_SEASON = 4;
export const MATCH_CARD_HAND_LIMIT = 6;
export const MATCH_CARD_DRAW_SIZE = 6;
export const MATCH_CARD_UNBEATEN_STREAK = 8;
/** Remontada: media de más en la segunda parte. */
const COMEBACK_BONUS = 12;

export type MatchCardDrawReason = "season_start" | "cup_quarter_final" | "cup_final" | "league_leader" | "unbeaten_streak" | "european_giant";

export const MATCH_CARD_DRAW_REASON_TEXT: Record<MatchCardDrawReason, string> = {
  season_start: "Cartas de la temporada",
  cup_quarter_final: "Llegas a cuartos de Copa",
  cup_final: "Llegas a la final de Copa",
  league_leader: "Has ganado al líder",
  unbeaten_streak: `${MATCH_CARD_UNBEATEN_STREAK} partidos sin perder`,
  european_giant: "Has ganado a un grande de Europa",
};

export interface MatchCardDrawResult {
  reason: MatchCardDrawReason;
  options: MatchCardId[];
  pickedIndex: number;
  /** La carta que enseñó el Ojeador. */
  revealedIndex?: number;
}

export interface MatchCardsState {
  /** Partida y temporada: fija los sorteos, así que recargar no los cambia. */
  seasonKey: string;
  hand: MatchCardId[];
  /** Carta elegida para el siguiente partido. */
  armedIndex?: number;
  pendingDraws: MatchCardDrawReason[];
  drawsDone: number;
  unbeatenStreak: number;
  /** El último sorteo, hasta que el usuario lo cierra: se sigue viendo si recarga. */
  lastDraw?: MatchCardDrawResult;
  /** Lo que pasó con las cartas en el último partido. */
  lastNotes?: string[];
}

export function createSeasonMatchCards(seasonKey: string): MatchCardsState {
  return {
    seasonKey,
    hand: [],
    pendingDraws: Array.from({ length: MATCH_CARDS_PER_SEASON }, () => "season_start" as const),
    drawsDone: 0,
    unbeatenStreak: 0,
  };
}

// ---------------------------------------------------------------------------------------------
// Sorteo: 6 boca abajo, eliges 1
// ---------------------------------------------------------------------------------------------

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32: la misma semilla da la misma secuencia. */
function createRandom(seed: string): () => number {
  let state = hashString(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawOptions(state: MatchCardsState): MatchCardId[] {
  const random = createRandom(`${state.seasonKey}_draw_${state.drawsDone}`);

  return Array.from({ length: MATCH_CARD_DRAW_SIZE }, () => {
    let roll = random();
    const rarity = RARITY_WEIGHTS.find(([, weight]) => (roll -= weight) < 0)?.[0] ?? "common";
    const pool = MATCH_CARDS.filter((card) => card.rarity === rarity);
    return pool[Math.floor(random() * pool.length)].id;
  });
}

export interface PendingMatchCardDraw {
  reason: MatchCardDrawReason;
  options: MatchCardId[];
  revealedIndex?: number;
  /** Este sorteo y cuántos quedan, para «Carta 1 de 4». */
  number: number;
  total: number;
}

export function getPendingMatchCardDraw(state: MatchCardsState): PendingMatchCardDraw | undefined {
  const reason = state.pendingDraws[0];
  if (!reason) return undefined;

  const hasScout = state.hand.includes("scout");
  const revealedIndex = hasScout ? hashString(`${state.seasonKey}_scout_${state.drawsDone}`) % MATCH_CARD_DRAW_SIZE : undefined;
  const sameReason = state.pendingDraws.filter((item) => item === reason).length;

  return {
    reason,
    options: drawOptions(state),
    revealedIndex,
    number: reason === "season_start" ? MATCH_CARDS_PER_SEASON - sameReason + 1 : 1,
    total: reason === "season_start" ? MATCH_CARDS_PER_SEASON : 1,
  };
}

/** Elige una carta del sorteo pendiente. Se guarda en seguida: recargar no permite elegir otra. */
export function pickMatchCard(state: MatchCardsState, index: number): MatchCardsState {
  const draw = getPendingMatchCardDraw(state);
  if (!draw || index < 0 || index >= draw.options.length) return state;

  const hand = [...state.hand];
  if (draw.revealedIndex !== undefined) hand.splice(hand.indexOf("scout"), 1);
  hand.push(draw.options[index]);

  return {
    ...state,
    hand,
    // Quitar el Ojeador mueve las cartas: la elegida para el partido se vuelve a elegir.
    armedIndex: draw.revealedIndex !== undefined ? undefined : state.armedIndex,
    pendingDraws: state.pendingDraws.slice(1),
    drawsDone: state.drawsDone + 1,
    lastDraw: { reason: draw.reason, options: draw.options, pickedIndex: index, revealedIndex: draw.revealedIndex },
  };
}

export function closeMatchCardDraw(state: MatchCardsState): MatchCardsState {
  return { ...state, lastDraw: undefined };
}

// ---------------------------------------------------------------------------------------------
// Usar una carta
// ---------------------------------------------------------------------------------------------

/** El partido tal como lo enseña la previa, sin la carta. */
export interface MatchCardSituation {
  competition: "league" | "cup" | "supercopa" | "europe";
  knockout: boolean;
  venue: "home" | "away";
  userOverall: number;
  rivalOverall: number;
}

type RatingLine = "attack" | "defense" | "control" | "physical" | "mentality" | "goalkeeping";
export type MatchCardLineBonus = Partial<Record<RatingLine, number>>;

export interface MatchCardPlay {
  /** Media de más, en el rating de simulación (el que enseña la previa). */
  lineBonus: MatchCardLineBonus;
  effect?: MatchCardEffect;
}

const all = (value: number): MatchCardLineBonus => ({ attack: value, defense: value, control: value, physical: value, mentality: value, goalkeeping: value });

/** El efecto de la carta en este partido, o por qué no se puede usar. */
export function getMatchCardPlay(id: MatchCardId, situation: MatchCardSituation): { play?: MatchCardPlay; unavailableReason?: string } {
  const rivalIsStronger = situation.rivalOverall > situation.userOverall;

  switch (id) {
    case "plus2": return { play: { lineBonus: all(2) } };
    case "plus4": return { play: { lineBonus: all(4) } };
    case "plus6": return { play: { lineBonus: all(6) } };
    case "double_or_nothing": return { play: { lineBonus: all(6) } };
    case "revenge": return { play: { lineBonus: all(3) } };
    case "midfield": return { play: { lineBonus: { ...all(2), control: 6 } } };
    case "attack_total": return { play: { lineBonus: {}, effect: { userGoals: 1.4, rivalGoals: 1.1 } } };
    case "defense_total": return { play: { lineBonus: {}, effect: { rivalGoals: 0.6 } } };
    case "comeback": return { play: { lineBonus: {}, effect: { comeback: COMEBACK_BONUS } } };
    case "scout": return { unavailableReason: "Se usa sola en tu siguiente sorteo." };
    case "inspired_keeper":
      return situation.knockout ? { play: { lineBonus: {}, effect: { shootout: true } } } : { unavailableReason: "Solo en eliminatorias." };
    case "classic":
      return rivalIsStronger ? { play: { lineBonus: all(5) } } : { unavailableReason: "Solo contra un rival con más media que tú." };
    case "away_fortress":
      return situation.venue === "away" ? { play: { lineBonus: {}, effect: { neutralVenue: true } } } : { unavailableReason: "Solo fuera de casa." };
    case "san_mames":
      if (situation.venue !== "home") return { unavailableReason: "Solo en casa." };
      return rivalIsStronger
        ? { play: { lineBonus: all(situation.rivalOverall - situation.userOverall) } }
        : { unavailableReason: "Solo contra un rival con más media que tú." };
  }
}

export function getArmedMatchCard(state: MatchCardsState | undefined): MatchCardId | undefined {
  return state?.armedIndex === undefined ? undefined : state.hand[state.armedIndex];
}

/** Elige (o quita, con la misma carta o sin índice) la carta del siguiente partido. */
export function armMatchCard(state: MatchCardsState, index?: number): MatchCardsState {
  if (index === undefined || index === state.armedIndex || index < 0 || index >= state.hand.length) {
    return { ...state, armedIndex: undefined };
  }
  return { ...state, armedIndex: index };
}

/** La carta elegida en este partido, si vale en él. */
export function getArmedMatchCardPlay(state: MatchCardsState | undefined, situation: MatchCardSituation | undefined): MatchCardPlay | undefined {
  const id = getArmedMatchCard(state);
  return id && situation ? getMatchCardPlay(id, situation).play : undefined;
}

// Los mismos pesos que la media del motor (getAverageUserRating).
const LINE_WEIGHTS: Record<RatingLine, number> = { attack: 0.22, defense: 0.22, control: 0.18, physical: 0.1, mentality: 0.13, goalkeeping: 0.15 };

/** Suma la media de la carta al rating de simulación. */
export function applyMatchCardLineBonus(rating: TeamRating, lineBonus: MatchCardLineBonus | undefined): TeamRating {
  const entries = Object.entries(lineBonus ?? {}) as [RatingLine, number][];
  if (entries.length === 0) return rating;

  const next = { ...rating };
  const uniform = entries.length === 6 && entries.every(([, value]) => value === entries[0][1]);
  for (const [line, value] of entries) next[line] += value;
  next.overall = uniform ? rating.overall + entries[0][1] : rating.overall + entries.reduce((sum, [line, value]) => sum + value * LINE_WEIGHTS[line], 0);

  return next;
}

// ---------------------------------------------------------------------------------------------
// Después del partido
// ---------------------------------------------------------------------------------------------

export interface MatchCardOutcome {
  situation: MatchCardSituation;
  won: boolean;
  lost: boolean;
  comebackActivated?: boolean;
  /** Liga: el rival iba primero (y no eras tú). */
  rivalIsLeader?: boolean;
  /** Copa: la ronda jugada. */
  cupRoundId?: string;
}

/** Gasta la carta del partido, aplica sus reglas y suma las cartas ganadas. */
export function resolveMatchCards(state: MatchCardsState, outcome: MatchCardOutcome): MatchCardsState {
  const notes: string[] = [];
  let hand = [...state.hand];
  const armedId = getArmedMatchCard(state);
  const armedPlay = armedId ? getMatchCardPlay(armedId, outcome.situation).play : undefined;

  if (armedId && armedPlay && state.armedIndex !== undefined) {
    const name = getMatchCard(armedId).name;
    const keep = (armedId === "comeback" && !outcome.comebackActivated) || (armedId === "revenge" && outcome.lost);

    if (keep) {
      notes.push(armedId === "comeback" ? `${name}: no ibas perdiendo al descanso, la carta vuelve a tu mano.` : `${name}: has perdido, la carta vuelve a tu mano.`);
    } else {
      hand.splice(state.armedIndex, 1);
      notes.push(armedId === "comeback" ? `${name} activada: ibas perdiendo al descanso.` : `Has jugado con la carta ${name}.`);
    }

    if (armedId === "double_or_nothing" && outcome.lost && hand.length > 0) {
      const burnIndex = hashString(`${state.seasonKey}_burn_${state.drawsDone}_${hand.length}`) % hand.length;
      notes.push(`Doble o nada: pierdes también la carta ${getMatchCard(hand[burnIndex]).name}.`);
      hand = hand.filter((_, index) => index !== burnIndex);
    }
  }

  const pendingDraws = [...state.pendingDraws];
  const earn = (reason: MatchCardDrawReason) => {
    if (hand.length + pendingDraws.length >= MATCH_CARD_HAND_LIMIT) {
      notes.push(`${MATCH_CARD_DRAW_REASON_TEXT[reason]}, pero tienes la mano llena: no hay carta.`);
      return;
    }
    pendingDraws.push(reason);
    notes.push(`${MATCH_CARD_DRAW_REASON_TEXT[reason]}: ganas una carta.`);
  };

  let unbeatenStreak = outcome.lost ? 0 : state.unbeatenStreak + 1;
  if (unbeatenStreak >= MATCH_CARD_UNBEATEN_STREAK) {
    unbeatenStreak = 0;
    earn("unbeaten_streak");
  }

  const { competition } = outcome.situation;
  if (competition === "cup" && outcome.won && outcome.cupRoundId === "round_of_16") earn("cup_quarter_final");
  if (competition === "cup" && outcome.won && outcome.cupRoundId === "semi_final") earn("cup_final");
  if (competition === "league" && outcome.won && outcome.rivalIsLeader) earn("league_leader");
  if (competition === "europe" && outcome.won && outcome.situation.rivalOverall > outcome.situation.userOverall) earn("european_giant");

  return { ...state, hand, armedIndex: undefined, pendingDraws, unbeatenStreak, lastNotes: notes };
}
