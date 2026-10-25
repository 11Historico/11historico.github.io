// src/components/CompetitionIcon.tsx
//
// Iconos propios por competición (v0.25.8). Trazos simples con currentColor para
// heredar el color de cada tema. No usan logos ni símbolos oficiales de UEFA, LaLiga
// ni de la Copa del Rey.

import "./CompetitionIcon.css";

export type CompetitionIconKind = "liga" | "copa" | "supercopa" | "champions" | "europa" | "conference";

const COMPETITION_ICON_LABELS: Record<CompetitionIconKind, string> = {
  liga: "LaLiga",
  copa: "Copa del Rey",
  supercopa: "Supercopa de España",
  champions: "Champions League",
  europa: "Europa League",
  conference: "Conference League",
};

function IconShapes({ kind }: { kind: CompetitionIconKind }) {
  switch (kind) {
    case "liga":
      // Campo: círculo central y línea de medio campo.
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="3" x2="12" y2="21" />
          <circle cx="12" cy="12" r="2.2" />
        </>
      );
    case "copa":
      // Copa: cuenco, asas y pie.
      return (
        <>
          <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
          <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
          <path d="M12 13v4M8 21h8M9 17h6" />
        </>
      );
    case "supercopa":
      // Copa con estrella: la misma copa con una estrella en el cuenco.
      return (
        <>
          <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
          <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
          <path d="M12 6.4l.7 1.4 1.5.2-1.1 1 .3 1.5-1.4-.8-1.4.8.3-1.5-1.1-1 1.5-.2z" />
          <path d="M12 13v4M8 21h8M9 17h6" />
        </>
      );
    case "champions":
      // Estrella de cinco puntas.
      return <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z" />;
    case "europa":
      // Dos chevrones hacia arriba.
      return (
        <>
          <path d="M5 11l7-5.5 7 5.5" />
          <path d="M5 17l7-5.5 7 5.5" />
        </>
      );
    case "conference":
      // Banderín sobre un mástil.
      return (
        <>
          <path d="M6 3v18" />
          <path d="M6 4h11l-3 3.5 3 3.5H6" />
        </>
      );
  }
}

export function CompetitionIcon({ kind }: { kind: CompetitionIconKind }) {
  return (
    <svg
      className="competition-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={COMPETITION_ICON_LABELS[kind]}
    >
      <IconShapes kind={kind} />
    </svg>
  );
}

export default CompetitionIcon;
