import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  SEASON_LUCK_WHEEL_BASE_PROBABILITIES,
  SEASON_LUCK_WHEEL_NEGATIVE_WEIGHTS,
  SEASON_LUCK_WHEEL_POSITIVE_WEIGHTS,
  SEASON_LUCK_WHEEL_PRIZE_SEGMENTS,
} from "../src/career/seasonLuckWheel";

const ROOT = process.cwd();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

function testUiFilesExist(): void {
  assert(existsSync(join(ROOT, "src/components/SeasonLuckWheelModal.tsx")), "Debe existir SeasonLuckWheelModal.tsx.");
  assert(existsSync(join(ROOT, "src/components/SeasonLuckWheelModal.css")), "Debe existir SeasonLuckWheelModal.css.");
  logOk("modal de ruleta creado");
}

function testModalSupportsRequiredFlow(): void {
  const component = read("src/components/SeasonLuckWheelModal.tsx");

  for (const text of ["Jugar ruleta", "No jugar", "Parar flecha", "Continuar temporada"]) {
    assert(component.includes(text), `El modal debe mostrar acción: ${text}.`);
  }

  assert(component.includes("resolveSeasonLuckWheel"), "El modal debe resolver la ruleta con el motor v0.23.2a.");
  assert(component.includes("declineSeasonLuckWheel"), "El modal debe permitir rechazar sin efecto.");
  assert(component.includes("SEASON_LUCK_WHEEL_PRIZE_SEGMENTS"), "El modal debe mostrar los premios definidos por el motor.");
  assert(component.includes("season-wheel-disc-shell"), "El puntero fijo debe vivir fuera del disco que gira.");
  assert(component.includes("(360 / offer.prizeSegments.length) - 90}deg"), "Cada etiqueta debe quedar centrada sobre su quesito (la caja nace a 3 en punto).");
  assert(component.includes("key={`${segment.resultType}-${index}`}"), "Los segmentos repetidos deben tener key estable con índice.");
  assert(component.includes("getSegmentShortParts"), "Los quesitos deben usar etiquetas ultracortas y nítidas.");
  assert(component.includes("getSegmentLegendLabel"), "El modal debe explicar etiquetas cortas con una leyenda de premios.");
  assert(component.includes("playingStartedAtRef"), "La velocidad de la flecha debe depender del tiempo de juego.");
  assert(component.includes("accelerationPerSecond") && component.includes("maxSpeed"), "La flecha debe acelerar progresivamente con límite máximo.");
  logOk("modal soporta jugar, rechazar, parar, continuar, leyenda y flecha progresiva");
}

function testCssProvidesWheelAndPrecisionAnimation(): void {
  const css = read("src/components/SeasonLuckWheelModal.css");

  assert(css.includes("@keyframes seasonWheelSpin"), "La ruleta debe tener animación de giro.");
  assert(css.includes("season-wheel-precision-bar"), "Debe existir barra de precisión.");
  assert(css.includes("season-wheel-precision-marker"), "Debe existir flecha/marcador móvil.");
  assert(css.includes(".season-wheel-disc-shell::before"), "El puntero visual de ruleta debe ser fijo y no rotar con el disco.");
  assert(css.includes("conic-gradient"), "La ruleta debe usar segmentos visuales de premios.");
  assert(css.includes("from -15deg"), "La ruleta de 12 quesitos debe centrar el primer segmento bajo el puntero.");
  assert(css.includes("0deg 30deg") && css.includes("330deg 360deg"), "La ruleta debe cubrir 12 segmentos de 30 grados.");
  assert(css.includes("text-rendering: geometricPrecision"), "Los textos de quesitos deben mejorar su nitidez.");
  assert(css.includes("-webkit-font-smoothing: antialiased"), "Los textos de quesitos deben activar suavizado de fuente.");
  assert(css.includes("season-wheel-prize-legend"), "Debe existir leyenda visual de premios completos.");
  logOk("CSS contiene ruleta, segmentos, flecha, puntero fijo, textos nítidos, leyenda y animación");
}

