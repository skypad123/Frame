import { NextRequest, NextResponse } from "next/server";
import { bigwebSearchUrl, fetchBigwebListings } from "@/lib/bigweb";
import { carousellSearchUrl } from "@/lib/carousell";
import { yuyuteiSearchUrl, fetchYuyuteiListings } from "@/lib/yuyutei";
import { mergeListings } from "@/lib/mergeListings";
import { containsJapanese } from "@/lib/format";
import { getCardById, toCardSummary } from "@/lib/ygoprodeck";
import { resolveJapaneseName } from "@/lib/ygorganization";
import type { CardDetailResponse } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = Number(rawId);
  const japaneseOverride = request.nextUrl.searchParams.get("jp");

  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid card id." }, { status: 400 });
  }

  try {
    const card = await getCardById(id);
    if (!card) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    const konamiId = card.misc_info?.[0]?.konami_id ?? null;
    const japaneseName = await resolveJapaneseName({
      konamiId,
      englishName: card.name,
      fallbackJapanese:
        japaneseOverride && containsJapanese(japaneseOverride)
          ? japaneseOverride
          : null,
    });

    // Fetch from both sources in parallel
    const [bigwebListings, yuyuteiListings] = japaneseName
      ? await Promise.all([
          fetchBigwebListings(japaneseName),
          fetchYuyuteiListings(japaneseName),
        ])
      : [[], []];

    // Merge listings showing the cheapest price for each rarity+condition
    const listings = mergeListings(bigwebListings, yuyuteiListings);
    const priced = listings.filter((item) => item.priceYen > 0);
    const summary = toCardSummary(card);
    const prices = card.card_prices?.[0];

    const body: CardDetailResponse = {
      card: {
        ...summary,
        description: card.desc,
        japaneseName,
        konamiId,
        ocgDate: card.misc_info?.[0]?.ocg_date ?? null,
        referencePrices: {
          cardmarketEur: prices?.cardmarket_price ?? null,
          tcgplayerUsd: prices?.tcgplayer_price ?? null,
        },
      },
      listings: priced,
      sources: {
        bigwebSearchUrl: japaneseName
          ? bigwebSearchUrl(japaneseName)
          : "https://bigweb.co.jp/ja/products/yugioh",
        yuyuteiSearchUrl: japaneseName
          ? yuyuteiSearchUrl(japaneseName)
          : "https://yuyu-tei.jp/",
        // Prefer English name — Carousell SG listings are typically English-titled
        carousellSearchUrl: carousellSearchUrl(card.name),
      },
      meta: {
        listingCount: priced.length,
        lowestYen: priced[0]?.priceYen ?? null,
        highestYen: priced.length
          ? priced[priced.length - 1]?.priceYen ?? null
          : null,
        fetchedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(body);
  } catch (error) {
    console.error("card detail failed", error);
    return NextResponse.json(
      { error: "Unable to load OCG prices right now." },
      { status: 502 },
    );
  }
}
