// scripts/auditLineCap.vite.ts
//
// Configuración solo para npm run audit:linecap. Permite probar otros topes de línea
// sin cambiar el juego: el tope real sigue igual si la auditoría no pide otro.

import { defineConfig } from "vite";

const REAL_CAP = "return Math.min(value, getRatingCeilingBySquadAverage(squadAverage, key, overallHeadroom));";

export default defineConfig({
  plugins: [
    {
      name: "audit-line-cap",
      enforce: "pre",
      transform(code, id) {
        if (!id.replace(/\\/g, "/").endsWith("src/simulation/teamRating.ts")) return undefined;
        if (!code.includes(REAL_CAP)) throw new Error("capRatingBySquadAverage ha cambiado: revisa auditLineCap.vite.ts.");

        // Prueba para formaciones sin delanteros (4-6-0): los medios hacen de delanteros.
        const NO_ATTACKERS = /const attackers = (getPlayersByLine\(selectedPlayers, formation, "attack"\)\.map\(\s*\(selected\) => selected\.playerSeason\s*\));/;
        if (!NO_ATTACKERS.test(code)) throw new Error("calculateBaseRatings ha cambiado: revisa auditLineCap.vite.ts.");

        return code.replace(
          NO_ATTACKERS,
          `const lineAttackers = $1;
  const attackers = lineAttackers.length === 0 && (globalThis as { __auditMidfieldAttack?: boolean }).__auditMidfieldAttack ? midfielders : lineAttackers;`,
        ).replace(
          REAL_CAP,
          `const auditHeadroom = (globalThis as { __auditLineHeadroom?: number }).__auditLineHeadroom;
  if (auditHeadroom !== undefined && (key === "attack" || key === "defense" || key === "control")) {
    return Math.min(value, Math.min(99, Math.round(squadAverage + auditHeadroom)));
  }
  const auditSoftHeadroom = (globalThis as { __auditSoftHeadroom?: number }).__auditSoftHeadroom;
  if (auditSoftHeadroom !== undefined && (key === "physical" || key === "mentality" || key === "goalkeeping")) {
    return Math.min(value, Math.min(99, Math.round(squadAverage + auditSoftHeadroom)));
  }
  ${REAL_CAP}`,
        );
      },
    },
  ],
});
