import type { OcgListing } from "@/lib/types";

/**
 * Create a unique key for grouping listings by rarity and condition
 */
function getListingKey(listing: OcgListing): string {
  return `${listing.rarity}|${listing.condition}`;
}

/**
 * Merge listings from multiple sources, showing the cheapest price
 * for each unique rarity+condition combination.
 * 
 * Each merged listing will include:
 * - The cheapest price across all sources
 * - The source of that cheapest price
 * - All prices from different sources in the allPrices array
 */
export function mergeListings(
  bigwebListings: OcgListing[],
  yuyuteiListings: OcgListing[],
): OcgListing[] {
  // Group all listings by rarity+condition
  const groupMap = new Map<string, OcgListing[]>();

  // Add all listings to the map
  [...bigwebListings, ...yuyuteiListings].forEach((listing) => {
    const key = getListingKey(listing);
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(listing);
  });

  // For each group, create a merged listing with the cheapest price
  const merged: OcgListing[] = [];

  groupMap.forEach((listings) => {
    if (listings.length === 0) return;

    // Sort by price to find the cheapest
    const sorted = [...listings].sort((a, b) => a.priceYen - b.priceYen);
    const cheapest = sorted[0];

    // Collect all prices from different sources
    const allPrices = sorted.map((listing) => ({
      source: listing.source!,
      priceYen: listing.priceYen,
    }));

    // Create the merged listing using the cheapest one as base
    merged.push({
      ...cheapest,
      allPrices,
    });
  });

  // Sort merged listings by price
  return merged.sort((a, b) => a.priceYen - b.priceYen);
}
