// scripts/auditCardTypes.vite.ts
//
// Configuración solo para npm run audit:card-types. Desde la v0.25.108 el motor ya tiene los
// efectos de las cartas (goles, campo, prórroga y penaltis); la auditoría los pasa con
// globalThis.__auditCard, que aquí se lee cuando el partido no trae su propia carta. Si la
// auditoría no lo define, el partido se juega como siempre.

import { defineConfig } from "vite";

const AUDIT_CARD = "(globalThis as { __auditCard?: any }).__auditCard";

// [archivo, texto original, texto con el gancho, veces]
const PATCHES: [string, string, string, number][] = [
  ["src/simulation/matchEngine.ts", "export function simulateMatch(params: SimulateMatchParams): MatchResult {", `export function simulateMatch(params: SimulateMatchParams): MatchResult {\n  params = { ...params, card: params.card ?? ${AUDIT_CARD} };`, 1],
  ["src/simulation/leagueSimulator.ts", "card?.neutralVenue)", `(card ?? ${AUDIT_CARD})?.neutralVenue)`, 2],
  ["src/simulation/leagueSimulator.ts", "(card?.shootout ? CARD_SHOOTOUT_WIN_CHANCE", `((card ?? ${AUDIT_CARD})?.shootout ? CARD_SHOOTOUT_WIN_CHANCE`, 1],
  ["src/career/supercopaRules.ts", "inspiredGoalkeeper: card?.shootout", `inspiredGoalkeeper: (card ?? ${AUDIT_CARD})?.shootout`, 1],
  ["src/europe/europeanMatchEngine.ts", "inspiredGoalkeeper: card?.shootout", `inspiredGoalkeeper: (card ?? ${AUDIT_CARD})?.shootout`, 1],
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

        return patches.reduce((patched, [file, search, replacement, times]) => {
          const source = patched.replace(/\r\n/g, "\n");
          if (source.split(search).length !== times + 1) throw new Error(`${file} ha cambiado («${search}»): revisa auditCardTypes.vite.ts.`);
          return source.split(search).join(replacement);
        }, code);
      },
    },
  ],
});
