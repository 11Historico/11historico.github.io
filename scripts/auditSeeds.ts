// Semillas de auditoría con la forma de las del juego.
//
// En el juego, gameId = game_<fecha>_<hex> (App.tsx), y el torneo europeo se sortea con
// `${gameId}_${temporada}`. Con semillas cortas y seguidas (audit_1_…, audit_2_…) el hash de
// europeanOpponents apenas cambia y el sorteo se repite: el Stuttgart salía en el 52 % de los
// torneos de la auditoría, y en el juego no. Este módulo no toca Date.now ni Math.random.

/** gameId determinista con la misma forma que los del juego. */
export function auditGameId(index: number): string {
  return `game_${1_760_000_000_000 + index * 7_919_331}_${((index + 1) * 2_654_435_761 >>> 0).toString(16)}`;
}
