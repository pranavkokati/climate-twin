"use client";

import { SCENARIO_DESCRIPTION, SCENARIO_LABEL } from "@/lib/scenarios";

export default function DocsPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <header>
        <p className="text-sm text-[var(--muted)]">Reference · Documentation</p>
        <h1 className="text-3xl font-bold mt-1">Climate Twin — Docs</h1>
        <p className="text-[var(--muted)] mt-2">
          Architecture, data sources, methodology, and extension points.
        </p>
      </header>

      <section className="panel">
        <h2 className="text-xl font-semibold">Architecture</h2>
        <pre className="text-xs mt-3 bg-[var(--panel-2)] p-4 rounded overflow-auto border border-[var(--border)]">{`┌────────────┐   ┌────────────┐   ┌───────────────┐
│ Public UI  │ → │  API layer │ → │ Domain logic  │
│ /explore,  │   │  /api/*    │   │ downscaling,  │
│ /simulator │   │            │   │ scoring, etc. │
└────────────┘   └────────────┘   └───────────────┘
                                            ↓
                                  ┌────────────────────┐
                                  │ Seed data (in-mem) │
                                  │ + NOAA/NASA ingest │
                                  │   (next: scheduled │
                                  │   via cron)        │
                                  └────────────────────┘`}</pre>
        <p className="text-sm text-[var(--muted)] mt-3">
          The Next.js app ships as a single deployable. Domain logic lives in{" "}
          <code>src/lib/</code> and is fully unit-tested. Seed data lives in{" "}
          <code>src/data/cities.ts</code>; production replaces it with an
          automated ingest pipeline.
        </p>
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
          City-level projections come from IPCC AR6 WG1 mid-range scenarios for
          2050. Neighborhood-level downscaling uses three adjustments:
        </p>
        <ol className="list-decimal list-inside text-sm mt-3 space-y-2 text-[var(--muted)]">
          <li>
            <strong className="text-[var(--text)]">Urban Heat Island offset:</strong>{" "}
            impervious-excess and canopy-deficit adjustments per the EPA UHI
            Compendium. Downtown Seattle runs ~2.4°F hotter than the city
            centroid on average.
          </li>
          <li>
            <strong className="text-[var(--text)]">Flood risk multiplier:</strong>{" "}
            neighborhoods with documented flood history get a 1.45× (high) or
            2.1× (severe) multiplier on precipitation and storm-wind days.
          </li>
          <li>
            <strong className="text-[var(--text)]">Drought penalty:</strong>{" "}
            impervious-dominant neighborhoods lose more recharge capacity;
            multiplier 1.18× on summer water deficit.
          </li>
        </ol>
      </section>

      <section className="panel">
        <h2 className="text-xl font-semibold">What-If cooling factors</h2>
        <p className="text-sm text-[var(--muted)] mt-2">
          Cooling factors per 10% neighborhood coverage, drawn from
          peer-reviewed meta-analyses:
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
        <p className="text-xs text-[var(--muted)] mt-3">
          Tree carbon sequestration modeled at 25 kg CO₂e per mature urban tree
          per year (USDA Forest Service).
        </p>
      </section>

      <section className="panel">
        <h2 className="text-xl font-semibold">Data sources (roadmap)</h2>
        <ul className="text-sm mt-3 space-y-2 text-[var(--muted)] list-disc list-inside">
          <li>
            <strong className="text-[var(--text)]">NOAA NCEI</strong> — 1991-2020
            climate normals (baseline).
          </li>
          <li>
            <strong className="text-[var(--text)]">NASA NEX-GDDP-CMIP6</strong>{" "}
            — statistically downscaled daily projections at 0.25° resolution.
          </li>
          <li>
            <strong className="text-[var(--text)]">EPA EJScreen</strong> — tree
            canopy, impervious surface, and EJ indices at census-tract level.
          </li>
          <li>
            <strong className="text-[var(--text)]">FEMA NFHL</strong> — flood
            hazard layers and base flood elevations.
          </li>
          <li>
            <strong className="text-[var(--text)]">AirNow</strong> — real-time
            and historical AQI / PM2.5 for smoke-day detection.
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="text-xl font-semibold">Extension points</h2>
        <ul className="text-sm mt-3 space-y-2 list-disc list-inside text-[var(--muted)]">
          <li>
            Replace <code>src/data/cities.ts</code> with an automated ingest
            (cron job fetching NOAA + NASA datasets into SQLite/Postgres).
          </li>
          <li>
            Swap the SVG <code>NeighborhoodMap</code> for MapLibre GL with
            satellite and tree-canopy tile layers.
          </li>
          <li>
            Add NextAuth + per-user saved addresses and property-score history.
          </li>
          <li>
            Add Stripe for &ldquo;Climate Pro&rdquo; tiers (unlimited property scores,
            alerts, export to GIS).
          </li>
        </ul>
      </section>
    </div>
  );
}
