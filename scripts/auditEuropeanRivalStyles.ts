// scripts/auditEuropeanRivalStyles.ts
//
// Fase 10 del roadmap: auditoría de los estilos de los rivales europeos. No cambia el juego.
// Hoy el rival europeo tiene todas las líneas iguales a su media (buildUniformRivalTeam en
// src/europe/europeanMatchEngine.ts). La propuesta es darle un estilo: más ataque y menos defensa
// (ofensivo) o al revés (defensivo), con la misma media ponderada del motor (ataque y defensa
// pesan lo mismo, 0,22).
//
// Mide, con el motor real (simulateMatch) y las mismas semillas:
//  1. Partido a partido: si el estilo cambia la fuerza del rival y qué planteamiento rinde más.
//  2. Fase inicial completa: pasar a semifinales con los estilos repartidos por club.
//
// El rival con estilo se construye aquí, igual que buildUniformRivalTeam salvo el ataque y la
// defensa. La primera comprobación verifica que el rival uniforme da exactamente lo mismo que
// simulateEuropeanMatch.
// Reproducible: npm run audit:european-styles (o node .audit-dist/auditEuropeanRivalStyles.js --matches=N --tournaments=N)

import strong from "../tests/e2e/fixtures/career-strong.json";
import { simulateEuropeanMatch } from "../src/europe/europeanMatchEngine";
import {
  applyEuropeanMatchResult,
  createEuropeanTournamentForQualification,
  getEuropeanLeaguePhaseUserPosition,
} from "../src/europe/europeanTournament";
import type { EuropeanCompetition, EuropeanQualificationResult } from "../src/europe/europeanTypes";
import { getAverageUserRating, simulateMatch } from "../src/simulation/matchEngine";
import type { MatchApproach, RivalTeam, SelectedPlayer, TeamRating } from "../src/types/game";

const arg = (name: string, fallback: number) => Number(process.argv.find((value) => value.startsWith(`--${name}=`))?.split("=")[1] ?? fallback);
const MATCHES = arg("matches", 10000);
const TOURNAMENTS = arg("tournaments", 600);
const BEST_SAMPLES = 400;

const profile = strong.teamRating as unknown as TeamRating;
const selectedPlayers = strong.selectedPlayers as unknown as SelectedPlayer[];
const APPROACHES: MatchApproach[] = ["defensive", "balanced", "attacking"];
const APPROACH_LABEL: Record<MatchApproach, string> = { defensive: "Defensivo", balanced: "Equilibrado", attacking: "Ofensivo" };

type Style = { label: string; attack: number; defense: number };
const UNIFORM: Style = { label: "Uniforme (hoy)", attack: 0, defense: 0 };
const styles = (amplitude: number): Style[] => [
  { label: `Ofensivo ±${amplitude}`, attack: amplitude, defense: -amplitude },
  { label: `Defensivo ±${amplitude}`, attack: -amplitude, defense: amplitude },
];
const ALL_STYLES: Style[] = [UNIFORM, ...styles(3), ...styles(6)];

// --- Copias de las funciones privadas de europeanMatchEngine.ts (sin cambios) ---

function clampRating(value: number): number {
  return Math.max(40, Math.min(99, Math.round(value)));
}

function buildProfileTeamRating(overall: number): TeamRating {
  const target = clampRating(overall);
  const offset = target - getAverageUserRating(profile);
  const shift = (line: number) => Math.max(40, Math.min(99, Math.round((line + offset) * 100) / 100));
  return {
    ...profile,
    attack: shift(profile.attack),
    defense: shift(profile.defense),
    control: shift(profile.control),
    physical: shift(profile.physical),
    mentality: shift(profile.mentality),
    goalkeeping: shift(profile.goalkeeping),
    overall: target,
  };
}

function seedToNumber(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  return hash;
}

/** buildUniformRivalTeam con el ataque y la defensa movidos por el estilo. */
function buildStyledRival(rating: number, competition: EuropeanCompetition, style: Style): RivalTeam {
  const clamped = clampRating(rating);
  return {
    id: `european_rival_${competition}`,
    name: "Rival europeo",
    shirtIcon: "🇪🇺",
    ratings: {
      attack: clampRating(clamped + style.attack),
      midfield: clamped,
      defense: clampRating(clamped + style.defense),
      goalkeeping: clamped,
      mentality: clamped,
      overall: clamped,
    },
  };
}

type Outcome = { userGoals: number; opponentGoals: number; result: "win" | "draw" | "loss" };

