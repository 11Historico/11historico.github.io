// src/components/TeamKitIcon.tsx

import "./TeamKitIcon.css";

function normalizeTeamNameForKit(teamName: string): string {
  return teamName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function getTeamKitClass(teamName: string): string {
  const normalizedName = normalizeTeamNameForKit(teamName);

  if (
    normalizedName.includes("athletic club historico") ||
    normalizedName.includes("athletic historico") ||
    normalizedName.includes("zurigorri")
  ) {
    return "team-kit-athletic";
  }

  if (normalizedName.includes("sevilla")) {
    return "team-kit-sevilla";
  }

  if (normalizedName.includes("real madrid")) return "team-kit-real-madrid";
  if (normalizedName.includes("barcelona") || normalizedName.includes("fc barcelona")) return "team-kit-barcelona";
  if (normalizedName.includes("atletico")) return "team-kit-atletico";
  if (normalizedName.includes("valencia")) return "team-kit-valencia";
  if (normalizedName.includes("betis")) return "team-kit-betis";
  if (normalizedName.includes("real sociedad")) return "team-kit-sociedad";
  if (normalizedName.includes("osasuna")) return "team-kit-osasuna";
  if (normalizedName.includes("celta")) return "team-kit-celta";
  if (normalizedName.includes("alaves")) return "team-kit-alaves";
  if (normalizedName.includes("elche")) return "team-kit-elche";
  if (normalizedName.includes("getafe")) return "team-kit-getafe";
  if (normalizedName.includes("girona")) return "team-kit-girona";
  if (normalizedName.includes("levante")) return "team-kit-levante";
  if (normalizedName.includes("rayo")) return "team-kit-rayo";
  if (normalizedName.includes("espanyol")) return "team-kit-espanyol";
  if (normalizedName.includes("mallorca")) return "team-kit-mallorca";
  if (normalizedName.includes("oviedo")) return "team-kit-oviedo";
  if (normalizedName.includes("villarreal")) return "team-kit-villarreal";
  if (normalizedName.includes("mirandes")) return "team-kit-mirandes";
  if (normalizedName.includes("zaragoza")) return "team-kit-zaragoza";
  if (normalizedName.includes("sporting")) return "team-kit-sporting";
  if (normalizedName.includes("tenerife")) return "team-kit-tenerife";
  if (normalizedName.includes("racing")) return "team-kit-racing";
  if (normalizedName.includes("deportivo de la coruna") || normalizedName.includes("coruna")) return "team-kit-deportivo";
  if (normalizedName.includes("albacete")) return "team-kit-albacete";
  if (normalizedName.includes("alcoyano")) return "team-kit-alcoyano";
  if (normalizedName.includes("cultural")) return "team-kit-cultural";
  if (normalizedName.includes("cadiz")) return "team-kit-cadiz";
  if (normalizedName.includes("malaga")) return "team-kit-malaga";
  if (normalizedName.includes("numancia")) return "team-kit-numancia";
  if (normalizedName.includes("almeria")) return "team-kit-almeria";
  if (normalizedName.includes("alcorcon")) return "team-kit-alcorcon";
  if (normalizedName.includes("badajoz")) return "team-kit-badajoz";
  if (normalizedName.includes("castellon")) return "team-kit-castellon";
  if (normalizedName.includes("eibar")) return "team-kit-eibar";
  if (normalizedName.includes("burgos")) return "team-kit-burgos";
  if (normalizedName.includes("las palmas")) return "team-kit-las-palmas";
  if (normalizedName.includes("cordoba")) return "team-kit-cordoba";
  if (normalizedName.includes("granada")) return "team-kit-granada";
  if (normalizedName.includes("huesca")) return "team-kit-huesca";
  if (normalizedName.includes("barakaldo")) return "team-kit-barakaldo";
  if (normalizedName.includes("sestao")) return "team-kit-sestao";
  if (normalizedName.includes("portugalete")) return "team-kit-portugalete";

  return "team-kit-default";
}

export function TeamKitIcon({ teamName, compact = false }: { teamName: string; compact?: boolean }) {
  return (
    <span
      className={`team-kit-icon ${getTeamKitClass(teamName)} ${
        compact ? "team-kit-icon-compact" : ""
      }`}
      aria-label={`Camiseta ${teamName}`}
      title={teamName}
    >
      <span className="team-kit-sleeve team-kit-sleeve-left" />
      <span className="team-kit-body" />
      <span className="team-kit-sleeve team-kit-sleeve-right" />
    </span>
  );
}

export function TeamWithKit({ teamName }: { teamName: string }) {
  return (
    <span className="team-with-kit">
      <TeamKitIcon teamName={teamName} />
      <span>{teamName}</span>
    </span>
  );
}
