// src/europe/europeanCrest.ts
//
// Escudos genéricos de los rivales europeos (v0.25.102, fase 14 del roadmap). Los clubes son
// reales y no usamos sus escudos: el escudo es la bandera de su país, simplificada, con las
// iniciales del club. El país también va siempre en texto (title y aria-label), no solo en color.

type FlagPattern =
  /** Franjas horizontales, de arriba abajo. */
  | { bands: "horizontal"; colors: string[]; hoist?: string }
  /** Franjas verticales, de izquierda a derecha. */
  | { bands: "vertical"; colors: string[] }
  /** Cruz centrada sobre un fondo (Inglaterra, Georgia). */
  | { cross: string; background: string }
  /** Cruz nórdica desplazada, con borde (Islandia). */
  | { nordic: string; border: string; background: string }
  /** Aspa (Escocia). */
  | { saltire: string; background: string };

// Banderas simplificadas a dos o tres colores: basta para reconocer el país de un vistazo.
const COUNTRY_FLAGS: Record<string, FlagPattern> = {
  Alemania: { bands: "horizontal", colors: ["#1a1a1a", "#dd0000", "#ffce00"] },
  Inglaterra: { cross: "#ce1124", background: "#ffffff" },
  Italia: { bands: "vertical", colors: ["#009246", "#ffffff", "#ce2b37"] },
  Francia: { bands: "vertical", colors: ["#0055a4", "#ffffff", "#ef4135"] },
  Portugal: { bands: "vertical", colors: ["#046a38", "#da291c", "#da291c"] },
  "Países Bajos": { bands: "horizontal", colors: ["#ae1c28", "#ffffff", "#21468b"] },
  Escocia: { saltire: "#ffffff", background: "#005eb8" },
  Turquía: { bands: "horizontal", colors: ["#e30a17"] },
  Bélgica: { bands: "vertical", colors: ["#1a1a1a", "#fae042", "#ed2939"] },
  Austria: { bands: "horizontal", colors: ["#ed2939", "#ffffff", "#ed2939"] },
  Grecia: { bands: "horizontal", colors: ["#0d5eaf", "#ffffff", "#0d5eaf", "#ffffff", "#0d5eaf"] },
  Hungría: { bands: "horizontal", colors: ["#ce2939", "#ffffff", "#477050"] },
  "República Checa": { bands: "horizontal", colors: ["#ffffff", "#d7141a"], hoist: "#11457e" },
  Polonia: { bands: "horizontal", colors: ["#ffffff", "#dc143c"] },
  Croacia: { bands: "horizontal", colors: ["#ff0000", "#ffffff", "#171796"] },
  Serbia: { bands: "horizontal", colors: ["#c6363c", "#0c4076", "#ffffff"] },
  Azerbaiyán: { bands: "horizontal", colors: ["#0092bc", "#e4002b", "#00af66"] },
  Chipre: { bands: "horizontal", colors: ["#ffffff", "#d57800", "#ffffff"] },
  Georgia: { cross: "#ff0000", background: "#ffffff" },
  Islandia: { nordic: "#dc1e35", border: "#ffffff", background: "#02529c" },
  Armenia: { bands: "horizontal", colors: ["#d90012", "#0033a0", "#f2a800"] },
  Albania: { bands: "horizontal", colors: ["#e41e20", "#1a1a1a", "#e41e20"] },
  Montenegro: { bands: "horizontal", colors: ["#d4af3a", "#c40308", "#c40308", "#c40308", "#d4af3a"] },
  Moldavia: { bands: "vertical", colors: ["#0046ae", "#ffd200", "#cc092f"] },
  Liechtenstein: { bands: "horizontal", colors: ["#002b7f", "#ce1126"] },
  Malta: { bands: "vertical", colors: ["#ffffff", "#cf142b"] },
};

/** Gris neutro para un país sin bandera en la tabla: el escudo sigue llevando las iniciales. */
const FALLBACK_BACKGROUND = "#5b6b84";

function stripes(direction: "to bottom" | "to right", colors: string[]): string {
  const step = 100 / colors.length;
  const stops = colors.map((color, index) => `${color} ${(index * step).toFixed(2)}% ${((index + 1) * step).toFixed(2)}%`);
  return `linear-gradient(${direction}, ${stops.join(", ")})`;
}

function bar(direction: "to bottom" | "to right", color: string, from: number, to: number): string {
  return `linear-gradient(${direction}, transparent ${from}%, ${color} ${from}% ${to}%, transparent ${to}%)`;
}

/** Fondo CSS del escudo: la bandera del país, simplificada. */
export function getEuropeanCrestBackground(country: string): string {
  const flag = COUNTRY_FLAGS[country];
  if (!flag) return FALLBACK_BACKGROUND;

  if ("bands" in flag) {
    const base = stripes(flag.bands === "horizontal" ? "to bottom" : "to right", flag.colors);
    return "hoist" in flag && flag.hoist ? `${bar("to right", flag.hoist, 0, 34)}, ${base}` : base;
  }
  if ("cross" in flag) {
    return `${bar("to right", flag.cross, 40, 60)}, ${bar("to bottom", flag.cross, 40, 60)}, ${flag.background}`;
  }
  if ("nordic" in flag) {
    return [
      bar("to right", flag.nordic, 30, 42),
      bar("to bottom", flag.nordic, 44, 56),
      bar("to right", flag.border, 26, 46),
      bar("to bottom", flag.border, 40, 60),
      flag.background,
    ].join(", ");
  }
  return [
    `linear-gradient(45deg, transparent 43%, ${flag.saltire} 43% 57%, transparent 57%)`,
    `linear-gradient(-45deg, transparent 43%, ${flag.saltire} 43% 57%, transparent 57%)`,
    flag.background,
  ].join(", ");
}

/**
 * Iniciales del club, como mucho tres: «Bayern München» → BM, «Paris Saint-Germain» → PSG.
 * Un nombre de una sola palabra da sus tres primeras letras («Arsenal» → ARS, «APOEL» → APO),
 * salvo las siglas de hasta cuatro letras, que van enteras («PAOK»). Las palabras en minúscula,
 * como «de», no cuentan: «Inter de Milán» → IM.
 */
export function getEuropeanCrestInitials(clubName: string): string {
  const words = clubName.split(/[\s-]+/).filter((word) => word && word !== word.toLowerCase());

  if (words.length === 1) {
    const [word] = words;
    return (word === word.toUpperCase() && word.length <= 4 ? word : word.slice(0, 3)).toUpperCase();
  }

  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
