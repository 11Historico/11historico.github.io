import { describe, expect, it } from "vitest";
import { getLeagueEventSlots } from "../../src/components/leagueEventOrder";
import type { EuropeanTournamentMatch } from "../../src/europe/europeanTypes";
import type { CupFixture } from "../../src/types/game";

const cup = (gateMatchday: number) => ({ gateMatchday }) as CupFixture;
const euro = (matchday: number) => ({ matchday }) as EuropeanTournamentMatch;
const order = (params: Parameters<typeof getLeagueEventSlots>[0]) => getLeagueEventSlots(params).map((slot) => slot.kind);

describe("orden de las tarjetas de la jornada", () => {
  it("pone arriba la Liga y debajo las competiciones por orden de fecha", () => {
    // 10 jornadas jugadas: Copa tras la 14, Europa antes de la 17.
    expect(order({ leagueMatchesPlayed: 10, leagueCompleted: false, hasLastResult: true, cupFixture: cup(14), nextEuropeanMatch: euro(17) }))
      .toEqual(["liga", "copa", "europa"]);
    // Si Europa llega antes que la Copa, va antes.
    expect(order({ leagueMatchesPlayed: 10, leagueCompleted: false, hasLastResult: true, cupFixture: cup(20), nextEuropeanMatch: euro(13) }))
      .toEqual(["liga", "europa", "copa"]);
  });

  it("un partido europeo pendiente va arriba: sigue bloqueando la Liga", () => {
    // 15 jugadas: el partido europeo de la jornada 16 se juega antes que la Liga.
    expect(order({ leagueMatchesPlayed: 15, leagueCompleted: false, hasLastResult: true, cupFixture: cup(20), nextEuropeanMatch: euro(16) }))
      .toEqual(["europa", "liga", "copa"]);
  });

  it("la Copa pendiente va arriba, también por delante de Europa", () => {
    expect(order({ leagueMatchesPlayed: 15, leagueCompleted: false, hasLastResult: true, cupFixture: cup(15), nextEuropeanMatch: euro(16) }))
      .toEqual(["copa", "europa", "liga"]);
  });

  it("el resultado europeo recién jugado va arriba hasta el siguiente partido", () => {
    expect(order({ leagueMatchesPlayed: 16, leagueCompleted: false, hasLastResult: true, cupFixture: cup(20), justPlayedEuropeanMatch: euro(16), nextEuropeanMatch: euro(20) }))
      .toEqual(["europa", "liga", "copa"]);
    // Sin el resultado recién jugado, Europa vuelve a su fecha.
    expect(order({ leagueMatchesPlayed: 17, leagueCompleted: false, hasLastResult: true, cupFixture: cup(20), nextEuropeanMatch: euro(20) }))
      .toEqual(["liga", "europa", "copa"]);
  });

  it("con la Liga terminada, su último resultado va al final", () => {
    expect(order({ leagueMatchesPlayed: 38, leagueCompleted: true, hasLastResult: true, cupFixture: cup(30) }))
      .toEqual(["copa", "liga"]);
  });

  it("sin último resultado no hay tarjeta de Liga", () => {
    expect(order({ leagueMatchesPlayed: 0, leagueCompleted: false, hasLastResult: false, cupFixture: cup(6), nextEuropeanMatch: euro(4) }))
      .toEqual(["europa", "copa"]);
  });
});
