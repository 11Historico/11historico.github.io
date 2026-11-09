// scripts/auditEuropeanPlayoff.ts
//
// Fase 13 del roadmap (docs/ROADMAP_MEJORAS_v0_25_91.md): mide una eliminatoria previa en Europa.
// El 3.º y el 4.º de la fase inicial juegan un partido único por entrar en semifinales. Hoy quedar
// 3.º o 4.º elimina. Dos variantes: «3.º contra 4.º» de la tabla, o «club nuevo» del sorteo.
// No cambia el juego: la previa solo existe dentro de esta auditoría (auditCareerRunner.ts).
// Reproducible: npm run audit:european-playoff (o node .audit-dist/auditEuropeanPlayoff.js --tournaments=N --careers=N)

import { FORMATIONS } from "../src/data/formations";
import { estimateEuropeanMatchOdds, simulateEuropeanMatch, type SimulateEuropeanMatchInput } from "../src/europe/europeanMatchEngine";
import {
  applyEuropeanMatchResult,
  createEuropeanTournamentForQualification,
  getEuropeanLeaguePhaseUserPosition,
  getNextEuropeanMatch,
  isEuropeanKnockoutMatch,
} from "../src/europe/europeanTournament";
import type { EuropeanCompetition, EuropeanQualificationResult, EuropeanTournamentMatch } from "../src/europe/europeanTypes";
import { calculateTeamRating } from "../src/simulation/teamRating";
import type { GameDifficulty, MatchApproach } from "../src/types/game";

import {
  advanceAfterEuropeanPlayoff,
  draftTeam,
  getEuropeanPlayoff,
  meanWithMargin,
  pickHalfTime,
  playCareer,
  pointsValue,
  seedCareer,
  share,
  type DraftStyle,
  type EuropeanPlayoffVariant,
  type Policy,
} from "./auditCareerRunner";
import { auditGameId } from "./auditSeeds";

const arg = (name: string, fallback: number) => Number(process.argv.find((value) => value.startsWith(`--${name}=`))?.split("=")[1] ?? fallback);
const TOURNAMENTS = arg("tournaments", 2000);
const CAREERS_PER_CELL = arg("careers", 600);
const ODDS_SAMPLES = 60;
const APPROACHES: MatchApproach[] = ["balanced", "attacking", "defensive"];

const VARIANTS: { label: string; value?: EuropeanPlayoffVariant }[] = [
  { label: "Hoy: pasan los 2 primeros" },
  { label: "Previa 3.º contra 4.º", value: "table" },
  { label: "Previa contra un club nuevo", value: "fresh" },
];

const COMPETITIONS: { label: string; value: EuropeanCompetition }[] = [
  { label: "Champions", value: "champions_league" },
  { label: "Europa League", value: "europa_league" },
  { label: "Conference", value: "conference_league" },
];
// Rating de simulación del usuario en Europa (ya comprimido, con el +1 del entrenador). Un once de 88 visible juega con unos 85.
const RATINGS = [84, 86, 88];
const POLICIES: Pick<Policy, "label" | "approach" | "halfTime">[] = [
  { label: "No decide", approach: "balanced", halfTime: "keep" },
  { label: "Decide bien", approach: "best", halfTime: "good" },
];

const pct = (count: number, total: number) => `${Math.round((count / Math.max(1, total)) * 100)} %`;

function playMatch(
  match: Pick<EuropeanTournamentMatch, "id" | "opponent" | "isHome" | "competition">,
  rating: number,
  policy: (typeof POLICIES)[number],
  gameId: string,
  isKnockout: boolean,
) {
  const shared = { userTeamRating: rating, opponentRating: match.opponent.rating, opponentStyle: match.opponent.style, isHome: match.isHome, competition: match.competition };
  const value = (approach: MatchApproach) => {
    const odds = estimateEuropeanMatchOdds({ ...shared, approach }, ODDS_SAMPLES);
    return isKnockout ? odds.win + odds.draw / 2 : pointsValue(odds);
  };
  const approach = policy.approach === "balanced" ? "balanced" : [...APPROACHES].sort((a, b) => value(b) - value(a))[0];
  const input: SimulateEuropeanMatchInput = { ...shared, approach, isKnockout, seed: `${gameId}_${match.id}` };
  const base = simulateEuropeanMatch(input);
  const firstHalf = base.goalEvents.filter((goal) => goal.minute <= 45);
  const margin = firstHalf.filter((goal) => goal.isUserGoal).length - firstHalf.filter((goal) => !goal.isUserGoal).length;
  const choice = pickHalfTime(policy.halfTime, margin, (base.expectedGoals?.user ?? 0) < (base.expectedGoals?.rival ?? 0));
  return choice === "keep" ? base : simulateEuropeanMatch({ ...input, halfTimeChoice: choice });
}

