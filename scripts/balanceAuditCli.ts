import fs from "node:fs";
import path from "node:path";

import { ATHLETIC_SEASONS } from "../src/data/athletic";
import { EASY_MODE_SEASON_RANGES } from "../src/data/easyModeSeasonRanges";
import { FORMATIONS } from "../src/data/formations";
import {
  createFinalLeagueSummary,
  createUserLeagueSimulation,
  simulateFullCupAndLeague,
} from "../src/simulation/leagueSimulator";
import { USER_TEAM_NAME } from "../src/simulation/leagueTable";
import { calculateTeamRating, canPlayerFillSlot } from "../src/simulation/teamRating";
import type {
  EasyModeSeasonRangeId,
  Formation,
  GameDifficulty,
  LeagueTableRow,
  PlayerSeason,
  SelectedCoach,
  SelectedPlayer,
  TeamRating,
} from "../src/types/game";
// Sustituye Math.random y Date.now por versiones con semilla (como audit:cards o audit:oviedo):
// la forma de los rivales y el cuadro de Copa los decide el juego con ellos.
import { seedCareer } from "./auditCareerRunner";

type AuditProfile = "legendary" | "strong" | "balanced" | "weak" | "random";

interface CliOptions {
  simulations: number;
  seed: number;
  difficulty: "facil" | "normal" | "leyenda";
  range: EasyModeSeasonRangeId;
  formationId: string;
  profile: AuditProfile;
  out?: string;
  csv?: string;
  jsonOnly: boolean;
  cupReport: boolean;
}

interface BalanceAuditRun {
  index: number;
  leagueChampion: string;
  athleticPosition: number;
  athleticPoints: number;
  cupChampion: string;
  cupRound: string;
  relegatedTeams: string[];
  warning: string;
}

interface BalanceAuditAggregate {
  simulations: number;
  athleticAveragePosition: number;
  athleticAveragePoints: number;
  athleticTop4Count: number;
  athleticLeagueTitles: number;
  athleticCupTitles: number;
  villarrealRelegations: number;
  eliteCupTitles: number;
  leagueChampionCounts: Array<[string, number]>;
  cupChampionCounts: Array<[string, number]>;
  relegationCounts: Array<[string, number]>;
  cupRoundCounts: Array<[string, number]>;
}

const DEFAULT_OPTIONS: CliOptions = {
  simulations: 100,
  seed: 1,
  difficulty: "normal",
  range: "all",
  formationId: "4-3-3",
  profile: "balanced",
  jsonOnly: false,
  cupReport: false,
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { ...DEFAULT_OPTIONS };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    const [rawKey, rawValue] = arg.replace(/^--/, "").split("=");
    const value = rawValue ?? "";

    if (rawKey === "sims" || rawKey === "simulations") {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error("--sims debe ser un número positivo. Ejemplo: --sims=50");
      }
      options.simulations = Math.round(parsed);
      continue;
    }

    if (rawKey === "seed") {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error("--seed debe ser un entero positivo. Ejemplo: --seed=2");
      }
      options.seed = parsed;
      continue;
    }

    if (rawKey === "difficulty") {
      if (!["facil", "normal", "leyenda"].includes(value)) {
        throw new Error("--difficulty debe ser facil, normal o leyenda.");
      }
      options.difficulty = value as CliOptions["difficulty"];
      continue;
    }

    if (rawKey === "range") {
      const validRanges = EASY_MODE_SEASON_RANGES.map((range) => range.id);
      if (!validRanges.includes(value as EasyModeSeasonRangeId)) {
        throw new Error(`--range debe ser uno de: ${validRanges.join(", ")}.`);
      }
      options.range = value as EasyModeSeasonRangeId;
      continue;
    }

    if (rawKey === "formation") {
      options.formationId = value;
      continue;
    }

    if (rawKey === "profile") {
      if (!["legendary", "strong", "balanced", "weak", "random"].includes(value)) {
        throw new Error("--profile debe ser legendary, strong, balanced, weak o random.");
      }
      options.profile = value as AuditProfile;
      continue;
    }

    if (rawKey === "out") {
      options.out = value;
      continue;
    }

    if (rawKey === "csv") {
      options.csv = value;
      continue;
    }

    if (rawKey === "json") {
      options.jsonOnly = true;
      continue;
    }

    if (rawKey === "cup-report" || rawKey === "copa") {
      options.cupReport = true;
      continue;
    }
  }

  return options;
}

