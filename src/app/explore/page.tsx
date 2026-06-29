"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type {
  City,
  ClimateProjection,
  ClimateStory,
  Neighborhood,
  Scenario,
} from "@/lib/types";
import {
  SCENARIO_LABEL,
  SCENARIO_DESCRIPTION,
} from "@/lib/scenarios";
import { smoothTrajectory } from "@/lib/downscaling";
import { ScenarioPill } from "@/components/ScenarioPill";
import { HazardChart } from "@/components/HazardChart";
import { NeighborhoodMap } from "@/components/NeighborhoodMap";

interface CityResponse {
  city: City;
  scenario: Scenario;
  neighborhood?: Neighborhood;
  projections?: ClimateProjection[];
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading explorer…</p>}>
      <ExplorePageInner />
    </Suspense>
  );
}

function ExplorePageInner() {
  const params = useSearchParams();
  const initialCity = params.get("city") || "seattle";
  const initialScenario = (params.get("scenario") as Scenario) || "rcp45";

  const [cityId, setCityId] = useState(initialCity);
  const [cities, setCities] = useState<City[]>([]);
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [neighborhoodId, setNeighborhoodId] = useState<string | "">("");
  const [data, setData] = useState<CityResponse | null>(null);
  const [story, setStory] = useState<ClimateStory | null>(null);
  const [loading, setLoading] = useState(false);

  // Load city list
  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((d) => setCities(d.cities ?? []));
  }, []);

  // Load city + (optional) neighborhood projections for the active scenario
  useEffect(() => {
    setLoading(true);
    const url = new URL("/api/cities", window.location.origin);
    url.searchParams.set("id", cityId);
    url.searchParams.set("scenario", scenario);
    if (neighborhoodId) url.searchParams.set("neighborhood", neighborhoodId);
    fetch(url.toString())
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [cityId, scenario, neighborhoodId]);

  // Load the narrative story
  useEffect(() => {
    if (!cityId) return;
    fetch("/api/story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityId, scenario, neighborhoodId: neighborhoodId || undefined }),
    })
      .then((r) => r.json())
      .then((d) => setStory(d.story ?? null));
  }, [cityId, scenario, neighborhoodId]);

  const selectedCity = data?.city;
  const selectedNeighborhood = data?.neighborhood;
  const projections = useMemo<ClimateProjection[]>(() => {
    if (!selectedCity) return [];
    if (data?.projections) return data.projections;
    // city-level: reconstruct series client-side so the chart works
    return selectedCity.projections[scenario].map((p) => ({
      ...p,
      series: smoothTrajectory(p.baseline, p.projected, scenario),
    }));
  }, [data, selectedCity, scenario]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-[var(--muted)]">Explore · City Twin</p>
        <h1 className="text-3xl font-bold mt-1">
          {selectedCity?.name ?? "Loading…"}
          {selectedNeighborhood ? (
            <span className="text-[var(--accent-2)]">
              {" "}
              · {selectedNeighborhood.name}
            </span>
          ) : null}
        </h1>
        {selectedCity && (
          <p className="text-[var(--muted)] mt-2 max-w-3xl">
            {selectedCity.baselineStory}
          </p>
        )}
      </header>

      <section className="panel">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 items-center">
            <label className="text-sm text-[var(--muted)]">City</label>
            <select
              className="select"
              style={{ width: "auto" }}
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

          <div className="flex gap-2 items-center">
            <span className="text-sm text-[var(--muted)] mr-1">Scenario</span>
            {(["rcp26", "rcp45", "rcp85"] as Scenario[]).map((s) => (
              <ScenarioPill
                key={s}
                scenario={s}
                active={scenario === s}
                onClick={() => setScenario(s)}
              />
            ))}
          </div>

          <div className="flex gap-3 items-center">
            <label className="text-sm text-[var(--muted)]">Zoom level</label>
            <select
              className="select"
              style={{ width: "auto" }}
              value={neighborhoodId}
              onChange={(e) => setNeighborhoodId(e.target.value)}
            >
              <option value="">City (centroid)</option>
              {selectedCity?.neighborhoods.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-[var(--muted)] mt-3">
          {SCENARIO_DESCRIPTION[scenario]}
        </p>
      </section>

      {loading && (
        <div className="text-sm text-[var(--muted)]">Loading projections…</div>
      )}

      {selectedCity && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <HazardChart projections={projections} />
            <NeighborhoodMap
              city={selectedCity}
              selectedNeighborhoodId={neighborhoodId}
              onSelect={setNeighborhoodId}
            />
          </div>

          <aside className="space-y-4">
            <div className="panel">
              <h3 className="font-semibold mb-2">Climate Story</h3>
              {story ? (
                <div className="space-y-3 text-sm">
                  <p className="font-medium text-[var(--text)]">
                    {story.headline}
                  </p>
                  {story.paragraphs.map((p, i) => (
                    <p key={i} className="text-[var(--muted)] leading-relaxed">
                      {p}
                    </p>
                  ))}
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--muted)] mt-4">
                      Key risks
                    </p>
                    <ul className="mt-2 space-y-1">
                      {story.risks.map((r) => (
                        <li key={r.hazard} className="flex items-center gap-2">
                          <span className={`chip tag-${r.hazard}`}>
                            {r.hazard}
                          </span>
                          <span className="text-sm">{r.delta}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--muted)] mt-4">
                      Levers
                    </p>
                    <ul className="mt-2 space-y-2">
                      {story.levers.map((l, i) => (
                        <li key={i} className="panel-muted">
                          <p className="font-medium text-sm">{l.action}</p>
                          <p className="text-xs text-[var(--muted)] mt-1">
                            {l.payoff}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)]">Synthesizing…</p>
              )}
            </div>

            <div className="panel">
              <h3 className="font-semibold mb-2">Local policy</h3>
              <ul className="space-y-2 text-sm">
                {selectedCity.policies.map((p) => (
                  <li key={p.id} className="panel-muted">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{p.title}</p>
                      <span className="chip">{p.status}</span>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-1">{p.impact}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}

      {selectedCity && (
        <section className="panel">
          <h2 className="text-xl font-semibold mb-3">
            Hazard-by-hazard projection
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Smoothed trajectory from 1990 baseline through 2060 under{" "}
            {SCENARIO_LABEL[scenario]}.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {projections.map((p) => (
              <HazardMiniChart key={p.hazard} projection={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function HazardMiniChart({ projection }: { projection: ClimateProjection }) {
  return (
    <div className="panel-muted">
      <div className="flex items-center justify-between">
        <p className="font-semibold capitalize">{projection.hazard}</p>
        <span className="text-xs text-[var(--muted)]">{projection.unit}</span>
      </div>
      <p className="text-xs text-[var(--muted)] mt-1">{projection.description}</p>
      <div className="h-36 mt-3">
        <ResponsiveContainer>
          <LineChart data={projection.series}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="year"
              tick={{ fill: "#8a93b0", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              minTickGap={20}
            />
            <YAxis
              tick={{ fill: "#8a93b0", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: "#131a2e",
                border: "1px solid #2a3458",
                borderRadius: 6,
              }}
              labelStyle={{ color: "#e6eaf5" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={
                projection.hazard === "heat"
                  ? "#f87171"
                  : projection.hazard === "smoke"
                  ? "#fbbf24"
                  : projection.hazard === "flood"
                  ? "#60a5fa"
                  : projection.hazard === "wind"
                  ? "#a78bfa"
                  : "#6ee7b7"
              }
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
