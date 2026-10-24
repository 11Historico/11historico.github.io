import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  buildCareerShareText,
  formatCareerTrophyCounts,
  getCareerAchievements,
  getBestEuropeanAchievement,
  getCareerRankingPosition,
  isNewCareerPersonalRecord,
} from "../src/career/shareRetention";
import type { CareerLocalRankingEntry, CareerTrophyCounts } from "../src/types/career";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`QA Share Retention failed: ${message}`);
  }
}

function assertIncludes(source: string, expected: string, context: string): void {
  assert(source.includes(expected), `${context} missing ${JSON.stringify(expected)}`);
}

const emptyTrophies: CareerTrophyCounts = {
  champions: 0,
  liga: 0,
  europaLeague: 0,
  copa: 0,
  conference: 0,
  supercopa: 0,
};

function buildEntry(overrides: Partial<CareerLocalRankingEntry> = {}): CareerLocalRankingEntry {
  return {
    id: overrides.id ?? "career_test",
    completedSeasons: overrides.completedSeasons ?? 3,
    arcadeScore: overrides.arcadeScore ?? 42,
    palmaresScore: overrides.palmaresScore ?? 12,
    survivalScore: overrides.survivalScore ?? 30,
    trophyCounts: overrides.trophyCounts ?? { ...emptyTrophies, copa: 1 },
    bestLeaguePosition: overrides.bestLeaguePosition ?? 4,
    lastSeasonLabel: overrides.lastSeasonLabel ?? "2028/29",
    lastLeaguePosition: overrides.lastLeaguePosition ?? 8,
    gameVersion: overrides.gameVersion ?? "v0.test",
    createdAt: overrides.createdAt ?? "2026-09-23T00:00:00.000Z",
  };
}

function testShareTextIncludesCareerCore(): void {
  const text = buildCareerShareText(buildEntry({
    completedSeasons: 5,
    arcadeScore: 88,
    trophyCounts: { ...emptyTrophies, liga: 1, copa: 1, europaLeague: 1 },
    bestLeaguePosition: 2,
  }));

  assertIncludes(text, "Temporadas superadas: 5", "share text seasons");
  assertIncludes(text, "Puntos: 88", "share text score");
  assertIncludes(text, "Palmarés: 1 Liga · 1 Copa · 1 Europa League", "share text palmares");
  assertIncludes(text, "Mejor Liga: 2.º", "share text best league");
  assertIncludes(text, "Mejor hito europeo: Campeón de Europa League", "share text europe");
  assertIncludes(text, "¿Lo superas?", "share text challenge");
}

function testShareTextDoesNotInventEurope(): void {
  const text = buildCareerShareText(buildEntry({
    trophyCounts: { ...emptyTrophies, copa: 1 },
  }));

  assert(!text.includes("Mejor hito europeo"), "share text should not invent European achievement");
  assert(getBestEuropeanAchievement({ ...emptyTrophies }) === undefined, "empty trophies should not produce European achievement");
}

function testTrophyFormatting(): void {
  assert(formatCareerTrophyCounts({ ...emptyTrophies }) === "Sin títulos todavía", "empty trophies label mismatch");
  assert(
    formatCareerTrophyCounts({ ...emptyTrophies, champions: 1, conference: 2, supercopa: 1 }) ===
      "1 Supercopa · 1 Champions · 2 Conference",
    "trophy formatting order mismatch",
  );
}

function testAchievementsAreUniqueAndScoped(): void {
  const achievements = getCareerAchievements({
    completedSeasons: 6,
    trophyCounts: { ...emptyTrophies, champions: 1, europaLeague: 1 },
    qualifiedForEurope: true,
    rankingPosition: 4,
  });

  const ids = achievements.map((achievement) => achievement.id);
  assert(new Set(ids).size === ids.length, "achievements should not duplicate ids");
  assert(ids.includes("first_european_qualification"), "missing qualification achievement");
  assert(ids.includes("first_european_final"), "missing final achievement for champion");
  assert(ids.includes("first_european_title"), "missing first European title achievement");
  assert(ids.includes("champions_winner"), "missing Champions achievement");
  assert(ids.includes("five_seasons_survivor"), "missing five seasons achievement");
  assert(ids.includes("local_top_10"), "missing Top 10 achievement");
}