function printHelp() {
  console.log(`\nFutbol11 · Auditoría de balance por PowerShell\n\nUso:\n  npm run audit:balance\n  npm run audit:balance -- --sims=100 --profile=balanced --difficulty=normal --range=recent\n\nOpciones:\n  --sims=100             Número de temporadas completas a simular\n  --seed=1               Semilla: con la misma, sale siempre lo mismo\n  --difficulty=normal    facil | normal | leyenda\n  --range=all            all | classic | transition | modern | recent\n  --formation=4-3-3      Formación usada para construir el once automático\n  --profile=balanced     legendary | strong | balanced | weak | random\n  --out=reports/x.json   Guarda informe JSON\n  --csv=reports/x.csv    Guarda resultados por simulación en CSV\n  --json                 Imprime solo JSON por consola\n\nPerfiles:\n  legendary              Once histórico top, útil para probar techo de rendimiento\n  balanced               Once competitivo normal, mejor perfil por defecto para balance\n  random                 Once aleatorio viable, útil para detectar varianza real de partidas\n\nRuido:\n  Con 100 temporadas, las ligas del Athletic varían unas ±3 según la semilla.\n  Para medir si cambia el balance entre versiones, usa --sims=2000 (unos 10 s).\n  Ver docs/INFORME_BALANCE_DETERMINISTA_v0_25_121.md.\n`);
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isEliteName(teamName: string): boolean {
  const normalized = normalizeName(teamName);

  return (
    normalized.includes("real madrid") ||
    normalized.includes("barcelona") ||
    normalized.includes("atletico")
  );
}

function countByName(values: string[]): Array<[string, number]> {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
}

function normalizeCupRoundForAudit(value: string): string {
  if (value.includes("Campeón de Copa")) return "Campeón";
  if (value.includes("Final")) return "Finalista";
  if (value.includes("Semifinal")) return "Semifinal";
  if (value.includes("Cuartos")) return "Cuartos";
  if (value.includes("Octavos")) return "Octavos";
  if (value.includes("Dieciseisavos")) return "Dieciseisavos";
  return value || "Sin dato";
}

function getAthleticPosition(table: LeagueTableRow[]): number {
  return table.findIndex((row) => row.teamName === USER_TEAM_NAME) + 1;
}

function createBalanceWarning(params: {
  leagueChampion: string;
  cupChampion: string;
  athleticPosition: number;
  relegatedTeams: string[];
}): string {
  const warnings: string[] = [];
  const normalizedRelegated = params.relegatedTeams.map(normalizeName);

  if (normalizedRelegated.some((name) => name.includes("villarreal"))) {
    warnings.push("Villarreal desciende");
  }

  if (params.athleticPosition > 10) {
    warnings.push("Athletic bajo");
  }

  if (isEliteName(params.leagueChampion) && isEliteName(params.cupChampion)) {
    warnings.push("doblete/monopolio élite");
  }

  return warnings.length === 0 ? "OK" : warnings.join(" · ");
}

function createAggregate(rows: BalanceAuditRun[]): BalanceAuditAggregate {
  const simulations = rows.length || 1;
  const athleticAveragePosition =
    rows.reduce((sum, row) => sum + row.athleticPosition, 0) / simulations;
  const athleticAveragePoints =
    rows.reduce((sum, row) => sum + row.athleticPoints, 0) / simulations;

  return {
    simulations,
    athleticAveragePosition,
    athleticAveragePoints,
    athleticTop4Count: rows.filter((row) => row.athleticPosition <= 4).length,
    athleticLeagueTitles: rows.filter((row) => row.athleticPosition === 1).length,
    athleticCupTitles: rows.filter((row) => row.cupChampion === USER_TEAM_NAME).length,
    villarrealRelegations: rows.filter((row) =>
      row.relegatedTeams.some((team) => normalizeName(team).includes("villarreal"))
    ).length,
    eliteCupTitles: rows.filter((row) => isEliteName(row.cupChampion)).length,
    leagueChampionCounts: countByName(rows.map((row) => row.leagueChampion)),
    cupChampionCounts: countByName(rows.map((row) => row.cupChampion)),
    relegationCounts: countByName(rows.flatMap((row) => row.relegatedTeams)),
    cupRoundCounts: countByName(rows.map((row) => normalizeCupRoundForAudit(row.cupRound))),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toInternalDifficulty(difficulty: CliOptions["difficulty"]): GameDifficulty {
  if (difficulty === "facil") return "normal";
  if (difficulty === "normal") return "dificil";
  return "leyenda";
}

function applyDifficultyToTeamRating(
  teamRating: TeamRating,
  difficulty: CliOptions["difficulty"]
): TeamRating {
  const internalDifficulty = toInternalDifficulty(difficulty);
  const modifier = internalDifficulty === "normal" ? 2 : internalDifficulty === "leyenda" ? -4 : 0;
  const apply = (value: number) => clamp(Math.round(value + modifier), 40, 99);

  return {
    ...teamRating,
    attack: apply(teamRating.attack),
    defense: apply(teamRating.defense),
    control: apply(teamRating.control),
    physical: apply(teamRating.physical),
    mentality: apply(teamRating.mentality),
    goalkeeping: apply(teamRating.goalkeeping),
    overall: apply(teamRating.overall),
  };
}

function getRangeYears(rangeId: EasyModeSeasonRangeId): { from: number; to: number; label: string } {
  const range = EASY_MODE_SEASON_RANGES.find((item) => item.id === rangeId);

  if (!range) {
    return { from: 1928, to: 2025, label: "Todas las temporadas" };
  }

  return {
    from: range.from ?? 1928,
    to: range.to ?? 2025,
    label: range.label,
  };
}

function getSeasonStartYear(season: string): number {
  const start = Number(season.split("/")[0]);
  return Number.isFinite(start) ? start : 0;
}

function getPlayersForRange(rangeId: EasyModeSeasonRangeId): PlayerSeason[] {
  const { from, to } = getRangeYears(rangeId);

  return ATHLETIC_SEASONS
    .filter((season) => {
      const startYear = getSeasonStartYear(season.season);
      return startYear >= from && startYear <= to;
    })
    .flatMap((season) => season.players);
}

function getCoachForRange(rangeId: EasyModeSeasonRangeId): SelectedCoach | undefined {
  const { from, to } = getRangeYears(rangeId);
  const candidates = ATHLETIC_SEASONS
    .filter((season) => {
      const startYear = getSeasonStartYear(season.season);
      return startYear >= from && startYear <= to;
    })
    .map((season) => season.coach)
    .sort((a, b) => b.overall - a.overall || b.dataConfidence - a.dataConfidence);

  const coachSeason = candidates[0];
  return coachSeason ? { coachSeason } : undefined;
}

function findFormation(formationId: string): Formation {
  const formation = FORMATIONS.find((item) => item.id === formationId) ?? FORMATIONS[0];

  if (!formation) {
    throw new Error("No hay formaciones disponibles.");
  }

  return formation;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 20261503) * 10000;
  return x - Math.floor(x);
}

function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1000003;
  }

  return hash;
}

