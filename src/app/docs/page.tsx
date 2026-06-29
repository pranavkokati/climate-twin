"use client";

import { useEffect, useState } from "react";
import { SCENARIO_DESCRIPTION, SCENARIO_LABEL } from "@/lib/scenarios";

interface Provenance {
  climateBaselines: {
    _stations: Record<string, string>;
    _period: string;
  };
  epaPm25_2024: Record<string, unknown>;
  projections2050: Record<string, unknown>;
}

export default function DocsPage() {
  const [prov, setProv] = useState<Provenance | null>(null);
  useEffect(() => {
    fetch("/api/provenance")
      .then((r) => r.json())
      .then((d) => setProv(d.provenance ?? null));
  }, []);

  return (
    <div className="space-y-10 max-w-3xl">
      <header>
        <p className="text-sm text-[var(--muted)]">Reference · Documentation</p>
        <h1 className="text-3xl font-bold mt-1">Climate Twin — Docs</h1>
        <p className="text-[var(--muted)] mt-2">
          Architecture, real-data sources, methodology, and extension points.
        </p>
      </header>

      <section className="panel">
        <h2 className="text-xl font-semibold">Real data sources</h2>
        <p className="text-sm text-[var(--muted)] mt-2">
          All baseline climate numbers come from public NOAA and EPA datasets —
          not invented. Re-ingest any time with{" "}
          <code>python3 scripts/ingest_real_data.py</code>.
        </p>
        <table className="w-full text-sm mt-3">
          <thead>
            <tr className="text-left text-[var(--muted)]">
              <th className="font-medium py-1">City</th>
              <th className="font-medium py-1">NOAA station</th>
              <th className="font-medium py-1">Period</th>
            </tr>
          </thead>
          <tbody className="text-[var(--text)]">
            {prov &&
              Object.entries(prov.climateBaselines._stations).map(
                ([city, station]) => (
                  <tr key={city} className="border-t border-[var(--border)]">
                    <td className="py-2 capitalize">{city}</td>
                    <td className="py-2 text-[var(--muted)]">{station}</td>
                    <td className="py-2 text-[var(--muted)]">
                      {prov.climateBaselines._period}
                    </td>
                  </tr>
                ),
              )}
          </tbody>
        </table>
        <ul className="text-sm mt-4 space-y-1 text-[var(--muted)] list-disc list-inside">
          <li>
            <strong className="text-[var(--text)]">Climate baselines:</strong>{" "}
            NOAA NCEI Daily Summaries (TMAX, TMIN, PRCP) — public, no API key
            required.
          </li>
          <li>
            <strong className="text-[var(--text)]">Smoke-day sanity check:</strong>{" "}
            EPA AQS daily PM2.5 2024 — used as a sanity check on literature
            baselines (Liu et al. 2023, Burke et al. 2021).
          </li>
          <li>
            <strong className="text-[var(--text)]">2050 projections:</strong>{" "}
            IPCC AR6 WG1 mid-range regional deltas (RCP 4.5), applied to the
            real NOAA baselines and scaled per scenario.
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="text-xl font-semibold">Architecture</h2>
        <pre className="text-xs mt-3 bg-[var(--panel-2)] p-4 rounded overflow-auto border border-[var(--border)]">{`┌────────────┐   ┌────────────┐   ┌───────────────┐
│ Public UI  │ → │  API layer │ → │ Domain logic  │
│ /explore,  │   │  /api/*    │   │ downscaling,  │
│ /simulator │   │            │   │ scoring, etc. │
└────────────┘   └────────────┘   └───────────────┘
                                            ↓
                                  ┌────────────────────┐
                                  │ Real data JSONs    │
                                  │ (NOAA + EPA ingest)│
                                  │ + src/data/cities  │
                                  └────────────────────┘`}</pre>
      </section>

      <section className="panel">
        <h2 className="text-xl font-semibold">Scenarios</h2>
        <div className="mt-3 space-y-3">
          {(["rcp26", "rcp45", "rcp85"] as const).map((s) => (
            <div key={s} className="panel-muted">
              <p className="font-semibold">{SCENARIO_LABEL[s]}</p>
              <p className="text-sm text-[var(--muted)] mt-1">
                {SCENARIO_DESCRIPTION[s]}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="text-xl font-semibold">Downscaling methodology</h2>
        <p className="text-sm mt-3">
          City-level projections come from real NOAA 1991-2020 baselines plus
          IPCC AR6 WG1 mid-range deltas. Neighborhood-level downscaling applies
          three adjustments on top:
        </p>
        <ol className="list-decimal list-inside text-sm mt-3 space-y-2 text-[var(--muted)]">
          <li>
            <strong className="text-[var(--text)]">Urban Heat Island offset:</strong>{" "}
            impervious-excess and canopy-deficit, per EPA UHI Compendium.
            Downtown Seattle runs ~2.4°F hotter than the city centroid.
          </li>
          <li>
            <strong className="text-[var(--text)]">Flood risk multiplier:</strong>{" "}
            neighborhoods with documented flood history get a 1.45× (high) or
            2.1× (severe) multiplier on precipitation and storm-wind days.
          </li>
          <li>
            <strong className="text-[var(--text)]">Drought penalty:</strong>{" "}
            impervious-dominant neighborhoods lose more recharge capacity;
            1.18× on longest-dry-streak.
          </li>
        </ol>
      </section>

      <section className="panel">
        <h2 className="text-xl font-semibold">What-If cooling factors</h2>
        <p className="text-sm text-[var(--muted)] mt-2">
          Cooling factors per 10% neighborhood coverage, from peer-reviewed
          meta-analyses:
        </p>
        <table className="w-full text-sm mt-3">
          <thead>
            <tr className="text-left text-[var(--muted)]">
              <th className="font-medium py-1">Intervention</th>
              <th className="font-medium py-1">Cooling per 10% coverage</th>
              <th className="font-medium py-1">Source</th>
            </tr>
          </thead>
          <tbody className="text-[var(--text)]">
            <tr className="border-t border-[var(--border)]">
              <td className="py-2">Tree canopy (street trees)</td>
              <td className="py-2">0.5°F</td>
              <td className="py-2 text-[var(--muted)]">Bowler et al. 2010</td>
            </tr>
            <tr className="border-t border-[var(--border)]">
              <td className="py-2">Urban forest (dense mixed planting)</td>
              <td className="py-2">0.85°F</td>
              <td className="py-2 text-[var(--muted)]">Wang et al. 2019</td>
            </tr>
            <tr className="border-t border-[var(--border)]">
              <td className="py-2">Cool roofs (high SRI)</td>
              <td className="py-2">0.18°F</td>
              <td className="py-2 text-[var(--muted)]">Akbari et al. 2012</td>
            </tr>
            <tr className="border-t border-[var(--border)]">
              <td className="py-2">Permeable pavement</td>
              <td className="py-2">0.05°F</td>
              <td className="py-2 text-[var(--muted)]">Haselbach 2010</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 className="text-xl font-semibold">Extension points</h2>
        <ul className="text-sm mt-3 space-y-2 list-disc list-inside text-[var(--muted)]">
          <li>
            Replace neighborhood polygons with OpenStreetMap relation
            geometry (Overpass API).
          </li>
          <li>
            Add NextAuth + per-user saved addresses and property-score history.
          </li>
          <li>
            Add Stripe for &ldquo;Climate Pro&rdquo; tiers (unlimited property
            scores, alerts, GIS export).
          </li>
          <li>
            Cron-driven re-ingest of NOAA + EPA data to keep baselines current.
          </li>
        </ul>
      </section>
    </div>
  );
}
