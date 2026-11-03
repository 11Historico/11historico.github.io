// scripts/auditLeagueDecisions.ts
//
// Mide cuánto ganaría la carrera con decisiones en Liga, que hoy se juega sin ninguna.
// No cambia el juego: las decisiones solo existen dentro de esta auditoría.
// Reproducible: npm run audit:league

import { FORMATIONS } from "../src/data/formations";
import { applyHalfTimeChoice, estimateMatchOdds, getAverageUserRating } from "../src/simulation/matchEngine";
import { calculateTeamRating } from "../src/simulation/teamRating";
import type { GameDifficulty, HalfTimeChoice, MatchApproach, MatchResult, RivalTeam, SelectedPlayer, TeamRating } from "../src/types/game";

import { draftTeam, getHalfTimeMargin, mean, meanWithMargin, pickHalfTime, playCareer, pointsValue, seedCareer, share, type DraftStyle, type Policy } from "./auditCareerRunner";

const CAREERS_PER_CELL = Number(process.argv.find((arg) => arg.startsWith("--careers="))?.split("=")[1] ?? 300);
// --only=texto: solo las políticas cuyo nombre lo contiene (varios, separados por comas). Cada carrera tiene su semilla, así que las filas no cambian.
// npm se queda con --only: se pasa llamando directamente a node .audit-dist/auditLeagueDecisions.js.
const ONLY = process.argv.find((arg) => arg.startsWith("--only="))?.split("=")[1] ?? "";
const LEAGUE_MATCHDAYS = 38;
// Menos tiradas que la previa del juego: se calcula en cada partido de cada carrera.
const ODDS_SAMPLES = 60;

type LeagueApproach = "none" | "attacking" | "defensive" | "seasonPlan" | "best" | "worst" | "random";

interface LeaguePolicy {
  label: string;
  /** Decisiones por temporada que pediría al jugador en Liga. */
  decisions: string;
  approach: LeagueApproach;
  /** Solo decide en las últimas jornadas. Sin definir, en todas. */
  lastMatchdays?: number;
  /** Solo decide si la media del rival llega a la del equipo menos este margen. */
  bigMatchMargin?: number;
  halfTime?: "good" | "bad" | "random";
  /** Fase 3: multiplica el efecto del planteamiento y del descanso en esos partidos. Sin definir, 1. */
  weight?: number;
  cups: Policy;
}

const CUPS_NEVER: Policy = { label: "Nunca decide", approach: "balanced", halfTime: "keep" };
const CUPS_WELL: Policy = { label: "Decide bien", approach: "best", halfTime: "good" };
const CUPS_BADLY: Policy = { label: "Decide mal", approach: "worst", halfTime: "bad" };

const POLICIES: LeaguePolicy[] = [
  { label: "Nunca decide", decisions: "0", approach: "none", cups: CUPS_NEVER },
  { label: "Solo Copa y Europa (hoy)", decisions: "0", approach: "none", cups: CUPS_WELL },
  { label: "Plan de temporada: siempre ataque", decisions: "1", approach: "attacking", cups: CUPS_WELL },
  { label: "Plan de temporada: siempre defensa", decisions: "1", approach: "defensive", cups: CUPS_WELL },
  { label: "Plan de temporada elegido según el nivel", decisions: "1", approach: "seasonPlan", cups: CUPS_WELL },
  { label: "Últimas 5 jornadas", decisions: "5", approach: "best", lastMatchdays: 5, cups: CUPS_WELL },
  { label: "Últimas 5 jornadas, con descanso", decisions: "10", approach: "best", lastMatchdays: 5, halfTime: "good", cups: CUPS_WELL },
  { label: "Últimas 10 jornadas", decisions: "10", approach: "best", lastMatchdays: 10, cups: CUPS_WELL },
  { label: "Últimas 10 jornadas, con descanso", decisions: "20", approach: "best", lastMatchdays: 10, halfTime: "good", cups: CUPS_WELL },
  { label: "Partidos grandes", decisions: "", approach: "best", bigMatchMargin: 1, cups: CUPS_WELL },
  { label: "Partidos grandes, con descanso", decisions: "", approach: "best", bigMatchMargin: 1, halfTime: "good", cups: CUPS_WELL },
  { label: "Partidos grandes, solo descanso", decisions: "", approach: "none", bigMatchMargin: 1, halfTime: "good", cups: CUPS_WELL },
  { label: "Partidos grandes, solo descanso, decide mal", decisions: "", approach: "none", bigMatchMargin: 1, halfTime: "bad", cups: CUPS_WELL },
  { label: "Partidos grandes, decide mal", decisions: "", approach: "worst", bigMatchMargin: 1, cups: CUPS_WELL },
  { label: "Partidos grandes, con descanso, decide mal", decisions: "", approach: "worst", bigMatchMargin: 1, halfTime: "bad", cups: CUPS_WELL },
  ...[3, -1, -3].flatMap((margin): LeaguePolicy[] => {
    const label = `Partidos grandes (margen ${margin > 0 ? "+" : ""}${margin})`;

    return [
      { label, decisions: "", approach: "best", bigMatchMargin: margin, cups: CUPS_WELL },
      { label: `${label}, con descanso`, decisions: "", approach: "best", bigMatchMargin: margin, halfTime: "good", cups: CUPS_WELL },
      { label: `${label}, con descanso, decide mal`, decisions: "", approach: "worst", bigMatchMargin: margin, halfTime: "bad", cups: CUPS_WELL },
    ];
  }),
  // Fase 3: cuánto tendrían que pesar las decisiones de los partidos grandes (margen +1).
  // «Al azar» elige planteamiento y descanso sin mirar: una persona quedaría entre él y «bien».
  ...[1, 1.5, 2, 3, 4, 6].flatMap((weight): LeaguePolicy[] => {
    const label = `Peso ×${weight}`;
    const shared = { decisions: "", bigMatchMargin: 1, weight, cups: CUPS_WELL };

    return [
      { ...shared, label: `${label}: decide bien`, approach: "best", halfTime: "good" },
      { ...shared, label: `${label}: al azar`, approach: "random", halfTime: "random" },
      { ...shared, label: `${label}: decide mal`, approach: "worst", halfTime: "bad" },
    ];
  }),
  { label: "Todos los partidos", decisions: "38", approach: "best", cups: CUPS_WELL },
  { label: "Todos los partidos, con descanso", decisions: "76", approach: "best", halfTime: "good", cups: CUPS_WELL },
  { label: "Todos los partidos, decide mal", decisions: "76", approach: "worst", halfTime: "bad", cups: CUPS_BADLY },
];

