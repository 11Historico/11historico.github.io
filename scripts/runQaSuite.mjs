// scripts/runQaSuite.mjs
// Ejecuta en una sola compilación los QA que corre el workflow de despliegue (v0.25.24).
// Antes, cada `npm run qa:*` compilaba su script con `vite build --ssr` por separado.
// Cada QA sigue siendo el mismo fichero: solo cambia cuándo se compila.

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";

const QA_SCRIPTS = [
  "qaTechHealthBaseline",
  "qaMobileViewportFix",
  "qaHooksSimulationDeps",
  "qaLuckWheelRealRewards",
  "qaEuropeanQualification",
  "qaEuropeanQualificationUi",
  "qaEuropeanPersistence",
  "qaEuropeanTournamentSkeleton",
  "qaEuropeanMatchEngine",
  "qaEuropeanCalendarIntegration",
  "qaEuropeanMatchdayUi",
  "qaEuropeanProgressUi",
  "qaEuropeanKnockouts",
  "qaEuropeanKnockoutExtraTime",
  "qaMatchSequence",
  "qaEuropeanMatchSequence",
  "qaMatchPlaybackSpeed",
  "qaBundleChunking",
  "qaP1LowCost",
  "qaEuropeanTrophiesPalmares",
  "qaEuropeanRewardsPrestige",
  "qaEuropeanBalance",
  "qaGlobalRankingEuropaFields",
  "qaGlobalRankingBackendMigration",
  "qaEuropeanMobilePolish",
  "qaEuropeanVisualPolish",
  "qaPublicReleaseUx",
  "qaShareRetentionSystem",
  "qaSavedGameResume",
];

const OUT_DIR = ".audit-dist";

await build({
  logLevel: "warn",
  build: {
    ssr: true,
    outDir: OUT_DIR,
    emptyOutDir: false,
    rollupOptions: {
      input: Object.fromEntries(QA_SCRIPTS.map((name) => [name, `scripts/${name}.ts`])),
      output: { entryFileNames: "[name].js", format: "es" },
    },
  },
});

for (const name of QA_SCRIPTS) {
  console.log(`\n== ${name}`);
  await import(pathToFileURL(resolve(OUT_DIR, `${name}.js`)).href);
}

console.log(`\nQA CI OK: ${QA_SCRIPTS.length} scripts en una sola compilación.`);
