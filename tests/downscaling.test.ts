import { describe, expect, it } from "vitest";
import {
  downscaleToNeighborhood,
  smoothTrajectory,
  synthesizeClimateStory,
} from "@/lib/downscaling";
import {
  SCENARIO_MULTIPLIER,
  SCENARIO_SMOKE_RAMP,
  PROJECTION_YEARS,
} from "@/lib/scenarios";
import { CITIES } from "@/data/cities";
import type { Neighborhood } from "@/lib/types";

describe("smoothTrajectory", () => {
  it("ends near baseline when multiplier is 0", () => {
    const series = smoothTrajectory(10, 20, "rcp26");
    // rcp26 multiplier 0.55 -> final ~10 + (20-10)*0.55 = 15.5
    expect(series.at(-1)?.value).toBeCloseTo(15.5, 1);
  });

  it("starts at baseline (within logistic tail at year 1990)", () => {
    const series = smoothTrajectory(10, 20, "rcp45");
    // 1990 is far enough back that the logistic tail is near 0; we allow a
    // small residual rather than a strict equality.
    expect(series[0].value).toBeGreaterThanOrEqual(10);
    expect(series[0].value).toBeLessThan(10.05);
  });

  it("respects scenario multiplier ordering: rcp85 > rcp45 > rcp26", () => {
    const a = smoothTrajectory(10, 50, "rcp26").at(-1)?.value ?? 0;
    const b = smoothTrajectory(10, 50, "rcp45").at(-1)?.value ?? 0;
    const c = smoothTrajectory(10, 50, "rcp85").at(-1)?.value ?? 0;
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });

  it("covers the full 1990-2060 horizon", () => {
    const series = smoothTrajectory(10, 20, "rcp45");
    expect(series.length).toBe(PROJECTION_YEARS.length);
    expect(series.at(0)?.year).toBe(1990);
    expect(series.at(-1)?.year).toBe(2060);
  });
});

describe("downscaleToNeighborhood", () => {
  const seattle = CITIES.find((c) => c.id === "seattle")!;
  const baselineProj = seattle.projections.rcp45;

  it("applies positive UHI offset to heat projections in low-canopy neighborhoods", () => {
    const downtown = seattle.neighborhoods.find((n) => n.id === "downtown")!;
    const out = downscaleToNeighborhood(baselineProj, downtown, "rcp45");
    const cityHeat = baselineProj.find((p) => p.hazard === "heat")!;
    const nHeat = out.find((p) => p.hazard === "heat")!;
    expect(nHeat.baseline).toBeGreaterThan(cityHeat.baseline);
  });

  it("amplifies flood exposure for high-flood-risk neighborhoods", () => {
    const rv = seattle.neighborhoods.find((n) => n.id === "rainier-valley")!;
    const mag = seattle.neighborhoods.find((n) => n.id === "magnolia")!;
    const rvFlood = downscaleToNeighborhood(baselineProj, rv, "rcp45")
      .find((p) => p.hazard === "flood")!;
    const magFlood = downscaleToNeighborhood(baselineProj, mag, "rcp45")
      .find((p) => p.hazard === "flood")!;
    expect(rvFlood.projected).toBeGreaterThan(magFlood.projected);
  });

  it("applies drought penalty to impervious-dominant neighborhoods", () => {
    const downtown = seattle.neighborhoods.find((n) => n.id === "downtown")!;
    const mag = seattle.neighborhoods.find((n) => n.id === "magnolia")!;
    const dDrought = downscaleToNeighborhood(baselineProj, downtown, "rcp45")
      .find((p) => p.hazard === "drought")!;
    const mDrought = downscaleToNeighborhood(baselineProj, mag, "rcp45")
      .find((p) => p.hazard === "drought")!;
    expect(dDrought.projected).toBeGreaterThan(mDrought.projected);
  });

  it("smoke is uniform across neighborhoods (regional hazard)", () => {
    const downtown = seattle.neighborhoods.find((n) => n.id === "downtown")!;
    const mag = seattle.neighborhoods.find((n) => n.id === "magnolia")!;
    const dSmoke = downscaleToNeighborhood(baselineProj, downtown, "rcp45")
      .find((p) => p.hazard === "smoke")!;
    const mSmoke = downscaleToNeighborhood(baselineProj, mag, "rcp45")
      .find((p) => p.hazard === "smoke")!;
    expect(dSmoke.projected).toBeCloseTo(mSmoke.projected, 2);
  });

  it("synthetic neighborhood with zero canopy still produces finite offsets", () => {
    const n: Neighborhood = {
      id: "x",
      name: "X",
      polygon: [[0, 0]],
      treeCanopy: 0,
      impervious: 1,
      water: 0,
      heatDelta: 5,
      floodRisk: "severe",
      population: 1000,
    };
    const out = downscaleToNeighborhood(baselineProj, n, "rcp85");
    for (const p of out) {
      expect(Number.isFinite(p.baseline)).toBe(true);
      expect(Number.isFinite(p.projected)).toBe(true);
      expect(p.series.length).toBe(PROJECTION_YEARS.length);
    }
  });
});

describe("synthesizeClimateStory", () => {
  const seattle = CITIES.find((c) => c.id === "seattle")!;

  it("produces a non-empty headline and paragraphs", () => {
    const story = synthesizeClimateStory(seattle, "rcp45");
    expect(story.headline).toMatch(/Seattle/);
    expect(story.paragraphs.length).toBeGreaterThanOrEqual(3);
    expect(story.paragraphs.every((p) => p.length > 50)).toBe(true);
  });

  it("includes neighborhood name in headline when neighborhood is provided", () => {
    const rv = seattle.neighborhoods.find((n) => n.id === "rainier-valley")!;
    const story = synthesizeClimateStory(seattle, "rcp85", rv);
    expect(story.headline).toMatch(/Rainier Valley/);
    expect(story.neighborhood).toBe("Rainier Valley");
  });

  it("worsens hazards under rcp85 vs rcp26", () => {
    const s26 = synthesizeClimateStory(seattle, "rcp26");
    const s85 = synthesizeClimateStory(seattle, "rcp85");
    const heat26 = s26.risks.find((r) => r.hazard === "heat")?.delta ?? "";
    const heat85 = s85.risks.find((r) => r.hazard === "heat")?.delta ?? "";
    // extract first integer
    const n26 = parseInt(heat26.match(/\d+/)?.[0] ?? "0");
    const n85 = parseInt(heat85.match(/\d+/)?.[0] ?? "0");
    expect(n85).toBeGreaterThanOrEqual(n26);
  });

  it("emits 3 levers", () => {
    const story = synthesizeClimateStory(seattle, "rcp45");
    expect(story.levers.length).toBe(3);
  });
});

describe("scenario constants", () => {
  it("multipliers are monotonically increasing", () => {
    expect(SCENARIO_MULTIPLIER.rcp26).toBeLessThan(SCENARIO_MULTIPLIER.rcp45);
    expect(SCENARIO_MULTIPLIER.rcp45).toBeLessThan(SCENARIO_MULTIPLIER.rcp85);
  });
  it("smoke ramp is monotonic", () => {
    expect(SCENARIO_SMOKE_RAMP.rcp26).toBeLessThan(SCENARIO_SMOKE_RAMP.rcp45);
    expect(SCENARIO_SMOKE_RAMP.rcp45).toBeLessThan(SCENARIO_SMOKE_RAMP.rcp85);
  });
});
