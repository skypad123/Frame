"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { formatPrice } from "@/lib/currency";
import { useCurrency } from "@/lib/useCurrency";
import { CurrencySelector } from "./CurrencySelector";
import type { CardDetailResponse, CardSummary } from "@/lib/types";

type RecentItem = {
  id: number;
  name: string;
  japaneseName?: string | null;
  imageSmall?: string;
};

const RECENT_KEY = "frame-recent-cards";
const recentListeners = new Set<() => void>();
let recentSnapshot: RecentItem[] = [];
let recentSnapshotRaw = "";

function emitRecentChange() {
  recentListeners.forEach((listener) => listener());
}

function readRecentSnapshot(): RecentItem[] {
  if (typeof window === "undefined") return recentSnapshot;

  try {
    const raw = localStorage.getItem(RECENT_KEY) ?? "";
    if (raw === recentSnapshotRaw) return recentSnapshot;
    recentSnapshotRaw = raw;
    recentSnapshot = raw ? (JSON.parse(raw) as RecentItem[]) : [];
    return recentSnapshot;
  } catch {
    recentSnapshotRaw = "";
    recentSnapshot = [];
    return recentSnapshot;
  }
}

function subscribeRecent(onStoreChange: () => void) {
  recentListeners.add(onStoreChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === RECENT_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    recentListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function saveRecent(item: RecentItem) {
  const next = [
    item,
    ...readRecentSnapshot().filter((entry) => entry.id !== item.id),
  ].slice(0, 8);
  const raw = JSON.stringify(next);
  localStorage.setItem(RECENT_KEY, raw);
  recentSnapshotRaw = raw;
  recentSnapshot = next;
  emitRecentChange();
}

export function PriceLookup() {
  const { currency } = useCurrency();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardSummary[]>([]);
  const [selected, setSelected] = useState<CardDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [isLoadingCard, startLoadCard] = useTransition();
  const [rarityFilter, setRarityFilter] = useState("all");
  const [expandedListing, setExpandedListing] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recent = useSyncExternalStore(
    subscribeRecent,
    readRecentSnapshot,
    () => recentSnapshot,
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;
  const visibleResults = canSearch ? results : [];

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!canSearch) return;

    let cancelled = false;
    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        try {
          const response = await fetch(
            `/api/search?q=${encodeURIComponent(trimmedQuery)}`,
          );
          const data = await response.json();
          if (cancelled) return;

          if (!response.ok) {
            setError(data.error || "Search failed.");
            setResults([]);
            return;
          }

          const nextResults = (data.results ?? []) as CardSummary[];
          setResults(nextResults);
          setError(
            nextResults.length === 0 ? "No cards matched that search." : null,
          );
        } catch {
          if (!cancelled) {
            setError("Network error while searching.");
            setResults([]);
          }
        }
      });
    }, 280);

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [canSearch, trimmedQuery]);

  function openCard(card: CardSummary) {
    startLoadCard(async () => {
      setError(null);
      setSelected(null);
      setRarityFilter("all");
      setExpandedListing(null);
      try {
        const response = await fetch(`/api/card/${card.id}`);
        const data = (await response.json()) as CardDetailResponse & {
          error?: string;
        };
        if (!response.ok) {
          setError(data.error || "Could not load prices.");
          return;
        }
        setSelected(data);
        saveRecent({
          id: data.card.id,
          name: data.card.name,
          japaneseName: data.card.japaneseName,
          imageSmall: data.card.imageSmall,
        });
      } catch {
        setError("Network error while loading prices.");
      }
    });
  }

  const rarities = selected
    ? Array.from(new Set(selected.listings.map((item) => item.rarity)))
    : [];

  const visibleListings =
    selected?.listings.filter((item) =>
      rarityFilter === "all" ? true : item.rarity === rarityFilter,
    ) ?? [];

  return (
    <div className="lookup">
      <header className="hero">
        <div className="hero-copy">
          <p className="brand">Frame</p>
          <h1>OCG Japanese going prices</h1>
          <p className="lede">
            Counter-ready lookup for Yu-Gi-Oh! OCG printings priced from the
            Japanese market.
          </p>
        </div>

        <CurrencySelector />

        <form
          className="search-form"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label htmlFor="card-search" className="sr-only">
            Search card name or passcode
          </label>
          <input
            ref={inputRef}
            id="card-search"
            className="search-input"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              if (event.target.value.trim().length < 2) {
                setError(null);
              }
            }}
            placeholder="Search English / Japanese name or passcode"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
          />
          <div className="search-meta" aria-live="polite">
            {isSearching
              ? "Searching…"
              : visibleResults.length > 0
                ? `${visibleResults.length} match${visibleResults.length === 1 ? "" : "es"}`
                : "Type at least 2 characters"}
          </div>
        </form>
      </header>

      {error ? <p className="status error">{error}</p> : null}

      {!selected && visibleResults.length > 0 ? (
        <section className="results" aria-label="Search results">
          {visibleResults.map((card, index) => (
            <button
              key={card.id}
              type="button"
              className="result-row"
              style={{ animationDelay: `${index * 40}ms` }}
              onClick={() => openCard(card)}
            >
              <span className="thumb">
                {card.imageSmall ? (
                  <Image
                    src={card.imageSmall}
                    alt=""
                    width={54}
                    height={78}
                    unoptimized
                  />
                ) : null}
              </span>
              <span className="result-copy">
                <span className="result-name">{card.name}</span>
                <span className="result-sub">
                  {[card.type, card.attribute, card.race]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <span className="chevron" aria-hidden>
                →
              </span>
            </button>
          ))}
        </section>
      ) : null}

      {!selected && visibleResults.length === 0 && recent.length > 0 ? (
        <section className="recent" aria-label="Recent lookups">
          <h2>Recent</h2>
          <div className="recent-list">
            {recent.map((item) => (
              <button
                key={item.id}
                type="button"
                className="recent-chip"
                onClick={() =>
                  openCard({
                    id: item.id,
                    name: item.name,
                    type: "",
                    image: item.imageSmall || "",
                    imageSmall: item.imageSmall || "",
                  })
                }
              >
                <span className="recent-chip-content">
                  <span className="recent-jp">{item.japaneseName || item.name}</span>
                  <span className="recent-en">{item.name}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {isLoadingCard ? (
        <p className="status">Pulling Japanese market listings…</p>
      ) : null}

      {selected ? (
        <section className="detail" aria-label="Card price detail">
          <button
            type="button"
            className="back-btn"
            onClick={() => setSelected(null)}
          >
            ← Back to results
          </button>

          <div className="detail-head">
            <div className="detail-art">
              {selected.card.image ? (
                <Image
                  src={selected.card.image}
                  alt={selected.card.name}
                  width={220}
                  height={320}
                  unoptimized
                  className="card-art"
                  priority
                />
              ) : null}
            </div>
            <div className="detail-copy">
              <p className="jp-name">
                {selected.card.japaneseName || "日本語名不明"}
              </p>
              <h2>{selected.card.name}</h2>
              <p className="detail-sub">
                {[selected.card.type, selected.card.attribute, selected.card.race]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {selected.card.ocgDate ? (
                <p className="detail-sub">OCG release {selected.card.ocgDate}</p>
              ) : null}

              <div className="price-highlight">
                <span className="label">Lowest listed</span>
                <span className="value">
                  {selected.meta.lowestYen != null
                    ? formatPrice(selected.meta.lowestYen, currency)
                    : "—"}
                </span>
                <span className="range">
                  {selected.meta.listingCount} listing
                  {selected.meta.listingCount === 1 ? "" : "s"}
                  {selected.meta.highestYen != null
                    ? ` · up to ${formatPrice(selected.meta.highestYen, currency)}`
                    : ""}
                </span>
              </div>

              <div className="ref-prices">
                <span>
                  Cardmarket €{selected.card.referencePrices.cardmarketEur ?? "—"}
                </span>
                <span>
                  TCGPlayer ${selected.card.referencePrices.tcgplayerUsd ?? "—"}
                </span>
              </div>

              <div className="source-links">
                <a
                  href={selected.sources.bigwebSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open on Bigweb
                </a>
                <a
                  href={selected.sources.yuyuteiSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Check Yuyutei
                </a>
              </div>
            </div>
          </div>

          <div className="filters">
            <label htmlFor="rarity-filter">Rarity</label>
            <select
              id="rarity-filter"
              value={rarityFilter}
              onChange={(event) => setRarityFilter(event.target.value)}
            >
              <option value="all">All rarities</option>
              {rarities.map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarity}
                </option>
              ))}
            </select>
          </div>

          {visibleListings.length === 0 ? (
            <p className="status">
              No priced Japanese listings found for this card right now.
            </p>
          ) : (
            <div className="listings" role="table" aria-label="OCG listings">
              <div className="listings-head" role="row">
                <span>Set</span>
                <span>Rarity</span>
                <span>Condition</span>
                <span>Price</span>
              </div>
              {visibleListings.map((listing, index) => (
                <div
                  key={`${listing.id}-${listing.setCode}-${index}`}
                  className="listing-row"
                  role="row"
                  style={{ animationDelay: `${index * 28}ms` }}
                >
                  <span className="set">
                    <strong>{listing.setCode}</strong>
                    <small>{listing.cardset}</small>
                  </span>
                  <span className="rarity" title={listing.rarityFull}>
                    {listing.rarity}
                  </span>
                  <span className="condition">{listing.condition}</span>
                  <span className="yen">{formatPrice(listing.priceYen, currency)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
