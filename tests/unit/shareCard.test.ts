import { describe, expect, it } from "vitest";
import { getShareCardContent, getShareCardFileName } from "../../src/career/shareCard";
import type { CareerLocalRankingEntry } from "../../src/types/career";

function entry(overrides: Partial<CareerLocalRankingEntry> = {}): CareerLocalRankingEntry {
  return {
    id: "career_1",
    completedSeasons: 3,
    arcadeScore: 42,
    palmaresScore: 12,
    survivalScore: 30,
    trophyCounts: { champions: 0, liga: 1, europaLeague: 0, copa: 0, conference: 0, supercopa: 0 },
    bestLeaguePosition: 2,
    lastSeasonLabel: "2028/29",
    lastLeaguePosition: 4,
    gameVersion: "v0.25.37",
    createdAt: "2026-10-25T00:00:00.000Z",
    ...overrides,
  } as CareerLocalRankingEntry;
}

describe("getShareCardContent", () => {
  it("usa plural con varias temporadas y singular con una", () => {
    expect(getShareCardContent(entry({ completedSeasons: 3 })).seasons).toBe("3 temporadas superadas");
    expect(getShareCardContent(entry({ completedSeasons: 1 })).seasons).toBe("1 temporada superada");
  });

  it("resume puntos, palmarés, mejor Liga y última temporada", () => {
    const content = getShareCardContent(entry());

    expect(content.points).toBe("Puntos: 42");
    expect(content.palmares).toContain("1 Liga");
    expect(content.bestLeague).toBe("Mejor Liga: 2.º");
    expect(content.lastSeason).toBe("Última temporada: 2028/29 · 4.º");
  });

  it("muestra el hito europeo solo si existe", () => {
    expect(getShareCardContent(entry()).europe).toBeUndefined();
    const withChampions = getShareCardContent(
      entry({ trophyCounts: { champions: 1, liga: 0, europaLeague: 0, copa: 0, conference: 0, supercopa: 0 } }),
    );
    expect(withChampions.europe).toBe("Mejor hito europeo: Campeón de Champions");
  });

  it("no incluye el nick ni identificadores de partida", () => {
    const serialized = JSON.stringify(getShareCardContent(entry({ id: "career_secret_123" })));

    expect(serialized).not.toContain("career_secret_123");
    expect(serialized).not.toContain("nick");
  });
});

describe("getShareCardFileName", () => {
  it("nombra el fichero por temporadas, sin datos personales", () => {
    expect(getShareCardFileName(entry({ completedSeasons: 7 }))).toBe("futbol11-carrera-7-temporadas.png");
  });
});
