import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CompetitionIcon, type CompetitionIconKind } from "../../src/components/CompetitionIcon";

const KINDS: Array<[CompetitionIconKind, string]> = [
  ["liga", "LaLiga"],
  ["copa", "Copa del Rey"],
  ["supercopa", "Supercopa de España"],
  ["champions", "Champions League"],
  ["europa", "Europa League"],
  ["conference", "Conference League"],
];

describe("iconos por competición", () => {
  it.each(KINDS)("%s se renderiza como imagen accesible con el nombre de la competición", (kind, label) => {
    const markup = renderToStaticMarkup(<CompetitionIcon kind={kind} />);

    expect(markup).toContain("<svg");
    expect(markup).toContain('role="img"');
    expect(markup).toContain(`aria-label="${label}"`);
    expect(markup).toContain('stroke="currentColor"');
  });

  it("cada competición tiene una forma distinta", () => {
    const shapes = KINDS.map(([kind]) => renderToStaticMarkup(<CompetitionIcon kind={kind} />));
    expect(new Set(shapes).size).toBe(KINDS.length);
  });
});
