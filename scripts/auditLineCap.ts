// scripts/auditLineCap.ts
//
// Estudio del tope de las líneas (capRatingBySquadAverage). No cambia el juego: las
// alternativas solo existen dentro de esta auditoría. Reproducible: npm run audit:linecap

import { applyDifficultyToTeamRating } from "../src/career/teamPower";
import { ATHLETIC_SEASONS } from "../src/data/athletic/seasons";
import { FORMATIONS } from "../src/data/formations";
import { calculateTeamRating } from "../src/simulation/teamRating";
import type { Formation, FormationSlot, GameDifficulty, PlayerSeason, TeamRating } from "../src/types/game";

import { draftTeam, mean, meanWithMargin, playCareer, seedCareer, share, type CareerTeam, type DraftedTeam, type DraftStyle, type Policy } from "./auditCareerRunner";

const DRAFTS = Number(process.argv.find((arg) => arg.startsWith("--drafts="))?.split("=")[1] ?? 1300);
const CAREERS_PER_CELL = Number(process.argv.find((arg) => arg.startsWith("--careers="))?.split("=")[1] ?? 300);

const globals = globalThis as { __auditLineHeadroom?: number; __auditSoftHeadroom?: number };

// El 4-6-0 no tiene delanteros con los que comparar a los defensas: se mide aparte
// para que no distorsione las comparaciones por estilo del resto.
const NO_ATTACKERS_FORMATION = "4-6-0";
const COMMON_FORMATIONS = FORMATIONS.filter((formation) => formation.id !== NO_ATTACKERS_FORMATION);

function ratingWithHeadroom(team: DraftedTeam, headroom: number): TeamRating {
  globals.__auditLineHeadroom = headroom;
  const rating = calculateTeamRating(team);
  globals.__auditLineHeadroom = undefined;
  return rating;
}

/** Portería, mentalidad y físico sin su tope de +10. */
function ratingWithoutSoftCap(team: DraftedTeam): TeamRating {
  globals.__auditSoftHeadroom = 1000;
  const rating = calculateTeamRating(team);
  globals.__auditSoftHeadroom = undefined;
  return rating;
}

const STYLES: { label: string; style: DraftStyle }[] = [
  { label: "Mejor media", style: "best" },
  { label: "Al azar", style: "random" },
  { label: "Prefiere ataque", style: "attack" },
  { label: "Prefiere defensa", style: "defense" },
  { label: "Ataque extremo", style: "attackExtreme" },
  { label: "Defensa extrema", style: "defenseExtreme" },
];

function pct(values: boolean[]): string {
  return share(values.filter(Boolean).length, values.length);
}

function p90(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(0.9 * sorted.length))] ?? 0;
}

function squadAverage(team: DraftedTeam): number {
  return mean(team.selectedPlayers.map((selected) => selected.playerSeason.overall));
}

function lineAverage(team: DraftedTeam, line: FormationSlot["line"]): number {
  const slots = new Set(team.formation.slots.filter((slot) => slot.line === line).map((slot) => slot.id));
  return mean(team.selectedPlayers.filter((selected) => slots.has(selected.slotId)).map((selected) => selected.playerSeason.overall));
}