function getProfileCandidateScore(params: {
  player: PlayerSeason;
  slotLabel: string;
  profile: AuditProfile;
  seed: number;
}): number {
  const { player, slotLabel, profile, seed } = params;
  const tacticalBonus = player.tacticalSlotLabels?.some((label) => label === slotLabel) ? 140 : 0;

  if (profile === "legendary") {
    return tacticalBonus + player.overall * 10 + player.dataConfidence;
  }

  const getTargetProfileScore = (target: number, floor: number, ceiling: number) => {
    const distancePenalty = Math.abs(player.overall - target) * 18;
    const tooLowPenalty = player.overall < floor ? 180 + (floor - player.overall) * 22 : 0;
    const tooHighPenalty = player.overall > ceiling ? 180 + (player.overall - ceiling) * 34 : 0;
    const confidenceBonus = player.dataConfidence * 0.55;
    return tacticalBonus + 1200 - distancePenalty - tooLowPenalty - tooHighPenalty + confidenceBonus;
  };

  if (profile === "strong") {
    // Objetivo: 88-90 de rating de equipo. Muy buen once, pero no techo histórico.
    return getTargetProfileScore(84, 80, 86);
  }

  if (profile === "balanced") {
    // Objetivo: 84-86 de rating de equipo. Es el perfil útil para medir una partida normal buena.
    return getTargetProfileScore(80, 76, 83);
  }

  if (profile === "weak") {
    // Objetivo: 80-82 de rating de equipo. Simula un draft flojo o decisiones subóptimas.
    return getTargetProfileScore(76, 72, 80);
  }

  // Perfil random: viable, pero no optimizado. Se elige entre candidatos compatibles
  // con peso aleatorio y una penalización suave a extremos demasiado altos o bajos.
  const random = seededRandom(seed + hashString(`${player.id}_${slotLabel}`));
  const viableBandBonus = player.overall >= 76 && player.overall <= 84 ? 90 : 0;
  const elitePenalty = player.overall > 86 ? 130 + (player.overall - 86) * 25 : 0;
  const lowPenalty = player.overall < 72 ? 120 : 0;
  return tacticalBonus + player.overall * 2.2 + viableBandBonus + random * 260 - elitePenalty - lowPenalty;
}

