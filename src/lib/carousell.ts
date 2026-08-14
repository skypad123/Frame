import type { OcgListing } from "@/lib/types";

/**
 * Carousell integration for Frame - PROOF OF CONCEPT
 * 
 * ⚠️ WARNING: This is a proof-of-concept implementation demonstrating how
 * Carousell could be integrated into Frame. This code is NOT production-ready
 * and should NOT be deployed without:
 * 
 * 1. Legal review of Carousell Terms of Service
 * 2. Cost-benefit analysis and budget approval
 * 3. User demand validation
 * 4. Feature flag infrastructure
 * 5. Comprehensive testing
 * 
 * See /workspace/docs/CAROUSELL_INTEGRATION_EVALUATION.md for full details.
 */

// ============================================================================
// TYPES
// ============================================================================

type CarousellItem = {
  id: string;
  title: string;
  price: number;
  currency: string;
  description?: string;
  condition?: string;
  images?: string[];
  seller_username?: string;
  seller_rating?: number;
  seller_response_rate?: number;
  status?: "available" | "sold" | "reserved";
  url?: string;
  location?: string;
  posted_at?: string;
};

type ApifyDatasetResponse = {
  items: CarousellItem[];
};

type CarousellSearchParams = {
  englishName: string;
  japaneseName?: string;
  setCode?: string;
  maxResults?: number;
};

// ============================================================================
// CONFIGURATION
// ============================================================================

const APIFY_TOKEN = process.env.APIFY_TOKEN;
const APIFY_ACTOR_ID = "parseforge/carousell-scraper"; // or piotrv1001/carousell-listings-scraper
const ENABLE_CAROUSELL = process.env.NEXT_PUBLIC_ENABLE_CAROUSELL === "true";
const SGD_TO_JPY_RATE = 110; // Fallback rate if live conversion fails

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Generate Carousell search URL for manual browsing
 */
export function carousellSearchUrl(cardName: string): string {
  const query = encodeURIComponent(`${cardName} Yu-Gi-Oh!`);
  return `https://www.carousell.sg/search/${query}?searchId=`;
}

/**
 * Fetch Carousell listings for a Yu-Gi-Oh! card
 * 
 * NOTE: This requires an Apify account and API token. Costs approximately
 * $2-4 per 1,000 results. See documentation for setup instructions.
 * 
 * @param params Search parameters including English name (required)
 * @returns Array of OCG listings in Carousell format
 */
export async function fetchCarousellListings(
  params: CarousellSearchParams,
): Promise<OcgListing[]> {
  // Feature flag check
  if (!ENABLE_CAROUSELL) {
    console.log("Carousell integration is disabled via feature flag");
    return [];
  }

  // Validate API token
  if (!APIFY_TOKEN) {
    console.warn(
      "APIFY_TOKEN not configured. Carousell integration will not work.",
    );
    return [];
  }

  try {
    console.log(
      `Fetching Carousell listings for "${params.englishName}"...`,
    );

    // Search Carousell via Apify scraper
    const items = await searchCarousellViaApify(params);

    if (items.length === 0) {
      console.log(`No Carousell listings found for "${params.englishName}"`);
      return [];
    }

    // Filter to relevant results
    const filtered = filterRelevantListings(items, params);
    console.log(
      `Found ${filtered.length} relevant Carousell listings after filtering`,
    );

    // Convert to OcgListing format
    const listings = await Promise.all(
      filtered.map((item) => mapCarousellToOcgListing(item)),
    );

    // Sort by price (cheapest first)
    return listings.sort((a, b) => a.priceYen - b.priceYen);
  } catch (error) {
    console.error(`Carousell fetch error for "${params.englishName}":`, error);
    // Non-blocking failure - return empty array instead of throwing
    return [];
  }
}

// ============================================================================
// APIFY INTEGRATION
// ============================================================================

/**
 * Search Carousell via Apify scraper API
 */
async function searchCarousellViaApify(
  params: CarousellSearchParams,
): Promise<CarousellItem[]> {
  const searchQuery = `${params.englishName} Yu-Gi-Oh!`;

  const apifyInput = {
    query: searchQuery,
    country: "sg", // Singapore market
    sortBy: "price_low_to_high",
    maxItems: params.maxResults || 50,
  };

  // Call Apify actor
  const response = await fetch(
    `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${APIFY_TOKEN}`,
      },
      body: JSON.stringify(apifyInput),
      // Don't cache - Carousell prices change frequently
      next: { revalidate: 300 }, // 5 minutes
    },
  );

  if (!response.ok) {
    throw new Error(
      `Apify API failed: ${response.status} ${response.statusText}`,
    );
  }

  const items = (await response.json()) as CarousellItem[];
  return items || [];
}

