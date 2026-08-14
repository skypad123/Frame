# Carousell Integration Evaluation for Frame Application

**Issue:** SKY-22  
**Date:** August 14, 2026  
**Status:** Evaluation Complete

## Executive Summary

This document evaluates methods to incorporate Carousell as a data source partner for the Frame application. Frame is a Next.js PWA that aggregates Yu-Gi-Oh! OCG Japanese card prices from multiple retailers to help brick-and-mortar shops make informed pricing decisions.

**Key Findings:**
- ✅ Carousell has an active Yu-Gi-Oh! trading card marketplace with 10,000+ listings
- ✅ Predominantly serves the Singapore/Southeast Asia market
- ❌ **No official public API available**
- ⚠️ Integration requires web scraping via third-party services
- 💰 Carousell prices are in SGD (Singapore Dollars), not JPY
- 🌍 Different market focus: C2C marketplace vs. B2C retailers

**Recommendation:** Conditional integration with clear disclosure of data source differences.

---

## 1. Understanding Carousell

### What is Carousell?

Carousell is Southeast Asia's largest consumer-to-consumer (C2C) classifieds and recommerce marketplace, founded in 2012 and headquartered in Singapore. It operates across:

- 🇸🇬 Singapore (primary market)
- 🇲🇾 Malaysia  
- 🇭🇰 Hong Kong
- 🇵🇭 Philippines
- 🇹🇼 Taiwan
- 🇦🇺 Australia
- 🇨🇦 Canada
- 🇮🇩 Indonesia

### Carousell Trading Card Marketplace

**Market Size:**
- 10,000+ trading card listings
- Covers Pokémon, Magic: The Gathering, Yu-Gi-Oh!, One Piece TCG, and Digimon

**Yu-Gi-Oh! Market Characteristics:**
- Average raw card price: ~S$15 (≈¥1,650 JPY at 1 SGD = 110 JPY)
- Price range: S$0.50 - S$500+ for singles
- Mix of raw singles, graded cards, and sealed products
- Negotiable pricing (C2C marketplace model)
- Local pickup and direct seller-to-buyer transactions

**Key Difference from Current Sources:**
- **Bigweb & Yuyutei:** Japanese B2C retailers with fixed retail prices in JPY
- **Carousell:** Singapore C2C marketplace with negotiable prices in SGD

---

## 2. Current Frame Architecture

### Data Sources

Frame currently aggregates price data from:

| Source | Type | Method | Currency | Market |
|--------|------|--------|----------|--------|
| **Bigweb** | B2C Retailer | Public API | JPY | Japan |
| **Yuyutei** | B2C Retailer | Web Scraping | JPY | Japan |
| **YGOPRODeck** | Card Metadata | Public API | - | Global |
| **Cardmarket** | Reference Only | Via YGOPRODeck | EUR | Europe |
| **TCGPlayer** | Reference Only | Via YGOPRODeck | USD | USA |

### Price Aggregation Logic

Frame fetches prices from multiple sources in parallel and:
1. Groups listings by `rarity + condition`
2. Displays the **cheapest price** for each combination
3. Allows users to expand and compare prices across all sources
4. Shows stock availability and direct retailer links

### Core Type Structure

```typescript
export type OcgListing = {
  id: number;
  name: string;
  setCode: string;
  rarity: string;
  rarityFull: string;
  condition: string;
  priceYen: number;  // Currently expects JPY
  inStock: boolean;
  image?: string;
  cardset?: string;
  source?: "bigweb" | "yuyutei";  // Would need to add "carousell"
  allPrices?: Array<{
    source: "bigweb" | "yuyutei";
    priceYen: number;
  }>;
};
```

---

## 3. Integration Methods Analysis

### Option A: Official API Integration ❌

**Status:** Not Available

Carousell does not provide a public API for accessing marketplace data. The developer portal at `developerhub.carusell.world` belongs to a **different company** (CaRuSell payment processing API), not the Carousell marketplace.

**Conclusion:** This approach is not feasible without an official partnership and private API access from Carousell.

---

### Option B: Web Scraping via Third-Party Services ⚠️

**Available Solutions:**

1. **Apify Carousell Scrapers**
   - Multiple actors available: `parseforge/carousell-scraper`, `piotrv1001/carousell-listings-scraper`, `devcake/carousell-scraper`
   - Pricing: ~$2-4 per 1,000 results
   - Features: Keyword search, price extraction, seller info, stock status
   - Handles Cloudflare bot protection automatically

