// scripts/auditApproachLines.vite.ts
//
// Configuración solo para la auditoría de la idea I2 (el planteamiento lee las líneas del rival).
// Permite probar otra fórmula del planteamiento sin cambiar el juego: si no se define
// globalThis.__auditApproachLines ni AUDIT_APPROACH_LINES, el partido es el de siempre.
// Sirve también para compilar audit:europe y audit:rating con la variante:
//   AUDIT_APPROACH_LINES='{"gap":10,"effect":0.1}'

import { defineConfig } from "vite";

const APPROACH_FUNCTION = "function getApproachGoalMultipliers(params: {";
const APPROACH_CALL = "const approachMultipliers = getApproachGoalMultipliers({";

// Variante: tu ataque contra su defensa decide cuánto ganas al atacar (o pierdes al cerrarte), y
// su ataque contra tu defensa cuánto te cuesta abrirte (o ganas al cerrarte). Con líneas iguales
// a la media es la fórmula de hoy, que solo mira la diferencia de medias.
const VARIANT = `
type AuditApproachLines = { gap: number; effect: number };

function getAuditApproachLines(): AuditApproachLines | undefined {
  const fromGlobal = (globalThis as { __auditApproachLines?: AuditApproachLines | null }).__auditApproachLines;
  if (fromGlobal !== undefined) return fromGlobal ?? undefined;
  const fromEnv = typeof process !== "undefined" ? process.env.AUDIT_APPROACH_LINES : undefined;
  return fromEnv ? (JSON.parse(fromEnv) as AuditApproachLines) : undefined;
}

function getApproachGoalMultipliers(
  params: Parameters<typeof getApproachGoalMultipliersBase>[0] & { teamRating: TeamRating; rival: RivalTeam },
): { user: number; rival: number } {
  const lines = getAuditApproachLines();
  const { approach, coachSkills, teamRating, rival } = params;
  if (!lines || !approach || approach === "balanced") return getApproachGoalMultipliersBase(params);

  const attackEdge = clamp((teamRating.attack - rival.ratings.defense) / lines.gap, -1, 1) * lines.effect;
  const defenseEdge = clamp((teamRating.defense - rival.ratings.attack) / lines.gap, -1, 1) * lines.effect;
  const coachExtra = coachReinforcesApproach(approach, coachSkills) ? COACH_APPROACH_EXTRA : 0;

  return approach === "attacking"
    ? { user: 1 + APPROACH_GOALS_CHANGE + attackEdge + coachExtra, rival: 1 + APPROACH_GOALS_CHANGE - defenseEdge }
    : { user: 1 - APPROACH_GOALS_CHANGE - attackEdge, rival: 1 - APPROACH_GOALS_CHANGE + defenseEdge - coachExtra };
}
`;

function replaceOnce(code: string, search: string, replacement: string): string {
  if (code.split(search).length !== 2) throw new Error(`matchEngine.ts ha cambiado («${search}»): revisa auditApproachLines.vite.ts.`);
  return code.replace(search, replacement);
}

export default defineConfig({
  plugins: [
    {
      name: "audit-approach-lines",
      enforce: "pre",
      transform(code, id) {
        if (!id.replace(/\\/g, "/").endsWith("src/simulation/matchEngine.ts")) return undefined;

        let patched = replaceOnce(code, APPROACH_FUNCTION, "function getApproachGoalMultipliersBase(params: {");
        patched = replaceOnce(patched, APPROACH_CALL, `${APPROACH_CALL}\n    teamRating,\n    rival,`);
        return `${patched}\n${VARIANT}`;
      },
    },
  ],
});
