// src/components/MatchVerdictBanner.tsx
//
// Cartel al final de un partido de eliminatoria (v0.25.86): «Has sido eliminado» o «Has clasificado»,
// para que no haya que leer la tarjeta de Copa o de Europa para saber qué ha pasado.

import type { MatchVerdict } from "./matchVerdict";

import "./MatchVerdictBanner.css";

export function MatchVerdictBanner({ verdict }: { verdict: MatchVerdict }) {
  return (
    <p className={`match-verdict match-verdict-${verdict.kind}`} role="status">
      <strong>{verdict.title}</strong>
      <span>{verdict.detail}</span>
    </p>
  );
}
