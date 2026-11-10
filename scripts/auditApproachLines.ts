// scripts/auditApproachLines.ts
//
// Idea I2 del informe de ideas (v0.25.107): que el planteamiento lea las líneas del rival en vez
// de solo la diferencia de medias. Mide, con onces sorteados como en el juego, qué planteamiento
// es el mejor en cada partido, si una regla fija acierta y cuánto vale decidir bien.
// No cambia el juego: la variante solo existe dentro de esta auditoría (auditApproachLines.vite.ts).
// Reproducible: npm run audit:approach-lines (o node .audit-dist/auditApproachLines.js --teams=N)

import { applyDifficultyToTeamRating } from "../src/career/teamPower";
import { FORMATIONS } from "../src/data/formations";
import { estimateEuropeanMatchOdds } from "../src/europe/europeanMatchEngine";
import type { EuropeanOpponentStyle } from "../src/europe/europeanTypes";
import { getInitialCareerLeagueRivals } from "../src/simulation/leagueSimulator";
import { estimateMatchOdds, getAverageUserRating, type MatchOdds } from "../src/simulation/matchEngine";
import { calculateTeamRating } from "../src/simulation/teamRating";
import type { CoachSkills, MatchApproach, RivalTeam, TeamRating } from "../src/types/game";

import { advanceValue, draftTeam, pointsValue, seedCareer, type DraftStyle } from "./auditCareerRunner";

const TEAMS = Number(process.argv.find((arg) => arg.startsWith("--teams="))?.split("=")[1] ?? 40);
const ODDS_SAMPLES = 300;
const APPROACHES: MatchApproach[] = ["attacking", "balanced", "defensive"];

const VARIANTS: { label: string; lines: { gap: number; effect: number } | null }[] = [
  { label: "Hoy: solo la media", lines: null },
  { label: "Líneas (tope a 10 puntos)", lines: { gap: 10, effect: 0.1 } },
  { label: "Líneas sensibles (tope a 5 puntos)", lines: { gap: 5, effect: 0.1 } },
  // Techo: el doble de efecto. Sirve para ver hasta dónde puede llegar, no como propuesta.
  { label: "Líneas con el doble de efecto (tope a 5 puntos)", lines: { gap: 5, effect: 0.2 } },
];

const DRAFTS: { label: string; style: DraftStyle }[] = [
  { label: "Mejor media", style: "best" },
  { label: "Al azar", style: "random" },
  { label: "Ofensivo", style: "attack" },
  { label: "Defensivo", style: "defense" },
];
const EUROPE_RATINGS = [80, 84, 88, 92];
const EUROPE_STYLES: { label: string; style: EuropeanOpponentStyle }[] = [
  { label: "Rival ofensivo", style: "attacking" },
  { label: "Rival equilibrado", style: "balanced" },
  { label: "Rival defensivo", style: "defensive" },
];

interface Team {
  draft: string;
  rating: TeamRating;
  coachSkills: CoachSkills;
}

interface Match {
  /** Grupo para el desglose: perfil del once (Copa) o estilo del rival (Europa). */
  group: string;
  /** Media del usuario menos la del rival, como la mira el planteamiento de hoy. */
  averageGap: number;
  odds: (approach: MatchApproach) => MatchOdds;
}

// Mismas cuentas que getAverageRivalRating en matchEngine.ts, que no se exporta.
function rivalAverage(rival: RivalTeam): number {
  const { attack, defense, midfield, mentality, goalkeeping } = rival.ratings;
  return attack * 0.22 + defense * 0.22 + midfield * 0.2 + mentality * 0.16 + goalkeeping * 0.2;
}

function pct(value: number, total: number): string {
  return `${Math.round((value / Math.max(1, total)) * 100)} %`;
}

const teams: Team[] = Array.from({ length: TEAMS }, (_, index) => {
  const { label, style } = DRAFTS[index % DRAFTS.length];
  seedCareer(index + 9_000_001);
  const team = draftTeam(FORMATIONS[index % FORMATIONS.length], style);
  return { draft: label, rating: applyDifficultyToTeamRating(calculateTeamRating(team), "dificil", true), coachSkills: team.selectedCoach.coachSeason.skills };
});
const rivals = getInitialCareerLeagueRivals();

const copaMatches: Match[] = teams.flatMap((team) =>
  rivals.flatMap((rival) =>
    (["home", "away"] as const).map((venue) => ({
      group: team.draft,
      averageGap: getAverageUserRating(team.rating) - rivalAverage(rival),
      odds: (approach: MatchApproach) =>
        estimateMatchOdds({ rival, venue, teamRating: team.rating, selectedPlayers: [], approach, coachSkills: team.coachSkills }, ODDS_SAMPLES),
    })),
  ),
);

