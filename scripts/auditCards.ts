// scripts/auditCards.ts
//
// Idea del usuario (2026-11-10): cartas con un bonus de media para un partido. Tienes unas
// cuantas por temporada y ganas más pasando eliminatorias. Al robar, se eligen boca abajo.
// Mide cuánto mueven la carrera, si inflan el ranking y si hay decisión (dónde usarlas).
// No cambia el juego: las cartas solo existen dentro de esta auditoría.
// Reproducible: npm run audit:cards (o node .audit-dist/auditCards.js --careers=N --only=texto)

import { FORMATIONS } from "../src/data/formations";
import { calculateTeamRating } from "../src/simulation/teamRating";
import type { GameDifficulty } from "../src/types/game";

import { draftTeam, meanWithMargin, playCareer, seedCareer, share, type CardHook, type CardMatch, type DraftStyle, type Policy } from "./auditCareerRunner";

const CAREERS_PER_CELL = Number(process.argv.find((arg) => arg.startsWith("--careers="))?.split("=")[1] ?? 300);
const ONLY = process.argv.find((arg) => arg.startsWith("--only="))?.split("=")[1] ?? "";
const HAND_LIMIT = 3;
// Las cartas que sobran se gastan en las últimas jornadas de Liga: la final de Copa (tras la 35)
// y la europea (antes de la 36) ya se han jugado.
const LAST_LEAGUE_MATCHDAYS_FROM = 36;
const RANDOM_USE_CHANCE = 0.15;
// Rareza al robar: común, rara, épica.
const RARITY_WEIGHTS = [0.5, 0.35, 0.15];
// Bonus de media en el rating de simulación (ya comprimido: +1 equivale a unos +1,8 visibles).
const DECKS = {
  normal: { label: "+1 / +2 / +4", values: [1, 2, 4] },
  strong: { label: "+2 / +4 / +6", values: [2, 4, 6] },
  veryStrong: { label: "+3 / +5 / +8", values: [3, 5, 8] },
} as const;

type Use = "next" | "knockouts" | "knockoutsThenLeague" | "big" | "random";

interface CardPolicy {
  label: string;
  deck: keyof typeof DECKS;
  /** "one": 6 boca abajo, eliges 1. "twoKeepOne": eliges 2, se dan la vuelta y te quedas la mejor. */
  pick: "one" | "twoKeepOne";
  perSeason: number;
  /** +1 carta al pasar una eliminatoria (Copa o europea). */
  earnKnockouts: boolean;
  /** +1 carta al ganar en Liga a un grande. */
  earnBigLeague?: boolean;
  /** +1 carta al quedar eliminado. */
  consolation?: boolean;
  use: Use;
}

const USES: Record<Use, string> = {
  next: "en el siguiente partido",
  knockouts: "solo en eliminatorias",
  knockoutsThenLeague: "eliminatorias y lo que sobre al final de Liga",
  big: "eliminatorias y grandes de Liga",
  random: "al azar",
};

const base = { pick: "twoKeepOne", perSeason: 2, earnKnockouts: true } as const;
const POLICIES: (CardPolicy | null)[] = [
  null,
  ...(["next", "knockouts", "knockoutsThenLeague", "big", "random"] as Use[]).map((use): CardPolicy => ({ ...base, label: `Fuertes, ${USES[use]}`, deck: "strong", use })),
  ...(["next", "knockoutsThenLeague", "random"] as Use[]).map((use): CardPolicy => ({ ...base, label: `Normales, ${USES[use]}`, deck: "normal", use })),
  ...(["next", "knockoutsThenLeague"] as Use[]).map((use): CardPolicy => ({ ...base, label: `Muy fuertes, ${USES[use]}`, deck: "veryStrong", use })),
  { ...base, label: "Fuertes, 1 de 6 boca abajo", deck: "strong", pick: "one", use: "knockoutsThenLeague" },
  { ...base, label: "Fuertes, sin ganar cartas", deck: "strong", earnKnockouts: false, use: "knockoutsThenLeague" },
  { ...base, label: "Fuertes, con carta de consolación", deck: "strong", consolation: true, use: "knockoutsThenLeague" },
  { ...base, label: "Fuertes, también al ganar a un grande de Liga", deck: "strong", earnBigLeague: true, use: "knockoutsThenLeague" },
];

const CUPS_WELL: Policy = { label: "Decide bien", approach: "best", halfTime: "good" };

interface Stats {
  seasons: number;
  earned: number;
  used: number;
  usedKnockout: number;
  bonus: number;
  expired: number;
}

function wants(use: Use, match: CardMatch, random: () => number): boolean {
  switch (use) {
    case "next":
      return true;
    case "knockouts":
      return match.knockout;
    case "knockoutsThenLeague":
      return match.knockout || (match.competition === "league" && match.leagueMatchday >= LAST_LEAGUE_MATCHDAYS_FROM);
    case "big":
      return match.knockout || Boolean(match.bigRival);
    default:
      return random() < RANDOM_USE_CHANCE;
  }
}