function countBy<T extends string>(values: T[]): Record<T, number> {
  return values.reduce((accumulator, value) => {
    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {} as Record<T, number>);
}

function sum(values: Record<string, number>): number {
  return Object.values(values).reduce((total, value) => total + value, 0);
}

function testTwelveSegmentVisualWheel(): void {
  assert(SEASON_LUCK_WHEEL_PRIZE_SEGMENTS.length === 12, "La ruleta visual debe tener 12 quesitos.");

  const resultTypeCounts = countBy(SEASON_LUCK_WHEEL_PRIZE_SEGMENTS.map((segment) => segment.resultType));

  assert(resultTypeCounts.rating_plus_0_5 === 3, "Debe haber 3 quesitos visuales de +0.5 media.");
  assert(resultTypeCounts.no_effect === 3, "Debe haber 3 quesitos visuales de Sin efecto.");
  assert(resultTypeCounts.player_change === 1, "Debe haber 1 quesito de cambio de jugador.");
  assert(resultTypeCounts.coach_change === 1, "Debe haber 1 quesito de cambio de entrenador.");
  assert(resultTypeCounts.rating_plus_1 === 1, "Debe haber 1 quesito de +1.0 media.");
  assert(resultTypeCounts.rating_plus_1_and_player_change === 1, "Debe haber 1 quesito de +1.0 media + jugador.");
  assert(resultTypeCounts.rating_minus_0_5 === 1, "Debe haber 1 quesito de -0.5 media.");
  assert(resultTypeCounts.rating_minus_1 === 1, "Debe haber 1 quesito de -1.0 media.");

  assert(sum(SEASON_LUCK_WHEEL_BASE_PROBABILITIES) === 100, "El pulido visual no debe alterar el 40/40/20.");
  assert(SEASON_LUCK_WHEEL_BASE_PROBABILITIES.positive === 40, "La probabilidad positiva base debe seguir en 40%.");
  assert(SEASON_LUCK_WHEEL_BASE_PROBABILITIES.neutral === 40, "La probabilidad neutra base debe seguir en 40%.");
  assert(SEASON_LUCK_WHEEL_BASE_PROBABILITIES.negative === 20, "La probabilidad negativa base debe seguir en 20%.");
  assert(sum(SEASON_LUCK_WHEEL_POSITIVE_WEIGHTS) === 100, "Los pesos positivos reales no deben cambiar.");
  assert(sum(SEASON_LUCK_WHEEL_NEGATIVE_WEIGHTS) === 100, "Los pesos negativos reales no deben cambiar.");

  logOk("ruleta visual de 12 quesitos sin tocar probabilidades reales");
}

function testLeagueIntegration(): void {
  const leagueView = read("src/components/LeagueSimulatorView.tsx");
  const simulator = read("src/simulation/leagueSimulator.ts");

  assert(leagueView.includes("SeasonLuckWheelModal"), "LeagueSimulatorView debe montar el modal de ruleta.");
  assert(leagueView.includes("setIsAutoSimulating(false)"), "La simulación automática debe poder pausarse al ofrecer ruleta.");
  assert(leagueView.includes("copa_elimination"), "Debe existir trigger por eliminación de Copa.");
  assert(leagueView.includes("mid_season"), "Debe existir trigger de mitad de temporada.");
  assert(leagueView.includes("applySeasonLuckWheelRatingDelta"), "Los efectos de media deben llegar al rating de simulación.");
  assert(leagueView.includes("context.seasonLuckWheel?.accepted ? context.seasonLuckWheel.ratingDelta"), "Los premios +0.5, +1, -0.5 y -1 deben aplicarse cuando la ruleta fue aceptada.");
  assert(leagueView.includes("getSeasonLuckWheelTriggerDeadlineMatchday"), "Debe existir fecha límite para ofrecer ruleta antes del tramo final.");
  assert(leagueView.includes("Math.floor(maxMatchday * 2 / 3)"), "La fecha límite de ruleta debe ser 2/3 de la Liga.");
  assert(leagueView.includes("isWithinSeasonLuckWheelTriggerWindow"), "Los triggers de ruleta deben respetar la ventana máxima de activación.");
  assert(leagueView.includes("finishIfReady(nextContext)"), "Resolver o rechazar ruleta no debe bloquear una temporada que ya puede cerrarse.");
  assert(simulator.includes("seasonLuckWheel?: SeasonLuckWheelState"), "El contexto de liga debe persistir el estado de ruleta.");
  logOk("LeagueSimulatorView integra pausa, triggers, límite 2/3, cierre seguro y ratingDelta");
}

function testReadablePrizeLabelsAndLegend(): void {
  const component = read("src/components/SeasonLuckWheelModal.tsx");

  for (const shortLabel of ["+0.5", "Jug.", "Entr.", "+1", "-0.5", "-1"]) {
    assert(component.includes(shortLabel), `El modal debe incluir etiqueta corta: ${shortLabel}.`);
  }

  for (const fullLabel of [
    "+0.5 media de temporada",
    "cambio de jugador",
    "cambio de entrenador",
    "+1.0 media de temporada",
    "la temporada sigue igual",
  ]) {
    assert(component.includes(fullLabel), `La leyenda debe explicar el premio completo: ${fullLabel}.`);
  }

  assert(!component.includes(">Jugador<") && !component.includes(">Entrenador<"), "Los textos largos no deben aparecer dentro de los quesitos.");
  logOk("etiquetas ultracortas y leyenda de premios completos presentes");
}

function testProgressiveArrowSpeed(): void {
  const component = read("src/components/SeasonLuckWheelModal.tsx");

  assert(component.includes("baseSpeed = 0.00075"), "La flecha debe empezar más lenta que en v0.23.2b1.");
  assert(component.includes("accelerationPerSecond = 0.00023"), "La flecha debe acelerar con el paso del tiempo.");
  assert(component.includes("maxSpeed = 0.00235"), "La flecha debe tener límite máximo de velocidad.");
  assert(component.includes("elapsedSeconds"), "La aceleración debe depender del tiempo transcurrido.");

  logOk("flecha con velocidad progresiva y límite máximo");
}

function testQuickSimulationStopsAtLuckWheelTrigger(): void {
  const leagueView = read("src/components/LeagueSimulatorView.tsx");

  assert(leagueView.includes("simulateLeagueUntilNextEvent"), "La simulación rápida debe avanzar hasta el próximo evento de ruleta, no hasta final de temporada.");
  assert(leagueView.includes("!nextContext.state.completed &&") && leagueView.includes("!getPendingCupFixture(nextContext) &&") && leagueView.includes("!shouldPlayEuropeanMatchAtLeagueMatchday(europeanTournament, getLeagueMatchesPlayed(nextContext) + 1)"), "El salto rápido debe simular Liga partido a partido mientras no haya Copa ni evento europeo pendiente.");
  assert(leagueView.includes("previousContext = nextContext"), "Cada iteración rápida debe conservar el contexto previo para detectar cruces de trigger.");
  assert(leagueView.includes("wheelOffered = maybeOfferSeasonLuckWheel"), "El salto rápido debe evaluar la ruleta tras cada partido simulado.");
  assert(leagueView.includes("if (wheelOffered)"), "El salto rápido debe detenerse si aparece la ruleta.");
  assert(leagueView.includes("params.nextContext.leagueSeasonSalt"), "La oferta de ruleta debe usar el contexto simulado más reciente para identificar la temporada.");

  logOk("simulación rápida se detiene ante trigger de Ruleta de la Suerte");
}

function testPackageScriptRegistered(): void {
  const packageJson = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
  const scripts = packageJson.scripts ?? {};

  assert(scripts["qa:season-luck-wheel-ui"], "Debe existir script qa:season-luck-wheel-ui.");
  assert(scripts["qa:tech-debt"]?.includes("qa:season-luck-wheel-ui"), "qa:tech-debt debe incluir qa:season-luck-wheel-ui.");
  logOk("QA UI registrada en package.json");
}

console.log("QA Season Luck Wheel UI");

testUiFilesExist();
testModalSupportsRequiredFlow();
testCssProvidesWheelAndPrecisionAnimation();
testTwelveSegmentVisualWheel();
testReadablePrizeLabelsAndLegend();
testProgressiveArrowSpeed();
testLeagueIntegration();
testQuickSimulationStopsAtLuckWheelTrigger();
testPackageScriptRegistered();

console.log("QA season luck wheel UI OK");
