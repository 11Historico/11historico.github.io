import type { SavedGameState } from "../storage/localGameStorage";

/**
 * La partida guardada solo persiste la fase (`phase`), no la pantalla. Tras
 * superar una temporada, la pantalla "Entre temporadas" (elegir cambio de
 * jugador/entrenador, ver el prestigio europeo) comparte fase `team_summary`
 * con el resumen normal del equipo, así que al recargar se saltaba y se
 * perdía la recompensa. Se reconoce por: carrera, fase team_summary,
 * resultado de temporada superado y snapshot de recompensa sin flujo de
 * recompensa en marcha (cambiar jugador/entrenador/formación ya fija
 * `careerRewardFlow`; al terminar, el snapshot se borra).
 */
export function shouldResumeInterseasonReward(saved: SavedGameState): boolean {
  return Boolean(
    saved.isCareerMode &&
      saved.phase === "team_summary" &&
      saved.careerSeasonResult &&
      saved.careerObjectiveResult?.survives &&
      saved.careerRewardSnapshot &&
      !saved.careerRewardFlow,
  );
}
