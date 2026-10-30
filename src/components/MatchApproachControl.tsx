// src/components/MatchApproachControl.tsx
// Planteamiento del partido (v0.25.75): la decisión del usuario en Copa, Europa y Supercopa.

import { COACH_SPECIALIST_SKILL, coachReinforcesApproach } from "../simulation/matchEngine";
import type { CoachSkills, MatchApproach } from "../types/game";
import { MatchIcon } from "./MatchIcon";

import "./MatchApproachControl.css";

const OPTIONS: { value: MatchApproach; label: string; hint: string }[] = [
  { value: "defensive", label: "Defensivo", hint: "Menos goles en los dos lados. Rinde más contra un rival superior." },
  { value: "balanced", label: "Equilibrado", hint: "Tu juego de siempre." },
  { value: "attacking", label: "Ofensivo", hint: "Más goles en los dos lados. Rinde más contra un rival inferior." },
];

const COMPETITION_NAME = { cup: "Copa", europe: "Europa" } as const;

function getCoachNotes(approach: MatchApproach, competition: "cup" | "europe" | "supercopa", coachSkills?: CoachSkills): string[] {
  const notes: string[] = [];
  const competitionSkill = competition === "supercopa" ? undefined : coachSkills?.[competition];

  if (competition !== "supercopa" && (competitionSkill ?? 0) >= COACH_SPECIALIST_SKILL) {
    notes.push(`Tu entrenador es especialista en ${COMPETITION_NAME[competition]}: +1 a tu media.`);
  }

  if (coachReinforcesApproach(approach, coachSkills)) {
    notes.push(`Tu entrenador refuerza este planteamiento: ${approach === "attacking" ? "marcas todavía más" : "encajas todavía menos"}.`);
  }

  return notes;
}

export function MatchApproachControl({
  value,
  onChange,
  competition,
  coachSkills,
}: {
  value: MatchApproach;
  onChange: (approach: MatchApproach) => void;
  competition: "cup" | "europe" | "supercopa";
  coachSkills?: CoachSkills;
}) {
  const selected = OPTIONS.find((option) => option.value === value);

  return (
    <div className="match-approach">
      <div className="match-approach-options" role="group" aria-label="Planteamiento del partido">
        <span>Planteamiento</span>
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={value === option.value ? "match-approach-option match-approach-option-active" : "match-approach-option"}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            <MatchIcon kind={option.value} />
            {option.label}
          </button>
        ))}
      </div>
      <p>
        {selected?.hint}
        {competition === "supercopa" && " Vale para todos tus partidos de la Supercopa."}
      </p>
      {getCoachNotes(value, competition, coachSkills).map((note) => (
        <p key={note} className="match-approach-coach">{note}</p>
      ))}
    </div>
  );
}
