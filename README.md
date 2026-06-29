# Climate Twin

> **From climate anxiety to climate agency.** Hyper-local climate projections
> for your block, not your country — backed by real NOAA and EPA data.

Climate Twin transforms abstract climate models into visual, human-scale
realities. Every query returns a **Climate Story** — a narrative synthesis of
real climate data, neighborhood context, and the levers that move the needle.

```
"Seattle's Downtown by 2050: 14 more scorching days, 14 more smoke days.
By increasing canopy cover, the neighborhood heat index could be reduced
by 2.5°F."
```

---

## Built on real data!

Climate baselines come from public NOAA NCEI daily summaries (1991-2020),
fetched at build / run time. Mid-century projections apply IPCC AR6 WG1
mid-range regional deltas on top. Smoke baselines are anchored to peer-reviewed
literature (Liu et al. 2023 for the PNW, Burke et al. 2021 nationally) and
sanity-checked against EPA AirNow daily PM2.5.

| Source | Used for | Coverage |
| --- | --- | --- |
| **NOAA NCEI Daily Summaries** (1991-2020) | Heat, precipitation, dry-streak baselines | SeaTac, Sky Harbor, Miami Intl stations |
| **EPA AQS Daily PM2.5** (2024) | Smoke-day sanity check | All stations in city bounding box |
| **IPCC AR6 WG1** (mid-range RCP 4.5) | 2050 regional deltas | Per NCA5 regional chapters |
| **Liu et al. 2023, *Earth's Future*** | PNW smoke-day projections | Pacific NW |
| **Burke et al. 2021, *Env. Res. Lett.*** | National smoke projections | All US |
| **EPA UHI Compendium** | Neighborhood-scale heat offsets | All US |

Re-ingest any time:
```bash
python3 scripts/ingest_real_data.py
```

This fetches NOAA + EPA data and writes the JSONs to `src/data/real/`.

---

## What's in the box

| Feature | What it does |
| --- | --- |
| **Multi-Scalar Modeling** | Drill from city centroid → neighborhood → individual block. The same real-data dataset, scaled to wherever you live. |
| **Dynamic Scenarios** | Toggle RCP 2.6 (optimistic), RCP 4.5 (status quo), or RCP 8.5 (pessimistic). See how choices compound through 2050. |
| **Impact Layer** | Raw projections translated into human terms — smoke-day counts, ER visits, insurance-risk shifts, flood-prone intersections. |
| **Heat Island Navigator** | SVG map showing how impervious surface vs. tree canopy creates localized hot spots. |
| **What-If Simulator** | Drop a virtual intervention (tree canopy, cool roofs, permeable pavement, urban forest) onto a neighborhood and quantify the cooling, tree count, cost, and CO₂ sequestration. |
| **Property Resilience Score** | A "credit score" for climate risk at a specific address, with prioritized retrofitting recommendations. |
| **Community Hub** | Residents share ground-truthed observations that validate and enrich the model. |
| **Local Policy View** | Surface nearby council initiatives, ballot measures, and agency programs that address the same risks the model identifies. |
| **Data Provenance** | Every number is traceable to a NOAA station, EPA file, or peer-reviewed paper. See `/api/provenance` and `/docs`. |

---

## Quickstart

Requires Node 20+ and Python 3.10+ (for the ingest script).

```bash
git clone https://github.com/pranavkokati/climate-twin.git
cd climate-twin

# Install Node deps
npm install

# (Optional) Re-ingest real data — overwrites src/data/real/*.json
python3 scripts/ingest_real_data.py

# Start dev server
npm run dev
```

Visit http://localhost:3000.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start dev server on :3000 |
| `npm run build` | Production build (15 routes) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Run vitest suite (36 tests) |
| `npm run lint` | ESLint via `next lint` |

### Try the API

```bash
# All cities with real-data projections
curl http://localhost:3000/api/cities

# Climate Story for Seattle's Downtown under RCP 4.5
curl -X POST http://localhost:3000/api/story \
  -H 'Content-Type: application/json' \
  -d '{"cityId":"seattle","scenario":"rcp45","neighborhoodId":"downtown"}'

# What-If: 25% tree canopy in Downtown Seattle
curl -X POST http://localhost:3000/api/simulate \
  -H 'Content-Type: application/json' \
  -d '{"cityId":"seattle","neighborhoodId":"downtown","scenario":"rcp85","intervention":{"type":"tree-canopy","coveragePct":25}}'

# Property Resilience Score
curl -X POST http://localhost:3000/api/property-score \
  -H 'Content-Type: application/json' \
  -d '{"cityId":"phoenix","neighborhoodId":"south-phoenix","address":"123 S Central Ave","scenario":"rcp85"}'

# Data provenance — NOAA station IDs, EPA file references, IPCC deltas
curl http://localhost:3000/api/provenance
```

---

## Real numbers (current seed)

Computed from NOAA NCEI daily summaries 1991-2020.

| City | NOAA station | Heat days ≥95°F/yr | Annual precip | Longest dry streak |
| --- | --- | --- | --- | --- |
| Seattle | USW00013743 (SeaTac) | **14** | 41.8 in | 22.5 days |
| Phoenix | USW00023183 (Sky Harbor) | **145** | 7.2 in | 91.7 days |
| Miami | USW00012839 (Miami Intl) | **6** | 67.4 in | 25.2 days |

Projected to 2050 under RCP 4.5:

| City | Heat days ≥95°F | Smoke days | Precip | Dry streak |
| --- | --- | --- | --- | --- |
| Seattle | 14 → 28 | 3 → 17 | 41.8 → 44.7 in | 22.5 → 19.1 d |
| Phoenix | 145 → 188 | 6 → 20 | 7.2 → 6.8 in | 91.7 → 105.5 d |
| Miami | 6 → 12 | 3 → 17 | 67.4 → 75.5 in | 25.2 → 26.5 d |

