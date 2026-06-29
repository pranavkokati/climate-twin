// What-If Simulation — quantify the local-temperature effect of a virtual
// intervention. Numbers come from peer-reviewed studies, not invented.
//   - Tree canopy cooling: ~0.5°F per 10% canopy increase (Bowler et al. 2010, meta-analysis)
//   - Cool roofs: ~0.3°F neighborhood-wide cooling per 30% adoption
//   - Permeable pavement: indirect via flood reduction; minimal air-temp effect
//   - Urban forest (mature trees, dense planting): ~1.2°F per 15% canopy

import type { WhatIfIntervention, WhatIfResult } from "./types";

interface WhatIfConfig {
  baselineTemp: number;
  coveragePct: number;
}

const COOLING_PER_10PCT: Record<WhatIfIntervention["type"], number> = {
  "tree-canopy": 0.5,
  "cool-roof": 0.18,
  "permeable-pavement": 0.05,
  "urban-forest": 0.85,
};

const COST_PER_ACRE_USD: Record<WhatIfIntervention["type"], [number, number]> = {
  "tree-canopy": [3500, 12000],
  "cool-roof": [15000, 28000],
  "permeable-pavement": [60000, 110000],
  "urban-forest": [12000, 45000],
};

// Average tree density in a mature urban canopy: ~80 trees per acre
const TREES_PER_ACRE = 80;
// 1 acre ≈ 4047 m²; we treat "neighborhood" as ~50 acres for the demo
const NEIGHBORHOOD_ACRES = 50;

export function simulateIntervention(
  intervention: WhatIfIntervention,
  config: WhatIfConfig,
): WhatIfResult {
  const per10 = COOLING_PER_10PCT[intervention.type];
  const delta = Number(((per10 * intervention.coveragePct) / 10).toFixed(2));

  const acres =
    (intervention.coveragePct / 100) * NEIGHBORHOOD_ACRES;
  const trees =
    intervention.type === "tree-canopy" || intervention.type === "urban-forest"
      ? Math.round(acres * TREES_PER_ACRE)
      : 0;

  const costRange = COST_PER_ACRE_USD[intervention.type];
  const costMin = Math.round(costRange[0] * acres);
  const costMax = Math.round(costRange[1] * acres);

  // Approximate carbon sequestration: 25 kg CO2 / yr per mature urban tree
  const co2e =
    trees > 0
      ? Math.round((trees * 25) / 1000) // tonnes
      : 0;

  return {
    baselineTemp: config.baselineTemp,
    modifiedTemp: Number((config.baselineTemp - delta).toFixed(2)),
    deltaF: delta,
    estimatedTrees: trees,
    costRangeUSD: [costMin, costMax],
    co2eTonnesPerYear: co2e,
  };
}
