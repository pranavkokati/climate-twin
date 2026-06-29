# Climate Twin

> **From climate anxiety to climate agency.** Hyper-local climate projections
> for your block, not your country. Toggle between decarbonization scenarios,
> drill from city → ZIP code → street, and see how local infrastructure shapes
> your micro-climate.

Climate Twin transforms abstract climate models into visual, human-scale
realities. Every query returns a **Climate Story** — a narrative synthesis of
data, neighborhood context, and the levers that move the needle.

```
"By 2050, your neighborhood in Seattle will experience 18 additional days
of extreme heat compared to today, and your risk of wildfire-related smoke
exposure will increase by 14 days per year. However, by increasing canopy
cover in the Rainier Valley district, the neighborhood heat index could be
reduced by 2.5°F."
```

---

## What's in the box

| Feature | What it does |
| --- | --- |
| **Multi-Scalar Modeling** | Drill from city centroid → neighborhood → individual block. The same dataset, scaled to wherever you live. |
| **Dynamic Scenarios** | Toggle RCP 2.6 (optimistic), RCP 4.5 (status quo), or RCP 8.5 (pessimistic). See how choices compound through 2050. |
| **Impact Layer** | Raw projections translated into human terms — smoke-day counts, ER visits, insurance-risk shifts, flood-prone intersections. |
| **Heat Island Navigator** | SVG map showing how impervious surface vs. tree canopy creates localized hot spots. |
| **What-If Simulator** | Drop a virtual intervention (tree canopy, cool roofs, permeable pavement, urban forest) onto a neighborhood and quantify the cooling, tree count, cost, and CO₂ sequestration. |
| **Property Resilience Score** | A "credit score" for climate risk at a specific address, with prioritized retrofitting recommendations. |
| **Community Hub** | Residents share ground-truthed observations that validate and enrich the digital model. |
| **Local Policy View** | Surface nearby council initiatives, ballot measures, and agency programs that address the same risks the model identifies. |

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
                                  │ Seed data (in-mem) │
                                  │ + NOAA/NASA ingest │
                                  │   (next: scheduled │
                                  │   via cron)        │
                                  └────────────────────┘