console.log("## 1. Cómo salen las líneas en drafts simulados\n");
console.log("| Estilo de draft | Media once | Ataque - defensa de la plantilla | Tope: ataque | defensa | control | las 3 | mentalidad | portería | |A-D| visible | |A-D| en carrera | |A-D| sin tope | p90 sin tope | A sin tope | D sin tope | C sin tope |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

const allTeams: { style: DraftStyle; team: DraftedTeam; capped: TeamRating; raw: TeamRating }[] = [];

for (const { label, style } of STYLES) {
  const rows = Array.from({ length: DRAFTS }, (_, index) => {
    seedCareer(index + 1 + STYLES.findIndex((item) => item.style === style) * 100000);
    const team = draftTeam(FORMATIONS[index % FORMATIONS.length], style);
    const capped = calculateTeamRating(team);
    const raw = ratingWithHeadroom(team, 1000);
    allTeams.push({ style, team, capped, raw });
    const average = squadAverage(team);

    return { team, capped, raw, ceiling: Math.min(99, Math.round(average + 8)), softCeiling: Math.min(99, Math.round(average + 10)), effective: applyDifficultyToTeamRating(capped, "dificil", true) };
  }).filter((row) => row.team.formation.id !== NO_ATTACKERS_FORMATION);

  console.log(`| ${[
    label,
    mean(rows.map((row) => squadAverage(row.team))).toFixed(1),
    mean(rows.map((row) => lineAverage(row.team, "attack") - lineAverage(row.team, "defense"))).toFixed(1),
    pct(rows.map((row) => row.capped.attack === row.ceiling)),
    pct(rows.map((row) => row.capped.defense === row.ceiling)),
    pct(rows.map((row) => row.capped.control === row.ceiling)),
    pct(rows.map((row) => row.capped.attack === row.ceiling && row.capped.defense === row.ceiling && row.capped.control === row.ceiling)),
    pct(rows.map((row) => row.capped.mentality === row.softCeiling)),
    pct(rows.map((row) => row.capped.goalkeeping === row.softCeiling)),
    mean(rows.map((row) => Math.abs(row.capped.attack - row.capped.defense))).toFixed(1),
    mean(rows.map((row) => Math.abs(row.effective.attack - row.effective.defense))).toFixed(1),
    mean(rows.map((row) => Math.abs(row.raw.attack - row.raw.defense))).toFixed(1),
    p90(rows.map((row) => Math.abs(row.raw.attack - row.raw.defense))).toFixed(0),
    mean(rows.map((row) => row.raw.attack - squadAverage(row.team))).toFixed(1),
    mean(rows.map((row) => row.raw.defense - squadAverage(row.team))).toFixed(1),
    mean(rows.map((row) => row.raw.control - squadAverage(row.team))).toFixed(1),
  ].join(" | ")} |`);
}

console.log("\n(A, D y C sin tope: puntos por encima de la media del once.)\n");

const realisticAll = allTeams.filter((item) => item.style !== "attackExtreme" && item.style !== "defenseExtreme");
const realistic = realisticAll.filter((item) => item.team.formation.id !== NO_ATTACKERS_FORMATION);

console.log("## 2. ¿El rating refleja la plantilla?\n");
const tilt = (item: (typeof allTeams)[number]) => lineAverage(item.team, "attack") - lineAverage(item.team, "defense");
console.log("Drafts extremos, con las mismas formaciones: cuánto se separa el ataque de la defensa.\n");
console.log("| Draft | Delanteros - defensas de la plantilla | Ataque - defensa con el tope | En carrera | Sin tope |");
console.log("| --- | --- | --- | --- | --- |");

for (const style of ["attackExtreme", "defenseExtreme"] as const) {
  const teams = allTeams.filter((item) => item.style === style && item.team.formation.id !== NO_ATTACKERS_FORMATION);
  const inCareer = teams.map((item) => applyDifficultyToTeamRating(item.capped, "dificil", true));

  console.log(`| ${[
    STYLES.find((item) => item.style === style)?.label,
    mean(teams.map(tilt)).toFixed(1),
    mean(teams.map((item) => item.capped.attack - item.capped.defense)).toFixed(1),
    mean(inCareer.map((rating) => rating.attack - rating.defense)).toFixed(1),
    mean(teams.map((item) => item.raw.attack - item.raw.defense)).toFixed(1),
  ].join(" | ")} |`);
}

console.log("\n## 2b. Portero: mismo once con el mejor o el peor portero del juego\n");

const bestSquads = realistic.filter((item) => item.style === "best").slice(0, 400).map((item) => item.team);
const goalkeepers = ATHLETIC_SEASONS.flatMap((season) => season.players).filter((player) => player.positions.includes("POR")).sort((a, b) => a.overall - b.overall);
const withGoalkeeper = (team: DraftedTeam, goalkeeper: PlayerSeason): DraftedTeam => ({
  ...team,
  selectedPlayers: team.selectedPlayers.map((selected) => (selected.position === "POR" ? { ...selected, playerSeason: goalkeeper } : selected)),
});
const worstGoalkeeper = goalkeepers[0];
const bestGoalkeeper = goalkeepers[goalkeepers.length - 1];

console.log("| Portero | Media del portero | Media once | Portería | Defensa | Portería sin tope | Mentalidad sin tope |");
console.log("| --- | --- | --- | --- | --- | --- | --- |");

for (const [label, goalkeeper] of [["Peor", worstGoalkeeper], ["Mejor", bestGoalkeeper]] as const) {
  const teams = bestSquads.map((team) => withGoalkeeper(team, goalkeeper));
  const ratings = teams.map((team) => calculateTeamRating(team));
  const uncapped = teams.map((team) => ratingWithoutSoftCap(team));

  console.log(`| ${[
    label,
    goalkeeper.overall,
    mean(teams.map(squadAverage)).toFixed(1),
    mean(ratings.map((rating) => rating.goalkeeping)).toFixed(1),
    mean(ratings.map((rating) => rating.defense)).toFixed(1),
    mean(uncapped.map((rating) => rating.goalkeeping)).toFixed(1),
    mean(uncapped.map((rating) => rating.mentality)).toFixed(1),
  ].join(" | ")} |`);
}

console.log("\n## 3. Formación: ¿sobrevive su modificador al tope?\n");
console.log("| Formación | Modificador ataque | defensa | control | Cambia el ataque | Cambia la defensa | Cambia el control | Ninguno | Ataque final sobre la media | Defensa | Control |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

for (const formation of FORMATIONS) {
  const teams = realisticAll.filter((item) => item.team.formation.id === formation.id);
  const changes = teams.map((item) => {
    const neutral = calculateTeamRating({
      ...item.team,
      formation: { ...formation, modifiers: { ...formation.modifiers, attack: 0, defense: 0, control: 0, risk: 0 } },
    });

    return {
      attack: neutral.attack !== item.capped.attack,
      defense: neutral.defense !== item.capped.defense,
      control: neutral.control !== item.capped.control,
    };
  });

  console.log(`| ${[
    formation.id,
    formation.modifiers.attack,
    formation.modifiers.defense,
    formation.modifiers.control,
    pct(changes.map((change) => change.attack)),
    pct(changes.map((change) => change.defense)),
    pct(changes.map((change) => change.control)),
    pct(changes.map((change) => !change.attack && !change.defense && !change.control)),
    mean(teams.map((item) => item.capped.attack - squadAverage(item.team))).toFixed(1),
    mean(teams.map((item) => item.capped.defense - squadAverage(item.team))).toFixed(1),
    mean(teams.map((item) => item.capped.control - squadAverage(item.team))).toFixed(1),
  ].join(" | ")} |`);
}

console.log("\n## 4. Etiquetas que ve el jugador\n");
const labels = new Map<string, number>();
for (const item of realistic) labels.set(item.capped.profileLabel, (labels.get(item.capped.profileLabel) ?? 0) + 1);
for (const [label, count] of [...labels.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`- ${label}: ${share(count, realistic.length)}`);
}

// Sesgo de cada línea sin tope: la defensa sale siempre más alta que el ataque por cómo
// están hechas las habilidades. Hay que quitarlo o todos los equipos serían defensivos.
const LINES = ["attack", "defense", "control"] as const;
const LINE_WEIGHTS = { attack: 0.22, defense: 0.22, control: 0.18 };
type LineValues = Record<(typeof LINES)[number], number>;

function weightedLines(values: LineValues): number {
  const total = LINE_WEIGHTS.attack + LINE_WEIGHTS.defense + LINE_WEIGHTS.control;
  return LINES.reduce((sum, line) => sum + values[line] * LINE_WEIGHTS[line], 0) / total;
}

const lineBias: LineValues = {
  attack: mean(realistic.map((item) => item.raw.attack - squadAverage(item.team))),
  defense: mean(realistic.map((item) => item.raw.defense - squadAverage(item.team))),
  control: mean(realistic.map((item) => item.raw.control - squadAverage(item.team))),
};

console.log(`\n## 5. Sesgo de las líneas sin tope\n\nAtaque +${lineBias.attack.toFixed(1)}, defensa +${lineBias.defense.toFixed(1)}, control +${lineBias.control.toFixed(1)} sobre la media del once.\n`);

/** Desviación de cada línea sobre lo normal: el estilo del equipo, sin cambiar su fuerza. */
function getLineShape(team: DraftedTeam): LineValues {
  const raw = ratingWithHeadroom(team, 1000);
  const average = squadAverage(team);
  const deviation: LineValues = {
    attack: raw.attack - average - lineBias.attack,
    defense: raw.defense - average - lineBias.defense,
    control: raw.control - average - lineBias.control,
  };
  const center = weightedLines(deviation);

  return { attack: deviation.attack - center, defense: deviation.defense - center, control: deviation.control - center };
}

interface Scenario {
  label: string;
  /** Otro tope sobre la media del once. */
  headroom?: number;
  /** Reparto de las líneas sin cambiar la fuerza: cuánto se amplifica el estilo. */
  shape?: number;
  /** El reparto se aplica después de la compresión de carrera, que no lo reduce. */
  afterCompression?: boolean;
  /** Fuerza una diferencia exacta de ataque - defensa, sin cambiar la fuerza del equipo. */
  forcedGap?: number;
}

const ACTUAL: Scenario = { label: "Actual (+8)" };
const SHAPE_UNCOMPRESSED: Scenario = { label: "Reparto x1, sin comprimir", shape: 1, afterCompression: true };
const SCENARIOS: Scenario[] = [
  ACTUAL,
  { label: "Tope +12", headroom: 12 },
  { label: "Sin tope", headroom: 1000 },
  { label: "Reparto x1, comprimido", shape: 1 },
  SHAPE_UNCOMPRESSED,
  { label: "Reparto x2, sin comprimir", shape: 2, afterCompression: true },
];

function getCareerTeam(team: DraftedTeam, scenario: Scenario, difficulty: GameDifficulty): CareerTeam {
  if (scenario.forcedGap !== undefined) {
    const capped = calculateTeamRating(team);
    const effective = applyDifficultyToTeamRating(capped, difficulty, true);
    const center = weightedLines(effective);

    return {
      ...team,
      teamRating: capped,
      effectiveLineShift: {
        attack: center + scenario.forcedGap / 2 - effective.attack,
        defense: center - scenario.forcedGap / 2 - effective.defense,
        control: center - effective.control,
      },
    };
  }

  if (scenario.headroom !== undefined) return { ...team, teamRating: ratingWithHeadroom(team, scenario.headroom) };

  const capped = calculateTeamRating(team);
  if (!scenario.shape) return { ...team, teamRating: capped };

  const shape = getLineShape(team);

  if (scenario.afterCompression) {
    const effective = applyDifficultyToTeamRating(capped, difficulty, true);
    const center = weightedLines(effective);

    return {
      ...team,
      teamRating: capped,
      effectiveLineShift: {
        attack: center + shape.attack * scenario.shape - effective.attack,
        defense: center + shape.defense * scenario.shape - effective.defense,
        control: center + shape.control * scenario.shape - effective.control,
      },
    };
  }

  const center = weightedLines(capped);

  return {
    ...team,
    teamRating: {
      ...capped,
      attack: center + shape.attack * scenario.shape,
      defense: center + shape.defense * scenario.shape,
      control: center + shape.control * scenario.shape,
    },
  };
}

const NEVER_DECIDES: Policy = { label: "Nunca decide", approach: "balanced", halfTime: "keep" };
const DECIDES_WELL: Policy = { label: "Decide bien", approach: "best", halfTime: "good" };
const CAREER_DIFFICULTIES: { label: string; value: GameDifficulty }[] = [
  { label: "Normal", value: "dificil" },
  { label: "Fácil", value: "normal" },
];
const CAREER_STYLES = STYLES.filter((item) => ["best", "random", "attackExtreme", "defenseExtreme"].includes(item.style));

let played = 0;
let rejected = 0;

function runCell(params: { style: DraftStyle; formation?: Formation; difficulty: GameDifficulty; scenario: Scenario; policy: Policy }) {
  const { style, formation, difficulty, scenario, policy } = params;

  return Array.from({ length: CAREERS_PER_CELL }, (_, index) => {
    const seed = index + 1;
    seedCareer(seed + 7_000_000);
    const team = draftTeam(formation ?? COMMON_FORMATIONS[index % COMMON_FORMATIONS.length], style);
    const careerTeam = getCareerTeam(team, scenario, difficulty);
    const compressed = applyDifficultyToTeamRating(careerTeam.teamRating, difficulty, true);
    const effective: LineValues = {
      attack: compressed.attack + (careerTeam.effectiveLineShift?.attack ?? 0),
      defense: compressed.defense + (careerTeam.effectiveLineShift?.defense ?? 0),
      control: compressed.control + (careerTeam.effectiveLineShift?.control ?? 0),
    };
    const career = playCareer({ policy, seed, difficulty, team: careerTeam });

    played += 1;
    if (!career.plausible) rejected += 1;

    return {
      ...career,
      effectiveGap: effective.attack - effective.defense,
      strength: weightedLines(effective),
      tilt: lineAverage(team, "attack") - lineAverage(team, "defense"),
      squad: squadAverage(team),
    };
  });
}

type Careers = ReturnType<typeof runCell>;

function titlesPerSeason(careers: Careers): string {
  const titles = careers.reduce((sum, career) => sum + career.trophies.liga + career.trophies.copa + career.trophies.supercopa + career.trophies.champions + career.trophies.europaLeague + career.trophies.conference, 0);
  const seasons = careers.reduce((sum, career) => sum + career.completedSeasons + 1, 0);

  return (titles / Math.max(1, seasons)).toFixed(2);
}

function careerRow(label: string, careers: Careers): string {
  return `| ${[
    label,
    mean(careers.map((career) => career.strength)).toFixed(1),
    mean(careers.map((career) => Math.abs(career.effectiveGap))).toFixed(1),
    meanWithMargin(careers.map((career) => career.completedSeasons)),
    share(careers.filter((career) => career.completedSeasons >= 1).length, careers.length),
    mean(careers.map((career) => career.averagePosition)).toFixed(1),
    titlesPerSeason(careers),
    mean(careers.map((career) => career.goalsForPerMatch)).toFixed(2),
    mean(careers.map((career) => career.goalsAgainstPerMatch)).toFixed(2),
    meanWithMargin(careers.map((career) => career.score)),
  ].join(" | ")} |`;
}

const CAREER_HEADER = "| Alternativa | Fuerza efectiva | |A-D| efectivo | Temporadas superadas | Pasa la 1.ª | Posición media | Títulos por temporada | Goles a favor por partido | En contra | Puntuación |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |";

console.log("\n## 6. Carreras completas con cada alternativa\n\nMismo draft y mismas semillas en cada alternativa. Jugador que nunca decide.");

// Se guardan para medir el estilo sin repetir las carreras.
const styleSamples: { scenario: string; careers: Careers }[] = [];

for (const { label: difficultyLabel, value: difficulty } of CAREER_DIFFICULTIES) {
  for (const { label: styleLabel, style } of CAREER_STYLES) {
    console.log(`\n### Dificultad ${difficultyLabel} · draft «${styleLabel}»\n`);
    console.log(CAREER_HEADER);

    for (const scenario of SCENARIOS) {
      const careers = runCell({ style, difficulty, scenario, policy: NEVER_DECIDES });
      if (style === "best" && difficulty === "dificil") styleSamples.push({ scenario: scenario.label, careers });
      console.log(careerRow(scenario.label, careers));
    }
  }
}

console.log("\n## 7. ¿El estilo de la plantilla se nota en los goles?\n\nDraft «Mejor media», dificultad Normal. Tercios según (media de delanteros - media de defensas).\n");
console.log("| Alternativa | Media once: más ofensivos | más defensivos | Goles a favor: más ofensivos | más defensivos | Diferencia | En contra: más ofensivos | más defensivos | Diferencia |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");

for (const { scenario, careers } of styleSamples) {
  const sorted = [...careers].sort((a, b) => a.tilt - b.tilt);
  const third = Math.floor(sorted.length / 3);
  const defensive = sorted.slice(0, third);
  const offensive = sorted.slice(sorted.length - third);
  const goalsFor = (list: Careers) => mean(list.map((career) => career.goalsForPerMatch));
  const goalsAgainst = (list: Careers) => mean(list.map((career) => career.goalsAgainstPerMatch));

  console.log(`| ${[
    scenario,
    mean(offensive.map((career) => career.squad)).toFixed(1),
    mean(defensive.map((career) => career.squad)).toFixed(1),
    goalsFor(offensive).toFixed(2),
    goalsFor(defensive).toFixed(2),
    (goalsFor(offensive) - goalsFor(defensive)).toFixed(2),
    goalsAgainst(offensive).toFixed(2),
    goalsAgainst(defensive).toFixed(2),
    (goalsAgainst(offensive) - goalsAgainst(defensive)).toFixed(2),
  ].join(" | ")} |`);
}

console.log("\n## 8. Formación en carreras\n\nDraft «Mejor media», dificultad Normal.\n");
console.log(CAREER_HEADER);

for (const formationId of ["5-4-1", "5-3-2", "4-3-3", "3-3-4", NO_ATTACKERS_FORMATION]) {
  const formation = FORMATIONS.find((item) => item.id === formationId);
  if (!formation) throw new Error(`Falta la formación ${formationId}.`);

  for (const scenario of [ACTUAL, SHAPE_UNCOMPRESSED]) {
    console.log(careerRow(`${formationId} · ${scenario.label}`, runCell({ style: "best", formation, difficulty: "dificil", scenario, policy: NEVER_DECIDES })));
  }
}

for (const formationId of ["4-3-3", NO_ATTACKERS_FORMATION]) {
  const formation = FORMATIONS.find((item) => item.id === formationId);
  if (!formation) throw new Error(`Falta la formación ${formationId}.`);

  console.log(careerRow(`${formationId} · Actual (+8), dificultad Fácil`, runCell({ style: "best", formation, difficulty: "normal", scenario: ACTUAL, policy: NEVER_DECIDES })));
}

console.log("\n## 8b. Cuánto reacciona el motor a las líneas\n\nDraft «Mejor media» en 4-3-3, dificultad Normal. Misma fuerza: solo cambia la diferencia entre ataque y defensa, ya en valores efectivos.\n");
console.log(CAREER_HEADER);

const formation433 = FORMATIONS.find((item) => item.id === "4-3-3");
if (!formation433) throw new Error("Falta la formación 4-3-3.");

for (const forcedGap of [-16, -8, 0, 8, 16]) {
  console.log(careerRow(`Ataque - defensa = ${forcedGap}`, runCell({ style: "best", formation: formation433, difficulty: "dificil", scenario: { label: String(forcedGap), forcedGap }, policy: NEVER_DECIDES })));
}

console.log("\n## 9. Con decisiones de partido\n\nDraft «Mejor media», dificultad Normal, jugador que decide bien.\n");
console.log(CAREER_HEADER);

for (const scenario of [ACTUAL, SHAPE_UNCOMPRESSED]) {
  console.log(careerRow(scenario.label, runCell({ style: "best", difficulty: "dificil", scenario, policy: DECIDES_WELL })));
}

console.log(`\nCarreras simuladas: ${played}. Rechazadas por la regla de plausibilidad del ranking: ${rejected}.`);
