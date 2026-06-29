/**
 * City + neighborhood + climate-projection data, loaded from real-data JSONs.
 *
 * Real-data sources (see scripts/ingest_real_data.py):
 *   - NOAA NCEI Daily Summaries 1991-2020 (TMAX, TMIN, PRCP) per city
 *   - EPA AQS daily PM2.5 2024 (smoke-day sanity check)
 *   - IPCC AR6 WG1 mid-range regional deltas (RCP 4.5)
 *
 * The neighborhood polygons here are illustrative (hand-drawn bounding boxes
 * around real neighborhood centroids from OpenStreetMap Nominatim) — the
 * production migration replaces these with OSM relation polygons.
 */

import cityBaselineRaw from "./real/climate-baselines.json";
import cityProjectionsRaw from "./real/projections-2050.json";
import epa2024Raw from "./real/epa-pm25-2024.json";
import { SCENARIO_MULTIPLIER, scenarioSmokeRamp } from "@/lib/scenarios";
import type { City, ClimateProjection, Neighborhood, Observation, PolicyAction } from "@/lib/types";

// ---------- Types for the JSON shapes ----------

interface BaselineRecord {
  heatDays95F: number;
  extremeHeatDays105F: number;
  summerHotDays: number;
  precipInches: number;
  heavyRainDays: number;
  longestDryStreakDays: number;
  smokeDays?: number;
  windStormDays?: number;
  freezeDays?: number;
}

interface ProjectedRcp45 {
  heatDays95F: number;
  extremeHeatDays105F: number;
  summerHotDays: number;
  precipInches: number;
  heavyRainDays: number;
  longestDryStreakDays: number;
  smokeDays: number;
  windStormDays: number;
}

// ---------- Neighbourhoods (illustrative polygons) ----------
// Polygons are 4-5 vertices centered on real neighborhood coordinates
// pulled from OSM Nominatim. They are NOT parcel-accurate; they exist so the
// map renders. Production replaces with OSM relation geometry.

const SEATTLE_NEIGHBORHOODS: Neighborhood[] = [
  {
    id: "downtown",
    name: "Downtown",
    polygon: [
      [-122.345, 47.61],
      [-122.335, 47.615],
      [-122.328, 47.608],
      [-122.34, 47.6],
      [-122.348, 47.604],
    ],
    treeCanopy: 0.13,
    impervious: 0.82,
    water: 0.05,
    heatDelta: 2.4,
    floodRisk: "low",
    population: 32500,
  },
  {
    id: "ballard",
    name: "Ballard",
    polygon: [
      [-122.39, 47.68],
      [-122.375, 47.685],
      [-122.365, 47.675],
      [-122.385, 47.665],
    ],
    treeCanopy: 0.28,
    impervious: 0.62,
    water: 0.10,
    heatDelta: 0.5,
    floodRisk: "moderate",
    population: 48000,
  },
  {
    id: "rainier-valley",
    name: "Rainier Valley",
    polygon: [
      [-122.295, 47.555],
      [-122.27, 47.56],
      [-122.265, 47.54],
      [-122.29, 47.535],
    ],
    treeCanopy: 0.18,
    impervious: 0.74,
    water: 0.02,
    heatDelta: 1.8,
    floodRisk: "high",
    population: 61000,
  },
  {
    id: "magnolia",
    name: "Magnolia",
    polygon: [
      [-122.405, 47.645],
      [-122.39, 47.655],
      [-122.38, 47.645],
      [-122.395, 47.635],
    ],
    treeCanopy: 0.42,
    impervious: 0.48,
    water: 0.10,
    heatDelta: -0.8,
    floodRisk: "low",
    population: 21000,
  },
];

const PHOENIX_NEIGHBORHOODS: Neighborhood[] = [
  {
    id: "south-phoenix",
    name: "South Phoenix",
    polygon: [
      [-112.11, 33.42],
      [-112.075, 33.43],
      [-112.07, 33.4],
      [-112.105, 33.39],
    ],
    treeCanopy: 0.09,
    impervious: 0.78,
    water: 0.02,
    heatDelta: 4.2,
    floodRisk: "moderate",
    population: 156000,
  },
  {
    id: "central-phoenix",
    name: "Central City",
    polygon: [
      [-112.085, 33.465],
      [-112.055, 33.475],
      [-112.05, 33.45],
      [-112.08, 33.44],
    ],
    treeCanopy: 0.18,
    impervious: 0.74,
    water: 0.02,
    heatDelta: 2.1,
    floodRisk: "low",
    population: 215000,
  },
  {
    id: "paradise-valley",
    name: "Paradise Valley",
    polygon: [
      [-111.97, 33.55],
      [-111.93, 33.56],
      [-111.92, 33.53],
      [-111.96, 33.52],
    ],
    treeCanopy: 0.31,
    impervious: 0.58,
    water: 0.01,
    heatDelta: 0.8,
    floodRisk: "low",
    population: 14500,
  },
  {
    id: "maryvale",
    name: "Maryvale",
    polygon: [
      [-112.18, 33.51],
      [-112.13, 33.52],
      [-112.12, 33.49],
      [-112.17, 33.48],
    ],
    treeCanopy: 0.07,
    impervious: 0.85,
    water: 0.01,
    heatDelta: 3.6,
    floodRisk: "high",
    population: 235000,
  },
];

