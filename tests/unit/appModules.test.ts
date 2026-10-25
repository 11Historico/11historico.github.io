import { describe, expect, it } from "vitest";
import { createRandomPlayerRoundSeasons, getDraftSeasonPool, pickRandomSeason } from "../../src/app/draftSeasons";
import { TOTAL_PLAYER_ROUNDS, sanitizeSelectedPlayers, validateSelectedTeam } from "../../src/app/teamValidation";
import { getAvailableAthleticSeasons } from "../../src/data/athleticSeasons";

describe("sorteo de temporadas del draft", () => {
  it("devuelve tantas temporadas como rondas, sin repetir cuando hay suficientes", () => {
    const seasons = createRandomPlayerRoundSeasons(TOTAL_PLAYER_ROUNDS);
    expect(seasons).toHaveLength(TOTAL_PLAYER_ROUNDS);
    expect(new Set(seasons).size).toBe(TOTAL_PLAYER_ROUNDS);
  });

  it("elige solo entre las temporadas de la lista recibida", () => {
    const pool = ["1928/29", "1929/30", "1930/31"] as const;
    for (let run = 0; run < 20; run += 1) {
      expect(pool).toContain(pickRandomSeason([...pool]));
    }
  });

  it("lanza error si no hay temporadas disponibles", () => {
    expect(() => pickRandomSeason([])).toThrow("No hay temporadas disponibles");
  });

  it("fuera del modo normal se usan todas las temporadas", () => {
    expect(getDraftSeasonPool({ difficulty: "leyenda", easyModeSeasonRangeId: "all" })).toEqual(getAvailableAthleticSeasons());
  });
});

describe("validación del equipo", () => {
  it("sin formación no es válido", () => {
    const result = validateSelectedTeam({ selectedPlayers: [] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("No hay formación seleccionada.");
  });

  it("sin jugadores no es válido", () => {
    const result = validateSelectedTeam({ formation: undefined, selectedPlayers: [] });
    expect(result.valid).toBe(false);
  });

  it("sanear sin formación devuelve una lista vacía", () => {
    expect(sanitizeSelectedPlayers({ formation: undefined, selectedPlayers: [] })).toEqual([]);
  });
});
