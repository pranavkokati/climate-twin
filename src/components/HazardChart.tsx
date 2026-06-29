"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ClimateProjection } from "@/lib/types";

const HAZARD_COLORS = {
  heat: "#f87171",
  smoke: "#fbbf24",
  flood: "#60a5fa",
  wind: "#a78bfa",
  drought: "#6ee7b7",
} as const;

// Merge all hazard series into a single chart dataset keyed by year.
function buildChartData(projections: ClimateProjection[]) {
  const map = new Map<number, Record<string, number>>();
  for (const p of projections) {
    for (const pt of p.series) {
      const row = map.get(pt.year) ?? { year: pt.year };
      row[p.hazard] = pt.value;
      map.set(pt.year, row);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.year - b.year);
}

export function HazardChart({ projections }: { projections: ClimateProjection[] }) {
  const data = buildChartData(projections);
  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Hazard trajectories · 1990 → 2060</h3>
        <p className="text-xs text-[var(--muted)]">All hazards (units vary)</p>
      </div>
      <p className="text-sm text-[var(--muted)] mb-3">
        Each line is one hazard projected under the active scenario. Scaled to
        visible range — see mini-charts below for actual values.
      </p>
      <div className="h-72">
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="year"
              tick={{ fill: "#8a93b0", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              minTickGap={20}
            />
            <YAxis
              tick={{ fill: "#8a93b0", fontSize: 12 }}
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
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {(["heat", "smoke", "flood", "wind", "drought"] as const).map(
              (h) => (
                <Line
                  key={h}
                  type="monotone"
                  dataKey={h}
                  stroke={HAZARD_COLORS[h]}
                  strokeWidth={2}
                  dot={false}
                />
              ),
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
