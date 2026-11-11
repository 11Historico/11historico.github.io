import { describe, expect, it } from "vitest";
import strong from "../e2e/fixtures/career-strong.json";
import {
  MATCH_CARDS,
  MATCH_CARD_HAND_LIMIT,
  MATCH_CARDS_PER_SEASON,
  applyMatchCardLineBonus,
  armMatchCard,
  closeMatchCardDraw,
  createSeasonMatchCards,
  getMatchCardPlay,
  getPendingMatchCardDraw,
  pickMatchCard,
  resolveMatchCards,
  type MatchCardId,
  type MatchCardSituation,
  type MatchCardsState,
} from "../../src/career/matchCards";
import { simulateEuropeanMatch } from "../../src/europe/europeanMatchEngine";
import { getUserHalfTimeMargin, simulateMatch, type MatchCardEffect } from "../../src/simulation/matchEngine";
import { getInitialCareerLeagueRivals } from "../../src/simulation/leagueSimulator";
import type { RivalTeam, SelectedPlayer, TeamRating } from "../../src/types/game";

const teamRating = strong.teamRating as unknown as TeamRating;
const selectedPlayers = strong.selectedPlayers as unknown as SelectedPlayer[];
const rivals = getInitialCareerLeagueRivals();

function uniformTeam(overall: number): TeamRating {
  return { ...teamRating, attack: overall, defense: overall, control: overall, physical: overall, mentality: overall, goalkeeping: overall, overall };
}

function uniformRival(overall: number): RivalTeam {
  return { ...rivals[0], ratings: { attack: overall, midfield: overall, defense: overall, goalkeeping: overall, mentality: overall, overall } };
}

const league = (overrides: Partial<MatchCardSituation> = {}): MatchCardSituation => ({
  competition: "league",
  knockout: false,
  venue: "home",
  userOverall: 84,
  rivalOverall: 84,
  ...overrides,
});

function withHand(hand: MatchCardId[], overrides: Partial<MatchCardsState> = {}): MatchCardsState {
  return { ...createSeasonMatchCards("test_27/28"), pendingDraws: [], hand, ...overrides };
}

// v0.25.108: el mazo retocado de docs/INFORME_TIPOS_CARTAS_v0_25_107.md.
describe("cartas: el mazo", () => {
  it("tiene los 14 tipos con la rareza medida", () => {
    expect(MATCH_CARDS).toHaveLength(14);
    const byRarity = (rarity: string) => MATCH_CARDS.filter((card) => card.rarity === rarity).map((card) => card.id).sort();
    expect(byRarity("common")).toEqual(["attack_total", "inspired_keeper", "midfield", "plus2", "scout"]);
    expect(byRarity("rare")).toEqual(["classic", "comeback", "defense_total", "plus4", "revenge"]);
    expect(byRarity("epic")).toEqual(["away_fortress", "double_or_nothing", "plus6", "san_mames"]);
  });

  it("las condicionales solo valen donde toca", () => {
    expect(getMatchCardPlay("away_fortress", league({ venue: "home" })).play).toBeUndefined();
    expect(getMatchCardPlay("away_fortress", league({ venue: "away" })).play?.effect).toEqual({ neutralVenue: true });
    expect(getMatchCardPlay("inspired_keeper", league()).play).toBeUndefined();
    expect(getMatchCardPlay("inspired_keeper", league({ competition: "cup", knockout: true })).play?.effect).toEqual({ shootout: true });
    expect(getMatchCardPlay("classic", league({ rivalOverall: 84 })).play).toBeUndefined();
    expect(getMatchCardPlay("classic", league({ rivalOverall: 86 })).play?.lineBonus.attack).toBe(5);
    expect(getMatchCardPlay("san_mames", league({ venue: "away", rivalOverall: 90 })).play).toBeUndefined();
    expect(getMatchCardPlay("san_mames", league({ rivalOverall: 91 })).play?.lineBonus.defense).toBe(7);
    expect(getMatchCardPlay("scout", league()).play).toBeUndefined();
  });

  it("la media de la carta sube la media que enseña la previa", () => {
    expect(applyMatchCardLineBonus(teamRating, getMatchCardPlay("plus4", league()).play?.lineBonus).overall).toBe(teamRating.overall + 4);
    const midfield = applyMatchCardLineBonus(teamRating, getMatchCardPlay("midfield", league()).play?.lineBonus);
    expect(midfield.control).toBe(teamRating.control + 6);
    expect(midfield.attack).toBe(teamRating.attack + 2);
    expect(midfield.overall).toBeCloseTo(teamRating.overall + 2.72, 5);
    expect(applyMatchCardLineBonus(teamRating, {})).toBe(teamRating);
  });
});

