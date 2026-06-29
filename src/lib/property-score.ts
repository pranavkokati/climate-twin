// Property Resilience Score — a "credit score" for climate risk at a specific
// address. Composite of hazard subscores, weighted by hazard severity at the
// neighborhood level.

import type {
  City,
  Neighborhood,
  PropertyScore,
  Scenario,
} from "./types";
import { downscaleToNeighborhood } from "./downscaling";

const WEIGHTS = {
  heat: 0.3,
  flood: 0.3,
  smoke: 0.2,
  wind: 0.1,
  drought: 0.1,
} as const;

// Convert a "days/yr above threshold" projection into a 0-100 subscore where
// 100 is best (lowest exposure). Thresholds are hand-tuned for the demo.
function hazardSubscore(
  baseline: number,
  projected: number,
  hazard: keyof typeof WEIGHTS,
): number {
  let thresholdLow: number;
  let thresholdHigh: number;
  switch (hazard) {
    case "heat":
      thresholdLow = 4; // ≤4 extreme-heat days/yr → 100
      thresholdHigh = 60; // ≥60 → 0
      break;
    case "flood":
      thresholdLow = 38; // inches/yr
      thresholdHigh = 60;
      break;
    case "smoke":
      thresholdLow = 3; // unhealthy-air days/yr
      thresholdHigh = 50;
      break;
    case "wind":
      thresholdLow = 5;
      thresholdHigh = 40;
      break;
    case "drought":
      thresholdLow = 4;
      thresholdHigh = 30;
      break;
  }

  const score =
    100 *
    (1 -
      Math.max(
        0,
        Math.min(1, (projected - thresholdLow) / (thresholdHigh - thresholdLow)),
      ));
  return Math.round(score);
}

// Address is intentionally not geocoded — we accept the user-selected
// neighborhood as proxy. Production would add geocoding + parcel-level data.
export function scoreProperty(
  city: City,
  neighborhood: Neighborhood,
  address: string,
  scenario: Scenario,
): PropertyScore {
  const projections = downscaleToNeighborhood(
    city.projections[scenario],
    neighborhood,
    scenario,
  );

  const components = {
    heat: 0,
    flood: 0,
    smoke: 0,
    wind: 0,
    drought: 0,
  } as Record<keyof typeof WEIGHTS, number>;

  for (const p of projections) {
    components[p.hazard] = hazardSubscore(p.baseline, p.projected, p.hazard);
  }

  const overall = Math.round(
    WEIGHTS.heat * components.heat +
      WEIGHTS.flood * components.flood +
      WEIGHTS.smoke * components.smoke +
      WEIGHTS.wind * components.wind +
      WEIGHTS.drought * components.drought,
  );

  // Recommendations: only include those that meaningfully move the score.
  const recommendations: PropertyScore["recommendations"] = [];

  if (components.heat < 70) {
    recommendations.push({
      action: "Install a cool-roof (rated solar reflectance index ≥ 0.6)",
      rationale:
        "Reflective roofing reduces attic temperatures by 20–30°F, lowering AC load and improving indoor resilience during heat waves.",
      impactDelta: 8,
      cost: "medium",
    });
  }
  if (components.heat < 85) {
    recommendations.push({
      action: "Add exterior shading (awnings, deciduous trees on south/west sides)",
      rationale:
        "Direct shading reduces indoor temperature gain by 60–80% on sun-exposed walls.",
      impactDelta: 4,
      cost: "low",
    });
  }
  if (components.flood < 75) {
    recommendations.push({
      action: "Install backflow preventer and elevate HVAC above base flood elevation",
      rationale:
        "Most flood damage to HVAC systems is preventable with elevation; backflow preventers cost ~$200 and prevent sewer backup.",
      impactDelta: 6,
      cost: "low",
    });
  }
  if (components.flood < 60) {
    recommendations.push({
      action: "Apply for FEMA flood mitigation grant for wet-floodproofing",
      rationale:
        "Federal grants cover up to $30k for elevation, relocation, or wet-floodproofing of substantially damaged properties.",
      impactDelta: 10,
      cost: "high",
    });
  }
  if (components.smoke < 80) {
    recommendations.push({
      action: "Install MERV-13 (or better) HVAC filtration with a clean-air mode",
      rationale:
        "MERV-13 filters capture >50% of PM2.5, the dominant component of wildfire smoke. Indoor PM2.5 drops 60–80% during smoke events.",
      impactDelta: 5,
      cost: "low",
    });
  }
  if (components.drought < 70) {
    recommendations.push({
      action: "Replace lawn with drought-tolerant landscaping (clover, sedge, native bunchgrasses)",
      rationale:
        "Reduces outdoor water use by 50–75% and improves neighborhood microclimate during heat events.",
      impactDelta: 3,
      cost: "low",
    });
  }

  return {
    address,
    neighborhoodId: neighborhood.id,
    overall,
    components,
    recommendations,
  };
}
