// scripts/auditLuckWheelRisk.ts
//
// I5 (INFORME_IDEAS_DECISIONES_v0_25_107): la ruleta de temporada con riesgo elegido.
// - Prudente: +0,5 / 0 / −0,5 con las probabilidades de la zona de puntería.
// - A todo o nada: +1 o −1, con la victoria ajustada para que el valor esperado sea el mismo.
// Mide el valor esperado por zona y carreras completas aceptando la ruleta en los mismos
// momentos que el juego (jornada 19, o eliminado de la Copa hasta la jornada 25). No cambia el juego.
// Solo mueve la media: los premios de cambio de jugador o de entrenador cuentan como 0.
// Reproducible: npm run audit:wheel-risk (o node .audit-dist/auditLuckWheelRisk.js --careers=N)

import {
  SEASON_LUCK_WHEEL_NEGATIVE_WEIGHTS,
  SEASON_LUCK_WHEEL_POSITIVE_WEIGHTS,
  SEASON_LUCK_WHEEL_PRECISION_ZONES,
  getSeasonLuckWheelPrizeSegment,
  type SeasonLuckWheelPrecisionZone,
} from "../src/career/seasonLuckWheel";
import { FORMATIONS } from "../src/data/formations";
import { calculateTeamRating } from "../src/simulation/teamRating";
import type { GameDifficulty } from "../src/types/game";

import { draftTeam, mean, meanWithMargin, playCareer, seedCareer, share, type DraftStyle, type Policy, type WheelHook } from "./auditCareerRunner";

const CAREERS_PER_CELL = Number(process.argv.find((arg) => arg.startsWith("--careers="))?.split("=")[1] ?? 300);

// Supuesto de puntería: cuántas veces se para en cada zona (centro perfecto → extremo).
const ZONE_SHARES = [10, 30, 35, 20, 5];
// Fuera de Europa: del 8.º para abajo.
const EUROPE_LAST_POSITION = 7;

type WheelKind = "current" | "prudent" | "risky";

// Azar propio de la ruleta, fijado por carrera y temporada: no toca el del partido, y todas las
// políticas ven la misma puntería y la misma tirada.
function wheelRandom(seed: number, season: number): () => number {
  let state = (seed * 2_654_435_761 + season * 97_531 + 12_345) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pickWeighted<T extends string>(weights: Record<T, number>, roll: number): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let left = roll * total;
  for (const [id, weight] of entries) {
    left -= weight;
    if (left < 0) return id;
  }
  return entries[entries.length - 1][0];
}

function pickZone(roll: number): SeasonLuckWheelPrecisionZone {
  const total = ZONE_SHARES.reduce((sum, value) => sum + value, 0);
  let left = roll * total;
  for (let index = 0; index < ZONE_SHARES.length; index += 1) {
    left -= ZONE_SHARES[index];
    if (left < 0) return SEASON_LUCK_WHEEL_PRECISION_ZONES[index];
  }
  return SEASON_LUCK_WHEEL_PRECISION_ZONES[SEASON_LUCK_WHEEL_PRECISION_ZONES.length - 1];
}

/** La victoria de «a todo o nada» con el mismo valor esperado que la prudente: 0,5 + 0,25 (p − q). */
function riskyWin(zone: SeasonLuckWheelPrecisionZone): number {
  return 0.5 + 0.25 * (zone.probabilities.positive - zone.probabilities.negative) / 100;
}

function spinDelta(kind: WheelKind, zone: SeasonLuckWheelPrecisionZone, roll: number, prizeRoll: number): number {
  const { positive, neutral } = zone.probabilities;
  if (kind === "risky") return roll < riskyWin(zone) ? 1 : -1;
  const group = roll * 100 < positive ? "positive" : roll * 100 < positive + neutral ? "neutral" : "negative";
  if (kind === "prudent") return group === "positive" ? 0.5 : group === "neutral" ? 0 : -0.5;
  if (group === "neutral") return 0;
  const type = group === "positive" ? pickWeighted(SEASON_LUCK_WHEEL_POSITIVE_WEIGHTS, prizeRoll) : pickWeighted(SEASON_LUCK_WHEEL_NEGATIVE_WEIGHTS, prizeRoll);
  return getSeasonLuckWheelPrizeSegment(type).ratingDelta;
}

