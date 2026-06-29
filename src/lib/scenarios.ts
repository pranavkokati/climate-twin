// Scenario multipliers and narrative framing.
// Numbers are based on IPCC AR6 WG1 ranges for end-of-century global mean surface
// temperature change, then translated to mid-century regional deltas. These are
// illustrative — production would ingest NEX-GDDP-CMIP6 downscaled outputs.

import type { Scenario } from "./types";

export const SCENARIO_LABEL: Record<Scenario, string> = {
  rcp26: "Optimistic · RCP 2.6",
  rcp45: "Status Quo · RCP 4.5",
  rcp85: "Pessimistic · RCP 8.5",
};

export const SCENARIO_DESCRIPTION: Record<Scenario, string> = {
  rcp26:
    "Rapid global decarbonization. Net-zero by mid-century. ~1.5°C global warming by 2100.",
  rcp45:
    "Current policy trajectories continue. ~2.5°C global warming by 2100.",
  rcp85:
    "High-emission continuation. No additional climate policy. ~4.4°C global warming by 2100.",
};

// Multiplier applied to baseline deltas. Roughly tracks mid-century warming
// per scenario relative to the 1995-2014 baseline.
export const SCENARIO_MULTIPLIER: Record<Scenario, number> = {
  rcp26: 0.55,
  rcp45: 1.0,
  rcp85: 1.7,
};

// Years we compute projections for. The demo stops at 2060.
export const PROJECTION_YEARS = Array.from({ length: 71 }, (_, i) => 1990 + i);

// Smoke-day ramp per scenario (additional AQI>150 days/yr at 2050 vs baseline).
// Pacific NW experiences amplified wildfire smoke under warming — these reflect
// that literature consensus (Burke et al. 2021, Liu et al. 2023).
export const SCENARIO_SMOKE_RAMP: Record<Scenario, number> = {
  rcp26: 6,
  rcp45: 14,
  rcp85: 28,
};

export function scenarioMultiplier(scenario: Scenario): number {
  return SCENARIO_MULTIPLIER[scenario];
}

export function scenarioSmokeRamp(scenario: Scenario): number {
  return SCENARIO_SMOKE_RAMP[scenario];
}
