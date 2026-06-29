"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface City {
  id: string;
  name: string;
  state: string;
  centroid: [number, number];
  baselineStory: string;
}

export default function HomePage() {
  const [cities, setCities] = useState<City[]>([]);
  const [demoQuery, setDemoQuery] = useState(
    "What happens to Seattle by 2050?",
  );

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((d) => setCities(d.cities ?? []))
      .catch(() => setCities([]));
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="glow rounded-2xl border border-[var(--border)] p-10 md:p-16">
        <p className="text-sm uppercase tracking-wider text-[var(--accent)] font-semibold mb-4">
          Climate Twin
        </p>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight max-w-3xl">
          From <span style={{ color: "var(--danger)" }}>climate anxiety</span>{" "}
          to <span style={{ color: "var(--accent)" }}>climate agency</span>.
        </h1>
        <p className="mt-6 text-lg text-[var(--muted)] max-w-2xl">
          Hyper-local climate projections for your block, not your country.
          Toggle between decarbonization scenarios. Drill from city → ZIP code →
          street. See how your micro-climate is shaped by tree canopy,
          pavement, and elevation — and what changes when you add interventions.
        </p>

        <div className="mt-8 max-w-2xl">
          <label className="block text-sm text-[var(--muted)] mb-2">
            Try a query
          </label>
          <div className="flex gap-2">
            <input
              className="input"
              value={demoQuery}
              onChange={(e) => setDemoQuery(e.target.value)}
              placeholder="e.g. What happens to Seattle by 2050?"
            />
            <Link
              className="btn"
              href={`/explore?city=seattle&scenario=rcp45&q=${encodeURIComponent(demoQuery)}`}
            >
              Ask Climate Twin
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <span className="chip">RCP 2.6 / 4.5 / 8.5</span>
          <span className="chip">Neighborhood-scale downscaling</span>
          <span className="chip">What-if interventions</span>
          <span className="chip">Property Resilience Score</span>
          <span className="chip">Community observations</span>
        </div>
      </section>

      {/* Core architecture */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">How it works</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              t: "Multi-scalar modeling",
              d: "Start at the city level for the macro-trend, drill down to the ZIP code and street level to see how local infrastructure shapes micro-climate.",
            },
            {
              t: "The Impact Layer",
              d: "Raw projections in human terms: smoke-day counts, flood-prone intersections, ER visits during heat waves, insurance risk shifts.",
            },
            {
              t: "Dynamic scenarios",
              d: "Toggle between Optimistic (RCP 2.6), Status Quo (RCP 4.5), and Pessimistic (RCP 8.5) to see how choices today compound through 2050.",
            },
          ].map((f) => (
            <div key={f.t} className="panel">
              <h3 className="font-semibold text-lg">{f.t}</h3>
              <p className="text-sm text-[var(--muted)] mt-2">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cities */}
      <section>
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl font-semibold">Pick a city</h2>
          <Link href="/explore" className="text-sm">
            Explore all →
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {cities.map((c) => (
            <Link
              key={c.id}
              href={`/explore?city=${c.id}`}
              className="panel hover:border-[var(--accent)] transition"
              style={{ textDecoration: "none" }}
            >
              <p className="text-xs text-[var(--muted)]">{c.state}</p>
              <h3 className="text-xl font-semibold mt-1">{c.name}</h3>
              <p className="text-sm text-[var(--muted)] mt-3 line-clamp-4">
                {c.baselineStory}
              </p>
              <p className="mt-4 text-sm" style={{ color: "var(--accent)" }}>
                Open city twin →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Closing narrative example */}
      <section className="panel">
        <h2 className="text-xl font-semibold mb-4">
          What a &ldquo;Climate Story&rdquo; looks like
        </h2>
        <blockquote className="border-l-4 pl-4 italic text-[var(--muted)]">
          “By 2050, your neighborhood in Seattle will experience{" "}
          <span style={{ color: "var(--danger)" }}>18 additional days</span> of
          extreme heat compared to today, and your risk of wildfire-related
          smoke exposure will increase by{" "}
          <span style={{ color: "var(--warning)" }}>14 days</span> per year.
          However, by increasing canopy cover in the Rainier Valley district, the
          neighborhood heat index could be reduced by{" "}
          <span style={{ color: "var(--accent)" }}>2.5°F</span>.”
        </blockquote>
        <p className="mt-4 text-sm">
          Every query returns a narrative, not a chart.{" "}
          <Link href="/explore?city=seattle">Try it →</Link>
        </p>
      </section>
    </div>
  );
}
