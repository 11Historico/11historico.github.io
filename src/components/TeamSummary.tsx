// src/components/TeamSummary.tsx

import { useMemo } from "react";

import type {
  Formation,
  GameDifficulty,
  RivalTeam,
  RivalTeamRatings,
  SelectedCoach,
  SelectedPlayer,
  TeamRating,
} from "../types/game";

import { calculateTeamRating } from "../simulation/teamRating";
import { buildCareerTeamPowerPreview } from "../career/teamPower";
import SelectedTeamBoard from "./SelectedTeamBoard";

import "./TeamSummary.css";

interface TeamSummaryProps {
  formation: Formation;
  selectedPlayers: SelectedPlayer[];
  selectedCoach: SelectedCoach;
  onStartLeagueSimulation: (teamRating: TeamRating) => void;

  // Se mantiene opcional para compatibilidad con App.tsx, pero no se muestra botón de cambio.
  onBackToCoach?: () => void;
  modeLabel?: string;
  startButtonLabel?: string;
  careerRatingBonus?: number;
  difficulty?: GameDifficulty;
  isCareerMode?: boolean;
  /** Temporada que se va a jugar, en formato corto («27/28»). */
  seasonLabel?: string;
  /** Rivales de Liga de la temporada, ya con la progresión de carrera (v0.25.94). */
  leagueRivals?: RivalTeam[];
}

// Líneas que tienen par en los rivales: el físico no lo tienen, y su «midfield» es nuestro control.
const STRENGTH_LINES: { label: string; user: keyof TeamRating & ("attack" | "defense" | "control" | "goalkeeping" | "mentality"); rival: keyof RivalTeamRatings }[] = [
  { label: "Ataque", user: "attack", rival: "attack" },
  { label: "Defensa", user: "defense", rival: "defense" },
  { label: "Control", user: "control", rival: "midfield" },
  { label: "Portería", user: "goalkeeping", rival: "goalkeeping" },
  { label: "Mentalidad", user: "mentality", rival: "mentality" },
];

/**
 * v0.25.94: la fuerza con la que juega la carrera, en la escala de los rivales de LaLiga.
 * Los 85-88 del once histórico no se comparan con los 74-91 de los rivales; esta sí.
 */
