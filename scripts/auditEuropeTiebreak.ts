// scripts/auditEuropeTiebreak.ts
//
// Mide el desempate de la fase de liga europea («mide el desempate», 2026-11-14). Hasta la
// v0.25.119, con empate a puntos, diferencia de goles y goles a favor, decidía el nombre, y el
// usuario se llama "user", así que perdía casi todos esos empates. Juega los mismos torneos que
// el juego y ordena la tabla final con cuatro reglas:
//   - Nombre (la de hasta la v0.25.119).
//   - Directo: enfrentamiento directo entre los empatados (puntos, diferencia y goles en esos
//     partidos) y, si sigue el empate, sorteo con semilla del torneo. Es la del juego desde la
//     v0.25.120: el script comprueba que da el mismo puesto.
//   - Sorteo: solo el sorteo con semilla, como referencia neutral.
//   - Directo primero: con empate a puntos, primero el enfrentamiento directo y luego la
//     diferencia y los goles de toda la fase; al final, sorteo. Así lo hacía la UEFA en la
//     antigua fase de grupos.
// No cambia el juego. Reproducible: npm run audit:europe-tiebreak (--tournaments=N).

import { simulateEuropeanMatch } from "../src/europe/europeanMatchEngine";
import {
  buildEuropeanLeaguePhaseTable,
  getEuropeanLeagueTieSeed,
  getEuropeanRivalPairs,
  type EuropeanLeagueTableRow,
} from "../src/europe/europeanLeagueTable";
import {
  applyEuropeanMatchResult,
  createEuropeanTournamentForQualification,
  getEuropeanLeaguePhaseUserPosition,
} from "../src/europe/europeanTournament";
import type { EuropeanCompetition, EuropeanQualificationResult, EuropeanTournamentState } from "../src/europe/europeanTypes";

import { auditGameId } from "./auditSeeds";

const TOURNAMENTS = Number(process.argv.find((arg) => arg.startsWith("--tournaments="))?.split("=")[1] ?? 5000);
const USER = "user";

const COMPETITIONS: { label: string; value: EuropeanCompetition }[] = [
  { label: "Conference", value: "conference_league" },
  { label: "Europa League", value: "europa_league" },
  { label: "Champions", value: "champions_league" },
];
// Rating de simulación del usuario (ya comprimido), como en la auditoría de recorridos.
const RATINGS = [82, 85, 88];

type Rule = "name" | "direct" | "draw" | "directFirst";
const RULES: Rule[] = ["name", "direct", "draw", "directFirst"];
type Result = { home: string; away: string; homeGoals: number; awayGoals: number };

