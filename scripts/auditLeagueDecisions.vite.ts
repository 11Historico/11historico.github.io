// scripts/auditLeagueDecisions.vite.ts
//
// Configuración solo para npm run audit:league. Permite probar decisiones en Liga sin
// cambiar el juego: si la auditoría no define el gancho, la Liga se juega como siempre.

import { defineConfig } from "vite";

const USER_MATCH = /const userResult = simulateMatch\(\{\s*fixtureId: userFixture\.id,/;
const USER_RESULT = /\.\.\.userResult,\s*competition: "league",/;

export default defineConfig({
  plugins: [
    {
      name: "audit-league-decisions",
      enforce: "pre",
      transform(code, id) {
        if (!id.replace(/\\/g, "/").endsWith("src/simulation/leagueSimulator.ts")) return undefined;
        if (!USER_MATCH.test(code) || !USER_RESULT.test(code)) throw new Error("simulateNextUserLeagueMatch ha cambiado: revisa auditLeagueDecisions.vite.ts.");

        return code
          .replace(
            USER_MATCH,
            `const auditLeague = (globalThis as { __auditLeague?: any }).__auditLeague;
  const userResult = simulateMatch({
    ...auditLeague?.matchOptions({ context, teamRating, selectedPlayers, rival: formAdjustedRival, venue, matchday: userFixture.matchday }),
    fixtureId: userFixture.id,`,
          )
          .replace(
            USER_RESULT,
            `...(auditLeague?.afterMatch({ result: userResult, selectedPlayers, matchday: userFixture.matchday }) ?? userResult),
    competition: "league",`,
          );
      },
    },
  ],
});
