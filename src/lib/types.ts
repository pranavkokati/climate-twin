// Climate Twin — core domain types
// These are the contracts every other module builds against.

export type Scenario = "rcp26" | "rcp45" | "rcp85";

export type Hazard = "heat" | "flood" | "smoke" | "wind" | "drought";

export interface ClimatePoint {
  year: number;
  value: number;
}

export interface ClimateProjection {
  hazard: Hazard;
  // Baseline (1991-2020) and projected 2050 (2041-2060) for the city centroid
  baseline: number;
  projected: number;
  unit: string; // e.g. "days/yr", "inches/yr", "smoke-days/yr"
  series: ClimatePoint[]; // 1990 -> 2060, smoothed trajectory
  description: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  // Polygon is a closed ring of [lng, lat]. Kept small (5-8 vertices) for the demo.
  polygon: Array<[number, number]>;
  // Surface composition as fractions — sums to ~1.0
  treeCanopy: number; // 0-1
  impervious: number; // 0-1
  water: number; // 0-1
  // Local modifiers applied to the city projection
  heatDelta: number; // °F offset (positive = hotter than city centroid)
  floodRisk: "low" | "moderate" | "high" | "severe";
  population: number;
}

export interface PolicyAction {
  id: string;
  title: string;
  type: "council" | "ballot" | "agency";
  status: "proposed" | "active" | "passed" | "failed";
  url?: string;
  impact: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  centroid: [number, number]; // [lng, lat]
  projections: Record<Scenario, ClimateProjection[]>;
  neighborhoods: Neighborhood[];
  policies: PolicyAction[];
  // Local infrastructure / morphology metadata (for downscaling narrative)
  baselineStory: string;
}

export interface Observation {
  id: string;
  cityId: string;
  neighborhoodId: string;
  author: string;
  postedAt: string; // ISO
  category: Hazard;
  text: string;
  upvotes: number;
}

export interface PropertyScore {
  address: string;
  neighborhoodId: string;
  // 0-100 composite resilience score
  overall: number;
  components: {
    heat: number;
    flood: number;
    smoke: number;
    wind: number;
    drought: number;
  };
  recommendations: Array<{
    action: string;
    rationale: string;
    impactDelta: number; // estimated improvement to overall score
    cost: "low" | "medium" | "high";
  }>;
}

export interface WhatIfIntervention {
  type: "tree-canopy" | "cool-roof" | "permeable-pavement" | "urban-forest";
  coveragePct: number; // % of neighborhood to convert
  neighborhoodId?: string; // if omitted, city-wide
}

export interface WhatIfResult {
  baselineTemp: number; // °F, summer mean
  modifiedTemp: number;
  deltaF: number;
  estimatedTrees: number;
  costRangeUSD: [number, number];
  co2eTonnesPerYear: number;
}

export interface ClimateStory {
  city: string;
  scenario: Scenario;
  neighborhood?: string;
  headline: string;
  paragraphs: string[];
  risks: Array<{ hazard: Hazard; delta: string }>;
  levers: Array<{ action: string; payoff: string }>;
}