/** Mano de cartas de una carrera. Su azar va aparte para no mover las tiradas de los partidos. */
function createCards(policy: CardPolicy, seed: number, stats: Stats): CardHook {
  let state = (seed * 69621 + 7) % 2147483647 || 1;
  const random = () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
  const values = DECKS[policy.deck].values;
  const drawOne = () => {
    const roll = random();
    return roll < RARITY_WEIGHTS[0] ? values[0] : roll < RARITY_WEIGHTS[0] + RARITY_WEIGHTS[1] ? values[1] : values[2];
  };
  let hand: number[] = [];
  const add = () => {
    if (hand.length >= HAND_LIMIT) return;
    hand.push(policy.pick === "one" ? drawOne() : Math.max(drawOne(), drawOne()));
    stats.earned += 1;
  };

  return {
    startSeason() {
      stats.expired += hand.length;
      stats.seasons += 1;
      hand = [];
      for (let index = 0; index < policy.perSeason; index += 1) add();
    },
    bonusFor(match) {
      if (hand.length === 0 || !wants(policy.use, match, random)) return 0;
      hand.sort((a, b) => b - a);
      const bonus = hand.shift() ?? 0;
      stats.used += 1;
      stats.bonus += bonus;
      if (match.knockout) stats.usedKnockout += 1;
      return bonus;
    },
    afterMatch(match, won) {
      if (match.knockout && won && policy.earnKnockouts) add();
      if (match.knockout && !won && policy.consolation) add();
      if (match.competition === "league" && match.bigRival && won && policy.earnBigLeague) add();
    },
  };
}

const DIFFICULTIES: { label: string; value: GameDifficulty }[] = [
  { label: "Normal", value: "dificil" },
  { label: "Fácil", value: "normal" },
];
const DRAFTS: { label: string; style: DraftStyle }[] = [
  { label: "Mejor media", style: "best" },
  { label: "Al azar", style: "random" },
];

let played = 0;
let rejected = 0;

console.log(`Mazos (bonus de media en simulación, común / rara / épica al ${RARITY_WEIGHTS.map((weight) => weight * 100).join(" / ")} %): ${Object.values(DECKS).map((deck) => deck.label).join(" · ")}. Mano máxima: ${HAND_LIMIT}. Caducan al acabar la temporada.`);

for (const { label: difficultyLabel, value: difficulty } of DIFFICULTIES) {
  for (const { label: draftLabel, style } of DRAFTS) {
    console.log(`\n### Dificultad ${difficultyLabel} · draft «${draftLabel}»\n`);
    console.log("| Cartas | Mazo | Cartas por temporada: ganadas · usadas · en eliminatorias | Bonus medio | Temporadas superadas | Pasa la 1.ª | Puntos en la 1.ª | Copas por temporada | Títulos europeos por temporada | Títulos por temporada | Puntuación | Rechazadas |");
    console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

    for (const policy of POLICIES.filter((item) => !ONLY || ONLY.split(",").some((part) => (item?.label ?? "Sin cartas (hoy)").includes(part)))) {
      const stats: Stats = { seasons: 0, earned: 0, used: 0, usedKnockout: 0, bonus: 0, expired: 0 };
      const careers = Array.from({ length: CAREERS_PER_CELL }, (_, index) => {
        const seed = index + 1;
        seedCareer(seed + 7_000_000);
        const team = draftTeam(FORMATIONS[index % FORMATIONS.length], style);
        return playCareer({ policy: CUPS_WELL, seed, difficulty, team: { ...team, teamRating: calculateTeamRating(team) }, cards: policy ? createCards(policy, seed, stats) : undefined });
      });
      const seasons = careers.reduce((sum, career) => sum + career.completedSeasons + 1, 0);
      const count = (pick: (trophies: (typeof careers)[number]["trophies"]) => number) => careers.reduce((sum, career) => sum + pick(career.trophies), 0) / Math.max(1, seasons);
      const perSeason = (value: number) => (value / Math.max(1, stats.seasons)).toFixed(1);

      played += careers.length;
      rejected += careers.filter((career) => !career.plausible).length;

      console.log(`| ${[
        policy?.label ?? "Sin cartas (hoy)",
        policy ? DECKS[policy.deck].label : "-",
        policy ? `${perSeason(stats.earned)} · ${perSeason(stats.used)} · ${perSeason(stats.usedKnockout)}` : "-",
        policy && stats.used ? `+${(stats.bonus / stats.used).toFixed(1)}` : "-",
        meanWithMargin(careers.map((career) => career.completedSeasons)),
        share(careers.filter((career) => career.completedSeasons >= 1).length, careers.length),
        meanWithMargin(careers.map((career) => career.firstSeasonPoints)),
        count((trophies) => trophies.copa).toFixed(2),
        count((trophies) => trophies.champions + trophies.europaLeague + trophies.conference).toFixed(2),
        count((trophies) => trophies.liga + trophies.copa + trophies.supercopa + trophies.champions + trophies.europaLeague + trophies.conference).toFixed(2),
        meanWithMargin(careers.map((career) => career.score)),
        String(careers.filter((career) => !career.plausible).length),
      ].join(" | ")} |`);
    }
  }
}

console.log(`\nCarreras simuladas: ${played}. Rechazadas por la regla de plausibilidad del ranking: ${rejected}.`);
