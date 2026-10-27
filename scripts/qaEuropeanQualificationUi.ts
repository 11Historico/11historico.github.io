import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

function testComponentExistsAndUsesCorrectLabels(): void {
  assert(existsSync(join(ROOT, "src/components/EuropeanQualificationCard.tsx")), "Debe existir EuropeanQualificationCard.tsx.");
  assert(existsSync(join(ROOT, "src/components/EuropeanQualificationCard.css")), "Debe existir EuropeanQualificationCard.css.");

  const component = read("src/components/EuropeanQualificationCard.tsx");

  assert(component.includes("EuropeanQualificationResult"), "El componente debe tipar su prop con EuropeanQualificationResult.");
  assert(component.includes("Clasificación europea"), "Debe mostrar el título 'Clasificación europea'.");
  assert(component.includes("Sin billete europeo"), "Debe mostrar 'Sin billete europeo' cuando no hay clasificación.");
  assert(component.includes("Por posición en Liga"), "Debe mostrar el motivo 'Por posición en Liga'.");
  assert(component.includes("Por ganar la Copa del Rey"), "Debe mostrar el motivo 'Por ganar la Copa del Rey'.");
  assert(component.includes("La Copa mejora tu plaza europea"), "Debe mostrar el motivo 'La Copa mejora tu plaza europea'.");
  assert(
    component.includes("El Athletic jugará la Champions League la próxima temporada."),
    "Debe incluir el texto narrativo de Champions League.",
  );
  assert(
    component.includes("El Athletic jugará la Europa League la próxima temporada."),
    "Debe incluir el texto narrativo de Europa League.",
  );
  assert(
    component.includes("El Athletic jugará la Conference League la próxima temporada."),
    "Debe incluir el texto narrativo de Conference League.",
  );
  assert(
    component.includes("La plaza europea queda guardada para la próxima temporada."),
    "Debe indicar que la plaza queda guardada para la próxima temporada.",
  );

  logOk("EuropeanQualificationCard existe y usa los labels correctos");
}

function testSeasonOutcomeAndFinalSummaryIntegrateCard(): void {
  const outcome = read("src/components/CareerSeasonOutcome.tsx");
  const finalSummary = read("src/components/FinalSummary.tsx");

  assert(outcome.includes("EuropeanQualificationCard"), "CareerSeasonOutcome debe importar y usar EuropeanQualificationCard.");
  assert(outcome.includes("europeanQualification?: EuropeanQualificationResult"), "CareerSeasonOutcome debe aceptar la prop europeanQualification.");

  assert(finalSummary.includes("EuropeanQualificationCard"), "FinalSummary debe importar y usar EuropeanQualificationCard.");
  assert(finalSummary.includes("europeanQualification?: EuropeanQualificationResult"), "FinalSummary debe aceptar la prop europeanQualification.");

  logOk("CareerSeasonOutcome y FinalSummary integran la tarjeta de clasificación europea");
}

function testNoTextClaimsEuropeanTitleAlreadyWon(): void {
  const files = [
    "src/components/EuropeanQualificationCard.tsx",
    "src/components/CareerSeasonOutcome.tsx",
    "src/components/FinalSummary.tsx",
  ];

  const forbiddenPhrases = [
    "ha ganado la Champions",
    "ha ganado la Europa League",
    "ha ganado la Conference",
    "campeón de Europa",
    "campeón de la Champions",
  ];

  for (const file of files) {
    const content = read(file);

    for (const phrase of forbiddenPhrases) {
      assert(!content.includes(phrase), `${file} no debe insinuar que ya se ha ganado un título europeo ("${phrase}").`);
    }
  }

  logOk("Ningún texto insinúa que ya se ha ganado un título europeo esta fase");
}

function testPalmaresStillShowsAllEuropeanCompetitions(): void {
  const palmares = read("src/components/PalmaresTrophyCase.tsx");

  assert(palmares.includes("champions") || palmares.includes("Champions"), "El palmarés no debe ocultar Champions League.");
  assert(palmares.includes("europaLeague") || palmares.includes("Europa League"), "El palmarés no debe ocultar Europa League.");
  assert(palmares.includes("conference") || palmares.includes("Conference"), "El palmarés no debe ocultar Conference League.");

  logOk("El palmarés sigue mostrando Champions, Europa League y Conference");
}

function testQaRegistered(): void {
  const packageJson = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
  const scripts = packageJson.scripts ?? {};

  assert(scripts["qa:european-qualification-ui"], "Debe existir qa:european-qualification-ui.");
  assert(scripts["qa:tech-debt"]?.includes("qa:european-qualification-ui"), "qa:tech-debt debe incluir qa:european-qualification-ui.");

  logOk("QA de UI europea registrada en package.json");
}

console.log("QA European Qualification UI");

testComponentExistsAndUsesCorrectLabels();
testSeasonOutcomeAndFinalSummaryIntegrateCard();
testNoTextClaimsEuropeanTitleAlreadyWon();
testPalmaresStillShowsAllEuropeanCompetitions();
testQaRegistered();

console.log("QA european qualification UI OK");