// ============================================================================
// FILTERING & VALIDATION
// ============================================================================

/**
 * Filter Carousell items to only relevant Yu-Gi-Oh! card listings
 */
function filterRelevantListings(
  items: CarousellItem[],
  params: CarousellSearchParams,
): CarousellItem[] {
  return items.filter((item) => {
    // Must be available
    if (item.status !== "available") {
      return false;
    }

    // Must have a valid price
    if (!item.price || item.price <= 0) {
      return false;
    }

    // Title must mention card name (fuzzy match)
    const titleLower = item.title.toLowerCase();
    const cardNameLower = params.englishName.toLowerCase();
    const cardWords = cardNameLower.split(" ");

    // At least 70% of card name words must appear in title
    const matchedWords = cardWords.filter((word) =>
      titleLower.includes(word),
    ).length;
    const matchRatio = matchedWords / cardWords.length;

    if (matchRatio < 0.7) {
      return false;
    }

    // If we have a set code, prefer listings that mention it
    if (params.setCode) {
      const combinedText = `${item.title} ${item.description || ""}`.toLowerCase();
      const setCodeLower = params.setCode.toLowerCase();

      // Boost confidence if set code is mentioned
      if (combinedText.includes(setCodeLower)) {
        return true;
      }
    }

    // Exclude obvious non-cards (bulk lots, sleeves, etc.)
    const excludeKeywords = [
      "bulk",
      "lot of",
      "sleeve",
      "deck box",
      "playmat",
      "binder",
      "storage",
      "tin",
      "booster box",
      "booster pack",
      "sealed box",
    ];

    const hasExcludedKeyword = excludeKeywords.some(
      (keyword) =>
        titleLower.includes(keyword) ||
        (item.description && item.description.toLowerCase().includes(keyword)),
    );

    if (hasExcludedKeyword) {
      return false;
    }

    return true;
  });
}

// ============================================================================
// DATA MAPPING
// ============================================================================

/**
 * Convert Carousell item to OcgListing format
 */
async function mapCarousellToOcgListing(
  item: CarousellItem,
): Promise<OcgListing> {
  // Convert SGD to JPY
  const exchangeRate = await getExchangeRate("SGD", "JPY");
  const priceYen = Math.round(item.price * exchangeRate);

  // Extract metadata from title/description
  const rarity = extractRarity(item.title, item.description);
  const condition = extractCondition(item.title, item.description, item.condition);
  const setCode = extractSetCode(item.title, item.description);

  return {
    id: hashString(item.id), // Convert string ID to number
    name: item.title,
    setCode: setCode || "?",
    rarity: rarity.short,
    rarityFull: rarity.full,
    condition: condition,
    priceYen,
    inStock: item.status === "available",
    image: item.images?.[0],
    source: "carousell" as const,
    
    // Carousell-specific metadata (would need to extend OcgListing type)
    originalCurrency: item.currency || "SGD",
    originalPrice: item.price,
    marketplace: "C2C" as const,
    sellerInfo: {
      username: item.seller_username || "Unknown",
      rating: item.seller_rating || 0,
      responseRate: item.seller_response_rate || 0,
    },
    listingUrl: item.url,
    location: item.location || "Singapore",
    postedAt: item.posted_at,
  };
}

/**
 * Extract rarity from text (common patterns in Carousell listings)
 */
function extractRarity(
  title: string,
  description?: string,
): { short: string; full: string } {
  const text = `${title} ${description || ""}`.toLowerCase();

  const rarityPatterns = [
    { pattern: /prismatic secret|pscr/i, short: "PSCR", full: "Prismatic Secret Rare" },
    { pattern: /quarter century|qcscr|25th/i, short: "QCSCR", full: "Quarter Century Secret Rare" },
    { pattern: /20th secret|20scr/i, short: "20SCR", full: "20th Secret Rare" },
    { pattern: /ultimate|ulti|utr/i, short: "UTR", full: "Ultimate Rare" },
    { pattern: /secret|scr/i, short: "SCR", full: "Secret Rare" },
    { pattern: /ultra|ur\b/i, short: "UR", full: "Ultra Rare" },
    { pattern: /super|sr\b/i, short: "SR", full: "Super Rare" },
    { pattern: /rare|r\b/i, short: "R", full: "Rare" },
    { pattern: /collector|cr\b/i, short: "CR", full: "Collector's Rare" },
    { pattern: /starlight|star/i, short: "STAR", full: "Starlight Rare" },
    { pattern: /ghost|gho/i, short: "GHO", full: "Ghost Rare" },
    { pattern: /parallel|pr\b/i, short: "PR", full: "Parallel Rare" },
    { pattern: /common|nm\b/i, short: "N", full: "Normal" },
  ];

  for (const { pattern, short, full } of rarityPatterns) {
    if (pattern.test(text)) {
      return { short, full };
    }
  }

  return { short: "?", full: "Unknown" };
}

