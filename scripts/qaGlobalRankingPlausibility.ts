// QA v0.25.30: validador de palmarés del backend de Apps Script (checkTrophyPlausibility_).
// Se extrae la función del .gs y se ejecuta en Node, para comprobar casos límite reales.
// v0.25.64: límites por competición y comprobación de las reglas del juego en las que se basan.
import { readFileSync } from "node:fs";
import { evaluateCareerObjective, getEuropeanQualification } from "../src/career/careerRules";
import type { CareerSeasonResult } from "../src/types/career";

const source = readFileSync("apps-script/globalRankingBackend.gs", "utf8").replace(/\r\n/g, "\n");
const match = source.match(/function checkTrophyPlausibility_\([\s\S]*?\n\}\n/);
if (!match) throw new Error("No se encuentra checkTrophyPlausibility_ en globalRankingBackend.gs.");

type Trophies = { champions: number; liga: number; europaLeague: number; copa: number; conference: number; supercopa: number };
const check = new Function(`${match[0]}\nreturn checkTrophyPlausibility_;`)() as (seasons: number, trophies: Trophies) => void;

const none: Trophies = { champions: 0, liga: 0, europaLeague: 0, copa: 0, conference: 0, supercopa: 0 };

function accepts(seasons: number, trophies: Partial<Trophies>): boolean {
  try {
    check(seasons, { ...none, ...trophies });
    return true;
  } catch {
    return false;
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`QA Global Ranking Plausibility failed: ${message}`);
}

// Reglas del juego en las que se apoyan los límites. Si cambian, hay que revisar el backend.
function seasonResult(leaguePosition: number, wonCopa: boolean): CareerSeasonResult {
  return {
    seasonLabel: "2026/27",
    leaguePosition,
    wonLeague: leaguePosition === 1,
    wonCopa,
    wonSupercopa: false,
    isRelegated: leaguePosition >= 18,
    europeanQualification: getEuropeanQualification(leaguePosition, wonCopa, null),
    copaWinnerLeaguePosition: null,
  };
}
assert(evaluateCareerObjective(seasonResult(1, false)).survives, "Ganar la Liga debe salvar la temporada (el backend no admite Liga en la de Game Over).");
assert(evaluateCareerObjective(seasonResult(18, true)).isGameOver, "Copa + descenso debe ser Game Over (el backend admite Copa en la de Game Over).");

// Sin temporadas superadas: solo cabe la Copa de la temporada de Game Over (Copa + descenso).
assert(accepts(0, { copa: 1 }), "Una Copa en la temporada de Game Over debe aceptarse.");
assert(!accepts(0, { copa: 2 }), "Dos Copas sin temporadas superadas deben rechazarse.");
assert(!accepts(0, { liga: 1 }), "Una Liga sin temporadas superadas debe rechazarse: ganarla salva la temporada.");
assert(!accepts(0, { supercopa: 1 }), "Una Supercopa sin temporadas superadas debe rechazarse: la primera temporada no tiene Supercopa.");
assert(!accepts(0, { champions: 1 }), "Un título europeo sin temporadas superadas debe rechazarse: la primera temporada no tiene torneo europeo.");

// Con 3 temporadas superadas se juegan 4.
assert(accepts(3, { liga: 3, copa: 4, supercopa: 3 }), "3 Ligas, 4 Copas y 3 Supercopas en 3 temporadas superadas deben aceptarse.");
assert(!accepts(3, { liga: 4 }), "4 Ligas en 3 temporadas superadas deben rechazarse.");
assert(!accepts(3, { copa: 5 }), "5 Copas en 3 temporadas superadas deben rechazarse.");
assert(!accepts(3, { supercopa: 4 }), "4 Supercopas en 3 temporadas superadas deben rechazarse.");

// Europa: un único torneo por temporada, entre Champions, Europa League y Conference.
assert(accepts(3, { champions: 2, europaLeague: 1 }), "Tres títulos europeos en 3 temporadas superadas deben aceptarse.");
assert(!accepts(3, { champions: 2, europaLeague: 1, conference: 1 }), "Cuatro títulos europeos en 3 temporadas superadas deben rechazarse.");

// Carreras largas: el límite crece con las temporadas.
assert(accepts(10, { liga: 10, copa: 11, supercopa: 10, champions: 10 }), "El palmarés máximo de 10 temporadas superadas debe aceptarse.");
assert(!accepts(10, { liga: 11 }), "11 Ligas en 10 temporadas superadas deben rechazarse.");

console.log("QA Global Ranking Plausibility OK");
