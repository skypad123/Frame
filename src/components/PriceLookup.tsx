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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CardDetailResponse, CardSummary } from "@/lib/types";
import { ChevronRight, ArrowLeft } from "lucide-react";

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
    <div className="grid gap-5">
      <header className="grid gap-6 pt-7 pb-2 animate-[rise_0.7s_ease_both]">
        <div>
          <p className="m-0 font-[var(--font-display)] text-[clamp(3.4rem,12vw,5.6rem)] leading-[0.9] tracking-[-0.04em] text-[var(--brass)] [text-shadow:0_0_40px_rgba(201,162,39,0.25)]">
            Frame
          </p>
          <h1 className="mt-[0.35rem] mb-0 max-w-[14ch] font-[var(--font-display)] text-[clamp(1.45rem,4.2vw,2.1rem)] leading-[1.1] tracking-[-0.02em] text-[var(--paper)]">
            OCG Japanese going prices
          </h1>
          <p className="mt-3 mb-0 max-w-[34rem] text-[1.02rem] leading-[1.55] text-[var(--paper-dim)]">
            Counter-ready lookup for Yu-Gi-Oh! OCG printings priced from the
            Japanese market.
          </p>
        </div>

        <CurrencySelector />

        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label htmlFor="card-search" className="sr-only">
            Search card name or passcode
          </label>
          <Input
            ref={inputRef}
            id="card-search"
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
          <div className="pl-3 text-sm text-[var(--paper-dim)]" aria-live="polite">
            {isSearching
              ? "Searching…"
              : visibleResults.length > 0
                ? `${visibleResults.length} match${visibleResults.length === 1 ? "" : "es"}`
                : "Type at least 2 characters"}
          </div>
        </form>
      </header>

      {error ? <p className="m-0 text-[var(--paper-dim)] text-red-300">{error}</p> : null}

      {!selected && visibleResults.length > 0 ? (
        <section className="grid gap-2 animate-[rise_0.45s_ease_both]" aria-label="Search results">
          {visibleResults.map((card, index) => (
            <Button
              key={card.id}
              variant="outline"
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3.5 h-auto text-left p-3 transition-all hover:translate-y-[-2px] hover:border-[rgba(201,162,39,0.55)] animate-[fade-up_0.35s_ease_both]"
              style={{ animationDelay: `${index * 40}ms` }}
              onClick={() => openCard(card)}
            >
              <span className="w-[54px] h-[78px] rounded-lg overflow-hidden bg-[var(--panel-soft)] shadow-[0_8px_18px_rgba(0,0,0,0.28)]">
                {card.imageSmall ? (
                  <Image
                    src={card.imageSmall}
                    alt=""
                    width={54}
                    height={78}
                    unoptimized
                    className="w-full h-full object-cover block"
                  />
                ) : null}
              </span>
              <span className="grid gap-1 min-w-0">
                <span className="font-bold text-base">{card.name}</span>
                <span className="text-sm text-[var(--paper-dim)]">
                  {[card.type, card.attribute, card.race]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <ChevronRight className="text-[var(--brass)]" aria-hidden />
            </Button>
          ))}
        </section>
      ) : null}

      {!selected && visibleResults.length === 0 && recent.length > 0 ? (
        <section className="animate-[rise_0.45s_ease_both]" aria-label="Recent lookups">
          <h2 className="m-0 text-xs uppercase tracking-wider text-[var(--brass-soft)]">Recent</h2>
          <div className="flex flex-wrap gap-2 mt-3">
            {recent.map((item) => (
              <Badge
                key={item.id}
                variant="default"
                className="cursor-pointer flex-col items-start gap-1"
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
                <span className="font-semibold text-sm text-[var(--paper)]">
                  {item.japaneseName || item.name}
                </span>
                <span className="text-xs text-[var(--paper-dim)] leading-[1.2]">
                  {item.name}
                </span>
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      {isLoadingCard ? (
        <p className="m-0 text-[var(--paper-dim)]">Pulling Japanese market listings…</p>
      ) : null}

      {selected ? (
        <Card className="animate-[rise_0.45s_ease_both]" aria-label="Card price detail">
          <CardContent className="p-4">
            <Button
              variant="ghost"
              size="default"
              onClick={() => setSelected(null)}
              className="mb-4 w-fit"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to results
            </Button>

            <div className="grid gap-5 md:grid-cols-[220px_1fr]">
              <div className="w-[min(220px,55vw)] mx-auto md:mx-0 rounded-[14px] overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.4)] animate-[card-in_0.55s_cubic-bezier(0.2,0.8,0.2,1)_both]">
                {selected.card.image ? (
                  <Image
                    src={selected.card.image}
                    alt={selected.card.name}
                    width={220}
                    height={320}
                    unoptimized
                    className="w-full h-full object-cover block"
                    priority
                  />
                ) : null}
              </div>
              <div>
                <p className="m-0 text-[var(--brass-soft)] text-xl font-bold">
                  {selected.card.japaneseName || "日本語名不明"}
                </p>
                <h2 className="mt-1 mb-0 font-[var(--font-display)] text-[clamp(1.4rem,4vw,1.9rem)] tracking-[-0.02em]">
                  {selected.card.name}
                </h2>
                <p className="mt-1.5 mb-0 text-sm text-[var(--paper-dim)]">
                  {[selected.card.type, selected.card.attribute, selected.card.race]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {selected.card.ocgDate ? (
                  <p className="mt-1.5 mb-0 text-sm text-[var(--paper-dim)]">
                    OCG release {selected.card.ocgDate}
                  </p>
                ) : null}

                <div className="mt-4 grid gap-1 p-4 border-l-[3px] border-[var(--brass)] bg-[rgba(7,20,33,0.45)]">
                  <span className="text-xs uppercase tracking-wider text-[var(--brass-soft)]">
                    Lowest listed
                  </span>
                  <span className="font-[var(--font-display)] text-[clamp(1.8rem,5vw,2.4rem)] tracking-[-0.03em]">
                    {selected.meta.lowestYen != null
                      ? formatPrice(selected.meta.lowestYen, currency)
                      : "—"}
                  </span>
                  <span className="text-sm text-[var(--paper-dim)]">
                    {selected.meta.listingCount} listing
                    {selected.meta.listingCount === 1 ? "" : "s"}
                    {selected.meta.highestYen != null
                      ? ` · up to ${formatPrice(selected.meta.highestYen, currency)}`
                      : ""}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 mt-3 text-sm text-[var(--paper-dim)]">
                  <span>
                    Cardmarket €{selected.card.referencePrices.cardmarketEur ?? "—"}
                  </span>
                  <span>
                    TCGPlayer ${selected.card.referencePrices.tcgplayerUsd ?? "—"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 mt-4">
                  <a
                    href={selected.sources.bigwebSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--brass-soft)] no-underline border-b border-[rgba(232,213,163,0.45)] pb-0.5"
                  >
                    Open on Bigweb
                  </a>
                  <a
                    href={selected.sources.yuyuteiSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--brass-soft)] no-underline border-b border-[rgba(232,213,163,0.45)] pb-0.5"
                  >
                    Check Yuyutei
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <label htmlFor="rarity-filter" className="text-xs uppercase tracking-wider text-[var(--brass-soft)]">
                Rarity
              </label>
              <Select value={rarityFilter} onValueChange={setRarityFilter}>
                <SelectTrigger id="rarity-filter" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rarities</SelectItem>
                  {rarities.map((rarity) => (
                    <SelectItem key={rarity} value={rarity}>
                      {rarity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {visibleListings.length === 0 ? (
              <p className="m-0 mt-4 text-[var(--paper-dim)]">
                No priced Japanese listings found for this card right now.
              </p>
            ) : (
              <div className="grid gap-2 mt-4" role="table" aria-label="OCG listings">
                <div className="hidden md:grid grid-cols-[1.5fr_0.7fr_1fr_0.9fr] gap-2 px-2 pb-2 text-xs uppercase tracking-wider text-[var(--brass-soft)] border-b border-[rgba(232,213,163,0.18)]" role="row">
                  <span>Set</span>
                  <span>Rarity</span>
                  <span>Condition</span>
                  <span>Price</span>
                </div>
                {visibleListings.map((listing, index) => (
                  <div
                    key={`${listing.id}-${listing.setCode}-${index}`}
                    className="grid grid-cols-[1.5fr_0.7fr_1fr_0.9fr] md:grid-cols-[1.5fr_0.7fr_1fr_0.9fr] gap-2 items-center p-3 rounded-xl border border-transparent bg-[rgba(7,20,33,0.35)] transition-all hover:translate-x-0.5 hover:border-[rgba(201,162,39,0.35)] hover:bg-[rgba(7,20,33,0.55)] animate-[fade-up_0.3s_ease_both]"
                    role="row"
                    style={{ animationDelay: `${index * 28}ms` }}
                  >
                    <span className="grid gap-0.5 min-w-0">
                      <strong className="text-base">{listing.setCode}</strong>
                      <small className="text-[var(--paper-dim)] whitespace-nowrap overflow-hidden text-ellipsis">
                        {listing.cardset}
                      </small>
                    </span>
                    <span className="text-[var(--brass)] font-bold" title={listing.rarityFull}>
                      {listing.rarity}
                    </span>
                    <span>{listing.condition}</span>
                    <span className="grid gap-1 text-right font-bold tabular-nums">
                      {formatPrice(listing.priceYen, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
