// src/components/CoachRound.tsx

import { useEffect, useMemo, useState } from "react";

import type { CoachSeason, SelectedCoach, SeasonId } from "../types/game";
import {
  ATHLETIC_SEASONS,
  getAvailableAthleticSeasons,
  getCoachBySeason,
} from "../data/athleticSeasons";
import { RATING_METHOD_LABELS } from "../data/sources";

import "./CoachRound.css";

interface CoachRoundProps {
  availableSeasonIds?: SeasonId[];
  alreadyUsedSeasonIds?: SeasonId[];
  optionsCount?: number;
  onSelectCoach: (selection: SelectedCoach) => void;
  onRegenerateOptions?: (coaches: CoachSeason[]) => void;
}

type CoachMainProfile = "defense" | "attack" | "management" | "mentality";

interface CoachCompetitionSpecialty {
  id: "league" | "cup" | "europe";
  label: string;
  detail: string;
}

const COACH_REVEAL_STEP_MS = 1250;
const COACH_ROULETTE_TICK_MS = 110;

function pickRandomItems<T>(items: T[], count: number): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy.slice(0, count);
}

function getCoachMainProfile(coach: CoachSeason): CoachMainProfile {
  const { attack, defense, management, mentality } = coach.skills;
  const max = Math.max(attack, defense, management, mentality);

  if (max === defense) return "defense";
  if (max === attack) return "attack";
  if (max === management) return "management";
  return "mentality";
}

function getCoachProfileLabel(coach: CoachSeason): string {
  const profile = getCoachMainProfile(coach);

  if (profile === "defense") return "Competitivo y defensivo";
  if (profile === "attack") return "Ofensivo e intenso";
  if (profile === "management") return "Gestor y regular";
  return "Carácter y partidos grandes";
}


function getCoachBaseBonus(coach: CoachSeason): number {
  if (coach.overall <= 80) return 1;
  if (coach.overall <= 85) return 2;
  return 3;
}

function getCoachCompetitionSpecialties(coach: CoachSeason): CoachCompetitionSpecialty[] {
  const specialties: CoachCompetitionSpecialty[] = [];

  if (coach.skills.management >= 86) {
    specialties.push({
      id: "league",
      label: "Liga",
      detail: "+1 solo en Liga",
    });
  }

  if ((coach.skills.cup ?? 0) >= 86) {
    specialties.push({
      id: "cup",
      label: "Copa",
      detail: "+1 solo en Copa",
    });
  }

  if ((coach.skills.europe ?? 0) >= 86) {
    specialties.push({
      id: "europe",
      label: "Europa",
      detail: "+1 solo en Europa",
    });
  }

  return specialties;
}

function getCoachImpactText(coach: CoachSeason): string {
  const profile = getCoachMainProfile(coach);

  if (profile === "defense") {
    return "Mejora la solidez del bloque, reduce riesgos y ayuda especialmente en partidos cerrados.";
  }

  if (profile === "attack") {
    return "Potencia el ritmo ofensivo, la presión y la probabilidad de generar ocasiones.";
  }

  if (profile === "management") {
    return "Aporta equilibrio, regularidad y mejor rendimiento medio durante toda la temporada.";
  }

  return "Sube la mentalidad competitiva del equipo y puede marcar diferencias en momentos clave.";
}

function getSkillClass(value: number): string {
  if (value >= 86) return "coach-skill coach-skill-elite";
  if (value >= 78) return "coach-skill coach-skill-good";
  return "coach-skill coach-skill-normal";
}

function getSkillBarClass(value: number): string {
  if (value >= 86) return "coach-skill-bar coach-skill-bar-elite";
  if (value >= 78) return "coach-skill-bar coach-skill-bar-good";
  return "coach-skill-bar coach-skill-bar-normal";
}

function getAllCoachPool(): CoachSeason[] {
  return ATHLETIC_SEASONS.map((squad) => squad.coach).filter(Boolean);
}

