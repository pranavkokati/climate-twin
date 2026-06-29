// POST /api/property-score — compute a Property Resilience Score
// Body: { cityId, neighborhoodId, address, scenario? }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCity } from "@/data/cities";
import { scoreProperty } from "@/lib/property-score";

const Body = z.object({
  cityId: z.string(),
  neighborhoodId: z.string(),
  address: z.string().min(1),
  scenario: z.enum(["rcp26", "rcp45", "rcp85"]).optional(),
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

  const neighborhood = city.neighborhoods.find(
    (n) => n.id === parsed.data.neighborhoodId,
  );
  if (!neighborhood) {
    return NextResponse.json(
      { error: "neighborhood not found" },
      { status: 404 },
    );
  }

  const score = scoreProperty(
    city,
    neighborhood,
    parsed.data.address,
    parsed.data.scenario ?? "rcp45",
  );

  return NextResponse.json({ score });
}
