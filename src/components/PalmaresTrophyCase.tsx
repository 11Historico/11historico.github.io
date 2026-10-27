// src/components/PalmaresTrophyCase.tsx

import type { FinalGameSummary, TrophyCount, TrophyId } from "../types/game";
import type { CareerTrophyCounts } from "../types/career";

import "./PalmaresTrophyCase.css";

interface PalmaresTrophyCaseProps {
  summary?: FinalGameSummary;
  trophyCounts?: CareerTrophyCounts;
  variant?: "single-game" | "career";
}

interface TrophySvgProps {
  dimmed?: boolean;
}

const DEFAULT_TROPHIES: TrophyCount[] = [
  { id: "liga", label: "Liga", count: 0 },
  { id: "copa_del_rey", label: "Copa del Rey", count: 0 },
  { id: "champions", label: "Champions League", count: 0 },
  { id: "europa_league", label: "Europa League", count: 0 },
  { id: "conference_league", label: "Conference League", count: 0 },
  { id: "supercopa", label: "Supercopa de España", count: 0 },
];

function buildCareerTrophies(trophyCounts: CareerTrophyCounts): TrophyCount[] {
  const byId = new Map<TrophyId, TrophyCount>(DEFAULT_TROPHIES.map((item) => [item.id, item]));

  byId.set("liga", { id: "liga", label: "Liga", count: trophyCounts.liga });
  byId.set("copa_del_rey", { id: "copa_del_rey", label: "Copa del Rey", count: trophyCounts.copa });
  byId.set("champions", { id: "champions", label: "Champions League", count: trophyCounts.champions });
  byId.set("europa_league", { id: "europa_league", label: "Europa League", count: trophyCounts.europaLeague });
  byId.set("conference_league", { id: "conference_league", label: "Conference League", count: trophyCounts.conference });
  byId.set("supercopa", { id: "supercopa", label: "Supercopa de España", count: trophyCounts.supercopa });

  return DEFAULT_TROPHIES.map((fallback) => byId.get(fallback.id) ?? fallback);
}

function buildTrophies(summary: FinalGameSummary | undefined, trophyCounts?: CareerTrophyCounts): TrophyCount[] {
  if (trophyCounts) {
    return buildCareerTrophies(trophyCounts);
  }

  const byId = new Map<TrophyId, TrophyCount>(DEFAULT_TROPHIES.map((item) => [item.id, item]));

  for (const trophy of summary?.trophiesWon ?? []) {
    byId.set(trophy.id, trophy);
  }

  return DEFAULT_TROPHIES.map((fallback) => byId.get(fallback.id) ?? fallback);
}

function getCareerTrophyNote(trophy: TrophyCount): string {
  if (trophy.count > 0) {
    const suffix = trophy.count === 1 ? "título acumulado" : "títulos acumulados";
    return `${trophy.count} ${suffix} en carrera`;
  }

  if (trophy.id === "supercopa") return "Sin Supercopa ganada todavía";
  if (trophy.id === "liga") return "Sin Liga ganada todavía";
  if (trophy.id === "copa_del_rey") return "Sin Copa ganada todavía";

  return `Sin ${trophy.label} ganada todavía`;
}

function getTrophyNote(trophy: TrophyCount, summary: FinalGameSummary | undefined, variant: "single-game" | "career"): string {
  if (variant === "career" || !summary) {
    return getCareerTrophyNote(trophy);
  }
  if (trophy.id === "liga") {
    return summary.leaguePosition === 1 ? "Campeón de Liga" : `${summary.leaguePosition}º en Liga`;
  }

  if (trophy.id === "copa_del_rey") {
    if (summary.cupTrophyWon) return "Campeón de Copa";
    if (summary.cupChampionTeamName) return `Campeón: ${summary.cupChampionTeamName}`;
    return summary.cupRoundReached ?? "Copa pendiente";
  }

  return "Preparado para modo carrera";
}