describe("cartas: el sorteo", () => {
  it("4 al empezar la temporada; recargar no cambia lo que hay boca abajo", () => {
    const start = createSeasonMatchCards("game_1_2027/28");
    expect(start.pendingDraws).toHaveLength(MATCH_CARDS_PER_SEASON);

    const draw = getPendingMatchCardDraw(start);
    expect(draw?.options).toHaveLength(6);
    expect(draw).toMatchObject({ number: 1, total: 4 });
    expect(getPendingMatchCardDraw(JSON.parse(JSON.stringify(start)))?.options).toEqual(draw?.options);
    expect(getPendingMatchCardDraw(createSeasonMatchCards("game_1_2028/29"))?.options).not.toEqual(draw?.options);
  });

  it("eliges una, se guarda y se ve el resultado hasta cerrarlo", () => {
    const start = createSeasonMatchCards("game_2_2027/28");
    const options = getPendingMatchCardDraw(start)!.options;
    const picked = pickMatchCard(start, 3);

    expect(picked.hand).toEqual([options[3]]);
    expect(picked.pendingDraws).toHaveLength(3);
    expect(picked.lastDraw).toMatchObject({ pickedIndex: 3, options });
    expect(getPendingMatchCardDraw(picked)).toMatchObject({ number: 2, total: 4 });
    expect(closeMatchCardDraw(picked).lastDraw).toBeUndefined();
  });

  it("el Ojeador enseña una carta y se gasta en el sorteo", () => {
    const state = withHand(["scout", "plus2"], { pendingDraws: ["league_leader"] });
    const draw = getPendingMatchCardDraw(state)!;
    expect(draw.revealedIndex).toBeGreaterThanOrEqual(0);

    const picked = pickMatchCard(state, draw.revealedIndex!);
    expect(picked.hand).toEqual(["plus2", draw.options[draw.revealedIndex!]]);
    expect(picked.lastDraw?.revealedIndex).toBe(draw.revealedIndex);
  });

  it("las rarezas salen más o menos al 50 / 35 / 15 %", () => {
    const counts = { common: 0, rare: 0, epic: 0 };
    for (let season = 0; season < 400; season += 1) {
      for (const id of getPendingMatchCardDraw(createSeasonMatchCards(`g_${season}`))!.options) {
        counts[MATCH_CARDS.find((card) => card.id === id)!.rarity] += 1;
      }
    }
    const total = counts.common + counts.rare + counts.epic;
    expect(counts.common / total).toBeCloseTo(0.5, 1);
    expect(counts.rare / total).toBeCloseTo(0.35, 1);
    expect(counts.epic / total).toBeCloseTo(0.15, 1);
  });
});

