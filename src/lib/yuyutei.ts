import type { OcgListing } from "@/lib/types";
import * as cheerio from "cheerio";

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
 * Note: This is a basic implementation that may need adjustments
 * based on actual Yuyutei HTML structure.
 */
function parseYuyuteiHtml(html: string, searchName: string): YuyuteiItem[] {
  const $ = cheerio.load(html);
  const items: YuyuteiItem[] = [];

  // Yuyutei typically shows cards in a table structure
  // This selector will need to be verified against actual HTML
  $("table.card_list tr").each((_, row) => {
    const $row = $(row);
    
    // Skip header rows
    if ($row.hasClass("head")) return;

    try {
      const name = $row.find(".card_name").text().trim();
      const setInfo = $row.find(".set_name").text().trim();
      const rarity = $row.find(".rarity").text().trim();
      const condition = $row.find(".condition").text().trim() || "NM";
      const priceText = $row.find(".price").text().trim();
      const stockText = $row.find(".stock").text().trim();

      // Extract price (remove ¥ and commas)
      const priceMatch = priceText.match(/[\d,]+/);
      const price = priceMatch
        ? Number(priceMatch[0].replace(/,/g, ""))
        : 0;

      const inStock = !stockText.includes("売切") && !stockText.includes("×");

      if (name && price > 0) {
        items.push({
          name,
          setCode: setInfo || "Unknown",
          rarity: rarity || "?",
          condition: mapYuyuteiCondition(condition),
          price,
          inStock,
        });
      }
    } catch (error) {
      console.warn("Failed to parse Yuyutei row:", error);
    }
  });

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
      console.error(`Yuyutei fetch failed (${response.status})`);
      return [];
    }

    const html = await response.text();
    const items = parseYuyuteiHtml(html, japaneseName);

    // Prefer exact Japanese name matches
    const exact = items.filter((item) => item.name === japaneseName);
    const selected = exact.length > 0 ? exact : items;

    return selected
      .map((item, index) => mapYuyuteiListing(item, index))
      .filter((listing) => listing.priceYen > 0 && listing.inStock)
      .sort((a, b) => a.priceYen - b.priceYen);
  } catch (error) {
    console.error("Yuyutei fetch error:", error);
    return [];
  }
}
