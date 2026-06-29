// POST /api/story — synthesize a Climate Story
// Body: { cityId: string, scenario?: Scenario, neighborhoodId?: string }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCity } from "@/data/cities";
import { synthesizeClimateStory } from "@/lib/downscaling";

const Body = z.object({
  cityId: z.string(),
  scenario: z.enum(["rcp26", "rcp45", "rcp85"]).optional(),
  neighborhoodId: z.string().optional(),
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

  const scenario = parsed.data.scenario ?? "rcp45";
  const neighborhood = parsed.data.neighborhoodId
    ? city.neighborhoods.find((n) => n.id === parsed.data.neighborhoodId)
    : undefined;

  if (parsed.data.neighborhoodId && !neighborhood) {
    return NextResponse.json(
      { error: "neighborhood not found" },
      { status: 404 },
    );
  }

  const story = synthesizeClimateStory(city, scenario, neighborhood);
  return NextResponse.json({ story });
}