/** FNV-1a: orden de sorteo fijo por torneo y equipo. */
function drawKey(seed: string, teamId: string): number {
  let hash = 2_166_136_261;
  for (const char of `${seed}_${teamId}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16_777_619);
  return hash >>> 0;
}

/** Todos los partidos de la fase de liga: los del usuario y los de los rivales, con la semilla de la tabla. */
function getResults(tournament: EuropeanTournamentState): Result[] {
  const league = tournament.matches.filter((match) => match.phase === "league_phase");
  const results: Result[] = league.map((match) => ({ home: USER, away: match.opponent.id, homeGoals: match.userGoals ?? 0, awayGoals: match.opponentGoals ?? 0 }));
  for (const { home, away } of getEuropeanRivalPairs(league.map((match) => match.opponent))) {
    const outcome = simulateEuropeanMatch({
      userTeamRating: home.rating,
      opponentRating: away.rating,
      isHome: true,
      competition: tournament.competition,
      seed: `${tournament.seasonNumber}_${tournament.competition}_${home.id}_${away.id}`,
    });
    results.push({ home: home.id, away: away.id, homeGoals: outcome.userGoals, awayGoals: outcome.opponentGoals });
  }
  return results;
}

/** Puntos, diferencia y goles de cada equipo del grupo contando solo los partidos entre ellos. */
function getMiniTable(group: string[], results: Result[]): Map<string, [number, number, number]> {
  const mini = new Map(group.map((id) => [id, [0, 0, 0] as [number, number, number]]));
  for (const { home, away, homeGoals, awayGoals } of results) {
    if (!mini.has(home) || !mini.has(away)) continue;
    for (const [id, gf, ga] of [[home, homeGoals, awayGoals], [away, awayGoals, homeGoals]] as const) {
      const row = mini.get(id)!;
      row[0] += gf > ga ? 3 : gf === ga ? 1 : 0;
      row[1] += gf - ga;
      row[2] += gf;
    }
  }
  return mini;
}

const totalKey = (row: EuropeanLeagueTableRow) => `${row.points}_${row.goalDifference}_${row.goalsFor}`;
const pointsKey = (row: EuropeanLeagueTableRow) => String(row.points);

/** La tabla final ordenada con la regla dada. `rows` viene de buildEuropeanLeaguePhaseTable, con el usuario llamado "user". */
function sortWith(rule: Rule, rows: EuropeanLeagueTableRow[], results: Result[], seed: string): string[] {
  if (rule === "name") {
    return [...rows]
      .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.teamName.localeCompare(b.teamName, "es"))
      .map((row) => row.teamId);
  }
  const order: string[] = [];
  const key = rule === "directFirst" ? pointsKey : totalKey;
  const byId = new Map(rows.map((row) => [row.teamId, row]));
  for (let start = 0; start < rows.length; ) {
    let end = start + 1;
    while (end < rows.length && key(rows[end]) === key(rows[start])) end += 1;
    const group = rows.slice(start, end).map((row) => row.teamId);
    const mini = getMiniTable(group, results);
    group.sort((a, b) => {
      if (rule !== "draw") {
        const [pa, da, ga] = mini.get(a)!;
        const [pb, db, gb] = mini.get(b)!;
        if (pb !== pa) return pb - pa;
        if (db !== da) return db - da;
        if (gb !== ga) return gb - ga;
      }
      if (rule === "directFirst") {
        const [ra, rb] = [byId.get(a)!, byId.get(b)!];
        if (rb.goalDifference !== ra.goalDifference) return rb.goalDifference - ra.goalDifference;
        if (rb.goalsFor !== ra.goalsFor) return rb.goalsFor - ra.goalsFor;
      }
      return drawKey(seed, a) - drawKey(seed, b);
    });
    order.push(...group);
    start = end;
  }
  return order;
}

const zone = (position: number) => (position <= 2 ? 0 : position <= 4 ? 1 : 2);
const pct = (value: number, total: number) => (total ? `${((value / total) * 100).toFixed(1)} %` : "-");
const pct0 = (value: number, total: number) => (total ? `${Math.round((value / total) * 100)} %` : "-");

console.log(`Torneos por casilla: ${TOURNAMENTS}. Decisiones: equilibrado, sin cambios en el descanso.\n`);
console.log("| Competición | Rating | Empate total contigo | A 3 o más | Los ganas: nombre / directo / sorteo | Directo lo resuelve | Cambia tu puesto | Cambia tu zona: mejor / peor | Rival de la previa distinto | Semifinales: nombre → directo |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

const firstRows: string[] = [];
for (const { label, value: competition } of COMPETITIONS) {
  for (const rating of RATINGS) {
    let ties = 0;
    let bigTies = 0;
    let resolvedByDirect = 0;
    let positionChanged = 0;
    let zoneBetter = 0;
    let zoneWorse = 0;
    let playoffRivalChanged = 0;
    let firstPositionChanged = 0;
    let firstZoneBetter = 0;
    let firstZoneWorse = 0;
    const tiesWon: Record<Rule, number> = { name: 0, direct: 0, draw: 0, directFirst: 0 };
    const semifinal: Record<Rule, number> = { name: 0, direct: 0, draw: 0, directFirst: 0 };

    for (let index = 0; index < TOURNAMENTS; index += 1) {
      let tournament = createEuropeanTournamentForQualification({
        seasonNumber: index + 1,
        qualification: { qualified: true, competition } as Pick<EuropeanQualificationResult, "qualified" | "competition"> as EuropeanQualificationResult,
        seed: `${auditGameId(index)}_${index + 1}`,
      });
      if (!tournament) throw new Error("No se creó el torneo.");
      for (const match of tournament.matches) {
        const outcome = simulateEuropeanMatch({
          userTeamRating: rating,
          opponentRating: match.opponent.rating,
          opponentStyle: match.opponent.style,
          isHome: match.isHome,
          competition,
          seed: `${auditGameId(index)}_${match.id}`,
        });
        tournament = applyEuropeanMatchResult(tournament, match.id, outcome);
      }

      const rows = buildEuropeanLeaguePhaseTable(tournament, USER);
      const results = getResults(tournament);
      if (rows.findIndex((row) => row.isUser) + 1 !== getEuropeanLeaguePhaseUserPosition(tournament)) throw new Error("La tabla no coincide con la regla.");
      for (const row of rows) {
        const own = results.filter((r) => r.home === row.teamId || r.away === row.teamId);
        const points = own.reduce((sum, r) => {
          const [gf, ga] = r.home === row.teamId ? [r.homeGoals, r.awayGoals] : [r.awayGoals, r.homeGoals];
          return sum + (gf > ga ? 3 : gf === ga ? 1 : 0);
        }, 0);
        if (points !== row.points || own.length !== 6) throw new Error("Los resultados recalculados no cuadran con la tabla.");
      }

      const user = rows.find((row) => row.isUser)!;
      const tied = rows.filter((row) => totalKey(row) === totalKey(user));
      const orders = Object.fromEntries(RULES.map((rule) => [rule, sortWith(rule, rows, results, getEuropeanLeagueTieSeed(tournament!))])) as Record<Rule, string[]>;
      const position = (rule: Rule) => orders[rule].indexOf(USER) + 1;
      // La regla «directo» de este script tiene que ser la del juego (v0.25.120).
      if (position("direct") !== getEuropeanLeaguePhaseUserPosition(tournament)) throw new Error("La regla «directo» no coincide con el juego.");

      if (tied.length > 1) {
        ties += 1;
        if (tied.length > 2) bigTies += 1;
        const ids = tied.map((row) => row.teamId);
        for (const rule of RULES) {
          // «Los ganas»: quedas el primero de tu grupo de empatados.
          if (orders[rule].filter((id) => ids.includes(id))[0] === USER) tiesWon[rule] += 1;
        }
        const mini = getMiniTable(ids, results);
        const userMini = mini.get(USER)!.join("_");
        if ([...mini.entries()].every(([id, value]) => id === USER || value.join("_") !== userMini)) resolvedByDirect += 1;
      }

      const before = position("name");
      const after = position("direct");
      if (before !== after) positionChanged += 1;
      if (zone(after) < zone(before)) zoneBetter += 1;
      if (zone(after) > zone(before)) zoneWorse += 1;
      const first = position("directFirst");
      if (first !== before) firstPositionChanged += 1;
      if (zone(first) < zone(before)) firstZoneBetter += 1;
      if (zone(first) > zone(before)) firstZoneWorse += 1;

      for (const rule of RULES) {
        const pos = position(rule);
        if (pos <= 2) {
          semifinal[rule] += 1;
          continue;
        }
        if (pos > 4) continue;
        const rivalId = orders[rule][pos === 3 ? 3 : 2];
        if (rule === "direct" && before >= 3 && before <= 4 && rivalId !== orders.name[before === 3 ? 3 : 2]) playoffRivalChanged += 1;
        const rival = tournament.matches.find((match) => match.opponent.id === rivalId)!.opponent;
        const playoff = simulateEuropeanMatch({
          userTeamRating: rating,
          opponentRating: rival.rating,
          opponentStyle: rival.style,
          isHome: pos === 3,
          competition,
          isKnockout: true,
          seed: `${auditGameId(index)}_playoff`,
        });
        if (playoff.result === "win") semifinal[rule] += 1;
      }
    }

    console.log(`| ${[
      label,
      rating,
      pct(ties, TOURNAMENTS),
      pct0(bigTies, ties),
      (["name", "direct", "draw"] as Rule[]).map((rule) => pct0(tiesWon[rule], ties)).join(" / "),
      pct0(resolvedByDirect, ties),
      pct(positionChanged, TOURNAMENTS),
      `${pct(zoneBetter, TOURNAMENTS)} / ${pct(zoneWorse, TOURNAMENTS)}`,
      pct(playoffRivalChanged, TOURNAMENTS),
      `${pct(semifinal.name, TOURNAMENTS)} → ${pct(semifinal.direct, TOURNAMENTS)}`,
    ].join(" | ")} |`);
    firstRows.push(`| ${[
      label,
      rating,
      pct(firstPositionChanged, TOURNAMENTS),
      `${pct(firstZoneBetter, TOURNAMENTS)} / ${pct(firstZoneWorse, TOURNAMENTS)}`,
      `${pct(semifinal.name, TOURNAMENTS)} → ${pct(semifinal.directFirst, TOURNAMENTS)}`,
    ].join(" | ")} |`);
  }
}

console.log("");
console.log("Directo primero (con empate a puntos, antes que la diferencia de goles):");
console.log("");
console.log("| Competición | Rating | Cambia tu puesto | Cambia tu zona: mejor / peor | Semifinales: nombre → directo primero |");
console.log("| --- | --- | --- | --- | --- |");
for (const row of firstRows) console.log(row);
