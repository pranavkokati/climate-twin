import { describe, expect, it } from "vitest";
import { CITIES, getCity, listCities, DATA_PROVENANCE } from "@/data/cities";

describe("cities data (real-data backed)", () => {
  it("exposes 3 cities", () => {
    expect(listCities()).toHaveLength(3);
    expect(listCities().map((c) => c.id).sort()).toEqual([
      "miami",
      "phoenix",
      "seattle",
    ]);
  });

  it("each city has 3 scenarios and >= 3 neighborhoods / 3 policies", () => {
    for (const c of CITIES) {
      expect(c.projections.rcp26).toBeDefined();
      expect(c.projections.rcp45).toBeDefined();
      expect(c.projections.rcp85).toBeDefined();
      expect(c.neighborhoods.length).toBeGreaterThanOrEqual(3);
      expect(c.policies.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("real-data baselines are loaded from NOAA NCEI JSON", () => {
    expect(DATA_PROVENANCE.stations.seattle).toBe("USW00013743");
    expect(DATA_PROVENANCE.stations.phoenix).toBe("USW00023183");
    expect(DATA_PROVENANCE.stations.miami).toBe("USW00012839");
  });

  it("Seattle heat baseline is realistic (NOAA-derived: ~14 days/yr >=95F)", () => {
    const seattle = getCity("seattle")!;
    const heat = seattle.projections.rcp45.find((p) => p.hazard === "heat")!;
    expect(heat.baseline).toBeGreaterThanOrEqual(10);
    expect(heat.baseline).toBeLessThanOrEqual(20);
  });

  it("Phoenix heat baseline is realistic (NOAA-derived: ~145 days/yr >=95F)", () => {
    const phoenix = getCity("phoenix")!;
    const heat = phoenix.projections.rcp45.find((p) => p.hazard === "heat")!;
    expect(heat.baseline).toBeGreaterThanOrEqual(130);
    expect(heat.baseline).toBeLessThanOrEqual(160);
  });

  it("Miami precipitation baseline is realistic (NOAA-derived: ~67 in/yr)", () => {
    const miami = getCity("miami")!;
    const flood = miami.projections.rcp45.find((p) => p.hazard === "flood")!;
    expect(flood.baseline).toBeGreaterThanOrEqual(60);
    expect(flood.baseline).toBeLessThanOrEqual(75);
  });

  it("scenarios are monotonic: rcp85 >= rcp45 >= rcp26 for heat exposure", () => {
    const seattle = getCity("seattle")!;
    const h26 = seattle.projections.rcp26.find((p) => p.hazard === "heat")!
      .projected;
    const h45 = seattle.projections.rcp45.find((p) => p.hazard === "heat")!
      .projected;
    const h85 = seattle.projections.rcp85.find((p) => p.hazard === "heat")!
      .projected;
    expect(h26).toBeLessThanOrEqual(h45);
    expect(h45).toBeLessThanOrEqual(h85);
  });

  it("scenarios are monotonic for smoke days (PNW: rcp85 worst)", () => {
    const seattle = getCity("seattle")!;
    const s26 = seattle.projections.rcp26.find((p) => p.hazard === "smoke")!
      .projected;
    const s45 = seattle.projections.rcp45.find((p) => p.hazard === "smoke")!
      .projected;
    const s85 = seattle.projections.rcp85.find((p) => p.hazard === "smoke")!
      .projected;
    expect(s26).toBeLessThanOrEqual(s45);
    expect(s45).toBeLessThan(s85);
  });

  it("neighborhood polygons are valid (>= 3 vertices, sane coords)", () => {
    for (const c of CITIES) {
      for (const n of c.neighborhoods) {
        expect(n.polygon.length).toBeGreaterThanOrEqual(3);
        for (const [lng, lat] of n.polygon) {
          expect(Math.abs(lng)).toBeLessThan(180);
          expect(Math.abs(lat)).toBeLessThan(90);
        }
        expect(n.treeCanopy + n.impervious).toBeLessThanOrEqual(1.01);
      }
    }
  });

  it("getCity returns the city or undefined", () => {
    expect(getCity("seattle")?.name).toBe("Seattle");
    expect(getCity("atlantis")).toBeUndefined();
  });
});