/** Partido de 90 minutos como simulateEuropeanMatch, con el rival con estilo. */
function play(params: { userRating: number; rival: number; isHome: boolean; competition: EuropeanCompetition; style: Style; approach: MatchApproach; seed: string }): Outcome {
  const result = simulateMatch({
    fixtureId: `european_${params.competition}`,
    matchday: 0,
    rival: buildStyledRival(params.rival, params.competition, params.style),
    venue: params.isHome ? "home" : "away",
    teamRating: buildProfileTeamRating(params.userRating),
    selectedPlayers,
    seed: seedToNumber(params.seed),
    approach: params.approach,
  });
  return {
    userGoals: params.isHome ? result.homeGoals : result.awayGoals,
    opponentGoals: params.isHome ? result.awayGoals : result.homeGoals,
    result: result.userTeamWon ? "win" : result.userTeamDrew ? "draw" : "loss",
  };
}

const points = (outcome: Outcome) => (outcome.result === "win" ? 3 : outcome.result === "draw" ? 1 : 0);

// --- 0. Comprobación: el rival uniforme reproduce el juego ---

let mismatches = 0;
for (let index = 0; index < 2000; index += 1) {
  const isHome = index % 2 === 0;
  const approach = APPROACHES[index % 3];
  const seed = `check_${index}`;
  const game = simulateEuropeanMatch({ userTeamRating: 85, opponentRating: 84 + (index % 7), isHome, competition: "champions_league", seed, approach, userProfile: profile, selectedPlayers });
  const audit = play({ userRating: 85, rival: 84 + (index % 7), isHome, competition: "champions_league", style: UNIFORM, approach, seed });
  if (game.userGoals !== audit.userGoals || game.opponentGoals !== audit.opponentGoals) mismatches += 1;
}
console.log(`# Auditoría de estilos de los rivales europeos\n`);
console.log(`Comprobación: el rival uniforme de la auditoría da el mismo marcador que el juego en ${2000 - mismatches} de 2000 partidos.\n`);
if (mismatches > 0) throw new Error("La auditoría no reproduce el motor europeo.");

// --- 1. Partido a partido ---

const CASES: { label: string; competition: EuropeanCompetition; rival: number }[] = [
  { label: "Champions, rival de 90", competition: "champions_league", rival: 90 },
  { label: "Champions, rival de 86", competition: "champions_league", rival: 86 },
  { label: "Europa League, rival de 82", competition: "europa_league", rival: 82 },
  { label: "Conference, rival de 76", competition: "conference_league", rival: 76 },
];
const USER_MATCH_RATING = 85;

function measure(competition: EuropeanCompetition, rival: number, style: Style, approach: MatchApproach, samples: number, tag: string) {
  let pts = 0;
  let wins = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  for (let index = 0; index < samples; index += 1) {
    const outcome = play({ userRating: USER_MATCH_RATING, rival, isHome: index % 2 === 0, competition, style, approach, seed: `${tag}_${index}` });
    pts += points(outcome);
    if (outcome.result === "win") wins += 1;
    goalsFor += outcome.userGoals;
    goalsAgainst += outcome.opponentGoals;
  }
  return { points: pts / samples, wins: wins / samples, goalsFor: goalsFor / samples, goalsAgainst: goalsAgainst / samples };
}

console.log(`## 1. Partido a partido (tu media de simulación ${USER_MATCH_RATING}, la mitad en casa; ${MATCHES} partidos por casilla)\n`);
console.log("Puntos por partido con cada planteamiento; entre paréntesis, goles a favor y en contra con el equilibrado.\n");

const bestCount: Record<string, Record<MatchApproach, number>> = {};