function SvgDefs() {
  return (
    <defs>
      <linearGradient id="silverMetal" x1="0" x2="1">
        <stop offset="0%" stopColor="#5d6066" />
        <stop offset="17%" stopColor="#f7f8f9" />
        <stop offset="34%" stopColor="#b9bec6" />
        <stop offset="54%" stopColor="#ffffff" />
        <stop offset="73%" stopColor="#8e949e" />
        <stop offset="100%" stopColor="#44484f" />
      </linearGradient>
      <linearGradient id="silverDark" x1="0" x2="1">
        <stop offset="0%" stopColor="#202226" />
        <stop offset="50%" stopColor="#d2d5db" />
        <stop offset="100%" stopColor="#25282d" />
      </linearGradient>
      <linearGradient id="goldMetal" x1="0" x2="1">
        <stop offset="0%" stopColor="#8b5d16" />
        <stop offset="20%" stopColor="#fff0a8" />
        <stop offset="45%" stopColor="#d6a43b" />
        <stop offset="67%" stopColor="#fff6bd" />
        <stop offset="100%" stopColor="#7b4b12" />
      </linearGradient>
      <linearGradient id="blackBase" x1="0" x2="1">
        <stop offset="0%" stopColor="#050505" />
        <stop offset="38%" stopColor="#343238" />
        <stop offset="70%" stopColor="#090909" />
        <stop offset="100%" stopColor="#1f1d22" />
      </linearGradient>
      <radialGradient id="shine" cx="38%" cy="18%" r="58%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="42%" stopColor="#ffffff" stopOpacity="0.24" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <filter id="trophyShadow" x="-30%" y="-20%" width="160%" height="150%">
        <feDropShadow dx="0" dy="9" stdDeviation="5" floodColor="#000000" floodOpacity="0.45" />
      </filter>
    </defs>
  );
}

function LigaTrophy({ dimmed }: TrophySvgProps) {
  return (
    <svg className="palmares-svg-trophy" viewBox="0 0 140 170" role="img" aria-label="Trofeo de Liga">
      <SvgDefs />
      <g filter="url(#trophyShadow)" opacity={dimmed ? 0.72 : 1}>
        <path d="M34 43 C16 43 13 59 18 75 C23 91 37 95 48 93" fill="none" stroke="url(#silverMetal)" strokeWidth="8" strokeLinecap="round" />
        <path d="M106 43 C124 43 127 59 122 75 C117 91 103 95 92 93" fill="none" stroke="url(#silverMetal)" strokeWidth="8" strokeLinecap="round" />
        <path d="M41 35 C38 54 41 77 53 91 C60 99 80 99 87 91 C99 77 102 54 99 35 Z" fill="url(#silverMetal)" stroke="#f9fbff" strokeOpacity="0.55" strokeWidth="1.5" />
        <path d="M49 44 C50 69 56 85 68 91" fill="none" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="3" />
        <circle cx="70" cy="52" r="8" fill="none" stroke="#dce1ea" strokeWidth="2" opacity="0.75" />
        <path d="M62 95 H78 V118 H62 Z" fill="url(#silverDark)" />
        <path d="M49 118 H91 V133 H49 Z" rx="4" fill="url(#blackBase)" />
        <path d="M37 133 H103 V153 H37 Z" rx="8" fill="url(#blackBase)" />
        <path d="M42 137 H98" stroke="#777" strokeOpacity="0.45" />
        <ellipse cx="62" cy="42" rx="18" ry="12" fill="url(#shine)" opacity="0.6" />
      </g>
    </svg>
  );
}

