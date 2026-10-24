// QA v0.25.30: validador de palmarés del backend de Apps Script (checkTrophyPlausibility_).
// Se extrae la función del .gs y se ejecuta en Node, para comprobar casos límite reales.
import { readFileSync } from "node:fs";

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

// Sin temporadas superadas solo cabe una temporada extra (la de Game Over).
assert(accepts(0, { liga: 1 }), "Un título de Liga en la temporada de Game Over debe aceptarse.");
assert(!accepts(0, { liga: 2 }), "Dos títulos de Liga sin temporadas superadas deben rechazarse.");

// Un título por competición nacional y temporada, más la extra.
assert(accepts(3, { liga: 4, copa: 4, supercopa: 4 }), "4 títulos por competición en 3 temporadas deben aceptarse (3 + 1 extra).");
assert(!accepts(3, { liga: 5 }), "5 Ligas en 3 temporadas deben rechazarse.");
assert(!accepts(3, { copa: 5 }), "5 Copas en 3 temporadas deben rechazarse.");

// Europa: un único torneo por temporada, entre Champions, Europa League y Conference.
assert(accepts(3, { champions: 2, europaLeague: 2 }), "Cuatro títulos europeos en 3 temporadas (3 + 1 extra) deben aceptarse.");
assert(!accepts(3, { champions: 2, europaLeague: 2, conference: 1 }), "Cinco títulos europeos en 3 temporadas deben rechazarse.");

// Carreras largas: el límite crece con las temporadas.
assert(accepts(10, { liga: 11 }), "11 Ligas en 10 temporadas deben aceptarse.");
assert(!accepts(10, { liga: 12 }), "12 Ligas en 10 temporadas deben rechazarse.");

console.log("QA Global Ranking Plausibility OK");
