"use client";

import { useEffect, useState } from "react";
import type { City, Observation, Hazard } from "@/lib/types";

export default function CommunityPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState("seattle");
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<Hazard>("heat");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/cities")
      .then((r) => r.json())
      .then((d) => setCities(d.cities ?? []));
  }, []);

  useEffect(() => {
    loadObservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

  function loadObservations() {
    setLoading(true);
    fetch(`/api/observations?cityId=${cityId}`)
      .then((r) => r.json())
      .then((d) => setObservations(d.observations ?? []))
      .finally(() => setLoading(false));
  }

  const city = cities.find((c) => c.id === cityId);

  useEffect(() => {
    if (city && !neighborhoodId && city.neighborhoods.length > 0) {
      setNeighborhoodId(city.neighborhoods[0].id);
    }
  }, [city, neighborhoodId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!author || !text || !neighborhoodId) return;
    setSubmitting(true);
    try {
      await fetch("/api/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId,
          neighborhoodId,
          author,
          category,
          text,
        }),
      });
      setAuthor("");
      setText("");
      await loadObservations();
    } finally {
      setSubmitting(false);
    }
  }

  async function upvote(id: string) {
    await fetch(`/api/observations/${id}/upvote`, { method: "POST" });
    loadObservations();
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm text-[var(--muted)]">Tools · Community Hub</p>
        <h1 className="text-3xl font-bold mt-1">Community Hub</h1>
        <p className="text-[var(--muted)] mt-2 max-w-3xl">
          Residents report what they&rsquo;re actually seeing on the ground. These
          observations ground-truth the digital model — when enough people flag
          the same intersection, the city can prioritize it.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <form className="panel space-y-3 lg:col-span-1" onSubmit={submit}>
          <h2 className="font-semibold">Share an observation</h2>

          <div>
            <label className="text-sm text-[var(--muted)] block mb-1">City</label>
            <select
              className="select"
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
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

          <div>
            <label className="text-sm text-[var(--muted)] block mb-1">
              Hazard category
            </label>
            <select
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value as Hazard)}
            >
              {(["heat", "flood", "smoke", "wind", "drought"] as Hazard[]).map(
                (h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label className="text-sm text-[var(--muted)] block mb-1">
              Your name
            </label>
            <input
              className="input"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Jane Q."
            />
          </div>

          <div>
            <label className="text-sm text-[var(--muted)] block mb-1">
              What did you observe?
            </label>
            <textarea
              className="textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="This intersection floods every time it rains more than an inch…"
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={submitting || !author || text.length < 10}
          >
            {submitting ? "Posting…" : "Post observation"}
          </button>
        </form>

        <div className="lg:col-span-2 space-y-3">
          {loading && (
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          )}
          {!loading && observations.length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              No observations yet for this city.
            </p>
          )}
          {observations.map((o) => {
            const c = cities.find((x) => x.id === o.cityId);
            const n = c?.neighborhoods.find((x) => x.id === o.neighborhoodId);
            return (
              <article key={o.id} className="panel">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`chip tag-${o.category}`}>{o.category}</span>
                    <p className="text-sm">
                      <span className="font-medium">{o.author}</span>
                      <span className="text-[var(--muted)]">
                        {" · "}
                        {n?.name ?? "Unknown"}
                        {" · "}
                        {new Date(o.postedAt).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost btn"
                    style={{ padding: "0.3rem 0.7rem", fontSize: 13 }}
                    onClick={() => upvote(o.id)}
                  >
                    ▲ {o.upvotes}
                  </button>
                </div>
                <p className="mt-3 text-sm">{o.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