2. **Custom Web Scraping**
   - Similar to current Yuyutei implementation
   - Requires maintenance as HTML structure changes
   - Risk of rate limiting and bot detection
   - May violate Carousell's Terms of Service

**Technical Approach:**

```typescript
// Conceptual implementation using Apify
import { ApifyClient } from 'apify-client';

export async function fetchCarousellListings(
  japaneseName: string,
  englishName: string
): Promise<OcgListing[]> {
  const client = new ApifyClient({ token: process.env.APIFY_TOKEN });
  
  // Search for both English and Japanese names
  const searchQuery = `${englishName} Yu-Gi-Oh!`;
  
  const input = {
    query: searchQuery,
    country: 'sg',
    sortBy: 'price_low_to_high',
    maxItems: 50,
  };

  const run = await client.actor('parseforge/carousell-scraper').call(input);
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  
  return items
    .filter(item => isRelevantCard(item, japaneseName, englishName))
    .map(item => mapCarousellToOcgListing(item));
}

function mapCarousellToOcgListing(item: CarousellItem): OcgListing {
  // Convert SGD to JPY (approximate rate: 1 SGD = 110 JPY)
  const priceYen = Math.round(item.price * 110);
  
  return {
    id: item.id,
    name: item.title,
    setCode: extractSetCode(item.description) || '?',
    rarity: extractRarity(item.description) || '?',
    rarityFull: extractRarity(item.description) || 'Unknown',
    condition: extractCondition(item.condition) || 'Used',
    priceYen,
    inStock: item.status === 'available',
    image: item.images?.[0],
    source: 'carousell',
    originalCurrency: 'SGD',
    originalPrice: item.price,
    marketplace: 'C2C',
    sellerInfo: {
      username: item.seller_username,
      rating: item.seller_rating,
      responseRate: item.seller_response_rate,
    },
  };
}
```

---

## 4. Technical Challenges & Considerations

### 4.1 Currency Conversion

**Challenge:** Carousell prices are in SGD, Frame displays JPY.

**Solutions:**
- Store original currency alongside converted value
- Use live exchange rates (e.g., Open Exchange Rates API)
- Display both currencies to users: "¥1,650 (≈S$15)"
- Add currency selector to UI (already partially implemented via `useCurrency.tsx`)

### 4.2 Market Type Mismatch

**Challenge:** Comparing B2C retail prices with C2C negotiable prices.

**Considerations:**
- Carousell prices are **asking prices**, not guaranteed retail prices
- Buyers typically negotiate below listed price
- Stock availability is less reliable (individual sellers)
- Listing quality varies (condition descriptions may be inconsistent)

**Solution:**
- Add clear visual indicators distinguishing C2C listings
- Label Carousell prices as "Singapore Market (C2C)"
- Consider applying a discount factor (e.g., -10%) to account for negotiation
- Add disclaimer about price types

### 4.3 Card Name Matching

**Challenge:** Carousell listings use English names, Frame searches by Japanese names.

**Current Flow:**
1. User searches English/Japanese name → YGOPRODeck API
2. YGOPRODeck returns card metadata
3. YGOrganization resolves official Japanese name
4. Bigweb & Yuyutei fetch prices using Japanese name

**Carousell Flow:**
- Would need to search using **English card name**
- Many listings include set codes (e.g., "LOB-EN001")
- Filtering requires fuzzy matching + set code verification

**Solution:**
```typescript
export async function fetchCarousellListings(
  cardData: { englishName: string; japaneseName: string; setCode?: string }
): Promise<OcgListing[]> {
  // Primary search: English name
  let results = await searchCarousell(cardData.englishName);
  
  // Filter by set code if available for accuracy
  if (cardData.setCode) {
    results = results.filter(item => 
      item.description?.includes(cardData.setCode) ||
      item.title?.includes(cardData.setCode)
    );
  }
  
  // Fallback: fuzzy match on card name
  results = results.filter(item => 
    fuzzyMatch(item.title, cardData.englishName, 0.8)
  );
  
  return results.map(mapToOcgListing);
}
```

### 4.4 Data Freshness & Reliability

**Carousell Characteristics:**
- Listings can be sold/removed at any time
- Prices fluctuate based on individual sellers
- No standardized condition grading
- Spam/irrelevant listings may appear