function CopaDelReyTrophy({ dimmed }: TrophySvgProps) {
  return (
    <svg className="palmares-svg-trophy" viewBox="0 0 140 170" role="img" aria-label="Trofeo de Copa del Rey">
      <SvgDefs />
      <g filter="url(#trophyShadow)" opacity={dimmed ? 0.72 : 1}>
        <path d="M37 38 C14 42 12 68 28 80 C35 86 43 86 50 82" fill="none" stroke="url(#silverMetal)" strokeWidth="7" strokeLinecap="round" />
        <path d="M103 38 C126 42 128 68 112 80 C105 86 97 86 90 82" fill="none" stroke="url(#silverMetal)" strokeWidth="7" strokeLinecap="round" />
        <path d="M43 23 H97 V72 C97 92 84 105 70 105 C56 105 43 92 43 72 Z" fill="url(#silverMetal)" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.4" />
        <path d="M50 33 C52 70 58 91 70 99" fill="none" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="3" />
        <path d="M57 49 H83" stroke="#79808a" strokeOpacity="0.55" strokeWidth="2" />
        <path d="M61 105 H79 V124 H61 Z" fill="url(#silverDark)" />
        <path d="M50 124 H90 V136 H50 Z" rx="4" fill="url(#silverMetal)" />
        <path d="M36 136 H104 V156 H36 Z" rx="8" fill="url(#blackBase)" />
        <ellipse cx="61" cy="36" rx="19" ry="14" fill="url(#shine)" opacity="0.6" />
      </g>
    </svg>
  );
}

function ChampionsTrophy({ dimmed }: TrophySvgProps) {
  return (
    <svg className="palmares-svg-trophy palmares-svg-trophy-large" viewBox="0 0 150 180" role="img" aria-label="Trofeo Champions League">
      <SvgDefs />
      <g filter="url(#trophyShadow)" opacity={dimmed ? 0.72 : 1}>
        <path d="M39 34 C13 18 9 58 29 88 C38 101 49 103 57 93" fill="none" stroke="url(#silverMetal)" strokeWidth="7" strokeLinecap="round" />
        <path d="M111 34 C137 18 141 58 121 88 C112 101 101 103 93 93" fill="none" stroke="url(#silverMetal)" strokeWidth="7" strokeLinecap="round" />
        <path d="M49 29 H101 V88 C101 113 88 130 75 130 C62 130 49 113 49 88 Z" fill="url(#silverMetal)" stroke="#ffffff" strokeOpacity="0.72" strokeWidth="1.5" />
        <path d="M58 41 C59 84 64 113 75 124" fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="3" />
        <path d="M63 130 H87 V146 H63 Z" fill="url(#silverDark)" />
        <path d="M49 146 H101 V158 H49 Z" rx="5" fill="url(#silverMetal)" />
        <path d="M39 158 H111 V173 H39 Z" rx="8" fill="url(#blackBase)" />
        <ellipse cx="68" cy="45" rx="20" ry="18" fill="url(#shine)" opacity="0.68" />
      </g>
    </svg>
  );
}

function EuropaLeagueTrophy({ dimmed }: TrophySvgProps) {
  return (
    <svg className="palmares-svg-trophy" viewBox="0 0 140 170" role="img" aria-label="Trofeo Europa League">
      <SvgDefs />
      <g filter="url(#trophyShadow)" opacity={dimmed ? 0.72 : 1}>
        <path d="M48 20 H92 L83 112 H57 Z" fill="url(#silverMetal)" stroke="#f4f4f4" strokeOpacity="0.48" strokeWidth="1.2" />
        <path d="M54 28 L83 102" stroke="#777" strokeWidth="4" opacity="0.55" />
        <path d="M62 25 L88 90" stroke="#f8f8f8" strokeWidth="3" opacity="0.45" />
        <path d="M60 112 H80 V128 H60 Z" fill="url(#silverDark)" />
        <path d="M47 128 H93 V141 H47 Z" rx="4" fill="url(#silverMetal)" />
        <path d="M35 141 H105 V158 H35 Z" rx="8" fill="url(#blackBase)" />
      </g>
    </svg>
  );
}

function ConferenceTrophy({ dimmed }: TrophySvgProps) {
  return (
    <svg className="palmares-svg-trophy" viewBox="0 0 140 170" role="img" aria-label="Trofeo Conference League">
      <SvgDefs />
      <g filter="url(#trophyShadow)" opacity={dimmed ? 0.72 : 1}>
        <path d="M54 22 C52 52 52 86 59 113 H81 C88 86 88 52 86 22 Z" fill="url(#silverMetal)" stroke="#f4f4f4" strokeOpacity="0.48" strokeWidth="1.2" />
        <path d="M61 26 V111 M70 24 V113 M79 26 V111" stroke="#595f67" strokeOpacity="0.48" strokeWidth="3" />
        <circle cx="70" cy="81" r="8" fill="url(#silverDark)" opacity="0.7" />
        <path d="M60 113 H80 V130 H60 Z" fill="url(#silverDark)" />
        <path d="M46 130 H94 V142 H46 Z" rx="4" fill="url(#silverMetal)" />
        <path d="M35 142 H105 V158 H35 Z" rx="8" fill="url(#blackBase)" />
      </g>
    </svg>
  );
}

