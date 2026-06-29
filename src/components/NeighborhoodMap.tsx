"use client";

// SVG-based neighborhood map. We project lng/lat onto a fixed SVG viewport
// centered on the city's centroid. This is intentionally simple — no tile
// server dependency for the demo.

import { useMemo } from "react";
import type { City, Neighborhood } from "@/lib/types";

const VIEW = 600;
const PAD = 40;

interface Props {
  city: City;
  selectedNeighborhoodId: string;
  onSelect: (id: string) => void;
}

function floodColor(risk: Neighborhood["floodRisk"]) {
  switch (risk) {
    case "low":
      return "rgba(110, 231, 183, 0.18)";
    case "moderate":
      return "rgba(96, 165, 250, 0.18)";
    case "high":
      return "rgba(251, 191, 36, 0.22)";
    case "severe":
      return "rgba(248, 113, 113, 0.25)";
  }
}

function floodStroke(risk: Neighborhood["floodRisk"]) {
  switch (risk) {
    case "low":
      return "#6ee7b7";
    case "moderate":
      return "#60a5fa";
    case "high":
      return "#fbbf24";
    case "severe":
      return "#f87171";
  }
}

export function NeighborhoodMap({ city, selectedNeighborhoodId, onSelect }: Props) {
  const { polygons, centroidXY } = useMemo(() => {
    // Project: compute bbox of all polygon points, then map to [PAD..VIEW-PAD]
    const all = city.neighborhoods.flatMap((n) => n.polygon);
    const minLng = Math.min(...all.map((p) => p[0]));
    const maxLng = Math.max(...all.map((p) => p[0]));
    const minLat = Math.min(...all.map((p) => p[1]));
    const maxLat = Math.max(...all.map((p) => p[1]));
    const dx = Math.max(maxLng - minLng, 0.001);
    const dy = Math.max(maxLat - minLat, 0.001);

    const scaleX = (lng: number) =>
      PAD + ((lng - minLng) / dx) * (VIEW - 2 * PAD);
    const scaleY = (lat: number) =>
      PAD + ((maxLat - lat) / dy) * (VIEW - 2 * PAD); // flip Y

    const projected = city.neighborhoods.map((n) => ({
      id: n.id,
      name: n.name,
      points: n.polygon.map(([lng, lat]) => [scaleX(lng), scaleY(lat)] as [number, number]),
      heatDelta: n.heatDelta,
      floodRisk: n.floodRisk,
      treeCanopy: n.treeCanopy,
      population: n.population,
    }));

    const centroidXY: [number, number] = [
      scaleX(city.centroid[0]),
      scaleY(city.centroid[1]),
    ];

    return { polygons: projected, centroidXY };
  }, [city]);

  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Heat Island Navigator</h3>
        <p className="text-xs text-[var(--muted)]">
          Click a neighborhood to zoom in
        </p>
      </div>

      <div className="grid-bg rounded-lg overflow-hidden border border-[var(--border)]">
        <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="w-full h-auto">
          <defs>
            <radialGradient id="hot" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(248, 113, 113, 0.6)" />
              <stop offset="100%" stopColor="rgba(248, 113, 113, 0)" />
            </radialGradient>
          </defs>

          {/* City centroid marker */}
          <circle
            cx={centroidXY[0]}
            cy={centroidXY[1]}
            r={9}
            fill="var(--accent)"
            opacity={0.8}
          />
          <text
            x={centroidXY[0] + 12}
            y={centroidXY[1] + 4}
            fill="var(--accent)"
            fontSize="12"
            fontFamily="ui-monospace, monospace"
          >
            {city.name}
          </text>

          {polygons.map((p) => {
            const isSelected = p.id === selectedNeighborhoodId;
            const pathD = p.points
              .map((pt, i) => `${i === 0 ? "M" : "L"}${pt[0]},${pt[1]}`)
              .join(" ") + " Z";
            return (
              <g
                key={p.id}
                style={{ cursor: "pointer" }}
                onClick={() => onSelect(p.id)}
              >
                <path
                  d={pathD}
                  fill={floodColor(p.floodRisk)}
                  stroke={floodStroke(p.floodRisk)}
                  strokeWidth={isSelected ? 3 : 1.5}
                />
                {p.heatDelta > 1.5 && (
                  <circle
                    cx={p.points.reduce((s, pt) => s + pt[0], 0) / p.points.length}
                    cy={p.points.reduce((s, pt) => s + pt[1], 0) / p.points.length}
                    r={Math.min(50, 20 + p.heatDelta * 6)}
                    fill="url(#hot)"
                    pointerEvents="none"
                  />
                )}
                <text
                  x={
                    p.points.reduce((s, pt) => s + pt[0], 0) / p.points.length
                  }
                  y={
                    p.points.reduce((s, pt) => s + pt[1], 0) / p.points.length
                  }
                  textAnchor="middle"
                  fill="var(--text)"
                  fontSize="11"
                  fontWeight={isSelected ? 700 : 500}
                  pointerEvents="none"
                >
                  {p.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: "rgba(248, 113, 113, 0.6)" }}
          />
          Hot island (+{">"}1.5°F)
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: floodStroke("severe") }}
          />
          Severe flood
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: floodStroke("high") }}
          />
          High flood
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: floodStroke("moderate") }}
          />
          Moderate
        </span>
      </div>
    </div>
  );
}
