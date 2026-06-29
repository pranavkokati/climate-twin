// POST /api/observations/[id]/upvote — increment upvote count

import { NextRequest, NextResponse } from "next/server";
import { OBSERVATIONS } from "@/data/cities";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const obs = OBSERVATIONS.find((o) => o.id === params.id);
  if (!obs) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  obs.upvotes += 1;
  return NextResponse.json({ observation: obs });
}