function testEuropeanMilestones(): void {
  const priorQualification = getCareerAchievements({ completedSeasons: 2, trophyCounts: emptyTrophies, qualifiedForEurope: true, reachedEuropeanFinal: false });
  assert(priorQualification.some((item) => item.id === "first_european_qualification"), "historical qualification should be recognized");
  const finalOnly = getCareerAchievements({ completedSeasons: 2, trophyCounts: emptyTrophies, qualifiedForEurope: false, reachedEuropeanFinal: true });
  assert(finalOnly.some((item) => item.id === "first_european_final"), "played final should be recognized");
  assert(!finalOnly.some((item) => item.id === "first_european_title"), "final without title should not produce title");
}

function testPersonalRecordUsesSortedRanking(): void {
  const entry = buildEntry({ id: "new", arcadeScore: 100, completedSeasons: 6 });
  const older = buildEntry({ id: "old", arcadeScore: 80, completedSeasons: 5 });
  const entries = [older, entry];

  assert(getCareerRankingPosition(entry, entries) === 1, "new entry should be #1");
  assert(isNewCareerPersonalRecord(entry, entries), "new entry should be personal record");
  assert(!isNewCareerPersonalRecord(older, entries), "older lower entry should not be personal record");
  assert(!isNewCareerPersonalRecord(buildEntry({ id: "tied", arcadeScore: 100, completedSeasons: 7 }), [entry, buildEntry({ id: "tied", arcadeScore: 100, completedSeasons: 7 })]), "tie must not count as new score record");
  assert(!isNewCareerPersonalRecord(entry, [older]), "unsaved entry must not count as record");
  assert(isNewCareerPersonalRecord(entry, [entry]), "first saved entry is a record");
}

function testUiIntegrationExists(): void {
  const outcome = read("src/components/CareerSeasonOutcome.tsx");
  const css = read("src/components/CareerSeasonOutcome.css");

  assertIncludes(outcome, "Compartir mi carrera", "career outcome share CTA");
  assertIncludes(outcome, "CareerShareRetentionPanel", "career outcome panel");
  assertIncludes(outcome, "buildCareerShareText", "share helper integration");
  assertIncludes(outcome, "Nuevo récord personal", "record copy");
  assertIncludes(outcome, "europeanCareerState?.totalQualifications", "historical Europe integration");
  assertIncludes(outcome, "role=\"status\"", "share feedback");
  assertIncludes(outcome, "readOnly value={shareText}", "manual copy fallback");
  assertIncludes(outcome, "rankingSaved={rankingPosition !== undefined}", "ranking persistence warning");
  assertIncludes(outcome, "Esta carrera no figura en el ranking local", "ranking persistence warning text");
  assertIncludes(css, ".career-share-retention-card", "share retention styles");
  assertIncludes(css, ".career-achievements-list", "achievement styles");
}

function testScriptsWorkflowAndDocs(): void {
  const packageJson = read("package.json");

  assertIncludes(packageJson, "qa:share-retention", "package scripts");
  assertIncludes(packageJson, "npm run qa:share-retention", "qa:tech-debt chain");
  assertIncludes(read("scripts/runQaSuite.mjs"), "qaShareRetentionSystem", "runQaSuite debe ejecutar qaShareRetentionSystem.");
  assertIncludes(read("scripts/runQaSuite.mjs"), "qaShareRetentionSystem", "runQaSuite debe ejecutar qaShareRetentionSystem.");
  assert(existsSync(join(root, "docs/v0_24_9_SHARE_RETENTION_SYSTEM.md")), "phase doc missing");
}

function testOutOfScopeGuards(): void {
  assert(!existsSync(join(root, "dist/index.html")) || !read("package.json").includes("dist/index.html"), "QA should not require dist");
  assert(!read("src/career/shareRetention.ts").includes("apps-script"), "share retention must not touch Apps Script");
}

function run(): void {
  testShareTextIncludesCareerCore();
  testShareTextDoesNotInventEurope();
  testTrophyFormatting();
  testAchievementsAreUniqueAndScoped();
  testEuropeanMilestones();
  testPersonalRecordUsesSortedRanking();
  testUiIntegrationExists();
  testScriptsWorkflowAndDocs();
  testOutOfScopeGuards();

  console.log("QA Share Retention System OK");
}

run();