for (const { label, competition, rival } of CASES) {
  console.log(`### ${label}\n`);
  console.log("| Estilo del rival | Defensivo | Equilibrado | Ofensivo | Mejor | Fuerza frente a hoy (equilibrado) |");
  console.log("| --- | --- | --- | --- | --- | --- |");
  let uniformBalanced = 0;

  for (const style of ALL_STYLES) {
    const results = APPROACHES.map((approach) => measure(competition, rival, style, approach, MATCHES, `m_${competition}_${rival}`));
    const balanced = results[1];
    if (style === UNIFORM) uniformBalanced = balanced.points;
    const bestIndex = results.reduce((best, current, index) => (current.points > results[best].points ? index : best), 0);
    const best = APPROACHES[bestIndex];
    const family = style.label.split(" ")[0];
    bestCount[family] ??= { defensive: 0, balanced: 0, attacking: 0 };
    bestCount[family][best] += 1;
    const delta = balanced.points - uniformBalanced;
    console.log(
      `| ${style.label} | ${results[0].points.toFixed(2)} | ${balanced.points.toFixed(2)} (${balanced.goalsFor.toFixed(2)}-${balanced.goalsAgainst.toFixed(2)}) | ${results[2].points.toFixed(2)} | ${APPROACH_LABEL[best]} | ${style === UNIFORM ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)} pts`} |`,
    );
  }
  console.log("");
}

console.log("Mejor planteamiento por familia de estilo (casillas de la tabla anterior):\n");
console.log("| Estilo | Defensivo | Equilibrado | Ofensivo |");
console.log("| --- | --- | --- | --- |");
for (const [family, counts] of Object.entries(bestCount)) {
  console.log(`| ${family} | ${counts.defensive} | ${counts.balanced} | ${counts.attacking} |`);
}

// --- 2. Fase inicial completa ---

const COMPETITIONS: { label: string; value: EuropeanCompetition }[] = [
  { label: "Champions", value: "champions_league" },
  { label: "Europa League", value: "europa_league" },
  { label: "Conference", value: "conference_league" },
];
const TOURNAMENT_RATINGS = [84, 86];

/** Estilo fijo por club: un tercio ofensivos, un tercio defensivos y un tercio uniformes, según el nombre. */
function styleForClub(name: string, amplitude: number): Style {
  if (amplitude === 0) return UNIFORM;
  const slot = seedToNumber(name) % 3;
  return slot === 0 ? styles(amplitude)[0] : slot === 1 ? styles(amplitude)[1] : UNIFORM;
}

const bestCache = new Map<string, MatchApproach>();
function bestApproach(userRating: number, rival: number, isHome: boolean, competition: EuropeanCompetition, style: Style): MatchApproach {
  const key = `${userRating}_${rival}_${isHome}_${competition}_${style.label}`;
  const cached = bestCache.get(key);
  if (cached) return cached;
  let best: MatchApproach = "balanced";
  let bestPoints = -1;
  for (const approach of APPROACHES) {
    let pts = 0;
    for (let index = 0; index < BEST_SAMPLES; index += 1) {
      pts += points(play({ userRating, rival, isHome, competition, style, approach, seed: `best_${index}` }));
    }
    if (pts > bestPoints) {
      bestPoints = pts;
      best = approach;
    }
  }
  bestCache.set(key, best);
  return best;
}

console.log(`\n## 2. Fase inicial completa (${TOURNAMENTS} torneos por casilla, mismas semillas)\n`);
console.log("Pasa a semifinales (top 2) y puntos medios. «Decide bien» elige en cada partido el planteamiento que más puntos da contra ese rival.\n");

const VARIANTS = [
  { label: "Hoy (uniforme)", amplitude: 0 },
  { label: "Estilos ±3", amplitude: 3 },
  { label: "Estilos ±6", amplitude: 6 },
];

for (const { label: competitionLabel, value: competition } of COMPETITIONS) {
  console.log(`### ${competitionLabel}\n`);
  console.log(`| Tu media | Decisiones | ${VARIANTS.map((variant) => variant.label).join(" | ")} |`);
  console.log(`| --- | --- | ${VARIANTS.map(() => "---").join(" | ")} |`);

  for (const userRating of TOURNAMENT_RATINGS) {
    for (const policy of ["No decide (equilibrado)", "Decide bien"]) {
      const cells = VARIANTS.map(({ amplitude }) => {
        let top2 = 0;
        let pointsSum = 0;
        for (let index = 0; index < TOURNAMENTS; index += 1) {
          let tournament = createEuropeanTournamentForQualification({
            seasonNumber: index + 1,
            qualification: { qualified: true, competition } as Pick<EuropeanQualificationResult, "qualified" | "competition"> as EuropeanQualificationResult,
            seed: `audit_${index}_${competition}`,
          });
          if (!tournament) throw new Error("No se creó el torneo.");

          for (const match of tournament.matches) {
            const style = styleForClub(match.opponent.name, amplitude);
            const approach = policy === "Decide bien" ? bestApproach(userRating, match.opponent.rating, match.isHome, competition, style) : "balanced";
            const outcome = play({ userRating, rival: match.opponent.rating, isHome: match.isHome, competition, style, approach, seed: `audit_${index}_${match.id}` });
            tournament = applyEuropeanMatchResult(tournament, match.id, { ...outcome, goalEvents: [] });
          }

          if (getEuropeanLeaguePhaseUserPosition(tournament) <= 2) top2 += 1;
          pointsSum += tournament.leaguePhasePoints;
        }
        return `${Math.round((top2 / TOURNAMENTS) * 100)} % · ${(pointsSum / TOURNAMENTS).toFixed(1)} pts`;
      });
      console.log(`| ${userRating} | ${policy} | ${cells.join(" | ")} |`);
    }
  }
  console.log("");
}

console.log("Nota: los partidos entre rivales de la tabla siguen con rivales uniformes, como hoy.");