describe("cartas: después del partido", () => {
  it("se gasta la carta elegida; sin carta no se gasta nada", () => {
    const armed = armMatchCard(withHand(["plus2", "plus4"]), 1);
    expect(resolveMatchCards(armed, { situation: league(), won: true, lost: false }).hand).toEqual(["plus2"]);
    expect(resolveMatchCards(withHand(["plus2"]), { situation: league(), won: false, lost: true }).hand).toEqual(["plus2"]);
    expect(armMatchCard(armed, 1).armedIndex).toBeUndefined();
  });

  it("Revancha vuelve si pierdes; la Remontada se gasta siempre (v0.25.109)", () => {
    const revenge = armMatchCard(withHand(["revenge"]), 0);
    expect(resolveMatchCards(revenge, { situation: league(), won: false, lost: true }).hand).toEqual(["revenge"]);
    expect(resolveMatchCards(revenge, { situation: league(), won: true, lost: false }).hand).toEqual([]);

    const comeback = armMatchCard(withHand(["comeback"]), 0);
    const notActivated = resolveMatchCards(comeback, { situation: league(), won: true, lost: false });
    expect(notActivated.hand).toEqual([]);
    expect(notActivated.lastNotes).toEqual(["Remontada: no ibas perdiendo al descanso, la carta se ha gastado."]);
    const activated = resolveMatchCards(comeback, { situation: league(), won: false, lost: false, comebackActivated: true });
    expect(activated.hand).toEqual([]);
    expect(activated.lastNotes?.[0]).toContain("marcas en la segunda parte");
    expect(getMatchCardPlay("comeback", league()).play?.effect).toEqual({ comebackGoal: true });
  });

  it("Doble o nada: si pierdes, pierdes otra carta", () => {
    const state = armMatchCard(withHand(["double_or_nothing", "plus2", "plus4"]), 0);
    expect(resolveMatchCards(state, { situation: league(), won: false, lost: true }).hand).toHaveLength(1);
    expect(resolveMatchCards(state, { situation: league(), won: true, lost: false }).hand).toEqual(["plus2", "plus4"]);
  });

  it("se ganan cartas en cuartos y final de Copa, contra el líder, en Europa y con la racha", () => {
    const cup = (cupRoundId: string, won = true) => resolveMatchCards(withHand([]), { situation: league({ competition: "cup", knockout: true }), won, lost: !won, cupRoundId }).pendingDraws;
    expect(cup("round_of_16")).toEqual(["cup_quarter_final"]);
    expect(cup("semi_final")).toEqual(["cup_final"]);
    expect(cup("quarter_final")).toEqual([]);
    expect(cup("round_of_16", false)).toEqual([]);

    expect(resolveMatchCards(withHand([]), { situation: league(), won: true, lost: false, rivalIsLeader: true }).pendingDraws).toEqual(["league_leader"]);
    const europe = (rivalOverall: number) => resolveMatchCards(withHand([]), { situation: league({ competition: "europe", rivalOverall }), won: true, lost: false }).pendingDraws;
    expect(europe(85)).toEqual(["european_giant"]);
    expect(europe(84)).toEqual([]);

    let state = withHand([]);
    for (let match = 0; match < 7; match += 1) state = resolveMatchCards(state, { situation: league(), won: false, lost: false });
    expect(state.pendingDraws).toEqual([]);
    state = resolveMatchCards(state, { situation: league(), won: true, lost: false });
    expect(state.pendingDraws).toEqual(["unbeaten_streak"]);
    expect(state.unbeatenStreak).toBe(0);
    expect(resolveMatchCards(withHand([], { unbeatenStreak: 7 }), { situation: league(), won: false, lost: true }).unbeatenStreak).toBe(0);
  });

  it("con la mano llena no se gana carta", () => {
    const full = withHand(Array.from({ length: MATCH_CARD_HAND_LIMIT - 1 }, () => "plus2" as const), { pendingDraws: ["season_start"] });
    const after = resolveMatchCards(full, { situation: league(), won: true, lost: false, rivalIsLeader: true });
    expect(after.pendingDraws).toEqual(["season_start"]);
    expect(after.lastNotes?.some((note) => note.includes("mano llena"))).toBe(true);
  });
});

function run(card: MatchCardEffect | undefined, team: TeamRating, venue: "home" | "away" = "home", seeds = 1500) {
  let userGoals = 0;
  let rivalGoals = 0;
  let points = 0;
  for (let seed = 1; seed <= seeds; seed += 1) {
    const result = simulateMatch({ fixtureId: "f", matchday: 1, rival: uniformRival(84), venue, teamRating: team, selectedPlayers, seed, card });
    userGoals += venue === "home" ? result.homeGoals : result.awayGoals;
    rivalGoals += venue === "home" ? result.awayGoals : result.homeGoals;
    points += result.userTeamWon ? 3 : result.userTeamDrew ? 1 : 0;
  }
  return { userGoals, rivalGoals, points };
}

