import type { OcgListing } from "@/lib/types";

type BigwebItem = {
  id: number;
  name: string;
  fname: string;
  image?: string;
  price: number;
  is_sold_out?: boolean;
  rarity?: { slip?: string; web?: string };
  condition?: { web?: string; slip?: string };
  cardset?: { web?: string; slip?: string };
};

type BigwebResponse = {
  success?: boolean;
  items?: BigwebItem[];
};

const BIGWEB_API = "https://api.bigweb.co.jp/products";

export function bigwebSearchUrl(japaneseName: string): string {
  const encoded = encodeURIComponent(japaneseName);
  return `https://bigweb.co.jp/ver2/yugioh_index.php?search=yes&type_id=9&action=search&shape=1&selecttext=${encoded}`;
}

export function yuyuteiSearchUrl(japaneseName: string): string {
  return `https://yuyu-tei.jp/game_ygo/sell/sell_price.php?name=${encodeURIComponent(japaneseName)}`;
}

function mapListing(item: BigwebItem): OcgListing {
  return {
    id: item.id,
    name: item.name,
    setCode: item.fname ?? "",
    rarity: item.rarity?.slip || item.rarity?.web || "?",
    rarityFull: item.rarity?.web || item.rarity?.slip || "Unknown",
    condition: item.condition?.web || item.condition?.slip || "Play",
    priceYen: Number(item.price) || 0,
    inStock: !item.is_sold_out && Number(item.price) > 0,
    image: item.image,
    cardset: item.cardset?.web || item.cardset?.slip,
  };
}

export async function fetchBigwebListings(
  japaneseName: string,
): Promise<OcgListing[]> {
  const params = new URLSearchParams({
    game_id: "9",
    name: japaneseName,
  });

  const response = await fetch(`${BIGWEB_API}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "FrameOCGPricePWA/1.0 (brick-and-mortar price lookup)",
    },
    // Price data should stay relatively fresh for shop counters
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Bigweb API failed (${response.status})`);
  }

  const data = (await response.json()) as BigwebResponse;
  const items = data.items ?? [];

  // Prefer exact Japanese name matches, then fall back to all returned items
  const exact = items.filter((item) => item.name === japaneseName);
  const selected = exact.length > 0 ? exact : items;

  return selected
    .map(mapListing)
    .filter((listing) => listing.priceYen > 0)
    .sort((a, b) => a.priceYen - b.priceYen);
}
