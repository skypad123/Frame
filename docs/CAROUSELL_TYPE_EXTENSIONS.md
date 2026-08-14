# Carousell Integration - Type Extensions

This document shows how the existing TypeScript types would need to be extended to support Carousell integration.

## Extended OcgListing Type

```typescript
// src/lib/types.ts (proposed changes)

export type DataSource = "bigweb" | "yuyutei" | "carousell";
export type MarketType = "B2C" | "C2C";
export type Currency = "JPY" | "SGD" | "USD" | "EUR";

export type SellerInfo = {
  username: string;
  rating: number;
  responseRate: number;
  joinDate?: string;
  totalSales?: number;
};

export type OcgListing = {
  // Existing fields
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
  
  // Updated source field to include carousell
  source?: DataSource;
  
  // Updated allPrices to include carousell
  allPrices?: Array<{
    source: DataSource;
    priceYen: number;
  }>;
  
  // NEW: Carousell-specific fields (optional)
  originalCurrency?: Currency;
  originalPrice?: number;
  marketplace?: MarketType;
  sellerInfo?: SellerInfo;
  listingUrl?: string;
  location?: string;
  postedAt?: string;
  negotiable?: boolean;
  shippingAvailable?: boolean;
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
  
  // Japanese market listings (existing)
  listings: OcgListing[];
  
  // NEW: Separate Carousell listings
  carousellListings?: OcgListing[];
  
  sources: {
    bigwebSearchUrl: string;
    yuyuteiSearchUrl: string;
    // NEW: Carousell search URL
    carousellSearchUrl?: string;
  };
  
  meta: {
    listingCount: number;
    lowestYen: number | null;
    highestYen: number | null;
    fetchedAt: string;
    
    // NEW: Carousell-specific metadata
    carousellMeta?: {
      listingCount: number;
      lowestYen: number | null;
      lowestSgd: number | null;
      exchangeRate: number;
      fetchedAt: string;
    };
  };
};
```

## Usage Example

```typescript
// Example of how the extended types would be used

import { fetchCarousellListings } from "@/lib/carousell";

const cardData = {
  englishName: "Blue-Eyes White Dragon",
  japaneseName: "青眼の白龍",
  setCode: "LOB-001",
};

// Fetch Carousell listings
const carousellListings = await fetchCarousellListings(cardData);

// Example listing with Carousell-specific data
const listing: OcgListing = {
  id: 123456,
  name: "Blue-Eyes White Dragon",
  setCode: "LOB-001",
  rarity: "UR",
  rarityFull: "Ultra Rare",
  condition: "LP",
  priceYen: 3300,
  inStock: true,
  source: "carousell",
  
  // Carousell-specific fields
  originalCurrency: "SGD",
  originalPrice: 30.0,
  marketplace: "C2C",
  sellerInfo: {
    username: "tcgcollector_sg",
    rating: 4.8,
    responseRate: 95,
  },
  listingUrl: "https://www.carousell.sg/p/blue-eyes-white-dragon-lob-001-123456",
  location: "Singapore",
  postedAt: "2026-08-10T14:30:00Z",
  negotiable: true,
  shippingAvailable: true,
};
```

## UI Component Example

```typescript
// Example component for displaying Carousell listings

export function CarousellListingRow({ listing }: { listing: OcgListing }) {
  if (listing.source !== "carousell") return null;
  
  return (
    <div className="carousell-listing">
      <div className="price-info">
        <span className="price-jpy">¥{listing.priceYen.toLocaleString()}</span>
        <span className="price-sgd">
          (S${listing.originalPrice?.toFixed(2)})
        </span>
        {listing.negotiable && (
          <span className="badge negotiable">Negotiable</span>
        )}
      </div>
      
      <div className="card-info">
        <span className="rarity">{listing.rarity}</span>
        <span className="condition">{listing.condition}</span>
        {listing.setCode !== "?" && (
          <span className="set-code">{listing.setCode}</span>
        )}
      </div>
      
      {listing.sellerInfo && (
        <div className="seller-info">
          <span className="username">@{listing.sellerInfo.username}</span>
          <span className="rating">
            ⭐ {listing.sellerInfo.rating.toFixed(1)}
          </span>
          <span className="response-rate">
            {listing.sellerInfo.responseRate}% response
          </span>
        </div>
      )}
      
      <div className="actions">
        <a 
          href={listing.listingUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-view-listing"
        >
          View on Carousell →
        </a>
      </div>
    </div>
  );
}
```

## API Route Updates

```typescript
// src/app/api/card/[id]/route.ts (proposed changes)

import { fetchCarousellListings, isCarousellEnabled } from "@/lib/carousell";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ... existing code to fetch Japanese listings ...
  
  // NEW: Fetch Carousell listings if enabled
  let carousellListings: OcgListing[] = [];
  let carousellSearchUrl = "";
  
  if (isCarousellEnabled() && japaneseName) {
    try {
      [carousellListings] = await Promise.all([
        fetchCarousellListings({
          englishName: card.name,
          japaneseName,
          setCode: card.card_sets?.[0]?.set_code,
        }),
      ]);
      carousellSearchUrl = carousellSearchUrl(card.name);
    } catch (error) {
      console.warn("Carousell fetch failed:", error);
      // Non-blocking - continue without Carousell data
    }
  }
  
  return NextResponse.json({
    card,
    listings, // Japanese market
    carousellListings, // Singapore market (separate)
    sources: {
      bigwebSearchUrl,
      yuyuteiSearchUrl,
      carousellSearchUrl,
    },
    meta: {
      listingCount: listings.length,
      lowestYen: listings[0]?.priceYen ?? null,
      highestYen: listings[listings.length - 1]?.priceYen ?? null,
      fetchedAt: new Date().toISOString(),
      
      // NEW: Carousell metadata
      carousellMeta: carousellListings.length > 0 ? {
        listingCount: carousellListings.length,
        lowestYen: carousellListings[0]?.priceYen ?? null,
        lowestSgd: carousellListings[0]?.originalPrice ?? null,
        exchangeRate: carousellListings[0]?.priceYen / carousellListings[0]?.originalPrice,
        fetchedAt: new Date().toISOString(),
      } : undefined,
    },
  });
}
```

## Migration Notes

### Breaking Changes

None - all new fields are optional and backward-compatible.

### Migration Steps

1. Update `src/lib/types.ts` with extended types
2. Deploy backend changes (no user impact yet)
3. Update UI components to display Carousell data
4. Enable feature flag for beta users
5. Monitor and iterate based on feedback

### Rollback Plan

If Carousell integration causes issues:

1. Set `NEXT_PUBLIC_ENABLE_CAROUSELL=false`
2. All Carousell code becomes inactive
3. Application continues working with Japanese sources only
4. No data loss or breaking changes
