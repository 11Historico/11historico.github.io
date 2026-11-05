// scripts/auditSimulationRating.ts
//
// Mide alternativas al rating que usa la simulación en carrera (petición del 2026-11-05).
// Hoy se comprime: 80 + (rating − 80) × 0,55, redondeado (88 visible → 84). La propuesta es
// usar un rating entre el del once sin entrenador y el de la temporada con entrenador.
// No cambia el juego: el rating alternativo solo existe dentro de esta auditoría.
// Reproducible: npm run audit:rating (o node .audit-dist/auditSimulationRating.js --careers=N)

import { FORMATIONS } from "../src/data/formations";
import { compressCareerRating, getDifficultyRatingModifier } from "../src/career/teamPower";
import { calculateTeamRating } from "../src/simulation/teamRating";
import type { GameDifficulty, TeamRating } from "../src/types/game";

import { draftTeam, mean, meanWithMargin, playCareer, seedCareer, share, type DraftStyle, type Policy } from "./auditCareerRunner";

const CAREERS_PER_CELL = Number(process.argv.find((arg) => arg.startsWith("--careers="))?.split("=")[1] ?? 200);
const FIELDS = ["attack", "defense", "control", "physical", "mentality", "goalkeeping", "overall"] as const;
type Field = (typeof FIELDS)[number];

// El jugador de hoy: planteamiento y descanso bien elegidos en Copa y Europa.
const POLICY: Policy = { label: "Decide bien", approach: "best", halfTime: "good" };

interface Variant {
  label: string;
  /** Sin definir: la compresión del juego (hoy). `coach` es lo que suma el entrenador en cada línea. */
  build?: (season: TeamRating, coach: Record<Field, number>, modifier: number) => Record<Field, number>;
}

const perField = (fn: (field: Field) => number) => Object.fromEntries(FIELDS.map((field) => [field, fn(field)])) as Record<Field, number>;

const VARIANTS: Variant[] = [
  { label: "Hoy: comprimido y redondeado" },
  { label: "Comprimido sin redondeo", build: (season, _coach, modifier) => perField((field) => compressCareerRating(season[field]) + modifier) },
  { label: "Once sin entrenador", build: (season, coach, modifier) => perField((field) => season[field] - coach[field] + modifier) },
  // La propuesta varía partido a partido entre el once y la temporada; aquí, su media.
  { label: "Entre los dos (media)", build: (season, coach, modifier) => perField((field) => season[field] - coach[field] / 2 + modifier) },
  { label: "Temporada con entrenador", build: (season, _coach, modifier) => perField((field) => season[field] + modifier) },
];

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
  const modifier = getDifficultyRatingModifier(difficulty);

  for (const { label: draftLabel, style } of DRAFTS) {
    console.log(`\n### Dificultad ${difficultyLabel} · draft «${draftLabel}»\n`);
    console.log("| Rating de simulación | Media de simulación | Visible | Temporadas superadas | Pasa la 1.ª | Posición en la 1.ª | Puntos en la 1.ª | Ligas por temporada | Títulos por temporada | Llegan al tope de 25 | Puntuación |");
    console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

    for (const variant of VARIANTS) {
      const simulationOveralls: number[] = [];
      const visibleOveralls: number[] = [];

      const careers = Array.from({ length: CAREERS_PER_CELL }, (_, index) => {
        const seed = index + 1;
        seedCareer(seed + 7_000_000);
        const team = draftTeam(FORMATIONS[index % FORMATIONS.length], style);
        const teamRating = calculateTeamRating(team);
        const squadRating = calculateTeamRating({ ...team, selectedCoach: undefined });
        const coach = perField((field) => teamRating[field] - squadRating[field]);
        const build = variant.build;
        visibleOveralls.push(teamRating.overall);

        return playCareer({
          policy: POLICY,
          seed,
          difficulty,
          team: {
            ...team,
            teamRating,
            simulationRating: build
              ? (season) => {
                const rating = { ...season, ...build(season, coach, modifier) };
                simulationOveralls.push(rating.overall);
                return rating;
              }
              : undefined,
          },
        });
      });

      const seasons = careers.reduce((sum, career) => sum + career.completedSeasons + 1, 0);
      const titles = careers.reduce((sum, career) => sum + career.trophies.liga + career.trophies.copa + career.trophies.supercopa + career.trophies.champions + career.trophies.europaLeague + career.trophies.conference, 0);
      const leagues = careers.reduce((sum, career) => sum + career.trophies.liga, 0);
      played += careers.length;
      rejected += careers.filter((career) => !career.plausible).length;
      // Hoy: la media de simulación es la compresión redondeada de la visible.
      const todayOverall = mean(visibleOveralls.map((value) => Math.round(compressCareerRating(value)) + modifier));

      console.log(`| ${[
        variant.label,
        (variant.build ? mean(simulationOveralls) : todayOverall).toFixed(1),
        mean(visibleOveralls).toFixed(1),
        meanWithMargin(careers.map((career) => career.completedSeasons)),
        share(careers.filter((career) => career.completedSeasons >= 1).length, careers.length),
        meanWithMargin(careers.map((career) => career.firstSeasonPosition)),
        meanWithMargin(careers.map((career) => career.firstSeasonPoints)),
        (leagues / Math.max(1, seasons)).toFixed(2),
        (titles / Math.max(1, seasons)).toFixed(2),
        share(careers.filter((career) => career.reachedCap).length, careers.length),
        meanWithMargin(careers.map((career) => career.score)),
      ].join(" | ")} |`);
    }
  }
}

console.log(`\nCarreras simuladas: ${played}. Rechazadas por la regla de plausibilidad del ranking: ${rejected}.`);