function createAutomaticEleven(params: {
  formation: Formation;
  range: EasyModeSeasonRangeId;
  profile: AuditProfile;
  seed?: number;
}): SelectedPlayer[] {
  const { formation, range, profile, seed = 20261503 } = params;
  const players = getPlayersForRange(range);
  const selected: SelectedPlayer[] = [];
  const usedCanonicalIds = new Set<string>();

  const slotsByScarcity = [...formation.slots].sort((a, b) => {
    const aCount = players.filter((player) => canPlayerFillSlot(player, a)).length;
    const bCount = players.filter((player) => canPlayerFillSlot(player, b)).length;
    return aCount - bCount;
  });

  for (const slot of slotsByScarcity) {
    const candidates = players
      .filter((player) => !usedCanonicalIds.has(player.canonicalPlayerId))
      .filter((player) => canPlayerFillSlot(player, slot))
      .sort((a, b) => {
        const scoreB = getProfileCandidateScore({
          player: b,
          slotLabel: slot.label,
          profile,
          seed,
        });
        const scoreA = getProfileCandidateScore({
          player: a,
          slotLabel: slot.label,
          profile,
          seed,
        });
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (b.overall !== a.overall) return b.overall - a.overall;
        return b.dataConfidence - a.dataConfidence;
      });

    const candidate = candidates[0];

    if (!candidate) {
      throw new Error(`No se pudo construir once automático: falta jugador para ${slot.label}.`);
    }

    usedCanonicalIds.add(candidate.canonicalPlayerId);
    selected.push({
      slotId: slot.id,
      position: candidate.positions[0],
      playerSeason: candidate,
    });
  }

  return selected.sort((a, b) => {
    const aIndex = formation.slots.findIndex((slot) => slot.id === a.slotId);
    const bIndex = formation.slots.findIndex((slot) => slot.id === b.slotId);
    return aIndex - bIndex;
  });
}

