// GET /api/cities — list all available cities
// GET /api/cities/[id] — single city with projections for the requested scenario

import { NextRequest, NextResponse } from "next/server";
import { listCities, getCity } from "@/data/cities";
import { downscaleToNeighborhood } from "@/lib/downscaling";
import type { Scenario } from "@/lib/types";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const scenario = (url.searchParams.get("scenario") as Scenario) || "rcp45";
  const neighborhoodId = url.searchParams.get("neighborhood");

  if (id) {
    const city = getCity(id);
    if (!city) {
      return NextResponse.json({ error: "city not found" }, { status: 404 });
    }
    if (neighborhoodId) {
      const neighborhood = city.neighborhoods.find(
        (n) => n.id === neighborhoodId,
      );
      if (!neighborhood) {
        return NextResponse.json(
          { error: "neighborhood not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({
        city,
        scenario,
        neighborhood,
        projections: downscaleToNeighborhood(
          city.projections[scenario],
          neighborhood,
          scenario,
        ),
      });
    }
    return NextResponse.json({ city, scenario });
  }

  return NextResponse.json({ cities: listCities() });
}