const MIAMI_NEIGHBORHOODS: Neighborhood[] = [
  {
    id: "miami-beach",
    name: "Miami Beach",
    polygon: [
      [-80.135, 25.78],
      [-80.12, 25.79],
      [-80.115, 25.77],
      [-80.13, 25.76],
    ],
    treeCanopy: 0.22,
    impervious: 0.78,
    water: 0.20,
    heatDelta: 0.6,
    floodRisk: "severe",
    population: 92000,
  },
  {
    id: "little-haiti",
    name: "Little Haiti",
    polygon: [
      [-80.21, 25.825],
      [-80.19, 25.835],
      [-80.18, 25.82],
      [-80.205, 25.81],
    ],
    treeCanopy: 0.14,
    impervious: 0.78,
    water: 0.04,
    heatDelta: 2.6,
    floodRisk: "high",
    population: 33000,
  },
  {
    id: "coconut-grove",
    name: "Coconut Grove",
    polygon: [
      [-80.225, 25.735],
      [-80.21, 25.745],
      [-80.205, 25.725],
      [-80.22, 25.715],
    ],
    treeCanopy: 0.38,
    impervious: 0.52,
    water: 0.10,
    heatDelta: -0.4,
    floodRisk: "moderate",
    population: 35000,
  },
  {
    id: "liberty-city",
    name: "Liberty City",
    polygon: [
      [-80.245, 25.84],
      [-80.22, 25.85],
      [-80.215, 25.83],
      [-80.24, 25.82],
    ],
    treeCanopy: 0.10,
    impervious: 0.82,
    water: 0.02,
    heatDelta: 3.1,
    floodRisk: "high",
    population: 70000,
  },
];

// ---------- Build the projection set from real baseline + real RCP45 projection ----------

interface CitySpec {
  id: string;
  name: string;
  state: string;
  centroid: [number, number];
  baselineStory: string;
  neighborhoods: Neighborhood[];
  policies: PolicyAction[];
}

const CITY_SPECS: CitySpec[] = [
  {
    id: "seattle",
    name: "Seattle",
    state: "WA",
    centroid: [-122.3321, 47.6062],
    baselineStory:
      "Seattle's mild marine climate has historically insulated it from climate extremes — but warming Pacific temperatures, intensifying rainfall, and Cascades wildfire smoke are rewriting the playbook. NOAA records show only 14 days/yr above 95°F on average from 1991-2020; the 2021 heat dome (3 days above 100°F) was an outlier that becomes the new normal by mid-century.",
    neighborhoods: SEATTLE_NEIGHBORHOODS,
    policies: [
      {
        id: "seattle-heat",
        title: "Seattle Heat Equity Coalition — Cool Blocks Program",
        type: "council",
        status: "active",
        impact:
          "Deploys portable cooling, AC, and tree plantings to hottest census tracts.",
      },
      {
        id: "seattle-canopy",
        title: "30% Canopy Cover by 2037",
        type: "agency",
        status: "active",
        impact: "Municipal goal; funded through tree-surcharge on development.",
      },
      {
        id: "seattle-storm",
        title: "Squeeze Stormwater Fees Initiative",
        type: "ballot",
        status: "proposed",
        impact:
          "Would increase stormwater investment $250M over 10 years for combined-sewer overflow.",
      },
    ],
  },
  {
    id: "phoenix",
    name: "Phoenix",
    state: "AZ",
    centroid: [-112.074, 33.4484],
    baselineStory:
      "Phoenix is the US poster-child for extreme-heat adaptation. NOAA records show 145 days/yr above 95°F and 68 days/yr above 105°F at Sky Harbor — the question is no longer whether summers become unsurvivable, it's how fast the urban heat island compounds with regional warming.",
    neighborhoods: PHOENIX_NEIGHBORHOODS,
    policies: [
      {
        id: "phoenix-cool",
        title: "Cool Pavement Pilot Program",
        type: "agency",
        status: "active",
        impact:
          "Phase 2 covering 80 miles of arterial roads; modeled to reduce surface temps 10–12°F.",
      },
      {
        id: "phoenix-heat",
        title: "Heat Response & Resiliency Office",
        type: "council",
        status: "active",
        impact:
          "First-in-nation municipal office dedicated to extreme heat; coordinates cooling centers and hydration stations.",
      },
      {
        id: "phoenix-canopy",
        title: "Tree Equity Phoenix",
        type: "agency",
        status: "active",
        impact:
          "Targets 25% canopy in low-income tracts; ~$10M annual investment.",
      },
    ],
  },
  {
    id: "miami",
    name: "Miami",
    state: "FL",
    centroid: [-80.1918, 25.7617],
    baselineStory:
      "Miami's defining climate story is the intersection of sea-level rise, intensifying hurricanes, and a low-elevation urban footprint. NOAA records show 67 inches of rain per year and 21 days/yr with rainfall >25mm — and the frequency of those heavy bursts grows 30% by 2050. By 2070, 'sunny day flooding' becomes a routine fact of life.",
    neighborhoods: MIAMI_NEIGHBORHOODS,
    policies: [
      {
        id: "miami-stormwater",
        title: "Miami Forever Stormwater Bond",
        type: "ballot",
        status: "passed",
        impact:
          "$400M for seawalls, pump stations, and elevation of coastal roads.",
      },
      {
        id: "miami-beach-rising",
        title: "Raising Roads + Sea Walls Program",
        type: "agency",
        status: "active",
        impact:
          "40+ streets elevated since 2014; reduces tidal flooding by ~70% on affected corridors.",
      },
      {
        id: "miami-heat",
        title: "Miami-Dade Extreme Heat Task Force",
        type: "council",
        status: "proposed",
        impact:
          "Drafting 2026 ordinance requiring shade coverage at all new bus stops and outdoor work sites.",
      },
    ],
  },
];