/**
 * El mismo entrenador real dirige varias temporadas del Athletic (30
 * entrenadores distintos repartidos en 95 temporadas). Sin esto, la ruleta
 * podía sortear a la misma persona dos veces (solo cambia la temporada de
 * origen), como si fueran dos candidatos independientes.
 */
function dedupeByCoachId(coaches: CoachSeason[]): CoachSeason[] {
  const seenCoachIds = new Set<string>();
  const unique: CoachSeason[] = [];

  for (const coach of coaches) {
    if (seenCoachIds.has(coach.coachId)) continue;
    seenCoachIds.add(coach.coachId);
    unique.push(coach);
  }

  return unique;
}

function buildInitialCoachOptions(params: {
  availableSeasonIds?: SeasonId[];
  alreadyUsedSeasonIds?: SeasonId[];
  optionsCount: number;
}): CoachSeason[] {
  const { availableSeasonIds, alreadyUsedSeasonIds = [], optionsCount } = params;

  const baseSeasonIds = availableSeasonIds ?? getAvailableAthleticSeasons();
  const blockedSeasonIds = new Set(alreadyUsedSeasonIds);

  const candidateCoaches = dedupeByCoachId(
    baseSeasonIds
      .filter((seasonId) => !blockedSeasonIds.has(seasonId))
      .map((seasonId) => getCoachBySeason(seasonId))
      .filter((coach): coach is CoachSeason => Boolean(coach))
  );

  const fallbackCoaches = dedupeByCoachId(getAllCoachPool());
  const source = candidateCoaches.length >= optionsCount ? candidateCoaches : fallbackCoaches;

  return pickRandomItems(source, Math.min(optionsCount, source.length));
}

function CoachSkillRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="coach-skill-row">
      <div className="coach-skill-row-top">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="coach-skill-track">
        <div className={getSkillBarClass(value)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function CoachVisualCard({
  coach,
  isSelected,
  isRolling,
  isLocked,
  disabled,
  onSelect,
}: {
  coach: CoachSeason;
  isSelected?: boolean;
  isRolling?: boolean;
  isLocked?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}) {
  const baseBonus = getCoachBaseBonus(coach);
  const specialties = getCoachCompetitionSpecialties(coach);

  return (
    <article
      className={`coach-card coach-visual-card ${
        isSelected ? "coach-card-selected" : ""
      } ${isRolling ? "coach-card-rolling" : ""} ${isLocked ? "coach-card-locked" : ""}`}
    >
      <div className="coach-card-top">
        <div>
          <span className="coach-season">{coach.season}</span>
          <h2>{coach.name}</h2>
          <p>{getCoachProfileLabel(coach)}</p>
        </div>

        <div className="coach-overall">
          <span>MED</span>
          <strong>{coach.overall}</strong>
        </div>
      </div>

      <p className="coach-impact-text">{getCoachImpactText(coach)}</p>
      <div className="coach-bonus-box" aria-label="Bonus de entrenador">
        <div className="coach-bonus-main">
          <span>Bonus base</span>
          <strong>+{baseBonus}</strong>
          <small>Se suma a la media general del equipo</small>
        </div>

        <div className="coach-specialty-list">
          <span className="coach-specialty-title">Especialidad</span>
          {specialties.length > 0 ? (
            specialties.map((specialty) => (
              <span key={specialty.id} className={`coach-specialty-pill coach-specialty-${specialty.id}`}>
                {specialty.label}: {specialty.detail}
              </span>
            ))
          ) : (
            <span className="coach-specialty-pill coach-specialty-none">Sin +1 específico</span>
          )}
        </div>
      </div>

      <div className="coach-skill-bars">
        <CoachSkillRow label="Ataque" value={coach.skills.attack} />
        <CoachSkillRow label="Defensa" value={coach.skills.defense} />
        <CoachSkillRow label="Gestión" value={coach.skills.management} />
        <CoachSkillRow label="Mentalidad" value={coach.skills.mentality} />
      </div>

      <div className="coach-skills">
        {typeof coach.skills.cup === "number" && (
          <span className={getSkillClass(coach.skills.cup)}>Copa {coach.skills.cup}</span>
        )}
        {typeof coach.skills.europe === "number" && (
          <span className={getSkillClass(coach.skills.europe)}>Europa {coach.skills.europe}</span>
        )}
        <span className="coach-skill coach-skill-source">
          Confianza {Math.round(coach.dataConfidence * 100)}%
        </span>
      </div>

      <div className="coach-meta">
        <span>{RATING_METHOD_LABELS[coach.ratingMethod]}</span>
      </div>

      {coach.notes && <p className="coach-notes">{coach.notes}</p>}

      {onSelect && (
        <button
          type="button"
          className="coach-select-button"
          disabled={disabled}
          onClick={onSelect}
        >
          Seleccionar entrenador
        </button>
      )}
    </article>
  );
}

function CoachEmptySlot({ index }: { index: number }) {
  return (
    <article className="coach-card coach-empty-slot">
      <span>Slot {index + 1}</span>
      <strong>Por sortear</strong>
      <small>Esperando turno en el bombo</small>
    </article>
  );
}

export function CoachRound({
  availableSeasonIds,
  alreadyUsedSeasonIds,
  optionsCount = 3,
  onSelectCoach,
}: CoachRoundProps) {
  const [coachOptions] = useState<CoachSeason[]>(() =>
    buildInitialCoachOptions({
      availableSeasonIds,
      alreadyUsedSeasonIds,
      optionsCount,
    })
  );

  const [revealedCount, setRevealedCount] = useState(0);
  const [rouletteIndex, setRouletteIndex] = useState(0);
  const roulettePool = useMemo(() => getAllCoachPool(), []);

  useEffect(() => {
    const timers = coachOptions.map((_, index) =>
      window.setTimeout(() => {
        setRevealedCount(index + 1);
      }, COACH_REVEAL_STEP_MS * (index + 1))
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [coachOptions]);

  useEffect(() => {
    if (revealedCount >= coachOptions.length) return undefined;

    const interval = window.setInterval(() => {
      setRouletteIndex((current) => current + 1);
    }, COACH_ROULETTE_TICK_MS);

    return () => window.clearInterval(interval);
  }, [coachOptions.length, revealedCount]);

  const allCoachesRevealed = revealedCount >= coachOptions.length;

  function handleSelectCoach(coach: CoachSeason) {
    if (!allCoachesRevealed) return;

    onSelectCoach({
      coachSeason: coach,
    });
  }

  return (
    <section className="coach-round">
      <header className="coach-round-header">
        <p className="eyebrow">Ronda final</p>
        <h1>Elige entrenador</h1>
        <p>
          Se revelan 3 técnicos históricos, uno por uno. Cuando estén los tres
          sobre la mesa, pulsa un entrenador para validarlo directamente.
        </p>
      </header>

      <div className="coach-visual-reveal-board" aria-live="polite">
<div className="coach-options-grid coach-options-grid-visual">
          {Array.from({ length: optionsCount }).map((_, index) => {
            const finalCoach = coachOptions[index];
            const isRevealed = index < revealedCount;
            const isActive = index === revealedCount && !allCoachesRevealed;
            const rollingCoach =
              roulettePool.length > 0
                ? roulettePool[(rouletteIndex + index * 5) % roulettePool.length]
                : finalCoach;

            if (isRevealed && finalCoach) {
              return (
                <CoachVisualCard
                  key={finalCoach.id}
                  coach={finalCoach}
                  isLocked
                  disabled={!allCoachesRevealed}
                  onSelect={() => handleSelectCoach(finalCoach)}
                />
              );
            }

            if (isActive && rollingCoach) {
              return (
                <CoachVisualCard
                  key={`rolling_${index}_${rouletteIndex}`}
                  coach={rollingCoach}
                  isRolling
                  disabled
                />
              );
            }

            return <CoachEmptySlot key={`empty_${index}`} index={index} />;
          })}
        </div>
      </div>


    </section>
  );
}

export default CoachRound;


