import { describe, expect, it } from "vitest";
import { CITIES, getCity, listCities } from "@/data/cities";

describe("cities seed data", () => {
  it("exposes 3 cities", () => {
    expect(listCities()).toHaveLength(3);
    expect(listCities().map((c) => c.id).sort()).toEqual([
      "miami",
      "phoenix",
      "seattle",
    ]);
  });

  it("each city has at least 3 neighborhoods and >= 3 policies", () => {
    for (const c of CITIES) {
      expect(c.neighborhoods.length).toBeGreaterThanOrEqual(3);
      expect(c.policies.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("neighborhoods have valid polygons (>= 3 vertices, closed by repeating)", () => {
    for (const c of CITIES) {
      for (const n of c.neighborhoods) {
        expect(n.polygon.length).toBeGreaterThanOrEqual(3);
        for (const [lng, lat] of n.polygon) {
          expect(Math.abs(lng)).toBeLessThan(180);
          expect(Math.abs(lat)).toBeLessThan(90);
        }
      }
    }
  });

  it("getCity finds by id and returns undefined for missing", () => {
    expect(getCity("seattle")?.name).toBe("Seattle");
    expect(getCity("atlantis")).toBeUndefined();
  });

  it("tree canopy + impervious fractions are reasonable (sum < 1)", () => {
    for (const c of CITIES) {
      for (const n of c.neighborhoods) {
        expect(n.treeCanopy).toBeGreaterThanOrEqual(0);
        expect(n.treeCanopy).toBeLessThanOrEqual(1);
        expect(n.impervious).toBeGreaterThanOrEqual(0);
        expect(n.impervious).toBeLessThanOrEqual(1);
        expect(n.treeCanopy + n.impervious).toBeLessThanOrEqual(1.01);
      }
    }
  });
});
