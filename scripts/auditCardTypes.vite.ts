// scripts/auditCardTypes.vite.ts
//
// Configuración solo para npm run audit:card-types. Desde la v0.25.108 el motor ya tiene los
// efectos de las cartas (goles, campo, prórroga y penaltis); la auditoría los pasa con
// globalThis.__auditCard, que aquí se lee cuando el partido no trae su propia carta. Si la
// auditoría no lo define, el partido se juega como siempre.

import { defineConfig } from "vite";

const AUDIT_CARD = "(globalThis as { __auditCard?: any }).__auditCard";

// Remontada con gol (propuesta A, solo en auditorías): si vas perdiendo al descanso, marcas un gol
// en la segunda parte. Con `comebackGoal` en la carta; sin él, el partido es el de siempre.
const COMEBACK_GOAL = `
function auditComebackGoal(result: MatchResult, params: SimulateMatchParams): MatchResult {
  if (getUserHalfTimeMargin(result) >= 0) return result;

  // comebackGoal: true (siempre marcas) o la probabilidad de marcar.
  const random = createRandom(typeof params.seed === "number" ? params.seed + 4243 : undefined);
  const chance = (params.card as { comebackGoal?: boolean | number }).comebackGoal === true ? 1 : Number((params.card as { comebackGoal?: number }).comebackGoal);
  if (random.next() >= chance) return { ...result, comebackActivated: true };
  const userIsHome = result.expectedGoals?.userIsHome !== false;
  const userTeamName = userIsHome ? result.homeTeamName : result.awayTeamName;
  const [goal] = generateUserGoalEvents({ goals: 1, teamName: userTeamName, selectedPlayers: params.selectedPlayers, random });
  const goalEvents = [...result.goalEvents, { ...goal, minute: HALF_TIME_MINUTE + 1 + Math.floor(random.next() * HALF_TIME_MINUTE) }].sort((a, b) => a.minute - b.minute);
  const userGoals = goalEvents.filter((event) => event.teamName === userTeamName).length;
  const rivalGoals = goalEvents.length - userGoals;

  return {
    ...result,
    homeGoals: userIsHome ? userGoals : rivalGoals,
    awayGoals: userIsHome ? rivalGoals : userGoals,
    goalEvents,
    userTeamWon: userGoals > rivalGoals,
    userTeamDrew: userGoals === rivalGoals,
    userTeamLost: userGoals < rivalGoals,
    keyFactor: getMatchKeyFactor({ userGoals, rivalGoals, userIsHome, userAverage: 0, rivalAverage: 0, userIsHugeFavorite: false, rivalClosedGap: false, upset: false }),
    approachEffect: undefined,
    comebackActivated: true,
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
  return (params.card as { comebackGoal?: boolean } | undefined)?.comebackGoal ? auditComebackGoal(result, params) : result;
}
${COMEBACK_GOAL}
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
