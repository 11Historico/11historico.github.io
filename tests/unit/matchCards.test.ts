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
  getMatchCardHalftimePlay,
  getMatchCardPlay,
  getPendingMatchCardDraw,
  pickMatchCard,
  resolveMatchCards,
  type MatchCardId,
  type MatchCardSituation,
  type MatchCardsState,
} from "../../src/career/matchCards";
import { simulateEuropeanMatch } from "../../src/europe/europeanMatchEngine";
import { applyHalfTimeChoice, applyHalftimeCard, getUserHalfTimeMargin, simulateMatch, type MatchCardEffect } from "../../src/simulation/matchEngine";
import { getMatchCardEffectText } from "../../src/components/matchSequenceTimeline";
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

// v0.25.108: el mazo retocado de docs/INFORME_TIPOS_CARTAS_v0_25_107.md; v0.25.110: al doble de fuerza.
describe("cartas: el mazo", () => {
  it("tiene los 14 tipos con la rareza medida", () => {
    expect(MATCH_CARDS).toHaveLength(14);
    const byRarity = (rarity: string) => MATCH_CARDS.filter((card) => card.rarity === rarity).map((card) => card.id).sort();
    expect(byRarity("common")).toEqual(["attack_total", "inspired_keeper", "midfield", "plus2", "scout"]);
    expect(byRarity("rare")).toEqual(["away_fortress", "classic", "comeback", "defense_total", "plus4", "revenge", "san_mames"]);
    expect(byRarity("epic")).toEqual(["double_or_nothing", "plus6"]);
    expect(MATCH_CARDS.filter((card) => ["plus2", "plus4", "plus6"].includes(card.id)).map((card) => card.name)).toEqual(["+4", "+8", "+12"]);
  });

  it("las condicionales solo valen donde toca", () => {
    expect(getMatchCardPlay("away_fortress", league({ venue: "home" })).play).toBeUndefined();
    expect(getMatchCardPlay("away_fortress", league({ venue: "away" })).play?.effect).toEqual({ neutralVenue: true });
    expect(getMatchCardPlay("inspired_keeper", league()).play).toBeUndefined();
    expect(getMatchCardPlay("inspired_keeper", league({ competition: "cup", knockout: true })).play?.effect).toEqual({ shootout: true });
    expect(getMatchCardPlay("classic", league({ rivalOverall: 84 })).play).toBeUndefined();
    expect(getMatchCardPlay("classic", league({ rivalOverall: 86 })).play?.lineBonus.attack).toBe(10);
    expect(getMatchCardPlay("san_mames", league({ venue: "away", rivalOverall: 90 })).play).toBeUndefined();
    expect(getMatchCardPlay("san_mames", league({ rivalOverall: 91 })).play?.lineBonus.defense).toBe(7);
    expect(getMatchCardPlay("scout", league()).play).toBeUndefined();
  });

  it("la media de la carta sube la media que enseña la previa", () => {
    expect(applyMatchCardLineBonus(teamRating, getMatchCardPlay("plus4", league()).play?.lineBonus).overall).toBe(teamRating.overall + 8);
    const midfield = applyMatchCardLineBonus(teamRating, getMatchCardPlay("midfield", league()).play?.lineBonus);
    expect(midfield.control).toBe(teamRating.control + 12);
    expect(midfield.attack).toBe(teamRating.attack + 4);
    expect(midfield.overall).toBeCloseTo(teamRating.overall + 5.44, 5);
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

    // v0.25.111: ganar al líder cuenta desde la jornada 5.
    expect(resolveMatchCards(withHand([]), { situation: league(), won: true, lost: false, rivalIsLeader: true, leagueMatchday: 5 }).pendingDraws).toEqual(["league_leader"]);
    expect(resolveMatchCards(withHand([]), { situation: league(), won: true, lost: false, rivalIsLeader: true, leagueMatchday: 4 }).pendingDraws).toEqual([]);
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
    const after = resolveMatchCards(full, { situation: league(), won: true, lost: false, rivalIsLeader: true, leagueMatchday: 10 });
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

// v0.25.110: docs/INFORME_CARTAS_FUERZA_DESCANSO_v0_25_109.md.
describe("cartas: en el descanso", () => {
  it("las de media dan un 6 % de gol por punto; Defensa total, Portero y la Remontada, lo suyo", () => {
    const cup = league({ competition: "cup", knockout: true, rivalOverall: 88 });
    expect(getMatchCardHalftimePlay("plus4", cup).play).toEqual({ effect: { extraGoalChance: 0.48 }, text: "48 % de marcar un gol más en la segunda parte." });
    expect(getMatchCardHalftimePlay("plus6", cup).play?.effect.extraGoalChance).toBeCloseTo(0.72, 5);
    expect(getMatchCardHalftimePlay("classic", cup).play?.effect.extraGoalChance).toBeCloseTo(0.6, 5);
    expect(getMatchCardHalftimePlay("defense_total", cup).play?.effect).toEqual({ cancelRivalChance: 0.9 });
    expect(getMatchCardHalftimePlay("inspired_keeper", cup).play?.effect).toEqual({ shootout: true });
    expect(getMatchCardHalftimePlay("comeback", cup).play).toBeUndefined();
    expect(getMatchCardHalftimePlay("comeback", cup).unavailableReason).toContain("ya sabes si vas perdiendo");
    expect(getMatchCardHalftimePlay("away_fortress", cup).play).toBeUndefined();
  });

  it("no cambia la primera parte; con un 100 % marcas uno más y Defensa total anula goles del rival", () => {
    let cancelled = 0;
    for (let seed = 1; seed <= 300; seed += 1) {
      const plain = simulateMatch({ fixtureId: "f", matchday: 1, rival: uniformRival(86), venue: "home", teamRating: uniformTeam(84), selectedPlayers, seed });
      const firstHalf = (result: typeof plain) => result.goalEvents.filter((goal) => goal.minute <= 45);

      const goal = applyHalftimeCard({ result: plain, effect: { extraGoalChance: 1 }, selectedPlayers, seed });
      expect(firstHalf(goal)).toEqual(firstHalf(plain));
      expect(goal.homeGoals).toBe(plain.homeGoals + (plain.homeGoals < 6 ? 1 : 0));
      expect(goal.awayGoals).toBe(plain.awayGoals);
      expect(goal.cardEffect).toMatchObject({ halftime: true, userGoals: goal.homeGoals, withoutUserGoals: plain.homeGoals });

      const defense = applyHalftimeCard({ result: plain, effect: { cancelRivalChance: 1 }, selectedPlayers, seed });
      expect(firstHalf(defense)).toEqual(firstHalf(plain));
      expect(defense.awayGoals).toBe(firstHalf(plain).filter((event) => event.teamName === plain.awayTeamName).length);
      cancelled += plain.awayGoals - defense.awayGoals;
    }
    expect(cancelled).toBeGreaterThan(30);
  });
});

describe("cartas: la crónica dice qué cambió la carta", () => {
  it("con el rating sin la carta, el mismo partido sin ella; sin él, el partido de siempre", () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const params = { fixtureId: "f", matchday: 1, rival: uniformRival(84), venue: "away" as const, teamRating: uniformTeam(84), selectedPlayers, seed };
      const plain = simulateMatch(params);
      const withCard = simulateMatch({ ...params, teamRating: uniformTeam(92), teamRatingWithoutCard: uniformTeam(84) });
      const sameRating = simulateMatch({ ...params, teamRatingWithoutCard: uniformTeam(84) });

      expect(plain.cardEffect).toBeUndefined();
      expect(simulateMatch({ ...params, teamRating: uniformTeam(92) })).toEqual({ ...withCard, cardEffect: undefined });
      expect(withCard.cardEffect).toEqual({ userGoals: withCard.awayGoals, rivalGoals: withCard.homeGoals, withoutUserGoals: plain.awayGoals, withoutRivalGoals: plain.homeGoals });
      expect(sameRating.cardEffect).toEqual({ userGoals: plain.awayGoals, rivalGoals: plain.homeGoals, withoutUserGoals: plain.awayGoals, withoutRivalGoals: plain.homeGoals });
    }
  });

  it("si la decisión del descanso cambia el marcador, la comparación de antes del partido ya no vale", () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const result = simulateMatch({ fixtureId: "f", matchday: 1, rival: uniformRival(84), venue: "home", teamRating: uniformTeam(92), teamRatingWithoutCard: uniformTeam(84), selectedPlayers, seed });
      const closed = applyHalfTimeChoice({ result, choice: "close", selectedPlayers, seed });
      expect(closed.cardEffect).toEqual(closed.homeGoals === result.homeGoals && closed.awayGoals === result.awayGoals ? result.cardEffect : undefined);
    }
  });

  it("los textos", () => {
    expect(getMatchCardEffectText(undefined)).toBeUndefined();
    expect(getMatchCardEffectText({ userGoals: 1, rivalGoals: 1, withoutUserGoals: 1, withoutRivalGoals: 1 })).toBe("Tu carta no cambió el marcador: sin ella habría sido el mismo.");
    expect(getMatchCardEffectText({ userGoals: 2, rivalGoals: 1, withoutUserGoals: 1, withoutRivalGoals: 1 })).toBe("Tu carta cambió el partido: sin ella habrías empatado 1-1 a los 90 minutos.");
    expect(getMatchCardEffectText({ userGoals: 3, rivalGoals: 1, withoutUserGoals: 2, withoutRivalGoals: 1 })).toBe("Tu carta cambió el marcador, pero no el resultado: sin ella también habrías ganado, 2-1 a los 90 minutos.");
    expect(getMatchCardEffectText({ userGoals: 2, rivalGoals: 2, withoutUserGoals: 1, withoutRivalGoals: 2, halftime: true })).toBe("Tu carta del descanso cambió el partido: sin ella habrías perdido 2-1.");
    // v0.25.116: el que gana, delante, como en el planteamiento y el descanso (la prueba leyó «perdido 0-1» jugando fuera).
    expect(getMatchCardEffectText({ userGoals: 1, rivalGoals: 1, withoutUserGoals: 0, withoutRivalGoals: 1 })).toBe("Tu carta cambió el partido: sin ella habrías perdido 1-0 a los 90 minutos.");
    expect(getMatchCardEffectText({ userGoals: 0, rivalGoals: 1, withoutUserGoals: 1, withoutRivalGoals: 0 })).toBe("Tu carta te salió cara: sin ella habrías ganado 1-0 a los 90 minutos.");
  });
});