/**
 * Extract condition from text and Carousell's condition field
 */
function extractCondition(
  title: string,
  description?: string,
  carousellCondition?: string,
): string {
  const text = `${title} ${description || ""} ${carousellCondition || ""}`.toLowerCase();

  // Yu-Gi-Oh! standard conditions
  if (text.includes("mint") || text.includes(" nm") || text.includes("near mint")) {
    return "NM";
  }
  if (text.includes("lightly played") || text.includes(" lp")) {
    return "LP";
  }
  if (text.includes("moderately played") || text.includes(" mp")) {
    return "MP";
  }
  if (text.includes("heavily played") || text.includes(" hp") || text.includes("damaged")) {
    return "HP";
  }

  // Carousell generic conditions
  if (carousellCondition) {
    const cond = carousellCondition.toLowerCase();
    if (cond.includes("new") || cond.includes("brand new")) return "NM";
    if (cond.includes("like new")) return "NM";
    if (cond.includes("used") || cond.includes("good")) return "LP";
    if (cond.includes("heavily used") || cond.includes("fair")) return "HP";
  }

  // Default for C2C marketplace
  return "Used";
}

/**
 * Extract set code from text (e.g., "LOB-001", "DUSA-EN001")
 */
function extractSetCode(title: string, description?: string): string | null {
  const text = `${title} ${description || ""}`;
  
  // Match common Yu-Gi-Oh! set code patterns
  const patterns = [
    /\b([A-Z]{2,5}-[A-Z]{0,2}\d{3})\b/i, // LOB-001, DUSA-EN001
    /\b([A-Z]{2,5}\d{3})\b/i,             // LOB001
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get live SGD to JPY exchange rate
 * Falls back to approximate rate if API fails
 */
async function getExchangeRate(from: string, to: string): Promise<number> {
  try {
    // Option 1: Use Open Exchange Rates API (requires API key)
    // const response = await fetch(
    //   `https://openexchangerates.org/api/latest.json?app_id=${process.env.OPEN_EXCHANGE_RATES_KEY}`
    // );
    
    // Option 2: Use free exchangerate-api.com
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour
    );

    if (!response.ok) {
      throw new Error("Exchange rate API failed");
    }

    const data = await response.json();
    const rate = data.rates[to];

    if (!rate) {
      throw new Error(`No exchange rate found for ${from} to ${to}`);
    }

    return rate;
  } catch (error) {
    console.warn(
      `Failed to fetch live exchange rate, using fallback: ${SGD_TO_JPY_RATE}`,
      error,
    );
    return SGD_TO_JPY_RATE;
  }
}

/**
 * Simple string hash function to convert string IDs to numbers
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Format dual currency display (JPY + SGD)
 */
export function formatDualCurrency(yen: number, sgd: number): string {
  return `¥${yen.toLocaleString("ja-JP")} (≈S$${sgd.toFixed(2)})`;
}

/**
 * Check if Carousell integration is enabled and properly configured
 */
export function isCarousellEnabled(): boolean {
  return ENABLE_CAROUSELL && !!APIFY_TOKEN;
}

// ============================================================================
// NOTES & WARNINGS
// ============================================================================

/*
 * IMPORTANT CONSIDERATIONS FOR PRODUCTION:
 * 
 * 1. LEGAL:
 *    - Review Carousell Terms of Service
 *    - Ensure web scraping compliance
 *    - Consider robots.txt restrictions
 *    - Add proper attribution and disclaimers
 * 
 * 2. COST:
 *    - Monitor Apify usage and costs
 *    - Set spending limits
 *    - Consider caching strategies
 *    - Implement rate limiting
 * 
 * 3. DATA QUALITY:
 *    - C2C prices are negotiable, not fixed
 *    - Listings may be outdated
 *    - Condition descriptions vary
 *    - Set codes may be missing or incorrect
 * 
 * 4. USER EXPERIENCE:
 *    - Clearly label as Singapore C2C market
 *    - Show both SGD and converted JPY
 *    - Display seller ratings
 *    - Add disclaimer about negotiable pricing
 * 
 * 5. PERFORMANCE:
 *    - Apify calls can be slow (5-30 seconds)
 *    - Implement timeout handling
 *    - Consider async/background fetching
 *    - Cache aggressively (but not too long)
 * 
 * 6. ALTERNATIVE APPROACHES:
 *    - Official Carousell partnership
 *    - Direct web scraping (higher risk)
 *    - User-contributed data
 *    - Manual curation
 */
