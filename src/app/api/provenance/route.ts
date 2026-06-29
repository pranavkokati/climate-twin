// GET /api/provenance — returns the real-data provenance for the app.
// Includes NOAA station IDs, EPA AQS snapshot stats, and IPCC AR6 references.

import { NextResponse } from "next/server";
import { DATA_PROVENANCE } from "@/data/cities";

export async function GET() {
  return NextResponse.json({ provenance: DATA_PROVENANCE });
}
