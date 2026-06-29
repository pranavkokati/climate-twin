"use client";

import { useEffect, useState } from "react";
import { ScenarioPill } from "@/components/ScenarioPill";
import type {
  City,
  PropertyScore as PropertyScoreType,
  Scenario,
} from "@/lib/types";

export default function PropertyScorePage() {
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState("seattle");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [address, setAddress] = useState("123 Main St");
  const [scenario, setScenario] = useState<Scenario>("rcp45");
  const [result, setResult] = useState<PropertyScoreType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/property-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityId, neighborhoodId, address, scenario }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setResult(data.score);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function scoreColor(score: number): string {
    if (score >= 80) return "var(--accent)";
    if (score >= 60) return "var(--warning)";
    return "var(--danger)";
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-[var(--muted)]">Tools · Property Resilience</p>
        <h1 className="text-3xl font-bold mt-1">Property Resilience Score</h1>
        <p className="text-[var(--muted)] mt-2 max-w-3xl">
          A climate-risk &ldquo;credit score&rdquo; for a specific address. Combines hazard
          exposure with localized infrastructure data and returns prioritized
          retrofitting recommendations.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        <form className="panel space-y-4" onSubmit={submit}>
          <div>
            <label className="text-sm text-[var(--muted)] block mb-1">
              Address
            </label>
            <input
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Seattle, WA"
            />
          </div>

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
                  setResult(null);
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
                Neighborhood
              </label>
              <select
                className="select"
                value={neighborhoodId}
                onChange={(e) => setNeighborhoodId(e.target.value)}
              >
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
              Scenario
            </label>
            <div className="flex gap-2">
              {(["rcp26", "rcp45", "rcp85"] as Scenario[]).map((s) => (
                <ScenarioPill
                  key={s}
                  scenario={s}
                  active={scenario === s}
                  onClick={() => setScenario(s)}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="btn" disabled={loading || !neighborhoodId}>
            {loading ? "Scoring…" : "Compute score"}
          </button>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </form>

        <div className="panel">
          <h2 className="font-semibold mb-4">Score</h2>
          {!result ? (
            <p className="text-sm text-[var(--muted)]">
              Fill in the form to compute a resilience score.
            </p>
          ) : (
            <div>
              <div className="flex items-baseline gap-3">
                <span
                  className="text-6xl font-bold"
                  style={{ color: scoreColor(result.overall) }}
                >
                  {result.overall}
                </span>
                <span className="text-[var(--muted)]">/100</span>
              </div>
              <p className="text-sm text-[var(--muted)] mt-1">{result.address}</p>

              <h3 className="text-sm uppercase tracking-wide text-[var(--muted)] mt-6">
                Hazard subscores
              </h3>
              <div className="mt-2 space-y-2">
                {Object.entries(result.components).map(([h, v]) => (
                  <div key={h}>
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{h}</span>
                      <span style={{ color: scoreColor(v as number) }}>{v}</span>
                    </div>
                    <div className="h-1.5 bg-[var(--panel-2)] rounded mt-1 overflow-hidden">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${v}%`,
                          background: scoreColor(v as number),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {result && result.recommendations.length > 0 && (
        <section className="panel">
          <h2 className="font-semibold mb-2">Recommended retrofits</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Sorted by expected improvement to your overall resilience score.
          </p>
          <ul className="space-y-3">
            {result.recommendations
              .sort((a, b) => b.impactDelta - a.impactDelta)
              .map((r, i) => (
                <li key={i} className="panel-muted">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{r.action}</p>
                    <span className="chip" style={{ color: "var(--accent)" }}>
                      +{r.impactDelta} points · {r.cost} cost
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1">{r.rationale}</p>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