function SupercopaTrophy({ dimmed }: TrophySvgProps) {
  return (
    <svg className="palmares-svg-trophy" viewBox="0 0 140 170" role="img" aria-label="Trofeo Supercopa de España">
      <SvgDefs />
      <g filter="url(#trophyShadow)" opacity={dimmed ? 0.72 : 1}>
        <path d="M35 54 C19 55 19 75 32 83 C39 87 47 86 52 80" fill="none" stroke="url(#goldMetal)" strokeWidth="6" strokeLinecap="round" />
        <path d="M105 54 C121 55 121 75 108 83 C101 87 93 86 88 80" fill="none" stroke="url(#goldMetal)" strokeWidth="6" strokeLinecap="round" />
        <path d="M43 45 C45 75 56 93 70 93 C84 93 95 75 97 45 Z" fill="url(#goldMetal)" stroke="#fff1ad" strokeOpacity="0.62" strokeWidth="1.2" />
        <path d="M62 94 H78 V118 H62 Z" fill="url(#goldMetal)" />
        <path d="M49 118 H91 V132 H49 Z" rx="4" fill="url(#blackBase)" />
        <path d="M37 132 H103 V152 H37 Z" rx="8" fill="url(#blackBase)" />
      </g>
    </svg>
  );
}

function TrophySvg({ id, dimmed }: { id: TrophyId; dimmed?: boolean }) {
  if (id === "liga") return <LigaTrophy dimmed={dimmed} />;
  if (id === "copa_del_rey") return <CopaDelReyTrophy dimmed={dimmed} />;
  if (id === "champions") return <ChampionsTrophy dimmed={dimmed} />;
  if (id === "europa_league") return <EuropaLeagueTrophy dimmed={dimmed} />;
  if (id === "conference_league") return <ConferenceTrophy dimmed={dimmed} />;
  return <SupercopaTrophy dimmed={dimmed} />;
}

export function PalmaresTrophyCase({ summary, trophyCounts, variant = trophyCounts ? "career" : "single-game" }: PalmaresTrophyCaseProps) {
  const trophies = buildTrophies(summary, trophyCounts);
  const totalTitles = trophies.reduce((sum, trophy) => sum + trophy.count, 0);

  return (
    <section className="palmares-case-card palmares-case-card-premium">
      <header className="palmares-case-header">
        <div>
          <span>Palmarés</span>
          <h2>Vitrina histórica</h2>
          <p>
            {variant === "career"
              ? "Títulos acumulados en la carrera, incluida Supercopa si se ganó antes del Game Over."
              : "Trofeos ganados en esta partida. La vitrina queda preparada para sumar títulos acumulados en el futuro modo carrera."}
          </p>
        </div>

        <strong>{totalTitles} títulos</strong>
      </header>

      <div className="palmares-museum-cabinet">
        {trophies.map((trophy) => (
          <article
            key={trophy.id}
            className={`palmares-museum-cell ${trophy.count > 0 ? "palmares-museum-cell-won" : ""}`}
          >
            <div className="palmares-cell-plate">
              <span>{trophy.label}</span>
              <strong>x{trophy.count}</strong>
            </div>

            <div className="palmares-spotlight" />

            <div className="palmares-svg-wrap">
              <TrophySvg id={trophy.id} dimmed={trophy.count === 0} />
            </div>

            <small>{getTrophyNote(trophy, summary, variant)}</small>
          </article>
        ))}
      </div>

      <footer className="palmares-case-footer">
        <span>Orgullo · Historia · Futuro</span>
      </footer>
    </section>
  );
}

export default PalmaresTrophyCase;
