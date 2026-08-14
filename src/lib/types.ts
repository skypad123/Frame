export type MarketplacePrice = {
  cardmarket_price: string;
  tcgplayer_price: string;
  ebay_price: string;
  amazon_price: string;
  coolstuffinc_price: string;
};

export type CardSet = {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_rarity_code: string;
  set_price: string;
};

export type YgoCard = {
  id: number;
  name: string;
  type: string;
  frameType: string;
  desc: string;
  race?: string;
  atk?: number;
  def?: number;
  level?: number;
  attribute?: string;
  archetype?: string;
  card_images: Array<{
    id: number;
    image_url: string;
    image_url_small: string;
    image_url_cropped?: string;
  }>;
  card_sets?: CardSet[];
  card_prices?: MarketplacePrice[];
  misc_info?: Array<{
    konami_id?: number;
    ocg_date?: string;
    tcg_date?: string;
    formats?: string[];
  }>;
};

export type CardSummary = {
  id: number;
  name: string;
  type: string;
  race?: string;
  attribute?: string;
  level?: number;
  atk?: number;
  def?: number;
  image: string;
  imageSmall: string;
};

export type OcgListing = {
  id: number;
  name: string;
  setCode: string;
  rarity: string;
  rarityFull: string;
  condition: string;
  priceYen: number;
  inStock: boolean;
  image?: string;
  cardset?: string;
  source?: "bigweb" | "yuyutei";
  allPrices?: Array<{
    source: "bigweb" | "yuyutei";
    priceYen: number;
  }>;
};

export type CardDetailResponse = {
  card: CardSummary & {
    description: string;
    japaneseName: string | null;
    konamiId: number | null;
    ocgDate: string | null;
    referencePrices: {
      cardmarketEur: string | null;
      tcgplayerUsd: string | null;
    };
  };
  listings: OcgListing[];
  sources: {
    bigwebSearchUrl: string;
    yuyuteiSearchUrl: string;
    carousellSearchUrl: string;
  };
  meta: {
    listingCount: number;
    lowestYen: number | null;
    highestYen: number | null;
    fetchedAt: string;
  };
};

export type SearchResponse = {
  query: string;
  results: CardSummary[];
};