**Mitigation:**
- Implement aggressive filtering and validation
- Cache for shorter duration (5-10 minutes vs. 15 minutes)
- Add confidence scores to listings
- Allow users to report incorrect matches

### 4.5 Legal & Ethical Considerations

**Risks:**
- Web scraping may violate Carousell Terms of Service
- Third-party API services (Apify) add cost and dependency
- Carousell may implement stricter bot detection
- Liability for price accuracy on negotiable marketplace

**Mitigation:**
- Review Carousell ToS and robots.txt
- Implement rate limiting and respect robots.txt
- Add clear disclaimers about C2C pricing
- Consider reaching out to Carousell for official partnership
- Use third-party services (Apify) to offload legal responsibility

### 4.6 Cost Analysis

**Apify Pricing:**
- Card-level scraping: $2 per 1,000 results
- Detailed scraping: $4 per 1,000 results

**Estimated Monthly Cost:**
- Assume 1,000 card lookups/day
- Average 20 Carousell results per lookup
- Monthly requests: 600,000 results
- Cost: ~$1,200 - $2,400/month

**Alternative:**
- Direct web scraping: Free but higher maintenance and legal risk
- Conditional fetching: Only fetch for cards lacking Japanese market data

---

## 5. Integration Approaches

### Approach 1: Full Integration (Not Recommended)

**Implementation:**
- Add Carousell as a third parallel data source
- Display Carousell prices alongside Bigweb and Yuyutei
- Merge by rarity+condition as with other sources

**Pros:**
- Consistent user experience
- More price comparison options

**Cons:**
- ❌ Comparing apples to oranges (retail vs. C2C, JPY vs. SGD)
- ❌ Confuses primary use case (Japanese market pricing)
- ❌ Higher costs
- ❌ Maintenance burden

---

### Approach 2: Separate Section (Recommended)

**Implementation:**
- Add a separate "Singapore Market" section below Japanese listings
- Clearly label as "Carousell (C2C Marketplace - SGD)"
- Show converted prices with disclaimer
- Collapse by default, expand on user request

**Pros:**
- ✅ Clear separation of market types
- ✅ Users can choose to view Singapore prices
- ✅ No confusion with Japanese retail prices
- ✅ Respects primary use case

**Cons:**
- More complex UI
- Additional API calls even if users don't expand