function LeagueStrengthCard({ rating, rivals }: { rating: TeamRating; rivals: RivalTeam[] }) {
  const byStrength = [...rivals].sort((a, b) => b.ratings.overall - a.ratings.overall);
  const strongest = byStrength[0];
  const leagueAverage = (line: keyof RivalTeamRatings) =>
    Math.round((rivals.reduce((sum, rival) => sum + rival.ratings[line], 0) / rivals.length) * 10) / 10;
  const rows = STRENGTH_LINES.map((line) => ({
    ...line,
    userValue: rating[line.user],
    strongestValue: strongest.ratings[line.rival],
    averageValue: leagueAverage(line.rival),
  }));
  const weakest = rows.reduce((worst, row) =>
    row.userValue - row.strongestValue < worst.userValue - worst.strongestValue ? row : worst
  );
  const gap = weakest.strongestValue - weakest.userValue;

  return (
    <article className="team-summary-strength-card" aria-label="Tu fuerza en LaLiga">
      <span>Tu fuerza en LaLiga</span>
      <strong>{formatRatingValue(rating.overall)}</strong>
      <small>
        {byStrength.slice(0, 3).map((rival) => `${rival.name} ${rival.ratings.overall}`).join(" · ")}
      </small>
      <table>
        <caption>Tus líneas frente a los rivales</caption>
        <thead>
          <tr>
            <th scope="col">Línea</th>
            <th scope="col">Tú</th>
            <th scope="col">{strongest.name}</th>
            <th scope="col">Media LaLiga</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{formatRatingValue(row.userValue)}</td>
              <td>{formatRatingValue(row.strongestValue)}</td>
              <td>{formatRatingValue(row.averageValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        {gap > 0
          ? `Donde más te saca ${strongest.name}: ${weakest.label.toLowerCase()} (${formatRatingValue(Math.round(gap * 10) / 10)} puntos).`
          : `Igualas o superas a ${strongest.name} en todas las líneas.`}
      </p>
    </article>
  );
}

type SafeTeamRating = TeamRating & {
  overall?: number;
  attack?: number;
  defense?: number;
  control?: number;
  physical?: number;
  mentality?: number;
  goalkeeping?: number;
  strengths?: string[];
  risks?: string[];
};

function clampRating(value: number): number {
  if (Number.isNaN(value)) return 80;
  return Math.max(40, Math.min(99, Math.round(value)));
}

function formatRatingValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function average(values: number[]): number {
  if (values.length === 0) return 80;
  return clampRating(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildFallbackTeamRating(
  selectedPlayers: SelectedPlayer[],
  selectedCoach: SelectedCoach
): SafeTeamRating {
  const players = selectedPlayers.map((selected) => selected.playerSeason);
  const coach = selectedCoach.coachSeason;

  const attack = average([
    average(players.map((player) => player.skills.shooting ?? player.overall)),
    average(players.map((player) => player.skills.pace ?? player.overall)),
    coach.skills.attack,
  ]);

  const defense = average([
    average(players.map((player) => player.skills.defending ?? player.overall)),
    coach.skills.defense,
  ]);

  const control = average([
    average(players.map((player) => player.skills.passing ?? player.overall)),
    average(players.map((player) => player.skills.dribbling ?? player.overall)),
    coach.skills.management,
  ]);

  const physical = average(players.map((player) => player.skills.physical ?? player.overall));

  const mentality = average([
    average(players.map((player) => player.skills.mentality ?? player.overall)),
    coach.skills.mentality,
  ]);

  const goalkeepingPlayers = players.filter((player) => player.positions.includes("POR"));
  const goalkeeping = average(
    goalkeepingPlayers.length > 0
      ? goalkeepingPlayers.map((player) => player.skills.goalkeeping ?? player.overall)
      : players.map((player) => player.skills.goalkeeping ?? player.overall)
  );

  const overall = average([attack, defense, control, physical, mentality, goalkeeping]);

  return {
    overall,
    attack,
    defense,
    control,
    physical,
    mentality,
    goalkeeping,
    strengths: [
      overall >= 90 ? "Once de nivel campeón" : "Once competitivo",
      attack >= 85 ? "Ataque de mucho nivel" : "Ataque equilibrado",
      defense >= 85 ? "Bloque defensivo fiable" : "Defensa correcta",
    ],
    risks: overall >= 88 ? ["No presenta debilidades graves en el papel"] : ["Puede sufrir ante rivales top"],
  } as SafeTeamRating;
}

function getSafeTeamRating(
  formation: Formation,
  selectedPlayers: SelectedPlayer[],
  selectedCoach: SelectedCoach
): SafeTeamRating {
  try {
    const rating = calculateTeamRating({
      formation,
      selectedPlayers,
      selectedCoach,
    }) as SafeTeamRating;

    const fallback = buildFallbackTeamRating(selectedPlayers, selectedCoach);

    return {
      ...fallback,
      ...rating,
      strengths: Array.isArray(rating.strengths) ? rating.strengths : fallback.strengths,
      // calculateTeamRating (el motor real, src/simulation/teamRating.ts) devuelve
      // `weaknesses`, no `risks` — TeamRating no tiene ningún campo `risks`. Leer
      // `rating.risks` aquí siempre daba undefined, así que la tarjeta "Riesgos"
      // nunca mostraba el análisis real de detectWeaknesses() y caía siempre al
      // fallback genérico de 2 frases.
      risks: Array.isArray(rating.weaknesses) ? rating.weaknesses : fallback.risks,
    };
  } catch (error) {
    console.error("Error calculando el rating del equipo:", error);
    return buildFallbackTeamRating(selectedPlayers, selectedCoach);
  }
}

function getCoachBaseBonus(overall: number): number {
  if (overall <= 80) return 1;
  if (overall <= 85) return 2;
  return 3;
}

function getCoachSpecialistText(coach: SelectedCoach["coachSeason"]): string {
  const strengths: string[] = [];

  if (coach.skills.management >= 86) strengths.push("Liga +1");
  if ((coach.skills.cup ?? 0) >= 86) strengths.push("Copa +1");
  if ((coach.skills.europe ?? 0) >= 86) strengths.push("Europa +1");

  return strengths.length > 0 ? strengths.join(" · ") : "Sin bonus específico";
}

function RatingBar({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(40, Math.min(99, Number.isNaN(value) ? 80 : value));

  return (
    <div className="summary-rating-row">
      <div className="summary-rating-row-top">
        <span>{label}</span>
        <strong>{formatRatingValue(safeValue)}</strong>
      </div>
      <div className="summary-rating-track">
        <div className="summary-rating-bar" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

export function TeamSummary({
  formation,
  selectedPlayers,
  selectedCoach,
  onStartLeagueSimulation,
  modeLabel,
  startButtonLabel,
  careerRatingBonus = 0,
  difficulty = "normal",
  isCareerMode = false,
  seasonLabel = "25/26",
  leagueRivals,
}: TeamSummaryProps) {
  const teamRating = useMemo(
    () => getSafeTeamRating(formation, selectedPlayers, selectedCoach),
    [formation, selectedPlayers, selectedCoach]
  );

  const teamPowerPreview = useMemo(
    () => buildCareerTeamPowerPreview({
      teamRating: teamRating as TeamRating,
      bonus: careerRatingBonus,
      difficulty,
      isCareerMode,
    }),
    [teamRating, careerRatingBonus, difficulty, isCareerMode]
  );
  const displayedRating = teamPowerPreview.seasonRating;
  const simulatedRating = teamPowerPreview.simulationRating;

  const coach = selectedCoach.coachSeason;

  const strengths = Array.isArray(teamRating.strengths) && teamRating.strengths.length > 0
    ? teamRating.strengths
    : ["Once competitivo"];

  const risks = Array.isArray(teamRating.risks) && teamRating.risks.length > 0
    ? teamRating.risks
    : ["No presenta debilidades graves en el papel"];

  function handleStartLeague() {
    onStartLeagueSimulation(teamRating as TeamRating);
  }

  return (
    <section className="team-summary">
      <header className="team-summary-header">
        <p className="eyebrow">{modeLabel ?? "Resumen del equipo"}</p>

        <div className="team-summary-header-row">
          <div>
            <h1>Athletic Club Histórico</h1>
            <p>
              Revisa tu once, entrenador y perfil colectivo antes de empezar la Liga {seasonLabel}.
            </p>
          </div>

          <button
            type="button"
            className="start-league-button start-league-button-header"
            onClick={handleStartLeague}
          >
            {startButtonLabel ?? `Empezar Liga ${seasonLabel}`}
          </button>
        </div>
      </header>

      <div className="team-summary-layout">
        <div className="team-summary-main">
          <SelectedTeamBoard
            formation={formation}
            selectedPlayers={selectedPlayers}
            title="Once titular"
          />
        </div>

        <aside className="team-summary-side">
          <article className="team-summary-overall-card">
            <span>Rating de temporada</span>
            <strong>{formatRatingValue(displayedRating.overall ?? 0)}</strong>
            <small>
              {(displayedRating.overall ?? 0) >= 90
                ? "Athletic Club Histórico de nivel campeón"
                : "Athletic Club Histórico competitivo"}
            </small>
            <div className="team-summary-power-breakdown">
              <span>Base visible: {formatRatingValue(teamPowerPreview.baseRating.overall ?? 0)}</span>
              {teamPowerPreview.hasBonus && (
                <span>Premio entrenador: +{teamPowerPreview.bonus.toFixed(1)}</span>
              )}
            </div>
            {isCareerMode && (
              <p className="team-summary-overall-note">
                Es la media histórica del once. En Liga y Copa juegas con tu fuerza en LaLiga.
              </p>
            )}
          </article>

          {isCareerMode && leagueRivals && leagueRivals.length > 0 && (
            <LeagueStrengthCard rating={simulatedRating} rivals={leagueRivals} />
          )}

          <article className="team-summary-coach-card">
            <span>Entrenador elegido</span>
            <h2>{coach.name}</h2>
            <p>Temporada {coach.season}</p>
            <strong>Media {coach.overall}</strong>
            <p>Bonus general aplicado: +{getCoachBaseBonus(coach.overall)}</p>
            <p>Bonus específico: {getCoachSpecialistText(coach)}</p>

            <div className="team-summary-coach-chips">
              <span>Ataque {coach.skills.attack}</span>
              <span>Defensa {coach.skills.defense}</span>
              <span>Gestión {coach.skills.management}</span>
              <span>Mentalidad {coach.skills.mentality}</span>
            </div>
          </article>

          <article className="team-summary-ratings-card">
            <h2>Ratings que influyen en la temporada</h2>
            <p className="team-summary-rating-note">
              {isCareerMode
                ? "Valores históricos del once: jugadores, formación, entrenador y premios activos. La Supercopa los usa con la dificultad; Liga y Copa, en la escala de LaLiga."
                : "Estos valores salen de jugadores, formación, entrenador y premios activos. Son los que alimentan Liga, Copa y Supercopa."}
            </p>
            <RatingBar label="Ataque" value={displayedRating.attack ?? 0} />
            <RatingBar label="Defensa" value={displayedRating.defense ?? 0} />
            <RatingBar label="Control" value={displayedRating.control ?? 0} />
            <RatingBar label="Físico" value={displayedRating.physical ?? 0} />
            <RatingBar label="Mentalidad" value={displayedRating.mentality ?? 0} />
            <RatingBar label="Portería" value={displayedRating.goalkeeping ?? 0} />
          </article>

          <article className="team-summary-list-card">
            <h2>Puntos fuertes</h2>
            <ul>
              {strengths.map((strength) => (
                <li key={strength}>{strength}</li>
              ))}
            </ul>
          </article>

          <article className="team-summary-list-card">
            <h2>Riesgos</h2>
            <ul>
              {risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </article>
        </aside>
      </div>
    </section>
  );
}

export default TeamSummary;
