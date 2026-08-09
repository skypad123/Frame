import type { OcgListing } from "@/lib/types";
import * as cheerio from "cheerio";

/**
 * Yuyutei scraper for Yu-Gi-Oh! OCG card prices.
 * 
 * Note: This implementation uses web scraping since Yuyutei doesn't provide
 * a public API. The HTML structure may change over time and require updates.
 * The scraper gracefully degrades - if parsing fails, it returns an empty
 * array without breaking the overall price fetch.
 */

type YuyuteiItem = {
  name: string;
  setCode: string;
  rarity: string;
  condition: string;
  price: number;
  inStock: boolean;
};

export function yuyuteiSearchUrl(japaneseName: string): string {
  return `https://yuyu-tei.jp/game_ygo/sell/sell_price.php?name=${encodeURIComponent(japaneseName)}`;
}

/**
 * Parse Yuyutei's HTML to extract card listings.
 * Tries multiple selector patterns to handle different HTML structures.
 */
function parseYuyuteiHtml(html: string, searchName: string): YuyuteiItem[] {
  const $ = cheerio.load(html);
  const items: YuyuteiItem[] = [];

  // Try multiple common patterns for Yuyutei listings
  const selectors = [
    "table.card_list tr",
    "table.item_list tr", 
    ".card-list-item",
    ".item-box",
    "tr.item",
    ".product-row"
  ];

  for (const selector of selectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      elements.each((_, element) => {
        const $elem = $(element);
        
        // Skip header rows
        if ($elem.hasClass("head") || $elem.hasClass("header")) return;

        try {
          // Try multiple ways to extract card name
          const name = 
            $elem.find(".card_name, .card-name, .item-name, .product-name").text().trim() ||
            $elem.find("td").first().text().trim();

          if (!name) return;

          // Extract set info
          const setInfo = 
            $elem.find(".set_name, .set-info, .card-set").text().trim() ||
            "Unknown";

          // Extract rarity
          const rarity = 
            $elem.find(".rarity, .card-rarity").text().trim() ||
            "?";

          // Extract condition
          const condition = 
            $elem.find(".condition, .card-condition").text().trim() ||
            "NM";

          // Extract price
          const priceText = 
            $elem.find(".price, .card-price, .item-price, .product-price").text().trim() ||
            $elem.find("td").last().text().trim();

          const priceMatch = priceText.match(/[\d,]+/);
          const price = priceMatch
            ? Number(priceMatch[0].replace(/,/g, ""))
            : 0;

          // Check stock status
          const stockText = $elem.find(".stock, .card-stock, .availability").text().trim();
          const inStock = !stockText.includes("売切") && 
                         !stockText.includes("×") && 
                         !stockText.includes("在庫なし");

          if (name && price > 0) {
            items.push({
              name,
              setCode: setInfo,
              rarity,
              condition: mapYuyuteiCondition(condition),
              price,
              inStock,
            });
          }
        } catch (error) {
          // Silently continue on parsing errors
        }
      });

      // If we found items with this selector, stop trying others
      if (items.length > 0) break;
    }
  }

  return items;
}

/**
 * Map Yuyutei condition labels to standardized format
 */
function mapYuyuteiCondition(condition: string): string {
  const lower = condition.toLowerCase();
  if (lower.includes("nm") || lower.includes("美品")) return "NM";
  if (lower.includes("lp") || lower.includes("良品")) return "LP";
  if (lower.includes("mp") || lower.includes("並品")) return "MP";
  if (lower.includes("hp") || lower.includes("劣品")) return "HP";
  return "Play";
}

/**
 * Map Yuyutei rarity codes to short form
 */
function mapYuyuteiRarity(rarity: string): string {
  const rarityMap: Record<string, string> = {
    "ノーマル": "N",
    "レア": "R",
    "スーパーレア": "SR",
    "ウルトラレア": "UR",
    "シークレットレア": "SCR",
    "アルティメットレア": "UTR",
    "パラレルレア": "PR",
    "ホログラフィックレア": "HR",
    "プリズマティックシークレットレア": "PSCR",
    "コレクターズレア": "CR",
    "20thシークレットレア": "20SCR",
    "クォーターセンチュリーシークレットレア": "QCSCR",
  };

  return rarityMap[rarity] || rarity;
}

function mapYuyuteiListing(item: YuyuteiItem, index: number): OcgListing {
  return {
    id: index, // Yuyutei doesn't provide unique IDs, use index
    name: item.name,
    setCode: item.setCode,
    rarity: mapYuyuteiRarity(item.rarity),
    rarityFull: item.rarity,
    condition: item.condition,
    priceYen: item.price,
    inStock: item.inStock,
    source: "yuyutei",
  };
}

export async function fetchYuyuteiListings(
  japaneseName: string,
): Promise<OcgListing[]> {
  try {
    const url = yuyuteiSearchUrl(japaneseName);
    
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      // Cache for 15 minutes - Yuyutei prices can change frequently
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      console.warn(`Yuyutei fetch returned status ${response.status} for "${japaneseName}"`);
      return [];
    }

    const html = await response.text();
    const items = parseYuyuteiHtml(html, japaneseName);

    if (items.length === 0) {
      console.log(`No Yuyutei listings found for "${japaneseName}"`);
      return [];
    }

    // Prefer exact Japanese name matches
    const exact = items.filter((item) => item.name === japaneseName);
    const selected = exact.length > 0 ? exact : items;

    const listings = selected
      .map((item, index) => mapYuyuteiListing(item, index))
      .filter((listing) => listing.priceYen > 0 && listing.inStock)
      .sort((a, b) => a.priceYen - b.priceYen);

    console.log(`Fetched ${listings.length} Yuyutei listings for "${japaneseName}"`);
    return listings;
  } catch (error) {
    console.warn(`Yuyutei fetch error for "${japaneseName}":`, error);
    // Return empty array instead of throwing - we don't want Yuyutei failures
    // to break the entire price fetch
    return [];
  }
}