describe("cartas: el motor", () => {
  it("sin carta, o con una que no cambia el motor, el partido es el de siempre", () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const params = { fixtureId: "f", matchday: 1, rival: rivals[seed % rivals.length], venue: (seed % 2 ? "home" : "away") as "home" | "away", teamRating, selectedPlayers, seed };
      const plain = simulateMatch(params);
      expect(simulateMatch({ ...params, card: {} })).toEqual(plain);
      expect(simulateMatch({ ...params, card: { shootout: true } })).toEqual(plain);
    }
  });

  it("Ataque total da más goles; Defensa total, menos al rival", () => {
    const team = uniformTeam(84);
    const plain = run(undefined, team);
    const attack = run({ userGoals: 1.4, rivalGoals: 1.1 }, team);
    const defense = run({ rivalGoals: 0.6 }, team);
    // En goles reales es menos que el ×1,4 del motor: el redondeo y los marcadores extremos lo frenan.
    expect(attack.userGoals).toBeGreaterThan(plain.userGoals * 1.05);
    expect(attack.rivalGoals).toBeGreaterThan(plain.rivalGoals);
    expect(defense.rivalGoals).toBeLessThan(plain.rivalGoals * 0.8);
    expect(defense.points).toBeGreaterThan(plain.points);
  });

  it("Fortín fuera: fuera de casa se juega mejor; en casa no cambia nada", () => {
    const team = uniformTeam(84);
    expect(run({ neutralVenue: true }, team, "away").points).toBeGreaterThan(run(undefined, team, "away").points);
    expect(run({ neutralVenue: true }, team, "home")).toEqual(run(undefined, team, "home"));
  });

  it("Remontada: si vas perdiendo al descanso, un gol tuyo en la segunda parte; si no, el partido de siempre", () => {
    let activated = 0;
    for (let seed = 1; seed <= 600; seed += 1) {
      const venue = seed % 2 ? ("home" as const) : ("away" as const);
      const params = { fixtureId: "f", matchday: 1, rival: uniformRival(86), venue, teamRating: uniformTeam(84), selectedPlayers, seed };
      const plain = simulateMatch(params);
      const comeback = simulateMatch({ ...params, card: { comebackGoal: true } });

      if (getUserHalfTimeMargin(plain) >= 0) {
        expect(comeback).toEqual(plain);
        continue;
      }
      activated += 1;
      const userGoals = (result: typeof plain) => (venue === "home" ? result.homeGoals : result.awayGoals);
      const rivalGoals = (result: typeof plain) => (venue === "home" ? result.awayGoals : result.homeGoals);
      const userName = venue === "home" ? plain.homeTeamName : plain.awayTeamName;
      const remaining = plain.goalEvents.map((goal) => JSON.stringify(goal));
      const added = comeback.goalEvents.filter((goal) => {
        const index = remaining.indexOf(JSON.stringify(goal));
        if (index < 0) return true;
        remaining.splice(index, 1);
        return false;
      });

      expect(comeback.comebackActivated).toBe(true);
      expect(userGoals(comeback)).toBe(userGoals(plain) + 1);
      expect(rivalGoals(comeback)).toBe(rivalGoals(plain));
      expect(added).toHaveLength(1);
      expect(added[0].teamName).toBe(userName);
      expect(added[0].minute).toBeGreaterThan(45);
      expect(added[0].scorerName).toBeTruthy();
    }
    expect(activated).toBeGreaterThan(50);
  });

  it("Portero inspirado: en Europa se ganan más tandas de penaltis", () => {
    let plainWins = 0;
    let keeperWins = 0;
    let shootouts = 0;
    for (let seed = 1; seed <= 3000; seed += 1) {
      const input = { userTeamRating: 84, opponentRating: 84, isHome: true, competition: "champions_league" as const, seed: `p_${seed}`, isKnockout: true };
      const plain = simulateEuropeanMatch(input);
      if (plain.decidedBy !== "penalties") continue;
      shootouts += 1;
      plainWins += plain.result === "win" ? 1 : 0;
      keeperWins += simulateEuropeanMatch({ ...input, card: { shootout: true } }).result === "win" ? 1 : 0;
    }
    expect(shootouts).toBeGreaterThan(50);
    expect(keeperWins / shootouts).toBeGreaterThan(plainWins / shootouts + 0.2);
  });
});