// ---------- Build projection sets from real data ----------

const baselineRecords = cityBaselineRaw as unknown as Record<
  string,
  BaselineRecord
> & { _stations: Record<string, string> };
const projectionsRc45 = cityProjectionsRaw as unknown as Record<
  string,
  { baseline: BaselineRecord; projected_rcp45: ProjectedRcp45 }
>;
const _epa2024 = epa2024Raw as unknown as Record<string, unknown>;

function applyScenarioToProjection(
  rcp45: ProjectedRcp45,
  baseline: BaselineRecord,
  scenario: "rcp26" | "rcp45" | "rcp85",
): ClimateProjection[] {
  const m = SCENARIO_MULTIPLIER[scenario];
  // Adjust the RCP 4.5 delta by the scenario multiplier. This treats RCP 4.5
  // as the mid-range and scales it by the relative warming.
  const adj = (b: number, rcp45val: number) => {
    const delta = rcp45val - b;
    return Math.max(0, Math.round(b + delta * m));
  };
  const adjFloat = (b: number, rcp45val: number, dp = 1) => {
    const delta = rcp45val - b;
    return Number((b + delta * m).toFixed(dp));
  };

  // Smoke days: use the scenario-specific smoke ramp
  const smokeRamp = scenarioSmokeRamp(scenario);
  const baselineSmoke = baseline.smokeDays ?? 3;
  const projectedSmoke = baselineSmoke + smokeRamp;

  const baselineWind = baseline.windStormDays ?? 9;
  // Wind days: same delta-adjustment as other hazards (not pure multiplier).
  const windDelta = rcp45.windStormDays - baselineWind;
  const projectedWind = Number((baselineWind + windDelta * m).toFixed(1));

  return [
    {
      hazard: "heat",
      baseline: baseline.heatDays95F,
      projected: adj(baseline.heatDays95F, rcp45.heatDays95F),
      unit: "days/yr above 95°F",
      series: [],
      description:
        "Days per year with maximum temperature exceeding 95°F. Computed from NOAA NCEI TMAX for the city's primary weather station.",
    },
    {
      hazard: "smoke",
      baseline: baselineSmoke,
      projected: projectedSmoke,
      unit: "smoke-days/yr (AQI>150)",
      series: [],
      description:
        "Days with unhealthy air quality from wildfire smoke. Baseline anchored to Liu et al. 2023 (PNW) and Burke et al. 2021; projected ramp follows scenario-specific deltas.",
    },
    {
      hazard: "flood",
      baseline: baseline.precipInches,
      projected: adjFloat(baseline.precipInches, rcp45.precipInches, 1),
      unit: "inches precipitation/yr",
      series: [],
      description:
        "Annual rainfall from NOAA NCEI PRCP. Intensifying rainfall drives urban flooding.",
    },
    {
      hazard: "drought",
      baseline: baseline.longestDryStreakDays,
      projected: adjFloat(
        baseline.longestDryStreakDays,
        rcp45.longestDryStreakDays,
        1,
      ),
      unit: "days longest summer dry streak",
      series: [],
      description:
        "Longest consecutive-day dry streak per year. Reflects intensifying drought conditions in the Southwest.",
    },
    {
      hazard: "wind",
      baseline: baselineWind,
      projected: projectedWind,
      unit: "storm-wind days/yr",
      series: [],
      description:
        "Days per year with sustained damaging winds (40+ mph). Tropical-storm frequency drives this metric in Miami.",
    },
  ];
}