function runBalanceAudit(params: {
  options: CliOptions;
  selectedPlayers: SelectedPlayer[];
  teamRating: TeamRating;
}): BalanceAuditRun[] {
  const { options, selectedPlayers, teamRating } = params;
  const baseSeed = Date.now() + Math.floor(Math.random() * 1000000);
  const rows: BalanceAuditRun[] = [];

  for (let index = 0; index < options.simulations; index += 1) {
    const context = createUserLeagueSimulation();
    const finalContext = simulateFullCupAndLeague({
      context,
      teamRating,
      selectedPlayers,
      seed: baseSeed + index * 1009,
    });

    const summary = createFinalLeagueSummary({
      gameId: `balance_cli_${baseSeed}_${index}`,
      formationName: options.formationId,
      coachName: "Once automático CLI",
      context: finalContext,
    });

    const table = summary.table ?? [];
    const leagueChampion = table[0]?.teamName ?? "Sin dato";
    const athleticPosition = getAthleticPosition(table) || summary.leaguePosition;
    const relegatedTeams = table.slice(-3).map((row) => row.teamName);
    const cupChampion = summary.cupChampionTeamName ??
      (summary.cupTrophyWon ? USER_TEAM_NAME : "Sin dato");

    rows.push({
      index: index + 1,
      leagueChampion,
      athleticPosition,
      athleticPoints: summary.points,
      cupChampion,
      cupRound: summary.cupRoundReached ?? "Sin dato",
      relegatedTeams,
      warning: createBalanceWarning({
        leagueChampion,
        cupChampion,
        athleticPosition,
        relegatedTeams,
      }),
    });
  }

  return rows;
}

