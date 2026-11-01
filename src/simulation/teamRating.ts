function getSelectedPlayersAverageOverall(selectedPlayers: SelectedPlayer[]): number {
  if (selectedPlayers.length === 0) return 50;

  return average(
    selectedPlayers.map((selected) => selected.playerSeason.overall),
    50
  );
}

function getRatingCeilingBySquadAverage(squadAverage: number, key: string, overallHeadroom = 5): number {
  // La valoración colectiva no puede separarse demasiado de la media real del once.
  // El overall usa una holgura específica para no convertir cualquier entrenador en un +5 fijo.
  if (key === "overall") return Math.min(99, Math.round(squadAverage + overallHeadroom));
  if (key === "attack") return Math.min(99, Math.round(squadAverage + 8));
  if (key === "defense") return Math.min(99, Math.round(squadAverage + 8));
  if (key === "control") return Math.min(99, Math.round(squadAverage + 8));
  if (key === "physical") return Math.min(99, Math.round(squadAverage + 10));
  if (key === "mentality") return Math.min(99, Math.round(squadAverage + 10));
  if (key === "goalkeeping") return Math.min(99, Math.round(squadAverage + 10));

  return 99;
}

function capRatingBySquadAverage(
  value: number,
  squadAverage: number,
  key: string,
  overallHeadroom = 5
): number {
  return Math.min(value, getRatingCeilingBySquadAverage(squadAverage, key, overallHeadroom));
}

// src/simulation/teamRating.ts

import type {
  CoachSeason,
  Formation,
  FormationSlot,
  PlayerSeason,
  SelectedCoach,
  SelectedPlayer,
  TeamRating,
} from "../types/game";

import {
  canPlayerFillSlot as canPlayerFillSlotRule,
  getAvailableSlotsForPlayer as getAvailableSlotsForPlayerRule,
  isPlayerAlreadySelected as isPlayerAlreadySelectedRule,
} from "../domain/positionRules";

type NumericTeamRatingKey =
  | "attack"
  | "defense"
  | "control"
  | "physical"
  | "mentality"
  | "goalkeeping"
  | "overall";

interface LineAverages {
  goalkeeper: number;
  defense: number;
  midfield: number;
  attack: number;
}

interface InternalRatingBreakdown {
  attack: number;
  defense: number;
  control: number;
  physical: number;
  mentality: number;
  goalkeeping: number;
  overall: number;
  lineAverages: LineAverages;
}

/**
 * Limita cualquier rating al rango 0-100.
 */
