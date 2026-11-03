// scripts/auditLeagueDecisions.vite.ts
//
// Configuración solo para npm run audit:league. Permite probar decisiones en Liga sin
// cambiar el juego: si la auditoría no define el gancho, la Liga se juega como siempre.
// Desde la fase 3 también permite multiplicar el efecto del planteamiento y del descanso
// (globalThis.__auditWeight), solo en los partidos de Liga en que se decide.

import { defineConfig } from "vite";

const USER_MATCH = /const userResult = simulateMatch\(\{\s*fixtureId: userFixture\.id,/;
const USER_RESULT = /\.\.\.userResult,\s*competition: "league",/;

const APPROACH_FUNCTION = "function getApproachGoalMultipliers(params: {";
const CLOSE_CANCEL = "random.next() >= HALF_TIME_CLOSE_CANCEL";
const PUSH_USER = "(userExpected / 2) * HALF_TIME_PUSH_USER_GOAL";
const PUSH_RIVAL = "(rivalExpected / 2) * HALF_TIME_PUSH_RIVAL_GOAL";

// Sin __auditWeight activo el peso es 1: el partido se juega como en el juego.
const WEIGHT_HELPERS = `
function getAuditWeight(kind: "approach" | "halfTime"): number {
  const weight = (globalThis as { __auditWeight?: any }).__auditWeight;
  return weight?.active ? weight[kind] ?? 1 : 1;
}

function getApproachGoalMultipliers(params: Parameters<typeof getApproachGoalMultipliersBase>[0]): { user: number; rival: number } {
  const base = getApproachGoalMultipliersBase(params);
  const weight = getAuditWeight("approach");
  return { user: 1 + (base.user - 1) * weight, rival: 1 + (base.rival - 1) * weight };
}
`;

function replaceOnce(code: string, search: string, replacement: string, file: string): string {
  if (code.split(search).length !== 2) throw new Error(`${file} ha cambiado («${search}»): revisa auditLeagueDecisions.vite.ts.`);
  return code.replace(search, replacement);
}

export default defineConfig({
  plugins: [
    {
      name: "audit-league-decisions",
      enforce: "pre",
      transform(code, id) {
        const path = id.replace(/\\/g, "/");

        if (path.endsWith("src/simulation/matchEngine.ts")) {
          let patched = replaceOnce(code, APPROACH_FUNCTION, "function getApproachGoalMultipliersBase(params: {", "matchEngine.ts");
          patched = replaceOnce(patched, CLOSE_CANCEL, `random.next() >= Math.min(1, HALF_TIME_CLOSE_CANCEL * getAuditWeight("halfTime"))`, "matchEngine.ts");
          patched = replaceOnce(patched, PUSH_USER, `${PUSH_USER} * getAuditWeight("halfTime")`, "matchEngine.ts");
          patched = replaceOnce(patched, PUSH_RIVAL, `${PUSH_RIVAL} * getAuditWeight("halfTime")`, "matchEngine.ts");
          return `${patched}\n${WEIGHT_HELPERS}`;
        }

        if (!path.endsWith("src/simulation/leagueSimulator.ts")) return undefined;
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