// 1. Torneos sueltos: cuánto cambia llegar a semifinales, a la final y ganar el título.
for (const { label: competitionLabel, value: competition } of COMPETITIONS) {
  console.log(`\n### ${competitionLabel}: ${TOURNAMENTS} torneos por fila\n`);
  console.log("| Tu rating europeo | Decisiones | Formato | 3.º o 4.º | Gana la previa | Semifinal | Final | Campeón | Rival medio de la previa |");
  console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");

  for (const rating of RATINGS) {
    for (const policy of POLICIES) {
      for (const variant of VARIANTS) {
        let thirdOrFourth = 0;
        let playoffWins = 0;
        let semifinals = 0;
        let finals = 0;
        let titles = 0;
        let playoffRivalSum = 0;
        let playoffs = 0;

        for (let index = 0; index < TOURNAMENTS; index += 1) {
          const gameId = auditGameId(index);
          let tournament = createEuropeanTournamentForQualification({
            seasonNumber: 1,
            qualification: { qualified: true, competition } as EuropeanQualificationResult,
            seed: `${gameId}_1`,
          });
          if (!tournament) throw new Error("No se creó el torneo.");

          for (let match = getNextEuropeanMatch(tournament); match; match = getNextEuropeanMatch(tournament)) {
            tournament = applyEuropeanMatchResult(tournament, match.id, playMatch(match, rating, policy, gameId, isEuropeanKnockoutMatch(match)));

            const playoff = variant.value && match.phase === "league_phase" ? getEuropeanPlayoff(tournament, variant.value) : null;
            if (playoff) {
              playoffs += 1;
              playoffRivalSum += playoff.opponent.rating;
              if (playMatch({ ...playoff, competition }, rating, policy, gameId, true).result === "win") {
                playoffWins += 1;
                tournament = advanceAfterEuropeanPlayoff(tournament, playoff);
              }
            }
          }

          const position = getEuropeanLeaguePhaseUserPosition(tournament);
          if (position === 3 || position === 4) thirdOrFourth += 1;
          if (tournament.matches.some((match) => match.phase === "semifinal")) semifinals += 1;
          if (tournament.matches.some((match) => match.phase === "final")) finals += 1;
          if (tournament.champion) titles += 1;
        }

        console.log(`| ${[
          rating,
          policy.label,
          variant.label,
          pct(thirdOrFourth, TOURNAMENTS),
          variant.value ? pct(playoffWins, TOURNAMENTS) : "—",
          pct(semifinals, TOURNAMENTS),
          pct(finals, TOURNAMENTS),
          pct(titles, TOURNAMENTS),
          playoffs ? (playoffRivalSum / playoffs).toFixed(1) : "—",
        ].join(" | ")} |`);
      }
    }
  }
}

// 2. Carreras completas, como audit:rating: la misma carrera en los tres formatos.
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

if (CAREERS_PER_CELL > 0) {
  for (const { label: difficultyLabel, value: difficulty } of DIFFICULTIES) {
    for (const { label: draftLabel, style } of DRAFTS) {
      console.log(`\n### Carreras · dificultad ${difficultyLabel} · draft «${draftLabel}» · ${CAREERS_PER_CELL} carreras\n`);
      console.log("| Formato | Temporadas superadas | Títulos por temporada | Títulos europeos por temporada | Puntuación | Rechazadas por plausibilidad |");
      console.log("| --- | --- | --- | --- | --- | --- |");

      for (const variant of VARIANTS) {
        const policy: Policy = { label: "Decide bien", approach: "best", halfTime: "good", europeanPlayoff: variant.value };
        const careers = Array.from({ length: CAREERS_PER_CELL }, (_, index) => {
          const seed = index + 1;
          seedCareer(seed + 7_000_000);
          const team = draftTeam(FORMATIONS[index % FORMATIONS.length], style);
          return playCareer({ policy, seed, difficulty, team: { ...team, teamRating: calculateTeamRating(team) } });
        });

        const seasons = careers.reduce((sum, career) => sum + career.completedSeasons + 1, 0);
        const europe = careers.reduce((sum, career) => sum + career.trophies.champions + career.trophies.europaLeague + career.trophies.conference, 0);
        const titles = careers.reduce((sum, career) => sum + career.trophies.liga + career.trophies.copa + career.trophies.supercopa, europe);
        const notPlausible = careers.filter((career) => !career.plausible).length;
        played += careers.length;
        rejected += notPlausible;

        console.log(`| ${[
          variant.label,
          meanWithMargin(careers.map((career) => career.completedSeasons)),
          (titles / Math.max(1, seasons)).toFixed(2),
          (europe / Math.max(1, seasons)).toFixed(3),
          meanWithMargin(careers.map((career) => career.score)),
          share(notPlausible, careers.length),
        ].join(" | ")} |`);
      }
    }
  }

  console.log(`\nCarreras simuladas: ${played}. Rechazadas por la regla de plausibilidad del ranking: ${rejected}.`);
}
