"use client";

import { useEffect, useState } from "react";
import type {
  City,
  Scenario,
  WhatIfIntervention,
  WhatIfResult,
} from "@/lib/types";
import { SCENARIO_LABEL, SCENARIO_DESCRIPTION } from "@/lib/scenarios";

const INTERVENTIONS: Array<{
  type: WhatIfIntervention["type"];
  label: string;
  description: string;
}> = [
  {
    type: "tree-canopy",
    label: "Tree Canopy",
    description:
      "Mature street trees with regular pruning. Highest impact per dollar for cooling.",
  },
  {
    type: "urban-forest",
    label: "Urban Forest",
    description:
      "Dense mixed canopy planting — multi-story trees and understory. Higher impact, higher cost.",
  },
  {
    type: "cool-roof",
    label: "Cool Roofs",
    description:
      "High solar-reflectance roofing on flat-roof buildings. Reduces indoor and outdoor temps.",
  },
  {
    type: "permeable-pavement",
    label: "Permeable Pavement",
    description:
      "Porous pavement that lets stormwater infiltrate. Reduces runoff; small air-temp effect.",
  },
];

export default function SimulatorPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState("seattle");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [scenario, setScenario] = useState<Scenario>("rcp45");
  const [intervention, setIntervention] =
    useState<WhatIfIntervention["type"]>("tree-canopy");
  const [coverage, setCoverage] = useState(20);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((d) => setCities(d.cities ?? []));
  }, []);

  const city = cities.find((c) => c.id === cityId);

  useEffect(() => {
    if (city && !neighborhoodId && city.neighborhoods.length > 0) {
      setNeighborhoodId(city.neighborhoods[0].id);
    }
  }, [city, neighborhoodId]);

  async function runSim() {
    setLoading(true);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId,
          neighborhoodId: neighborhoodId || undefined,
          scenario,
          intervention: { type: intervention, coveragePct: coverage },
        }),
      });
      const data = await res.json();
      setResult(data.result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-[var(--muted)]">Tools · What-If Simulation</p>
        <h1 className="text-3xl font-bold mt-1">&ldquo;What-If&rdquo; Simulator</h1>
        <p className="text-[var(--muted)] mt-2 max-w-3xl">
          Drop a virtual intervention onto a neighborhood and see how much it
          would cool the projected 2050 summer heat. Numbers come from
          peer-reviewed cooling factors — see Docs for sources.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="panel space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-[var(--muted)] block mb-1">
                City
              </label>
              <select
                className="select"
                value={cityId}
                onChange={(e) => {
                  setCityId(e.target.value);
                  setNeighborhoodId("");
                }}
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}, {c.state}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-[var(--muted)] block mb-1">
                Neighborhood (optional)
              </label>
              <select
                className="select"
                value={neighborhoodId}
                onChange={(e) => setNeighborhoodId(e.target.value)}
              >
                <option value="">City-wide</option>
                {city?.neighborhoods.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-[var(--muted)] block mb-2">
              Intervention
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INTERVENTIONS.map((i) => (
                <button
                  key={i.type}
                  type="button"
                  className={`btn-ghost btn ${
                    intervention === i.type ? "border-[var(--accent)]" : ""
                  }`}
                  onClick={() => setIntervention(i.type)}
                  style={{
                    background:
                      intervention === i.type ? "var(--panel-2)" : "transparent",
                  }}
                >
                  {i.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--muted)] mt-2">
              {INTERVENTIONS.find((i) => i.type === intervention)?.description}
            </p>
          </div>

          <div>
            <label className="text-sm text-[var(--muted)] block mb-1">
              Coverage: {coverage}%
            </label>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={coverage}
              onChange={(e) => setCoverage(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm text-[var(--muted)] block mb-2">
              Scenario
            </label>
            <div className="flex gap-2">
              {(["rcp26", "rcp45", "rcp85"] as Scenario[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="scenario-pill"
                  data-active={scenario === s}
                  onClick={() => setScenario(s)}
                  aria-pressed={scenario === s}
                >
                  {SCENARIO_LABEL[s]}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--muted)] mt-2">
              {SCENARIO_DESCRIPTION[scenario]}
            </p>
          </div>

          <button
            type="button"
            className="btn"
            onClick={runSim}
            disabled={loading}
          >
            {loading ? "Simulating…" : "Run simulation"}
          </button>
        </div>

        <div className="panel">
          <h2 className="font-semibold mb-3">Result</h2>
          {!result ? (
            <p className="text-sm text-[var(--muted)]">
              Configure an intervention and run the simulation.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-baseline gap-4">
                <div>
                  <p className="text-xs text-[var(--muted)]">Baseline</p>
                  <p className="text-3xl font-semibold">
                    {result.baselineTemp}°F
                  </p>
                </div>
                <div className="text-2xl text-[var(--muted)]">→</div>
                <div>
                  <p className="text-xs text-[var(--accent)]">After intervention</p>
                  <p className="text-3xl font-semibold" style={{ color: "var(--accent)" }}>
                    {result.modifiedTemp}°F
                  </p>
                </div>
                <div className="ml-auto">
                  <p className="text-xs text-[var(--muted)]">Cooling</p>
                  <p className="text-3xl font-semibold" style={{ color: "var(--accent)" }}>
                    −{result.deltaF}°F
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--border)]">
                <div>
                  <p className="text-xs text-[var(--muted)]">Trees planted</p>
                  <p className="text-xl font-semibold">
                    {result.estimatedTrees.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">CO₂e / yr</p>
                  <p className="text-xl font-semibold">
                    {result.co2eTonnesPerYear} t
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">Cost (USD)</p>
                  <p className="text-sm font-semibold">
                    ${result.costRangeUSD[0].toLocaleString()} – $
                    {result.costRangeUSD[1].toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--muted)]">
                Cooling factors derived from peer-reviewed studies. Numbers are
                illustrative — real deployment requires local validation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