const APPROACHES: MatchApproach[] = ["balanced", "attacking", "defensive"];
const HALF_TIME_CHOICES: HalfTimeChoice[] = ["keep", "push", "close"];
// Lo lee el motor del partido en la compilación de la auditoría (auditLeagueDecisions.vite.ts).
// Solo está activo durante un partido de Liga en que se decide: Copa y Europa no cambian.
const auditWeight = { active: false, approach: 1, halfTime: 1 };
(globalThis as { __auditWeight?: unknown }).__auditWeight = auditWeight;

let current: LeaguePolicy = POLICIES[0];
// Qué planteamiento resulta ser el mejor, partido a partido: si siempre es el mismo, no hay decisión.
let chosen: Record<MatchApproach, number> = { balanced: 0, attacking: 0, defensive: 0 };
let decidedThisMatch = false;
// Partidos en que se decide y carreras que llegan, por número de temporada: los rivales suben con el tiempo.
let lastMatchday = 0;
let seasonIndex = 0;
let decidedBySeason: number[] = [];
let careersBySeason: number[] = [];

function isDecisionMatchday(matchday: number): boolean {
  return current.lastMatchdays === undefined || matchday > LEAGUE_MATCHDAYS - current.lastMatchdays;
}

function getLeagueApproach(params: {
  context: { rivals?: RivalTeam[]; selectedCoach?: { coachSeason: { skills: Parameters<typeof estimateMatchOdds>[0]["coachSkills"] } } };
  teamRating: TeamRating;
  selectedPlayers: SelectedPlayer[];
  rival: RivalTeam;
  venue: "home" | "away";
}): MatchApproach | undefined {
  const { context, teamRating, selectedPlayers, rival, venue } = params;

  if (current.approach === "none") return undefined;
  if (current.approach === "attacking" || current.approach === "defensive") return current.approach;

  if (current.approach === "random") {
    const approach = APPROACHES[Math.floor(Math.random() * APPROACHES.length)];
    chosen[approach] += 1;
    return approach;
  }

  if (current.approach === "seasonPlan") {
    const rivals = context.rivals ?? [];
    const leagueLevel = mean(rivals.map((item) => item.ratings.overall));
    return getAverageUserRating(teamRating) >= leagueLevel ? "attacking" : "defensive";
  }

  const coachSkills = context.selectedCoach?.coachSeason.skills;
  const ranked = APPROACHES
    .map((approach) => ({ approach, value: pointsValue(estimateMatchOdds({ rival, venue, teamRating, selectedPlayers, approach, coachSkills }, ODDS_SAMPLES)) }))
    .sort((a, b) => (current.approach === "best" ? b.value - a.value : a.value - b.value));

  chosen[ranked[0].approach] += 1;

  return ranked[0].approach;
}

