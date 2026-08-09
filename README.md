# Frame

**Frame** is a Next.js progressive web app for brick-and-mortar trading card shops to look up going prices of **Yu-Gi-Oh! OCG Japanese** cards.

## Features

- Search by English name, Japanese name, or passcode
- Resolve official Japanese card names
- Pull live Japanese market listings (JPY) from Bigweb
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
| `GET /api/card/[id]` | Card detail + Japanese OCG listings |
| `GET /api/prices?name=` | Direct Bigweb lookup by Japanese name |

## Data sources

- [YGOPRODeck](https://ygoprodeck.com/) — card metadata and artwork
- [YGOrganization](https://db.ygorganization.com/) — Japanese name resolution
- [Bigweb](https://bigweb.co.jp/) — Japanese OCG market prices

Not affiliated with Konami, Bigweb, Yuyutei, or YGOPRODeck.
