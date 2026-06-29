import { describe, expect, it } from "vitest";
import { simulateIntervention } from "@/lib/what-if";

describe("simulateIntervention", () => {
  it("scales linearly with coverage for tree canopy", () => {
    const a = simulateIntervention(
      { type: "tree-canopy", coveragePct: 10 },
      { baselineTemp: 80, coveragePct: 10 },
    );
    const b = simulateIntervention(
      { type: "tree-canopy", coveragePct: 30 },
      { baselineTemp: 80, coveragePct: 30 },
    );
    expect(b.deltaF).toBeGreaterThan(a.deltaF);
    expect(b.deltaF).toBeCloseTo(a.deltaF * 3, 1);
  });

  it("higher-impact intervention yields larger cooling at same coverage", () => {
    const trees = simulateIntervention(
      { type: "tree-canopy", coveragePct: 25 },
      { baselineTemp: 80, coveragePct: 25 },
    );
    const forest = simulateIntervention(
      { type: "urban-forest", coveragePct: 25 },
      { baselineTemp: 80, coveragePct: 25 },
    );
    expect(forest.deltaF).toBeGreaterThan(trees.deltaF);
  });

  it("permable pavement does not significantly cool air temperature", () => {
    const out = simulateIntervention(
      { type: "permeable-pavement", coveragePct: 50 },
      { baselineTemp: 80, coveragePct: 50 },
    );
    expect(out.deltaF).toBeLessThan(1);
  });

  it("modifiedTemp = baselineTemp - deltaF", () => {
    const out = simulateIntervention(
      { type: "urban-forest", coveragePct: 20 },
      { baselineTemp: 78, coveragePct: 20 },
    );
    expect(out.modifiedTemp).toBeCloseTo(out.baselineTemp - out.deltaF, 2);
  });

  it("estimates trees for canopy and forest but not pavement or roof", () => {
    expect(
      simulateIntervention(
        { type: "tree-canopy", coveragePct: 50 },
        { baselineTemp: 80, coveragePct: 50 },
      ).estimatedTrees,
    ).toBeGreaterThan(0);
    expect(
      simulateIntervention(
        { type: "permeable-pavement", coveragePct: 50 },
        { baselineTemp: 80, coveragePct: 50 },
      ).estimatedTrees,
    ).toBe(0);
    expect(
      simulateIntervention(
        { type: "cool-roof", coveragePct: 50 },
        { baselineTemp: 80, coveragePct: 50 },
      ).estimatedTrees,
    ).toBe(0);
  });

  it("carbon sequestration scales with tree count", () => {
    const a = simulateIntervention(
      { type: "urban-forest", coveragePct: 20 },
      { baselineTemp: 80, coveragePct: 20 },
    );
    const b = simulateIntervention(
      { type: "urban-forest", coveragePct: 60 },
      { baselineTemp: 80, coveragePct: 60 },
    );
    expect(b.co2eTonnesPerYear).toBeGreaterThan(a.co2eTonnesPerYear);
  });
});
