// src/components/MatchIcon.tsx
//
// Iconos de planteamiento y de factor del partido (v0.25.76), con trazos simples y
// currentColor como CompetitionIcon. Son decorativos: siempre van junto a su texto.

import "./CompetitionIcon.css";

export type MatchIconKind = "defensive" | "balanced" | "attacking" | "mentality" | "merit" | "warning" | "extra_time";

function IconShapes({ kind }: { kind: MatchIconKind }) {
  switch (kind) {
    case "defensive":
      // Escudo.
      return <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.500-7-10V6z" />;
    case "balanced":
      // Balanza.
      return (
        <>
          <path d="M12 4v16M8 20h8M5 7h14" />
          <path d="M5 7l-2.500 6a2.500 2.500 0 0 0 5 0zM19 7l-2.500 6a2.500 2.500 0 0 0 5 0z" />
        </>
      );
    case "attacking":
      // Flecha hacia la portería rival.
      return <path d="M5 19L19 5M9 5h10v10" />;
    case "mentality":
      // Rayo.
      return <path d="M13 3L5 14h6l-1 7 8-11h-6z" />;
    case "merit":
      // Estrella de cinco puntas.
      return <path d="M12 3l2.600 5.600 6.100.7-4.500 4.200 1.200 6L12 16.600 6.600 19.500l1.200-6-4.500-4.200 6.100-.7z" />;
    case "warning":
      // Triángulo de aviso.
      return <path d="M12 4l9 16H3zM12 10v4M12 17v.5" />;
    case "extra_time":
      // Reloj.
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      );
  }
}

export function MatchIcon({ kind }: { kind: MatchIconKind }) {
  return (
    <svg
      className="competition-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <IconShapes kind={kind} />
    </svg>
  );
}
