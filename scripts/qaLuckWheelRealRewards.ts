import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertIncludes(source: string, needle: string, label: string): void {
  if (!source.includes(needle)) {
    throw new Error(`${label}: no se encontró ${needle}`);
  }
}

const app = read("src/App.tsx");
const leagueSimulator = read("src/components/LeagueSimulatorView.tsx");
const careerTypes = read("src/types/career.ts");
const picker = read("src/components/CareerPlayerReplacementPicker.tsx");
const modal = read("src/components/SeasonLuckWheelModal.tsx");
const packageJson = JSON.parse(read("package.json")) as { scripts?: Record<string, string>; version?: string };
const version = read("src/config/appVersion.ts");

assertIncludes(version, 'APP_VERSION = "v0.25.21"', "versionado app");
assertIncludes(packageJson.version ?? "", "0.25.21", "versionado package");
assertIncludes(packageJson.scripts?.["qa:tech-debt"] ?? "", "qa:luck-wheel-real-rewards", "qa integrada en tech-debt");

assertIncludes(careerTypes, '"luck_wheel_player"', "tipo CareerRewardFlow jugador ruleta");
assertIncludes(careerTypes, '"luck_wheel_coach"', "tipo CareerRewardFlow entrenador ruleta");

assertIncludes(leagueSimulator, "onSeasonLuckWheelPlayerChange", "LeagueSimulator callback jugador");
assertIncludes(leagueSimulator, "onSeasonLuckWheelCoachChange", "LeagueSimulator callback entrenador");
assertIncludes(leagueSimulator, "result.requiresPlayerChange", "LeagueSimulator detecta premio jugador");
assertIncludes(leagueSimulator, "result.requiresCoachChange", "LeagueSimulator detecta premio entrenador");
assertIncludes(leagueSimulator, "buildAcceptedSeasonLuckWheelState(", "LeagueSimulator usa el constructor de estado de ruleta");
assertIncludes(read("src/career/seasonLuckWheel.ts"), "requiresPlayerChange: result.requiresPlayerChange", "El estado de ruleta persiste flag jugador");
assertIncludes(read("src/career/seasonLuckWheel.ts"), "requiresCoachChange: result.requiresCoachChange", "El estado de ruleta persiste flag entrenador");

assertIncludes(app, "function handleSeasonLuckWheelPlayerChange", "App maneja premio jugador");
assertIncludes(app, "function handleSeasonLuckWheelCoachChange", "App maneja premio entrenador");
assertIncludes(app, 'setCareerRewardFlow("luck_wheel_player")', "App activa flujo jugador ruleta");
assertIncludes(app, 'setCareerRewardFlow("luck_wheel_coach")', "App activa flujo entrenador ruleta");
assertIncludes(app, 'careerRewardFlow === "luck_wheel_player"', "App retorna a Liga tras jugador ruleta");
assertIncludes(app, 'careerRewardFlow === "luck_wheel_coach"', "App retorna a Liga tras entrenador ruleta");
assertIncludes(app, "onSeasonLuckWheelPlayerChange={handleSeasonLuckWheelPlayerChange}", "App conecta callback jugador");
assertIncludes(app, "onSeasonLuckWheelCoachChange={handleSeasonLuckWheelCoachChange}", "App conecta callback entrenador");

assertIncludes(picker, 'mode?: "player" | "player_formation" | "luck_wheel_player"', "Picker soporta modo ruleta");
assertIncludes(picker, "Cancelar y volver a la Liga", "Picker permite cancelar premio de jugador");
assertIncludes(modal, "Premio de cambio de jugador listo", "Modal explica cambio jugador ejecutable");
assertIncludes(modal, "Premio de cambio de entrenador listo", "Modal explica cambio entrenador ejecutable");

console.log("qa:luck-wheel-real-rewards OK - premios de jugador y entrenador de ruleta conectados a flujos reales.");
