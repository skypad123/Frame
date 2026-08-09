# Frame

**Frame** is a Next.js progressive web app for brick-and-mortar trading card shops to look up going prices of **Yu-Gi-Oh! OCG Japanese** cards.

## Features

- Search by English name, Japanese name, or passcode
- Resolve official Japanese card names
- Pull live Japanese market listings (JPY) from **multiple sources** (Bigweb & Yuyutei)
- **Show the cheapest price** for each rarity/condition combination
- **Compare prices** across different sources with expandable breakdowns
- Show rarity / set code / condition breakdowns
- Reference Cardmarket and TCGPlayer prices for context
- Installable PWA with offline shell caching and recent lookup history

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — local development server
- `npm run build` — production build
- `npm start` — serve production build
- `npm run lint` — ESLint

## API routes

| Route | Description |
| --- | --- |
| `GET /api/search?q=` | Fuzzy card search (YGOPRODeck) |
| `GET /api/card/[id]` | Card detail + merged Japanese OCG listings from all sources |
| `GET /api/prices?name=` | Direct lookup by Japanese name from all sources |

## Data sources

- [YGOPRODeck](https://ygoprodeck.com/) — card metadata and artwork
- [YGOrganization](https://db.ygorganization.com/) — Japanese name resolution
- [Bigweb](https://bigweb.co.jp/) — Japanese OCG market prices
- [Yuyutei](https://yuyu-tei.jp/) — Japanese OCG market prices

### Price Aggregation

Frame fetches prices from multiple Japanese retailers in parallel and automatically displays the cheapest available price for each unique rarity + condition combination. Users can expand any listing to see prices from all sources side-by-side.

Not affiliated with Konami, Bigweb, Yuyutei, or YGOPRODeck.
