// POST /api/simulate — what-if simulation for virtual interventions
// Body: { cityId, neighborhoodId?, intervention: { type, coveragePct } }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCity } from "@/data/cities";
import { downscaleToNeighborhood } from "@/lib/downscaling";
import { simulateIntervention } from "@/lib/what-if";
import type { Scenario, WhatIfIntervention } from "@/lib/types";

const Body = z.object({
  cityId: z.string(),
  neighborhoodId: z.string().optional(),
  scenario: z.enum(["rcp26", "rcp45", "rcp85"]).optional(),
  intervention: z.object({
    type: z.enum(["tree-canopy", "cool-roof", "permeable-pavement", "urban-forest"]),
    coveragePct: z.number().min(1).max(100),
  }),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const city = getCity(parsed.data.cityId);
  if (!city) {
    return NextResponse.json({ error: "city not found" }, { status: 404 });
  }

  const scenario: Scenario = parsed.data.scenario ?? "rcp45";
  let baselineTemp: number;

  if (parsed.data.neighborhoodId) {
    const neighborhood = city.neighborhoods.find(
      (n) => n.id === parsed.data.neighborhoodId,
    );
    if (!neighborhood) {
      return NextResponse.json(
        { error: "neighborhood not found" },
        { status: 404 },
      );
    }
    const downscaled = downscaleToNeighborhood(
      city.projections[scenario],
      neighborhood,
      scenario,
    );
    baselineTemp =
      downscaled.find((p) => p.hazard === "heat")?.projected ?? 85;
  } else {
    baselineTemp =
      city.projections[scenario].find((p) => p.hazard === "heat")?.projected ??
      85;
  }

  // For the demo, "baselineTemp" represents the projected 2050 mean summer temp
  // — the simulation reports the cooling offset applied on top of it.
  const intervention: WhatIfIntervention = {
    type: parsed.data.intervention.type,
    coveragePct: parsed.data.intervention.coveragePct,
    neighborhoodId: parsed.data.neighborhoodId,
  };
  const result = simulateIntervention(intervention, {
    baselineTemp,
    coveragePct: parsed.data.intervention.coveragePct,
  });

  return NextResponse.json({ result });
}