RCP 2.6 / 8.5 projections are derived by scaling the RCP 4.5 delta by
0.55× / 1.7× (the standard scenario multipliers for global-mean surface
temperature change at mid-century).

---

## Architecture

```
┌────────────┐   ┌────────────┐   ┌───────────────┐
│ Public UI  │ → │  API layer │ → │ Domain logic  │
│ /explore,  │   │  /api/*    │   │ downscaling,  │
│ /simulator │   │            │   │ scoring, etc. │
└────────────┘   └────────────┘   └───────────────┘
                                            ↓
                                  ┌────────────────────┐
                                  │ src/data/real/     │
                                  │   climate-baselines│
                                  │   epa-pm25-2024    │
                                  │   projections-2050│
                                  │ (NOAA + EPA ingest)│
                                  └────────────────────┘
```

- **UI:** Next.js 14 App Router + React + Tailwind CSS. Charts by Recharts. SVG-based neighborhood map (no tile-server dependency for the demo).
- **API layer:** Zod-validated REST endpoints at `src/app/api/*`.
- **Domain logic:** Pure-TypeScript modules in `src/lib/` — types, scenarios, downscaling, scoring, what-if simulation, narrative synthesis. Fully unit-tested (36 tests).
- **Real data:** Fetched from NOAA + EPA via `scripts/ingest_real_data.py`, cached as JSON in `src/data/real/`, loaded by `src/data/cities.ts`.

### Source layout

```
src/
├── app/                       Next.js App Router pages + API routes
│   ├── api/
│   │   ├── cities/            GET city list / single city
│   │   ├── story/             POST synthesize a Climate Story
│   │   ├── simulate/          POST run a What-If intervention
│   │   ├── property-score/    POST compute Property Resilience Score
│   │   ├── provenance/        GET data-source provenance
│   │   └── observations/      GET list / POST add community observations
│   ├── explore/               City Twin dashboard
│   ├── property-score/        Property Resilience Score UI
│   ├── simulator/             What-If intervention UI
│   ├── community/             Community observations UI
│   ├── docs/                  Methodology + real-data sources
│   ├── layout.tsx
│   ├── page.tsx               Landing page
│   └── globals.css
├── components/                ScenarioPill, HazardChart, NeighborhoodMap
├── data/
│   ├── cities.ts              Loads + composes real-data JSONs
│   └── real/                  Fetched JSONs (regenerate via ingest script)
│       ├── climate-baselines.json
│       ├── epa-pm25-2024.json
│       └── projections-2050.json
└── lib/
    ├── types.ts               Domain contracts
    ├── scenarios.ts           RCP multipliers + smoke-ramp constants
    ├── downscaling.ts         City→neighborhood + narrative synthesis
    ├── property-score.ts      Composite hazard → 0-100 resilience
    └── what-if.ts             Intervention simulation
scripts/
└── ingest_real_data.py        NOAA + EPA ingest (no API keys)
tests/                         vitest unit tests (36 tests across 4 files)
```

---

## Methodology

### Scenarios

| Scenario | Multiplier (× RCP 4.5 delta) | Description |
| --- | --- | --- |
| **RCP 2.6** | 0.55× | Rapid global decarbonization. ~1.5°C by 2100. |
| **RCP 4.5** | 1.0× | Current policy trajectories. ~2.5°C by 2100. |
| **RCP 8.5** | 1.7× | High-emission continuation. ~4.4°C by 2100. |

### Neighborhood downscaling

Three adjustments apply on top of the city-level real-data projection:

1. **Urban Heat Island offset** — impervious-excess and canopy-deficit, per EPA UHI Compendium. Downtown Seattle runs ~2.4°F hotter than the city centroid.
2. **Flood risk multiplier** — neighborhoods with documented flood history get 1.45× (high) or 2.1× (severe) on precipitation and storm-wind days.
3. **Drought penalty** — impervious-dominant neighborhoods lose recharge capacity; 1.18× on longest-dry-streak.

### What-If cooling factors

Per 10% neighborhood coverage, from peer-reviewed meta-analyses:

| Intervention | Cooling | Source |
| --- | --- | --- |
| Tree canopy | 0.5°F | Bowler et al. 2010 |
| Urban forest (dense mixed planting) | 0.85°F | Wang et al. 2019 |
| Cool roofs | 0.18°F | Akbari et al. 2012 |
| Permeable pavement | 0.05°F | Haselbach 2010 |

Tree carbon sequestration modeled at 25 kg CO₂e per mature urban tree per year (USDA Forest Service).

### Property Resilience Score

```
overall = 0.30 × heat + 0.30 × flood + 0.20 × smoke + 0.10 × wind + 0.10 × drought
```

Each subscore maps the projected 2050 exposure to a 0-100 score where 100 = best.

---

## Roadmap

The architecture is built so each swap from real-data JSON → live ingest is a one-file change.

| Now | Next |
| --- | --- |
| NOAA + EPA pulled at build time | Cron-driven re-ingest (NCEI updated daily) |
| Three cities, hand-curated neighborhoods | Add 30+ US cities from US Census Gazetteer |
| Hand-drawn neighborhood polygons | Overpass API → OSM relation geometry |
| In-memory observations | Persistent store + spam moderation |
| Anonymous | NextAuth + per-user saved addresses + alert subscriptions |
| Free | Stripe-billed "Climate Pro" tier (unlimited property scores, GIS export) |
| Single-time snapshots | Time-series animation of hazard trajectories |

---

## License

MIT — see `LICENSE`.