function clampRating(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Media simple segura. Si no hay valores, devuelve fallback.
 */
function average(values: number[], fallback = 0): number {
  if (values.length === 0) return fallback;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Media ponderada segura.
 */
function weightedAverage(items: Array<{ value: number; weight: number }>, fallback = 0): number {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  if (totalWeight <= 0) return fallback;

  return (
    items.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight
  );
}

/**
 * Calcula un pequeño bonus por confianza de datos.
 *
 * No queremos que dataConfidence cambie mucho el juego, pero sí evitar que
 * jugadores con ratings muy estimados tengan ventaja injusta.
 */
function getDataConfidenceAdjustment(players: PlayerSeason[], coach?: CoachSeason): number {
  const playerConfidence = average(players.map((player) => player.dataConfidence), 0.6);
  const coachConfidence = coach?.dataConfidence ?? 0.7;
  const combinedConfidence = playerConfidence * 0.85 + coachConfidence * 0.15;

  if (combinedConfidence >= 0.85) return 1;
  if (combinedConfidence >= 0.7) return 0;
  if (combinedConfidence >= 0.55) return -1;

  return -2;
}

/**
 * Devuelve los jugadores seleccionados de una línea concreta según el slot de formación.
 */
function getPlayersByLine(
  selectedPlayers: SelectedPlayer[],
  formation: Formation,
  line: FormationSlot["line"]
): SelectedPlayer[] {
  const slotIds = new Set(
    formation.slots.filter((slot) => slot.line === line).map((slot) => slot.id)
  );

  return selectedPlayers.filter((selected) => slotIds.has(selected.slotId));
}

/**
 * Aplica una pequeña bonificación/penalización si el once está completo o incompleto.
 *
 * Durante la construcción del once puede haber menos de 11 jugadores; esta función permite
 * calcular un rating provisional sin romper la aplicación.
 */
function getCompletenessAdjustment(selectedPlayers: SelectedPlayer[], formation: Formation): number {
  const expectedPlayers = formation.slots.length;
  const selectedCount = selectedPlayers.length;

  if (selectedCount >= expectedPlayers) return 0;

  const missingPlayers = expectedPlayers - selectedCount;
  return -missingPlayers * 3;
}

/**
 * Penaliza duplicados de slot o alineaciones incompletas.
 */
function getSelectionValidityAdjustment(
  selectedPlayers: SelectedPlayer[],
  formation: Formation
): number {
  const validSlotIds = new Set(formation.slots.map((slot) => slot.id));
  const usedSlotIds = new Set<string>();

  let penalty = 0;

  for (const selected of selectedPlayers) {
    if (!validSlotIds.has(selected.slotId)) {
      penalty -= 5;
    }

    if (usedSlotIds.has(selected.slotId)) {
      penalty -= 8;
    }

    usedSlotIds.add(selected.slotId);
  }

  return penalty;
}

/**
 * Calcula medias por línea usando el overall de cada jugador.
 */
function calculateLineAverages(
  selectedPlayers: SelectedPlayer[],
  formation: Formation
): LineAverages {
  const goalkeepers = getPlayersByLine(selectedPlayers, formation, "goalkeeper");
  const defenders = getPlayersByLine(selectedPlayers, formation, "defense");
  const midfielders = getPlayersByLine(selectedPlayers, formation, "midfield");
  const attackers = getPlayersByLine(selectedPlayers, formation, "attack");

  return {
    goalkeeper: average(goalkeepers.map((selected) => selected.playerSeason.overall), 50),
    defense: average(defenders.map((selected) => selected.playerSeason.overall), 50),
    midfield: average(midfielders.map((selected) => selected.playerSeason.overall), 50),
    attack: average(attackers.map((selected) => selected.playerSeason.overall), 50),
  };
}

/**
 * Calcula los ratings base sin formaciones ni entrenador.
 */
function calculateBaseRatings(
  selectedPlayers: SelectedPlayer[],
  formation: Formation
): InternalRatingBreakdown {
  const players = selectedPlayers.map((selected) => selected.playerSeason);
  const lineAverages = calculateLineAverages(selectedPlayers, formation);

  const goalkeepers = getPlayersByLine(selectedPlayers, formation, "goalkeeper").map(
    (selected) => selected.playerSeason
  );
  const defenders = getPlayersByLine(selectedPlayers, formation, "defense").map(
    (selected) => selected.playerSeason
  );
  const midfielders = getPlayersByLine(selectedPlayers, formation, "midfield").map(
    (selected) => selected.playerSeason
  );
  // Sin línea de ataque en la formación (4-6-0), los medios hacen de delanteros:
  // si no, esa línea valdría el 50 de reserva y el equipo se hundiría (v0.25.79).
  const attackers = formation.slots.some((slot) => slot.line === "attack")
    ? getPlayersByLine(selectedPlayers, formation, "attack").map(
      (selected) => selected.playerSeason
    )
    : midfielders;

  const attack = weightedAverage([
    {
      value: average(
        attackers.map(
          (player) =>
            player.skills.shooting * 0.4 +
            player.skills.dribbling * 0.25 +
            player.skills.pace * 0.2 +
            player.skills.passing * 0.15
        ),
        50
      ),
      weight: 0.5,
    },
    {
      value: average(
        midfielders.map(
          (player) =>
            player.skills.passing * 0.45 +
            player.skills.dribbling * 0.25 +
            player.skills.shooting * 0.2 +
            player.skills.mentality * 0.1
        ),
        50
      ),
      weight: 0.25,
    },
    {
      value: average(players.map((player) => player.overall), 50),
      weight: 0.25,
    },
  ]);

  const defense = weightedAverage([
    {
      value: average(
        defenders.map(
          (player) =>
            player.skills.defending * 0.45 +
            player.skills.physical * 0.3 +
            player.skills.mentality * 0.15 +
            player.skills.pace * 0.1
        ),
        50
      ),
      weight: 0.45,
    },
    {
      value: average(
        midfielders.map(
          (player) =>
            player.skills.defending * 0.35 +
            player.skills.physical * 0.25 +
            player.skills.passing * 0.2 +
            player.skills.mentality * 0.2
        ),
        50
      ),
      weight: 0.25,
    },
    {
      value: average(
        goalkeepers.map(
          (player) =>
            player.skills.goalkeeping * 0.75 +
            player.skills.mentality * 0.15 +
            player.skills.physical * 0.1
        ),
        50
      ),
      weight: 0.3,
    },
  ]);

  const control = weightedAverage([
    {
      value: average(
        midfielders.map(
          (player) =>
            player.skills.passing * 0.45 +
            player.skills.dribbling * 0.2 +
            player.skills.mentality * 0.2 +
            player.skills.physical * 0.15
        ),
        50
      ),
      weight: 0.5,
    },
    {
      value: average(
        defenders.map(
          (player) =>
            player.skills.passing * 0.5 +
            player.skills.mentality * 0.25 +
            player.skills.defending * 0.25
        ),
        50
      ),
      weight: 0.2,
    },
    {
      value: average(
        attackers.map(
          (player) =>
            player.skills.passing * 0.35 +
            player.skills.dribbling * 0.35 +
            player.skills.mentality * 0.3
        ),
        50
      ),
      weight: 0.3,
    },
  ]);

  const physical = average(
    players.map((player) => player.skills.physical * 0.7 + player.skills.pace * 0.3),
    50
  );

  const mentality = average(players.map((player) => player.skills.mentality), 50);

  const goalkeeping = average(
    goalkeepers.map(
      (player) =>
        player.skills.goalkeeping * 0.8 +
        player.skills.mentality * 0.1 +
        player.skills.passing * 0.1
    ),
    50
  );

  const overall = weightedAverage([
    { value: attack, weight: 0.24 },
    { value: defense, weight: 0.24 },
    { value: control, weight: 0.18 },
    { value: physical, weight: 0.1 },
    { value: mentality, weight: 0.12 },
    { value: goalkeeping, weight: 0.12 },
  ]);

  return {
    attack,
    defense,
    control,
    physical,
    mentality,
    goalkeeping,
    overall,
    lineAverages,
  };
}

/**
 * Aplica modificadores de formación.
 */
function applyFormationModifiers(
  rating: InternalRatingBreakdown,
  formation: Formation
): InternalRatingBreakdown {
  const { modifiers } = formation;

  const attack = rating.attack + modifiers.attack;
  const defense = rating.defense + modifiers.defense;
  const control = rating.control + modifiers.control;

  /**
   * El riesgo táctico no se aplica directamente como "malo".
   * - Riesgo positivo: sube techo ofensivo, baja estabilidad defensiva.
   * - Riesgo negativo: sube estabilidad defensiva, baja algo el techo ofensivo.
   */
  const riskAttackAdjustment = modifiers.risk > 0 ? modifiers.risk * 0.6 : modifiers.risk * 0.25;
  const riskDefenseAdjustment = modifiers.risk > 0 ? -modifiers.risk * 0.6 : Math.abs(modifiers.risk) * 0.5;

  const adjustedAttack = attack + riskAttackAdjustment;
  const adjustedDefense = defense + riskDefenseAdjustment;

  const overall = weightedAverage([
    { value: adjustedAttack, weight: 0.24 },
    { value: adjustedDefense, weight: 0.24 },
    { value: control, weight: 0.18 },
    { value: rating.physical, weight: 0.1 },
    { value: rating.mentality, weight: 0.12 },
    { value: rating.goalkeeping, weight: 0.12 },
  ]);

  return {
    ...rating,
    attack: adjustedAttack,
    defense: adjustedDefense,
    control,
    overall,
  };
}

function getCoachBaseOverallBonus(coachOverall: number): number {
  // v0.18.3 — El entrenador no debe regalar siempre +5 a la media.
  // Regla de bonus general acordada:
  // - 80 o menos: +1
  // - 81 a 85: +2
  // - 86 o más: +3
  if (coachOverall <= 80) return 1;
  if (coachOverall <= 85) return 2;
  return 3;
}

/**
 * Aplica modificadores generales del entrenador.
 */
function applyCoachModifiers(
  rating: InternalRatingBreakdown,
  selectedCoach?: SelectedCoach
): InternalRatingBreakdown {
  if (!selectedCoach) return rating;

  const coach = selectedCoach.coachSeason;
  const baseBonus = getCoachBaseOverallBonus(coach.overall);

  return {
    ...rating,
    attack: rating.attack + baseBonus,
    defense: rating.defense + baseBonus,
    control: rating.control + baseBonus,
    physical: rating.physical + baseBonus,
    mentality: rating.mentality + baseBonus,
    goalkeeping: rating.goalkeeping + baseBonus,
    overall: rating.overall + baseBonus,
  };
}

/**
 * Detecta puntos fuertes del once.
 */
function detectStrengths(rating: Pick<TeamRating, NumericTeamRatingKey>): string[] {
  const strengths: string[] = [];

  if (rating.attack >= 84) strengths.push("Ataque de mucho nivel");
  if (rating.defense >= 84) strengths.push("Defensa muy fiable");
  if (rating.control >= 84) strengths.push("Gran control del centro del campo");
  if (rating.physical >= 84) strengths.push("Equipo poderoso en duelos e intensidad");
  if (rating.mentality >= 86) strengths.push("Mentalidad competitiva muy alta");
  if (rating.goalkeeping >= 84) strengths.push("Portería diferencial");

  if (strengths.length === 0 && rating.overall >= 78) {
    strengths.push("Equipo equilibrado sin grandes puntos débiles");
  }

  if (strengths.length === 0) {
    strengths.push("Once competitivo, aunque todavía mejorable");
  }

  return strengths;
}

/**
 * Detecta puntos débiles del once.
 */
function detectWeaknesses(rating: Pick<TeamRating, NumericTeamRatingKey>): string[] {
  const weaknesses: string[] = [];

  if (rating.attack < 72) weaknesses.push("Puede tener problemas para generar goles");
  if (rating.defense < 72) weaknesses.push("Puede sufrir defensivamente ante rivales fuertes");
  if (rating.control < 72) weaknesses.push("Puede perder el control de los partidos");
  if (rating.physical < 70) weaknesses.push("Puede sufrir en duelos físicos");
  if (rating.mentality < 72) weaknesses.push("Puede ser irregular en partidos igualados");
  if (rating.goalkeeping < 72) weaknesses.push("La portería no parece diferencial");

  if (rating.attack >= 86 && rating.defense < 76) {
    weaknesses.push("Equipo ofensivo, pero con riesgo de encajar demasiado");
  }

  if (rating.defense >= 86 && rating.attack < 76) {
    weaknesses.push("Equipo sólido, pero puede quedarse corto en ataque");
  }

  if (weaknesses.length === 0) {
    weaknesses.push("No presenta debilidades graves en el papel");
  }

  return weaknesses;
}

// Puntos de media que debe sacar una línea a otra para marcar el estilo del equipo.
const PROFILE_LINE_EDGE = 4;

/**
 * Etiqueta general del perfil del equipo. Solo es texto: no afecta a los partidos.
 */
function detectProfileLabel(
  rating: Pick<TeamRating, NumericTeamRatingKey>,
  lines: LineAverages,
  formation: Formation
): string {
  if (rating.overall >= 88 && rating.attack >= 84 && rating.defense >= 84) {
    return "Once histórico de nivel campeón";
  }

  // Las líneas del rating salen casi iguales por el tope, y por eso el estilo se lee
  // de la media real de cada línea (v0.25.80). Sin delanteros, los medios son el ataque.
  const attack = formation.slots.some((slot) => slot.line === "attack") ? lines.attack : lines.midfield;

  if (attack - lines.defense >= PROFILE_LINE_EDGE) {
    return "Equipo ofensivo y vertical";
  }

  if (lines.defense - attack >= PROFILE_LINE_EDGE) {
    return "Equipo sólido y competitivo";
  }

  if (lines.midfield - (attack + lines.defense) / 2 >= PROFILE_LINE_EDGE) {
    return "Equipo dominador de mediocampo";
  }

  if (rating.overall >= 82) {
    return "Equipo equilibrado de alto nivel";
  }

  if (rating.overall >= 76) {
    return "Equipo competitivo";
  }

  return "Equipo irregular y mejorable";
}

/**
 * Calcula el rating colectivo del Athletic histórico del usuario.
 *
 * Esta función no simula partidos. Solo convierte:
 * - formación
 * - 11 jugadores elegidos
 * - entrenador elegido
 *
 * en una ficha de equipo que luego usará matchEngine.ts.
 */
export function calculateTeamRating(params: {
  selectedPlayers: SelectedPlayer[];
  selectedCoach?: SelectedCoach;
  formation: Formation;
}): TeamRating {
  const { selectedPlayers, selectedCoach, formation } = params;

  const playerSeasons = selectedPlayers.map((selected) => selected.playerSeason);
  const squadAverage = getSelectedPlayersAverageOverall(selectedPlayers);
  const coach = selectedCoach?.coachSeason;
  const coachOverallHeadroom = coach ? getCoachBaseOverallBonus(coach.overall) : 0;

  const baseRatings = calculateBaseRatings(selectedPlayers, formation);
  const withFormation = applyFormationModifiers(baseRatings, formation);
  const withCoach = applyCoachModifiers(withFormation, selectedCoach);

  const completenessAdjustment = getCompletenessAdjustment(selectedPlayers, formation);
  const validityAdjustment = getSelectionValidityAdjustment(selectedPlayers, formation);
  const dataConfidenceAdjustment = getDataConfidenceAdjustment(playerSeasons, coach);

  const globalAdjustment =
    completenessAdjustment + validityAdjustment + dataConfidenceAdjustment;

  const numericRating = {
    attack: clampRating(withCoach.attack + globalAdjustment),
    defense: clampRating(withCoach.defense + globalAdjustment),
    control: clampRating(withCoach.control + globalAdjustment),
    physical: clampRating(withCoach.physical + globalAdjustment),
    mentality: clampRating(withCoach.mentality + globalAdjustment),
    goalkeeping: clampRating(withCoach.goalkeeping + globalAdjustment),
    overall: clampRating(withCoach.overall + globalAdjustment),
  };
  const cappedRating = {
    attack: clampRating(capRatingBySquadAverage(numericRating.attack, squadAverage, "attack")),
    defense: clampRating(capRatingBySquadAverage(numericRating.defense, squadAverage, "defense")),
    control: clampRating(capRatingBySquadAverage(numericRating.control, squadAverage, "control")),
    physical: clampRating(capRatingBySquadAverage(numericRating.physical, squadAverage, "physical")),
    mentality: clampRating(capRatingBySquadAverage(numericRating.mentality, squadAverage, "mentality")),
    goalkeeping: clampRating(capRatingBySquadAverage(numericRating.goalkeeping, squadAverage, "goalkeeping")),
    overall: clampRating(capRatingBySquadAverage(numericRating.overall, squadAverage, "overall", coachOverallHeadroom)),
  };

  return {
    ...cappedRating,
    profileLabel: detectProfileLabel(cappedRating, baseRatings.lineAverages, formation),
    strengths: detectStrengths(cappedRating),
    weaknesses: detectWeaknesses(cappedRating),
  };
}

/**
 * Comprueba si un jugador puede ocupar un hueco concreto de la formación.
 *
 * Wrapper legacy: la regla real vive en domain/positionRules.ts.
 */
export function canPlayerFillSlot(
  player: PlayerSeason,
  slot: FormationSlot
): boolean {
  return canPlayerFillSlotRule(player, slot);
}

/**
 * Devuelve los slots libres que puede ocupar un jugador.
 *
 * Wrapper legacy: la regla real vive en domain/positionRules.ts.
 */
export function getAvailableSlotsForPlayer(params: {
  player: PlayerSeason;
  formation: Formation;
  selectedPlayers: SelectedPlayer[];
}): FormationSlot[] {
  return getAvailableSlotsForPlayerRule(params);
}

/**
 * Comprueba si un jugador ya ha sido seleccionado en cualquier temporada.
 *
 * Wrapper legacy: la regla real vive en domain/positionRules.ts.
 */
export function isPlayerAlreadySelected(
  player: PlayerSeason,
  selectedPlayers: SelectedPlayer[]
): boolean {
  return isPlayerAlreadySelectedRule(player, selectedPlayers);
}








