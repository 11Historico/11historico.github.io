// scripts/auditCardTypes.vite.ts
//
// Configuración solo para npm run audit:card-types. Añade al motor los efectos de las cartas
// que no son un bonus de media (goles, campo, prórroga y penaltis), leídos de
// globalThis.__auditCard. Si la auditoría no lo define, el partido se juega como siempre.

import { defineConfig } from "vite";

const CARD = "(globalThis as { __auditCard?: any }).__auditCard";

// [archivo, texto original, texto con el gancho]
const PATCHES: [string, string, string][] = [
  // Ataque total y Defensa total: los goles esperados de cada equipo.
  ["src/simulation/matchEngine.ts", "const userMatchExpectedGoals = userExpectedGoals * approachMultipliers.user;", `const userMatchExpectedGoals = userExpectedGoals * approachMultipliers.user * (${CARD}?.userGoals ?? 1);`],
  ["src/simulation/matchEngine.ts", "const rivalMatchExpectedGoals = rivalExpectedGoals * approachMultipliers.rival;", `const rivalMatchExpectedGoals = rivalExpectedGoals * approachMultipliers.rival * (${CARD}?.rivalGoals ?? 1);`],
  // Fortín fuera: campo neutral. Sin la penalización del visitante ni la ventaja del local.
  ["src/simulation/matchEngine.ts", "const homeBonus = isHome ? 0.14 : -0.18;", `const homeBonus = ${CARD}?.neutralVenue ? -0.02 : isHome ? 0.14 : -0.18;`],
  ["src/simulation/matchEngine.ts", "if (!userIsHome) {\n    userAttackPenalty += 2.2;", `if (!userIsHome && !${CARD}?.neutralVenue) {\n    userAttackPenalty += 2.2;`],
  ["src/simulation/matchEngine.ts", "if (!userIsHome) drawChance += 0.07;", `if (!userIsHome && !${CARD}?.neutralVenue) drawChance += 0.07;`],
  ["src/simulation/matchEngine.ts", "if (!userIsHome) upsetChance += 0.04;", `if (!userIsHome && !${CARD}?.neutralVenue) upsetChance += 0.04;`],
  ["src/simulation/leagueSimulator.ts", "? clamp(homeUnderdogBoost - fatigue, 0, 4)", `? (${CARD}?.neutralVenue ? 0 : clamp(homeUnderdogBoost - fatigue, 0, 4))`],
  // Portero inspirado: la prórroga de Copa y Supercopa, y los penaltis europeos.
  ["src/simulation/leagueSimulator.ts", "seededRandom(tieBreakerSeed) < clamp(0.5 + userAdvantage - underdogTiePenalty, 0.32, 0.68)", `seededRandom(tieBreakerSeed) < (${CARD}?.shootout ? 0.8 : clamp(0.5 + userAdvantage - underdogTiePenalty, 0.32, 0.68))`],
  ["src/career/supercopaRules.ts", "const userChance = Math.max(0.35, Math.min(0.66, 0.5 + (teamRating.overall - rival.ratings.overall) / 60));", `const userChance = ${CARD}?.shootout ? 0.8 : Math.max(0.35, Math.min(0.66, 0.5 + (teamRating.overall - rival.ratings.overall) / 60));`],
  ["src/europe/europeanMatchEngine.ts", "const userProbability = Math.max(", `const userProbability = ${CARD}?.shootout ? 0.85 : Math.max(`],
  ["src/europe/europeanMatchEngine.ts", "const opponentProbability = Math.max(", `const opponentProbability = ${CARD}?.shootout ? 0.65 : Math.max(`],
];

export default defineConfig({
  plugins: [
    {
      name: "audit-card-types",
      enforce: "pre",
      transform(code, id) {
        const path = id.replace(/\\/g, "/");
        const patches = PATCHES.filter(([file]) => path.endsWith(file));
        if (patches.length === 0) return undefined;

        return patches.reduce((patched, [file, search, replacement]) => {
          const source = patched.replace(/\r\n/g, "\n");
          if (source.split(search).length !== 2) throw new Error(`${file} ha cambiado («${search}»): revisa auditCardTypes.vite.ts.`);
          return source.replace(search, replacement);
        }, code);
      },
    },
  ],
});