// 1. Valor esperado por zona, calculado directamente.
const weightedMean = <T extends string>(weights: Record<T, number>, value: (id: T) => number) => {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  return entries.reduce((sum, [id, weight]) => sum + value(id) * weight, 0) / total;
};
const positiveDelta = weightedMean(SEASON_LUCK_WHEEL_POSITIVE_WEIGHTS, (id) => getSeasonLuckWheelPrizeSegment(id).ratingDelta);
const negativeDelta = weightedMean(SEASON_LUCK_WHEEL_NEGATIVE_WEIGHTS, (id) => getSeasonLuckWheelPrizeSegment(id).ratingDelta);
const signed = (value: number, digits = 3) => `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;

console.log("### Valor esperado por zona (media visible)\n");
console.log(`Ruleta de hoy, solo la media: un premio vale ${signed(positiveDelta)} de media (los cambios de jugador o entrenador cuentan 0) y un castigo ${signed(negativeDelta)}.\n`);
console.log("| Zona | Puntería supuesta | Premio / nada / castigo | Hoy (solo media) | Prudente | Desviación prudente | A todo o nada: gana | A todo o nada | Desviación todo o nada |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
let evToday = 0;
let evPrudent = 0;
const shareTotal = ZONE_SHARES.reduce((sum, value) => sum + value, 0);
SEASON_LUCK_WHEEL_PRECISION_ZONES.forEach((zone, index) => {
  const p = zone.probabilities.positive / 100;
  const q = zone.probabilities.negative / 100;
  const today = p * positiveDelta + q * negativeDelta;
  const prudent = 0.5 * (p - q);
  const prudentSd = Math.sqrt(0.25 * (p + q) - prudent ** 2);
  const win = riskyWin(zone);
  const risky = 2 * win - 1;
  evToday += today * ZONE_SHARES[index] / shareTotal;
  evPrudent += prudent * ZONE_SHARES[index] / shareTotal;
  console.log(`| ${[
    zone.label,
    `${ZONE_SHARES[index]} %`,
    `${zone.probabilities.positive} / ${zone.probabilities.neutral} / ${zone.probabilities.negative}`,
    signed(today),
    signed(prudent),
    prudentSd.toFixed(2),
    `${(win * 100).toFixed(1)} %`,
    signed(risky),
    Math.sqrt(1 - risky ** 2).toFixed(2),
  ].join(" | ")} |`);
});
console.log(`\nCon la puntería supuesta: hoy ${signed(evToday)}, prudente ${signed(evPrudent)} y a todo o nada ${signed(evPrudent)} de media visible (×0,55 en la simulación).\n`);

// 2. Carreras completas.
interface WheelPolicy {
  label: string;
  choose?: (leaguePosition: number) => WheelKind;
}
const POLICIES: WheelPolicy[] = [
  { label: "Rechazarla (hoy)" },
  { label: "La de hoy, solo la media", choose: () => "current" },
  { label: "Siempre prudente", choose: () => "prudent" },
  { label: "Siempre a todo o nada", choose: () => "risky" },
  { label: "Según la tabla: arriesga fuera de Europa", choose: (position) => (position > EUROPE_LAST_POSITION ? "risky" : "prudent") },
  { label: "Al revés: arriesga dentro de Europa", choose: (position) => (position > EUROPE_LAST_POSITION ? "prudent" : "risky") },
];

interface WheelStats { spins: number; risky: number; delta: number; copa: number }

function createWheel(policy: WheelPolicy, seed: number, stats: WheelStats): WheelHook {
  return {
    spin({ season, trigger, leaguePosition }) {
      if (!policy.choose) return 0;
      const random = wheelRandom(seed, season);
      const zone = pickZone(random());
      const roll = random();
      const prizeRoll = random();
      const kind = policy.choose(leaguePosition);
      const delta = spinDelta(kind, zone, roll, prizeRoll);
      stats.spins += 1;
      stats.risky += kind === "risky" ? 1 : 0;
      stats.delta += delta;
      stats.copa += trigger === "copa_elimination" ? 1 : 0;
      return delta;
    },
  };
}

const CUPS_WELL: Policy = { label: "Decide bien", approach: "best", halfTime: "good" };
const DIFFICULTIES: { label: string; value: GameDifficulty }[] = [
  { label: "Normal", value: "dificil" },
  { label: "Fácil", value: "normal" },
];
const DRAFTS: { label: string; style: DraftStyle }[] = [
  { label: "Mejor media", style: "best" },
  { label: "Al azar", style: "random" },
];

function play(seed: number, style: DraftStyle, difficulty: GameDifficulty, wheel?: WheelHook) {
  seedCareer(seed + 7_000_000);
  const team = draftTeam(FORMATIONS[(seed - 1) % FORMATIONS.length], style);
  return playCareer({ policy: CUPS_WELL, seed, difficulty, team: { ...team, teamRating: calculateTeamRating(team) }, wheel });
}

// Rechazarla por el gancho da lo mismo que sin gancho: el corredor no cambia las carreras de siempre.
for (let seed = 1; seed <= 5; seed += 1) {
  const without = JSON.stringify(play(seed, "best", "dificil"));
  const declined = JSON.stringify(play(seed, "best", "dificil", createWheel(POLICIES[0], seed, { spins: 0, risky: 0, delta: 0, copa: 0 })));
  if (without !== declined) throw new Error(`La carrera ${seed} cambia con el gancho de la ruleta rechazada.`);
}

interface RowSummary { seasons: number; survive: number; points: number; titles: number; score: number; diff: number }
const summaries = new Map<string, RowSummary[]>();
let played = 0;
let rejected = 0;

for (const { label: difficultyLabel, value: difficulty } of DIFFICULTIES) {
  for (const { label: draftLabel, style } of DRAFTS) {
    console.log(`\n### Dificultad ${difficultyLabel} · draft «${draftLabel}»\n`);
    console.log("| Ruleta | Giros por temporada · a todo o nada · tras caer en Copa | Media visible por giro | Temporadas superadas | Pasa la 1.ª | Puntos en la 1.ª | Títulos por temporada | Puntuación | Frente a rechazarla (misma carrera) |");
    console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");
    let baseline: ReturnType<typeof play>[] = [];

    for (const policy of POLICIES) {
      const stats: WheelStats = { spins: 0, risky: 0, delta: 0, copa: 0 };
      const careers = Array.from({ length: CAREERS_PER_CELL }, (_, index) => play(index + 1, style, difficulty, createWheel(policy, index + 1, stats)));
      if (!policy.choose) baseline = careers;
      const seasons = careers.reduce((sum, career) => sum + career.completedSeasons + 1, 0);
      const titles = careers.reduce((sum, career) => sum + Object.values(career.trophies).reduce((total, value) => total + value, 0), 0) / seasons;
      const diffs = careers.map((career, index) => career.score - baseline[index].score);
      const summary: RowSummary = {
        seasons: mean(careers.map((career) => career.completedSeasons)),
        survive: careers.filter((career) => career.completedSeasons >= 1).length / careers.length,
        points: mean(careers.map((career) => career.firstSeasonPoints)),
        titles,
        score: mean(careers.map((career) => career.score)),
        diff: mean(diffs),
      };
      summaries.set(policy.label, [...(summaries.get(policy.label) ?? []), summary]);
      played += careers.length;
      rejected += careers.filter((career) => !career.plausible).length;

      console.log(`| ${[
        policy.label,
        policy.choose ? `${(stats.spins / seasons).toFixed(2)} · ${share(stats.risky, stats.spins)} · ${share(stats.copa, stats.spins)}` : "-",
        policy.choose ? signed(stats.delta / Math.max(1, stats.spins), 2) : "-",
        meanWithMargin(careers.map((career) => career.completedSeasons)),
        share(careers.filter((career) => career.completedSeasons >= 1).length, careers.length),
        meanWithMargin(careers.map((career) => career.firstSeasonPoints)),
        titles.toFixed(2),
        meanWithMargin(careers.map((career) => career.score)),
        policy.choose ? meanWithMargin(diffs) : "-",
      ].join(" | ")} |`);
    }
  }
}

console.log("\n### Media de los 4 casos\n");
console.log("| Ruleta | Temporadas superadas | Pasa la 1.ª | Puntos en la 1.ª | Títulos por temporada | Puntuación | Frente a rechazarla |");
console.log("| --- | --- | --- | --- | --- | --- | --- |");
for (const [label, rows] of summaries) {
  const average = (pick: (row: RowSummary) => number) => mean(rows.map(pick));
  console.log(`| ${[
    label,
    average((row) => row.seasons).toFixed(2),
    `${(average((row) => row.survive) * 100).toFixed(1)} %`,
    average((row) => row.points).toFixed(1),
    average((row) => row.titles).toFixed(2),
    average((row) => row.score).toFixed(1),
    label === POLICIES[0].label ? "-" : signed(average((row) => row.diff), 1),
  ].join(" | ")} |`);
}

console.log(`\nCarreras simuladas: ${played}. Rechazadas por la regla de plausibilidad del ranking: ${rejected}.`);
