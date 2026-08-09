import { NextRequest, NextResponse } from "next/server";
import { normalizeQuery } from "@/lib/format";
import { searchCards, toCardSummary } from "@/lib/ygoprodeck";
import type { SearchResponse } from "@/lib/types";

export async function GET(request: NextRequest) {
  const query = normalizeQuery(request.nextUrl.searchParams.get("q") ?? "");

  if (query.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters." },
      { status: 400 },
    );
  }

  try {
    const cards = await searchCards(query, 16);
    const body: SearchResponse = {
      query,
      results: cards.map(toCardSummary),
    };
    return NextResponse.json(body);
  } catch (error) {
    console.error("search failed", error);
    return NextResponse.json(
      { error: "Unable to search cards right now." },
      { status: 502 },
    );
  }
}