```

- **UI:** Next.js 14 App Router + React + Tailwind CSS. Charts by Recharts. SVG-based map (no tile-server dependency for the demo).
- **API layer:** Zod-validated REST endpoints at `src/app/api/*`.
- **Domain logic:** Pure-TypeScript modules in `src/lib/` — types, scenarios, downscaling, scoring, what-if simulation, narrative synthesis. Fully unit-tested.
- **Seed data:** Three cities (Seattle, Phoenix, Miami) with realistic baseline numbers from NOAA NCEI 1991-2020 normals + IPCC AR6 mid-range projections for 2050.

### Source layout

```
src/
├── app/                    Next.js App Router pages + API routes
│   ├── api/
│   │   ├── cities/         GET city list / single city (with neighborhood projections)
│   │   ├── story/          POST synthesize a Climate Story
│   │   ├── simulate/       POST run a What-If intervention
│   │   ├── property-score/ POST compute Property Resilience Score
│   │   └── observations/   GET list / POST add community observations
│   ├── explore/            City Twin dashboard (multi-scenario, multi-zoom)
│   ├── property-score/     Property Resilience Score UI
│   ├── simulator/          What-If intervention UI
│   ├── community/          Community observations UI
│   ├── docs/               Methodology + extension points
│   ├── layout.tsx
│   ├── page.tsx            Landing page
│   └── globals.css
├── components/             ScenarioPill, HazardChart, NeighborhoodMap
├── data/
│   └── cities.ts           Seed data: cities, neighborhoods, observations
└── lib/
    ├── types.ts            Domain contracts (Scenario, City, Neighborhood, …)
    ├── scenarios.ts        RCP multipliers + smoke-ramp constants
    ├── downscaling.ts      City→neighborhood downscaling + narrative synthesis
    ├── property-score.ts   Composite hazard → 0-100 resilience score
    └── what-if.ts          Intervention simulation (cooling factors, costs)
tests/                      vitest unit tests (31 tests across 4 files)
```

---

## Quickstart

Requires Node 20+ and npm.

```bash
git clone https://github.com/pranavkokati/climate-twin.git
cd climate-twin
npm install
npm run dev
```

Visit http://localhost:3000.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start dev server on :3000 |
| `npm run build` | Production build (14 routes) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Run vitest suite (31 tests) |
| `npm run lint` | ESLint via `next lint` |

### Try the API

```bash
# All cities
curl http://localhost:3000/api/cities

# Climate Story for Seattle's Rainier Valley under RCP 8.5
curl -X POST http://localhost:3000/api/story \
  -H 'Content-Type: application/json' \
  -d '{"cityId":"seattle","scenario":"rcp85","neighborhoodId":"rainier-valley"}'

# What-If: 25% tree canopy in Downtown Seattle
curl -X POST http://localhost:3000/api/simulate \
  -H 'Content-Type: application/json' \
  -d '{"cityId":"seattle","neighborhoodId":"downtown","scenario":"rcp85","intervention":{"type":"tree-canopy","coveragePct":25}}'

# Property Resilience Score for an address in South Phoenix
curl -X POST http://localhost:3000/api/property-score \
  -H 'Content-Type: application/json' \
  -d '{"cityId":"phoenix","neighborhoodId":"south-phoenix","address":"123 S Central Ave","scenario":"rcp85"}'
```

---

## Methodology (the science)

### Scenarios

| Scenario | Multiplier | Description |
| --- | --- | --- |
| **RCP 2.6** (Optimistic) | 0.55× | Rapid global decarbonization. ~1.5°C global warming by 2100. |
| **RCP 4.5** (Status Quo) | 1.0× | Current policy trajectories. ~2.5°C by 2100. |
| **RCP 8.5** (Pessimistic) | 1.7× | High-emission continuation. ~4.4°C by 2100. |

Multipliers are applied to the city-level delta between 1991-2020 baseline and 2050 projection (RCP 4.5 mid-range from IPCC AR6 WG1).

### Neighborhood downscaling

Three adjustments apply on top of the city-level projection:

1. **Urban Heat Island offset** — impervious-excess and canopy-deficit, per EPA UHI Compendium. Downtown Seattle runs ~2.4°F hotter than the city centroid.
2. **Flood risk multiplier** — neighborhoods with documented flood history get 1.45× (high) or 2.1× (severe) on precipitation and storm-wind days.
3. **Drought penalty** — impervious-dominant neighborhoods lose recharge capacity; 1.18× on summer water deficit.

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

A weighted composite of five hazard subscores:

```
overall = 0.30 × heat + 0.30 × flood + 0.20 × smoke + 0.10 × wind + 0.10 × drought
```

Each subscore maps the projected 2050 exposure (days/yr, inches/yr) to a 0-100 score where 100 = best. Retrofit recommendations are conditional on which subscores fall below threshold, with cost tier (low/medium/high) and impact delta.

---

## Roadmap to production

The demo is built so the swap from seed data → real ingest is a one-file change. Roadmap:

| Now | Next |
| --- | --- |
| Seed data in `src/data/cities.ts` | NOAA NCEI + NASA NEX-GDDP-CMIP6 ingest pipeline (cron job → SQLite/Postgres) |
| SVG neighborhood map | MapLibre GL with satellite + tree-canopy tiles |
| In-memory observations | Persistent store + spam moderation |
| Anonymous | NextAuth + per-user saved addresses + alert subscriptions |
| Free | Stripe-billed "Climate Pro" tier (unlimited property scores, GIS export) |
| Three cities | City onboarding pipeline (municipal data partnerships) |

---

## License

MIT — see `LICENSE`.

Built for civic climate agency. The data is illustrative — see `/docs` for full methodology, sources, and limitations.
