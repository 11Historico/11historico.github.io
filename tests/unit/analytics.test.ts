import { describe, expect, it } from "vitest";
import { isAnalyticsEnabled, trackEvent } from "../../src/services/analytics";

describe("analítica sin cookies", () => {
  it("está desactivada por defecto, sin VITE_ANALYTICS_HOST", () => {
    expect(isAnalyticsEnabled()).toBe(false);
  });

  it("trackEvent no hace nada cuando está desactivada (ni lanza en Node)", () => {
    expect(() => trackEvent("career_start")).not.toThrow();
    expect(() => trackEvent("game_over")).not.toThrow();
  });
});