**UI Mockup:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Japanese Market Prices (JPY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Secret Rare • NM
¥3,980  Bigweb • Yuyutei ¥4,200

Ultra Rare • LP
¥2,500  Yuyutei

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▼ Singapore Market Prices (C2C)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Carousell prices are asking prices from 
individual sellers. Actual prices may be 
negotiable. Converted from SGD to JPY.

Secret Rare • NM
¥3,300 (S$30) Carousell  [Seller: @user123 ⭐ 4.8]

Ultra Rare • Used
¥2,200 (S$20) Carousell  [Seller: @tcgsg ⭐ 4.9]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Approach 3: Alternative View / Toggle (Alternative)

**Implementation:**
- Add a market toggle: "Japan 🇯🇵 | Singapore 🇸🇬"
- Switch between Japanese sources and Carousell
- Store user preference

**Pros:**
- ✅ Clean UI without clutter
- ✅ Users choose their preferred market
- ✅ Lower API costs (fetch only selected market)

**Cons:**
- Cannot compare both markets simultaneously
- More implementation complexity

---

### Approach 4: Opt-In Beta Feature (Recommended for MVP)

**Implementation:**
- Add Carousell integration behind a feature flag
- Users enable "Singapore Market Data" in settings
- Collect feedback before full rollout

**Pros:**
- ✅ Low risk
- ✅ Gather user feedback
- ✅ Test technical implementation
- ✅ Validate cost assumptions

**Cons:**
- Lower initial adoption
- Requires feature flag infrastructure

---

## 6. Recommended Implementation Plan

### Phase 1: Proof of Concept (1-2 weeks)

1. **Set up Apify Integration**
   - Create Apify account and get API token
   - Test `parseforge/carousell-scraper` with sample queries
   - Validate data quality and matching accuracy

2. **Create Carousell Data Adapter**
   - Implement `src/lib/carousell.ts` following Bigweb/Yuyutei patterns
   - Add currency conversion utilities
   - Implement card name matching logic

3. **Extend Type Definitions**
   ```typescript
   // src/lib/types.ts
   export type OcgListing = {
     // ... existing fields
     source?: "bigweb" | "yuyutei" | "carousell";
     originalCurrency?: "JPY" | "SGD";
     originalPrice?: number;
     marketplace?: "B2C" | "C2C";
     sellerInfo?: {
       username: string;
       rating: number;
       responseRate: number;
     };
   };
   ```

4. **Feature Flag Implementation**
   ```typescript
   // Add to environment variables or config
   export const FEATURE_FLAGS = {
     enableCarousell: process.env.NEXT_PUBLIC_ENABLE_CAROUSELL === 'true',
   };
   ```

### Phase 2: UI Integration (1 week)

1. **Add Separate Section Component**
   ```typescript
   // src/components/CarousellListings.tsx
   export function CarousellListings({ cardData }) {
     const [expanded, setExpanded] = useState(false);
     const listings = useCarousellListings(cardData);
     
     return (
       <section className="carousell-section">
         <button onClick={() => setExpanded(!expanded)}>
           🇸🇬 Singapore Market (C2C) {expanded ? '▼' : '▶'}
         </button>
         {expanded && (
           <>
             <Disclaimer />
             <ListingsTable listings={listings} showSellerInfo />
           </>
         )}
       </section>
     );
   }
   ```

2. **Update CardDetail API Route**
   ```typescript
   // src/app/api/card/[id]/route.ts
   export async function GET(request, { params }) {
     // ... existing code
     
     let carousellListings = [];
     if (FEATURE_FLAGS.enableCarousell) {
       try {
         carousellListings = await fetchCarousellListings({
           englishName: card.name,
           japaneseName,
           setCode: card.card_sets?.[0]?.set_code,
         });
       } catch (error) {
         console.warn('Carousell fetch failed:', error);
         // Non-blocking failure
       }
     }
     
     return NextResponse.json({
       card,
       listings,
       carousellListings, // Separate from Japanese listings
       sources: {
         bigwebSearchUrl,
         yuyuteiSearchUrl,
         carousellSearchUrl: carousellSearchUrl(card.name),
       },
       // ...
     });
   }
   ```

3. **Currency Conversion Utility**
   ```typescript
   // src/lib/currency.ts (enhance existing)
   export async function convertSGDtoJPY(sgd: number): Promise<number> {
     const rate = await getExchangeRate('SGD', 'JPY');
     return Math.round(sgd * rate);
   }
   
   export function formatDualCurrency(yen: number, sgd: number): string {
     return `¥${yen.toLocaleString()} (≈S$${sgd.toFixed(2)})`;
   }
   ```

### Phase 3: Testing & Refinement (1 week)

1. **Test Cases**
   - Popular cards (e.g., "Blue-Eyes White Dragon", "Dark Magician")
   - Obscure cards with few listings
   - Cards with multiple rarities and conditions
   - Currency conversion accuracy
   - Failure handling (no results, API timeout)

2. **Performance Optimization**
   - Add caching layer
   - Implement request deduplication
   - Optimize parallel fetching

3. **User Feedback Collection**
   - Add feedback button on Carousell section
   - Track usage metrics (expansion rate, click-through)
   - Monitor API costs

### Phase 4: Production Rollout

1. **Cost Monitoring**
   - Set up Apify spend alerts
   - Monitor daily/monthly API usage
   - Evaluate ROI based on user engagement

2. **Documentation**
   - Update README with Carousell integration details
   - Document environment variables
   - Add API cost considerations

3. **Gradual Rollout**
   - Start with 10% of users
   - Monitor for issues
   - Increase to 50%, then 100%

---

## 7. Alternative: Direct Partnership Approach

Instead of web scraping, consider reaching out to Carousell for an official partnership:

**Proposal Points:**
- Frame drives traffic to Carousell listings
- Benefits both platforms (discovery for buyers, visibility for sellers)
- Request access to private API or data feed
- Revenue sharing or affiliate model

**Benefits:**
- ✅ Legal certainty
- ✅ Higher data quality and reliability
- ✅ Potential for deeper integration (direct checkout)
- ✅ Better long-term sustainability

**Process:**
1. Draft partnership proposal
2. Contact Carousell business development team
3. Negotiate terms and API access
4. Implement official integration

---

## 8. Final Recommendation

### Short-Term (Immediate Action)

**Approach:** Do NOT integrate Carousell at this time.

**Rationale:**
- Frame's primary value proposition is aggregating **Japanese OCG retail prices** in JPY
- Carousell serves a different market (Singapore C2C) with different pricing dynamics
- Risk of confusing the core use case for brick-and-mortar Japanese card shops
- Legal and technical risks outweigh benefits without clear user demand

### Medium-Term (If User Demand Exists)

**Approach:** Implement Approach 4 (Opt-In Beta Feature)

**Conditions:**
1. Verify user demand through surveys or feature requests
2. Implement as optional, clearly labeled feature
3. Use Approach 2 (Separate Section) for UI
4. Start with Apify integration to minimize legal risk
5. Set strict budget caps on API costs
6. Monitor usage and iterate

**Timeline:** 3-4 weeks for MVP

### Long-Term (Strategic Partnership)

**Approach:** Pursue official partnership with Carousell

**Benefits:**
- Sustainable integration
- Potential for expanded features (seller ratings, direct messaging)
- Revenue opportunities (affiliate links, premium listings)
- Market expansion to Southeast Asia

**Timeline:** 3-6 months negotiation + implementation

---

## 9. Decision Matrix

| Criteria | Weight | No Integration | Beta Feature | Full Integration | Partnership |
|----------|--------|----------------|--------------|------------------|-------------|
| **Alignment with core use case** | 30% | ✅ 10/10 | ✅ 8/10 | ❌ 4/10 | ✅ 7/10 |
| **Technical feasibility** | 20% | ✅ 10/10 | ✅ 7/10 | ⚠️ 6/10 | ⚠️ 5/10 |
| **Legal/ethical compliance** | 25% | ✅ 10/10 | ⚠️ 6/10 | ⚠️ 5/10 | ✅ 10/10 |
| **Cost efficiency** | 15% | ✅ 10/10 | ⚠️ 6/10 | ❌ 3/10 | ✅ 8/10 |
| **User value** | 10% | ❌ 5/10 | ✅ 7/10 | ⚠️ 6/10 | ✅ 9/10 |
| **Weighted Score** | - | **9.15** | **7.15** | **5.10** | **7.70** |

**Winner:** No Integration (short-term) → Evaluate user demand → Partnership (long-term)

---

## 10. Conclusion

Carousell is a vibrant marketplace for Yu-Gi-Oh! trading cards in Southeast Asia, but integrating it into Frame poses significant challenges:

1. **Market Mismatch:** C2C negotiable prices (SGD) vs. B2C retail prices (JPY)
2. **No Official API:** Requires web scraping with legal/technical risks
3. **Cost:** $1,200-$2,400/month for API scraping services
4. **Core Use Case:** Frame targets Japanese brick-and-mortar shops, not Singapore consumers

**Recommended Action:**
- ❌ Do NOT implement Carousell integration immediately
- ✅ Validate user demand first (surveys, analytics)
- ✅ If demand exists, implement as opt-in beta with Approach 4
- ✅ Explore official partnership for long-term sustainability

**Next Steps:**
1. Share this evaluation with stakeholders
2. Conduct user research to gauge interest in Singapore market data
3. If positive, proceed with Phase 1 POC
4. Simultaneously, reach out to Carousell business development for partnership discussion

---

## Appendix A: Code Examples

See `src/lib/carousell.ts` (proof of concept implementation)

## Appendix B: Cost Projections

**Monthly Cost Scenarios:**

| Lookups/Day | Results/Lookup | Monthly Requests | Apify Cost (Card-Level) | Apify Cost (Detailed) |
|-------------|----------------|------------------|--------------------------|------------------------|
| 100 | 20 | 60,000 | $120 | $240 |
| 500 | 20 | 300,000 | $600 | $1,200 |
| 1,000 | 20 | 600,000 | $1,200 | $2,400 |
| 2,000 | 20 | 1,200,000 | $2,400 | $4,800 |

## Appendix C: References

1. Carousell Trading Cards: https://www.carousell.sg/categories/toys-collectibles-12/trading-cards-8001/
2. Apify Carousell Scrapers: https://apify.com/parseforge/carousell-scraper
3. TCG Market Analysis 2026: https://tcgtalk.com/guides/tcg-market-weekly-analysis
4. Frame Application README: /workspace/README.md

---

**Document Status:** ✅ Complete  
**Author:** Cloud Agent  
**Last Updated:** August 14, 2026
