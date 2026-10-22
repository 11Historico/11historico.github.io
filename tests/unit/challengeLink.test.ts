import { describe, expect, it } from "vitest";
import {
  CHALLENGE_QUERY_PARAM,
  buildChallengeLink,
  encodeChallenge,
  parseChallenge,
  type ChallengeSummary,
} from "../../src/career/challengeLink";

const summary: ChallengeSummary = {
  arcadeScore: 1234,
  completedSeasons: 7,
  bestLeaguePosition: 2,
  trophyCounts: { liga: 1, copa: 2, supercopa: 0, champions: 0, europaLeague: 1, conference: 0 },
};

describe("enlace de reto", () => {
  it("codifica y decodifica la misma marca", () => {
    expect(parseChallenge(encodeChallenge(summary))).toEqual(summary);
  });

  it("el enlace solo lleva la marca, sin nick ni fechas", () => {
    const link = buildChallengeLink(summary, "https://ikeritu.github.io/11Historico/");
    const url = new URL(link);
    expect([...url.searchParams.keys()]).toEqual([CHALLENGE_QUERY_PARAM]);
    expect(link).not.toMatch(/nick|fecha|createdAt|careerId/i);
  });

  it("conserva la URL base al construir el enlace", () => {
    const link = buildChallengeLink(summary, "https://ikeritu.github.io/11Historico/");
    expect(link.startsWith("https://ikeritu.github.io/11Historico/?reto=")).toBe(true);
  });

  it("rechaza valores vacíos, mal formados o fuera de rango", () => {
    expect(parseChallenge(null)).toBeNull();
    expect(parseChallenge("")).toBeNull();
    expect(parseChallenge("no-es-base64!!")).toBeNull();
    expect(parseChallenge(btoa(JSON.stringify([1, 2, 3])))).toBeNull();

    const outOfRange = { ...summary, arcadeScore: 2_000_000 };
    expect(parseChallenge(encodeChallenge(outOfRange))).toBeNull();

    const badTrophies = btoa(JSON.stringify({ s: 1, t: 1, b: 1, c: [1, 2] }));
    expect(parseChallenge(badTrophies)).toBeNull();
  });

  it("rechaza decimales y textos donde se espera número", () => {
    expect(parseChallenge(btoa(JSON.stringify({ s: 1.5, t: 1, b: 1, c: [0, 0, 0, 0, 0, 0] })))).toBeNull();
    expect(parseChallenge(btoa(JSON.stringify({ s: "10", t: 1, b: 1, c: [0, 0, 0, 0, 0, 0] })))).toBeNull();
  });
});