(globalThis as { __auditLeague?: unknown }).__auditLeague = {
  matchOptions(params: Parameters<typeof getLeagueApproach>[0] & { matchday: number }) {
    decidedThisMatch = isDecisionMatchday(params.matchday)
      && (current.bigMatchMargin === undefined || params.rival.ratings.overall >= getAverageUserRating(params.teamRating) - current.bigMatchMargin);

    if (params.matchday <= lastMatchday) seasonIndex += 1;
    if (params.matchday <= lastMatchday || lastMatchday === 0) careersBySeason[seasonIndex] = (careersBySeason[seasonIndex] ?? 0) + 1;
    lastMatchday = params.matchday;
    if (decidedThisMatch) decidedBySeason[seasonIndex] = (decidedBySeason[seasonIndex] ?? 0) + 1;

    // También durante la elección: «decide bien» mira las probabilidades con el peso puesto.
    auditWeight.active = decidedThisMatch && current.weight !== undefined;
    auditWeight.approach = current.weight ?? 1;
    auditWeight.halfTime = current.weight ?? 1;

    if (!decidedThisMatch) return {};

    return { approach: getLeagueApproach(params), coachSkills: params.context.selectedCoach?.coachSeason.skills };
  },
  afterMatch({ result, selectedPlayers }: { result: MatchResult; selectedPlayers: SelectedPlayer[] }) {
    try {
      if (!current.halfTime || !decidedThisMatch) return result;

      const choice = current.halfTime === "random"
        ? HALF_TIME_CHOICES[Math.floor(Math.random() * HALF_TIME_CHOICES.length)]
        : pickHalfTime(current.halfTime, getHalfTimeMargin(result), (result.expectedGoals?.user ?? 0) < (result.expectedGoals?.rival ?? 0));

      return choice === "keep" ? result : applyHalfTimeChoice({ result, choice, selectedPlayers });
    } finally {
      auditWeight.active = false;
    }
  },
};

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

for (const { label: difficultyLabel, value: difficulty } of DIFFICULTIES) {
  for (const { label: draftLabel, style } of DRAFTS) {
    console.log(`\n### Dificultad ${difficultyLabel} · draft «${draftLabel}»\n`);
    console.log("| Jugador | Decisiones en Liga por temporada | Partidos en que decide, temporadas 1.ª · 3.ª · 5.ª | Temporadas superadas | Pasa la 1.ª | Posición en la 1.ª | Puntos en la 1.ª | Posición media | Títulos por temporada | Goles a favor por partido | En contra | Puntuación | Elige ataque | Equilibrado | Defensa |");
    console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

    for (const policy of POLICIES.filter((item) => ONLY.split(",").some((part) => item.label.includes(part)))) {
      current = policy;
      chosen = { balanced: 0, attacking: 0, defensive: 0 };
      decidedBySeason = [];
      careersBySeason = [];

      const careers = Array.from({ length: CAREERS_PER_CELL }, (_, index) => {
        const seed = index + 1;
        seedCareer(seed + 7_000_000);
        const team = draftTeam(FORMATIONS[index % FORMATIONS.length], style);
        lastMatchday = 0;
        seasonIndex = 0;

        return playCareer({ policy: policy.cups, seed, difficulty, team: { ...team, teamRating: calculateTeamRating(team) } });
      });
      const titles = careers.reduce((sum, career) => sum + career.trophies.liga + career.trophies.copa + career.trophies.supercopa + career.trophies.champions + career.trophies.europaLeague + career.trophies.conference, 0);
      const seasons = careers.reduce((sum, career) => sum + career.completedSeasons + 1, 0);

      played += careers.length;
      rejected += careers.filter((career) => !career.plausible).length;

      const decided = chosen.attacking + chosen.balanced + chosen.defensive;
      const decidedInSeason = (index: number) => (careersBySeason[index] ? ((decidedBySeason[index] ?? 0) / careersBySeason[index]).toFixed(1) : "-");

      console.log(`| ${[
        policy.label,
        policy.decisions || (decided / Math.max(1, seasons)).toFixed(1),
        [0, 2, 4].map(decidedInSeason).join(" · "),
        meanWithMargin(careers.map((career) => career.completedSeasons)),
        share(careers.filter((career) => career.completedSeasons >= 1).length, careers.length),
        meanWithMargin(careers.map((career) => career.firstSeasonPosition)),
        meanWithMargin(careers.map((career) => career.firstSeasonPoints)),
        mean(careers.map((career) => career.averagePosition)).toFixed(1),
        (titles / Math.max(1, seasons)).toFixed(2),
        mean(careers.map((career) => career.goalsForPerMatch)).toFixed(2),
        mean(careers.map((career) => career.goalsAgainstPerMatch)).toFixed(2),
        meanWithMargin(careers.map((career) => career.score)),
        decided > 0 ? share(chosen.attacking, decided) : "-",
        decided > 0 ? share(chosen.balanced, decided) : "-",
        decided > 0 ? share(chosen.defensive, decided) : "-",
      ].join(" | ")} |`);
    }
  }
}

console.log(`\nCarreras simuladas: ${played}. Rechazadas por la regla de plausibilidad del ranking: ${rejected}.`);