function ensureParentDirectory(filePath: string) {
  const directory = path.dirname(filePath);
  if (directory && directory !== ".") {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function toCsv(rows: BalanceAuditRun[]): string {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const header = ["simulacion", "campeon_liga", "athletic_posicion", "athletic_puntos", "campeon_copa", "ronda_copa", "descensos", "alerta"];
  const lines = rows.map((row) => [
    row.index,
    row.leagueChampion,
    row.athleticPosition,
    row.athleticPoints,
    row.cupChampion,
    row.cupRound,
    row.relegatedTeams.join(" | "),
    row.warning,
  ].map(escape).join(","));

  return [header.join(","), ...lines].join("\n");
}

function printHumanReport(params: {
  options: CliOptions;
  formation: Formation;
  selectedPlayers: SelectedPlayer[];
  teamRating: TeamRating;
  aggregate: BalanceAuditAggregate;
  rows: BalanceAuditRun[];
}) {
  const { options, formation, selectedPlayers, teamRating, aggregate, rows } = params;
  const range = getRangeYears(options.range);

  console.log("\nFutbol11 · Auditoría de balance por PowerShell");
  console.log("================================================");
  console.log(`Simulaciones: ${options.simulations} · semilla ${options.seed}`);
  console.log(`Dificultad: ${options.difficulty}`);
  console.log(`Perfil auditoría: ${options.profile}`);
  console.log(`Rango: ${range.label} (${range.from}-${range.to})`);
  console.log(`Formación: ${formation.name}`);
  console.log(`Rating once automático: ${teamRating.overall} (${teamRating.profileLabel})`);
  console.log("\nOnce automático usado:");
  for (const selected of selectedPlayers) {
    console.log(`- ${selected.playerSeason.name} ${selected.playerSeason.season} · ${selected.playerSeason.overall} · ${selected.playerSeason.positions.join("/")}`);
  }

  console.log("\nResumen:");
  console.log(`- Media Athletic: ${aggregate.athleticAveragePosition.toFixed(1)}º · ${aggregate.athleticAveragePoints.toFixed(1)} pts`);
  console.log(`- Top 4 Athletic: ${aggregate.athleticTop4Count}/${aggregate.simulations}`);
  console.log(`- Ligas Athletic: ${aggregate.athleticLeagueTitles}/${aggregate.simulations}`);
  console.log(`- Copas Athletic: ${aggregate.athleticCupTitles}/${aggregate.simulations}`);
  console.log(`- Copas ganadas por élite: ${aggregate.eliteCupTitles}/${aggregate.simulations}`);
  console.log(`- Descensos Villarreal: ${aggregate.villarrealRelegations}/${aggregate.simulations}`);

  console.log("\nTop campeones de Liga:");
  for (const [team, count] of aggregate.leagueChampionCounts.slice(0, 8)) {
    console.log(`- ${team}: ${count}`);
  }

  console.log("\nTop campeones de Copa:");
  for (const [team, count] of aggregate.cupChampionCounts.slice(0, 8)) {
    console.log(`- ${team}: ${count}`);
  }

  if (options.cupReport) {
    console.log("\nRondas alcanzadas por Athletic en Copa:");
    for (const [round, count] of aggregate.cupRoundCounts) {
      console.log(`- ${round}: ${count}/${aggregate.simulations}`);
    }
  }

  console.log("\nTabla de descensos:");
  for (const [team, count] of aggregate.relegationCounts) {
    console.log(`- ${team}: ${count}/${aggregate.simulations}`);
  }

  const warnings = rows.filter((row) => row.warning !== "OK");
  console.log("\nAlertas:");
  if (warnings.length === 0) {
    console.log("- OK: sin alertas rápidas.");
  } else {
    for (const warning of warnings.slice(0, 15)) {
      console.log(`- Sim ${warning.index}: ${warning.warning}`);
    }
    if (warnings.length > 15) {
      console.log(`- ... ${warnings.length - 15} alertas más`);
    }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  seedCareer(options.seed);
  const formation = findFormation(options.formationId);
  const selectedPlayers = createAutomaticEleven({
    formation,
    range: options.range,
    profile: options.profile,
    seed: Date.now() + Math.floor(Math.random() * 1000000),
  });
  const selectedCoach = getCoachForRange(options.range);
  const baseTeamRating = calculateTeamRating({
    selectedPlayers,
    selectedCoach,
    formation,
  });
  const teamRating = applyDifficultyToTeamRating(baseTeamRating, options.difficulty);
  const rows = runBalanceAudit({ options, selectedPlayers, teamRating });
  const aggregate = createAggregate(rows);
  const report = {
    generatedAt: new Date().toISOString(),
    options,
    formation: formation.name,
    selectedCoach: selectedCoach?.coachSeason.name ?? null,
    teamRating,
    selectedPlayers: selectedPlayers.map((selected) => ({
      slotId: selected.slotId,
      name: selected.playerSeason.name,
      season: selected.playerSeason.season,
      overall: selected.playerSeason.overall,
      positions: selected.playerSeason.positions,
    })),
    aggregate,
    rows,
  };

  if (options.out) {
    ensureParentDirectory(options.out);
    fs.writeFileSync(options.out, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  if (options.csv) {
    ensureParentDirectory(options.csv);
    fs.writeFileSync(options.csv, `${toCsv(rows)}\n`, "utf8");
  }

  if (options.jsonOnly) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHumanReport({ options, formation, selectedPlayers, teamRating, aggregate, rows });

    if (options.out) console.log(`\nJSON guardado en: ${options.out}`);
    if (options.csv) console.log(`CSV guardado en: ${options.csv}`);
  }
}

try {
  main();
} catch (error) {
  console.error("\nError en auditoría de balance:");
  console.error(error instanceof Error ? error.message : error);
  console.error("\nUsa: npm run audit:balance -- --help");
  process.exit(1);
}