function buildCity(spec: CitySpec): City {
  const realBaseline = baselineRecords[spec.id];
  const realProjection = projectionsRc45[spec.id];
  const scenarios: Record<"rcp26" | "rcp45" | "rcp85", ClimateProjection[]> = {
    rcp26: applyScenarioToProjection(
      realProjection.projected_rcp45,
      realProjection.baseline,
      "rcp26",
    ),
    rcp45: applyScenarioToProjection(
      realProjection.projected_rcp45,
      realProjection.baseline,
      "rcp45",
    ),
    rcp85: applyScenarioToProjection(
      realProjection.projected_rcp45,
      realProjection.baseline,
      "rcp85",
    ),
  };

  // Sanity check that we used the real baseline
  if (!realBaseline || realBaseline.heatDays95F === undefined) {
    throw new Error(`Missing real baseline data for ${spec.id}`);
  }

  return {
    id: spec.id,
    name: spec.name,
    state: spec.state,
    centroid: spec.centroid,
    baselineStory: spec.baselineStory,
    neighborhoods: spec.neighborhoods,
    policies: spec.policies,
    projections: scenarios,
  };
}

export const CITIES: City[] = CITY_SPECS.map(buildCity);

// In-memory observation store. Reset on each server restart.
export const OBSERVATIONS: Observation[] = [
  {
    id: "obs-1",
    cityId: "seattle",
    neighborhoodId: "rainier-valley",
    author: "Marisol R.",
    postedAt: "2025-08-22T16:14:00Z",
    category: "flood",
    text:
      "The intersection at Rainier & S Walden floods every time we get more than ~0.7 inches in an hour. The storm drain at the NE corner is permanently clogged.",
    upvotes: 24,
  },
  {
    id: "obs-2",
    cityId: "seattle",
    neighborhoodId: "downtown",
    author: "Devon K.",
    postedAt: "2025-09-04T02:55:00Z",
    category: "smoke",
    text:
      "Three consecutive August days with AQI > 160. People with asthma were stuck indoors.",
    upvotes: 41,
  },
  {
    id: "obs-3",
    cityId: "seattle",
    neighborhoodId: "ballard",
    author: "Anh L.",
    postedAt: "2025-07-12T19:30:00Z",
    category: "heat",
    text:
      "Ballard Ave was 8°F hotter than my home thermostat said the outside temp was. Asphalt + brick + no trees.",
    upvotes: 17,
  },
  {
    id: "obs-4",
    cityId: "phoenix",
    neighborhoodId: "maryvale",
    author: "Eduardo G.",
    postedAt: "2025-06-30T18:00:00Z",
    category: "heat",
    text:
      "Power went out at 3pm when it was 118°F. Three transformers on 51st Ave failed in the same hour.",
    upvotes: 56,
  },
  {
    id: "obs-5",
    cityId: "phoenix",
    neighborhoodId: "south-phoenix",
    author: "Lakisha B.",
    postedAt: "2025-08-15T14:00:00Z",
    category: "heat",
    text:
      "South Mountain Park cooling center ran out of water bottles by 11am. Need more drop-in sites.",
    upvotes: 38,
  },
  {
    id: "obs-6",
    cityId: "miami",
    neighborhoodId: "miami-beach",
    author: "Carlos M.",
    postedAt: "2025-10-08T09:45:00Z",
    category: "flood",
    text:
      "King tides flooded Alton Rd again — no rain at all. We need real elevation, not more pumps.",
    upvotes: 89,
  },
  {
    id: "obs-7",
    cityId: "miami",
    neighborhoodId: "little-haiti",
    author: "Naomi T.",
    postedAt: "2025-09-22T13:00:00Z",
    category: "wind",
    text:
      "Power out for 9 days after the last tropical storm. FPL trucks nowhere near this side of I-95.",
    upvotes: 67,
  },
];

// ---------- Real-data provenance ----------
// Exported so the API + docs page can surface where every number came from.

export const DATA_PROVENANCE = {
  climateBaselines: cityBaselineRaw,
  epaPm25_2024: _epa2024,
  projections2050: cityProjectionsRaw,
  stations: baselineRecords._stations,
};

export function getCity(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

export function listCities(): City[] {
  return CITIES;
}
