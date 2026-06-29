import { describe, expect, it } from "vitest";
import { scoreProperty } from "@/lib/property-score";
import { CITIES } from "@/data/cities";

describe("scoreProperty", () => {
  const seattle = CITIES.find((c) => c.id === "seattle")!;

  it("returns all 5 hazard subscores and a 0-100 overall", () => {
    const n = seattle.neighborhoods.find((n) => n.id === "downtown")!;
    const score = scoreProperty(seattle, n, "100 Pine St", "rcp45");
    expect(score.components.heat).toBeGreaterThanOrEqual(0);
    expect(score.components.heat).toBeLessThanOrEqual(100);
    for (const v of Object.values(score.components)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it("downtown (impervious, low canopy) scores lower on heat than Magnolia", () => {
    const downtown = seattle.neighborhoods.find((n) => n.id === "downtown")!;
    const mag = seattle.neighborhoods.find((n) => n.id === "magnolia")!;
    const d = scoreProperty(seattle, downtown, "X", "rcp45");
    const m = scoreProperty(seattle, mag, "X", "rcp45");
    // Downtown should be at least as bad as Magnolia; usually strictly worse.
    expect(d.components.heat).toBeLessThanOrEqual(m.components.heat);
  });

  it("returns worse scores under rcp85 than rcp26", () => {
    const downtown = seattle.neighborhoods.find((n) => n.id === "downtown")!;
    const s26 = scoreProperty(seattle, downtown, "X", "rcp26");
    const s85 = scoreProperty(seattle, downtown, "X", "rcp85");
    expect(s85.overall).toBeLessThanOrEqual(s26.overall);
  });

  it("emits recommendations for low-scoring hazards", () => {
    const downtown = seattle.neighborhoods.find((n) => n.id === "downtown")!;
    const score = scoreProperty(seattle, downtown, "X", "rcp85");
    expect(score.recommendations.length).toBeGreaterThan(0);
    for (const r of score.recommendations) {
      expect(r.action.length).toBeGreaterThan(0);
      expect(r.rationale.length).toBeGreaterThan(0);
      expect(["low", "medium", "high"]).toContain(r.cost);
      expect(r.impactDelta).toBeGreaterThan(0);
    }
  });

  it("echoes the address and neighborhoodId", () => {
    const n = seattle.neighborhoods.find((n) => n.id === "ballard")!;
    const score = scoreProperty(seattle, n, "5502 22nd Ave NW", "rcp45");
    expect(score.address).toBe("5502 22nd Ave NW");
    expect(score.neighborhoodId).toBe("ballard");
  });
});
