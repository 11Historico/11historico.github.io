// scripts/auditCardTypes.vite.ts
//
// Configuración solo para npm run audit:card-types. Desde la v0.25.108 el motor ya tiene los
// efectos de las cartas (goles, campo, prórroga y penaltis); la auditoría los pasa con
// globalThis.__auditCard, que aquí se lee cuando el partido no trae su propia carta. Si la
// auditoría no lo define, el partido se juega como siempre.

import { defineConfig } from "vite";

const AUDIT_CARD = "(globalThis as { __auditCard?: any }).__auditCard";

// Carta en el descanso (solo en auditorías, audit:game-cards): globalThis.__auditHalftime decide con
// el marcador de la primera parte, y la carta actúa sobre los goles de la segunda. Sin él, nada cambia.
const HALFTIME_CARD = `
function auditHalftimeCard(result: MatchResult, params: SimulateMatchParams, effect: { extraGoalChance?: number; cancelRivalChance?: number; shootout?: boolean }): MatchResult {
  if (effect.shootout) {
    const audit = globalThis as { __auditCard?: Record<string, unknown> };
    audit.__auditCard = { ...(audit.__auditCard ?? {}), shootout: true };
  }

  const random = createRandom(typeof params.seed === "number" ? params.seed + 5151 : undefined);
  const userIsHome = result.expectedGoals?.userIsHome !== false;
  const userTeamName = userIsHome ? result.homeTeamName : result.awayTeamName;
  let goalEvents = result.goalEvents.filter((goal) => goal.minute <= HALF_TIME_MINUTE || goal.teamName === userTeamName || random.next() >= (effect.cancelRivalChance ?? 0));
  if (random.next() < (effect.extraGoalChance ?? 0)) {
    const [goal] = generateUserGoalEvents({ goals: 1, teamName: userTeamName, selectedPlayers: params.selectedPlayers, random });
    goalEvents = [...goalEvents, { ...goal, minute: HALF_TIME_MINUTE + 1 + Math.floor(random.next() * HALF_TIME_MINUTE) }];
  }
  goalEvents.sort((a, b) => a.minute - b.minute);
  const userGoals = goalEvents.filter((goal) => goal.teamName === userTeamName).length;
  const rivalGoals = goalEvents.length - userGoals;

  return {
    ...result,
    homeGoals: userIsHome ? userGoals : rivalGoals,
    awayGoals: userIsHome ? rivalGoals : userGoals,
    goalEvents,
    userTeamWon: userGoals > rivalGoals,
    userTeamDrew: userGoals === rivalGoals,
    userTeamLost: userGoals < rivalGoals,
    cleanSheetForUserTeam: rivalGoals === 0,
    approachEffect: undefined,
  };
}
`;

// [archivo, texto original, texto con el gancho, veces]
const PATCHES: [string, string, string, number][] = [
  [
    "src/simulation/matchEngine.ts",
    "export function simulateMatch(params: SimulateMatchParams): MatchResult {",
    `export function simulateMatch(params: SimulateMatchParams): MatchResult {
  params = { ...params, card: params.card ?? ${AUDIT_CARD} };
  const result = simulateMatchWithCard(params);
  const decide = (globalThis as { __auditHalftime?: (margin: number) => { extraGoalChance?: number; cancelRivalChance?: number; shootout?: boolean } | undefined }).__auditHalftime;
  const effect = decide?.(getUserHalfTimeMargin(result));
  return effect ? auditHalftimeCard(result, params, effect) : result;
}
${HALFTIME_CARD}
function simulateMatchWithCard(params: SimulateMatchParams): MatchResult {`,
    1,
  ],
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
