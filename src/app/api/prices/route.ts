import { NextRequest, NextResponse } from "next/server";
import { bigwebSearchUrl, fetchBigwebListings } from "@/lib/bigweb";
import { yuyuteiSearchUrl, fetchYuyuteiListings } from "@/lib/yuyutei";
import { mergeListings } from "@/lib/mergeListings";
import { containsJapanese, normalizeQuery } from "@/lib/format";

export async function GET(request: NextRequest) {
  const name = normalizeQuery(request.nextUrl.searchParams.get("name") ?? "");

  if (!name || !containsJapanese(name)) {
    return NextResponse.json(
      { error: "Provide a Japanese card name via ?name=" },
      { status: 400 },
    );
  }

  try {
    // Fetch from both sources in parallel
    const [bigwebListings, yuyuteiListings] = await Promise.all([
      fetchBigwebListings(name),
      fetchYuyuteiListings(name),
    ]);

    // Merge listings showing the cheapest price for each rarity+condition
    const listings = mergeListings(bigwebListings, yuyuteiListings);

    return NextResponse.json({
      japaneseName: name,
      listings,
      sources: {
        bigwebSearchUrl: bigwebSearchUrl(name),
        yuyuteiSearchUrl: yuyuteiSearchUrl(name),
      },
      meta: {
        listingCount: listings.length,
        lowestYen: listings[0]?.priceYen ?? null,
        highestYen: listings.length
          ? listings[listings.length - 1]?.priceYen ?? null
          : null,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("prices failed", error);
    return NextResponse.json(
      { error: "Unable to fetch Japanese market prices." },
      { status: 502 },
    );
  }
}
