/**
 * Carousell (Singapore) deep-link helpers for Frame.
 *
 * Carousell has no public marketplace API. Until a formal partnership /
 * data agreement exists, Frame only links out to Carousell search so
 * shop staff can check local SGD C2C listings alongside JP retailer prices.
 *
 * Prefer English card names — SG listings are typically titled in English
 * (often with "Yugioh" / "OCG" tags). Japanese-name search is a weak fallback.
 */

const CAROUSELL_SG_SEARCH = "https://www.carousell.sg/search";

export function carousellSearchUrl(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) {
    return "https://www.carousell.sg/search/yugioh";
  }
  return `${CAROUSELL_SG_SEARCH}/${encodeURIComponent(trimmed)}`;
}