const europeMatches: Match[] = teams.flatMap((team) =>
  EUROPE_RATINGS.flatMap((opponentRating) =>
    EUROPE_STYLES.flatMap(({ label, style }) =>
      [true, false].map((isHome) => ({
        group: label,
        averageGap: team.rating.overall - opponentRating,
        odds: (approach: MatchApproach) =>
          estimateEuropeanMatchOdds(
            { userTeamRating: team.rating.overall, userProfile: team.rating, opponentRating, opponentStyle: style, isHome, competition: "europa_league", approach, coachSkills: team.coachSkills },
            ODDS_SAMPLES,
          ),
      })),
    ),
  ),
);

function measure(title: string, matches: Match[], value: (odds: MatchOdds) => number, unit: (delta: number) => string, groupLabel: string, groups: string[]): void {
  console.log(`\n### ${title} (${matches.length} partidos)\n`);
  console.log("| Fórmula | Ofensivo, el mejor | Equilibrado, el mejor | Defensivo, el mejor | Acierta «ataca si tu media es mayor» | Acierta «ataca si eres favorito» | Decidir bien frente a equilibrado | Con la regla del favorito |");
  console.log("| --- | --- | --- | --- | --- | --- | --- | --- |");
  const byGroupRows: string[] = [];

  for (const variant of VARIANTS) {
    (globalThis as { __auditApproachLines?: unknown }).__auditApproachLines = variant.lines;
    const best = { attacking: 0, balanced: 0, defensive: 0 };
    let averageRuleHits = 0;
    let favouriteRuleHits = 0;
    let bestGain = 0;
    let favouriteGain = 0;
    const groupAttack = new Map<string, { attack: number; total: number }>();

    for (const match of matches) {
      const odds = Object.fromEntries(APPROACHES.map((approach) => [approach, match.odds(approach)])) as Record<MatchApproach, MatchOdds>;
      const values = Object.fromEntries(APPROACHES.map((approach) => [approach, value(odds[approach])])) as Record<MatchApproach, number>;
      const top = APPROACHES.reduce((a, b) => (values[b] > values[a] ? b : a));
      const averageRule: MatchApproach = match.averageGap >= 0 ? "attacking" : "defensive";
      const favouriteRule: MatchApproach = odds.balanced.win >= odds.balanced.loss ? "attacking" : "defensive";

      best[top] += 1;
      if (averageRule === top) averageRuleHits += 1;
      if (favouriteRule === top) favouriteRuleHits += 1;
      bestGain += values[top] - values.balanced;
      favouriteGain += values[favouriteRule] - values.balanced;

      const entry = groupAttack.get(match.group) ?? { attack: 0, total: 0 };
      groupAttack.set(match.group, { attack: entry.attack + (top === "attacking" ? 1 : 0), total: entry.total + 1 });
    }

    console.log(`| ${[
      variant.label,
      pct(best.attacking, matches.length),
      pct(best.balanced, matches.length),
      pct(best.defensive, matches.length),
      pct(averageRuleHits, matches.length),
      pct(favouriteRuleHits, matches.length),
      unit(bestGain / matches.length),
      unit(favouriteGain / matches.length),
    ].join(" | ")} |`);
    byGroupRows.push(`| ${[variant.label, ...groups.map((group) => { const entry = groupAttack.get(group); return entry ? pct(entry.attack, entry.total) : "-"; })].join(" | ")} |`);
  }

  console.log(`\nOfensivo es lo mejor, según ${groupLabel}:\n`);
  console.log(`| Fórmula | ${groups.join(" | ")} |`);
  console.log(`| --- | ${groups.map(() => "---").join(" | ")} |`);
  byGroupRows.forEach((row) => console.log(row));
}

const lineSpread = (key: "attack" | "defense") => {
  const values = teams.map((team) => team.rating[key] - team.rating.overall);
  return `${Math.min(...values).toFixed(1)} a ${Math.max(...values).toFixed(1)}`;
};
console.log(`Onces: ${TEAMS}, media de simulación ${(teams.reduce((sum, team) => sum + team.rating.overall, 0) / TEAMS).toFixed(1)}. Ataque menos media: ${lineSpread("attack")}. Defensa menos media: ${lineSpread("defense")}.`);
console.log(`Rivales de Liga, ataque menos defensa: ${rivals.map((rival) => rival.ratings.attack - rival.ratings.defense).sort((a, b) => a - b).join(", ")}.`);

measure("Copa · probabilidad de pasar (ganar en 90 minutos o la mitad de los empates)", copaMatches, advanceValue, (delta) => `${(delta * 100).toFixed(1)} puntos`, "el perfil del once", DRAFTS.map((draft) => draft.label));
measure("Europa League · fase de liga, puntos por partido", europeMatches, pointsValue, (delta) => `${delta >= 0 ? "+" : ""}${delta.toFixed(3)} puntos`, "el estilo del rival", EUROPE_STYLES.map((style) => style.label));
