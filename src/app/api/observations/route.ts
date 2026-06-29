// GET /api/observations?cityId=... — list observations
// POST /api/observations — add a new observation
// POST /api/observations/[id]/upvote — increment upvote count

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OBSERVATIONS } from "@/data/cities";
import type { Hazard, Observation } from "@/lib/types";

const NewObs = z.object({
  cityId: z.string(),
  neighborhoodId: z.string(),
  author: z.string().min(1).max(80),
  category: z.enum(["heat", "flood", "smoke", "wind", "drought"]),
  text: z.string().min(10).max(800),
});

export async function GET(request: NextRequest) {
  const cityId = new URL(request.url).searchParams.get("cityId");
  const filtered = cityId
    ? OBSERVATIONS.filter((o) => o.cityId === cityId)
    : OBSERVATIONS;
  // newest first
  const sorted = [...filtered].sort((a, b) =>
    b.postedAt.localeCompare(a.postedAt),
  );
  return NextResponse.json({ observations: sorted });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const parsed = NewObs.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const obs: Observation = {
    id: `obs-${Date.now()}`,
    cityId: parsed.data.cityId,
    neighborhoodId: parsed.data.neighborhoodId,
    author: parsed.data.author,
    postedAt: new Date().toISOString(),
    category: parsed.data.category as Hazard,
    text: parsed.data.text,
    upvotes: 1,
  };
  OBSERVATIONS.unshift(obs);
  return NextResponse.json({ observation: obs }, { status: 201 });
}
