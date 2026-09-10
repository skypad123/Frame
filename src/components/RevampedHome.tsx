"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Sparkles } from "lucide-react";
import { AISearchChat } from "./AISearchChat";
import { CurrencySelector } from "./CurrencySelector";

// Mock data for recommendations - in a real app, this would come from an API
const recommendedCards = [
  {
    id: 89631139,
    name: "Blue-Eyes White Dragon",
    japaneseName: "青眼の白龍",
    type: "Monster",
    imageSmall: "https://images.ygoprodeck.com/images/cards_small/89631139.jpg",
    reason: "Popular classic dragon card"
  },
  {
    id: 46986414,
    name: "Dark Magician",
    japaneseName: "ブラック・マジシャン",
    type: "Monster",
    imageSmall: "https://images.ygoprodeck.com/images/cards_small/46986414.jpg",
    reason: "Iconic spellcaster"
  },
  {
    id: 10000000,
    name: "Harpie's Feather Duster",
    japaneseName: "ハーピィの羽根帚",
    type: "Spell",
    imageSmall: "https://images.ygoprodeck.com/images/cards_small/18144506.jpg",
    reason: "Powerful spell removal"
  },
  {
    id: 83764718,
    name: "Monster Reborn",
    japaneseName: "死者蘇生",
    type: "Spell",
    imageSmall: "https://images.ygoprodeck.com/images/cards_small/83764718.jpg",
    reason: "Essential revival card"
  }
];

const trendingCards = [
  {
    id: 40044918,
    name: "Elemental HERO Stratos",
    japaneseName: "E・HERO エアーマン",
    type: "Monster",
    imageSmall: "https://images.ygoprodeck.com/images/cards_small/40044918.jpg",
    trending: "Rising 15%"
  },
  {
    id: 23995346,
    name: "Ash Blossom & Joyous Spring",
    japaneseName: "灰流うらら",
    type: "Monster",
    imageSmall: "https://images.ygoprodeck.com/images/cards_small/23995346.jpg",
    trending: "Top seller"
  },
  {
    id: 14558127,
    name: "Pot of Desires",
    japaneseName: "強欲で貪欲な壺",
    type: "Spell",
    imageSmall: "https://images.ygoprodeck.com/images/cards_small/14558127.jpg",
    trending: "Hot pick"
  }
];

export function RevampedHome() {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchClick = () => {
    setIsSearchMode(true);
  };

  const handleBackToHome = () => {
    setIsSearchMode(false);
    setSearchQuery("");
  };

  if (isSearchMode) {
    return (
      <AISearchChat 
        onBack={handleBackToHome}
        initialQuery={searchQuery}
      />
    );
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <header className="grid gap-6 pt-7 pb-2 animate-[rise_0.7s_ease_both]">
        <div>
          <p className="m-0 font-[var(--font-display)] text-[clamp(3.4rem,12vw,5.6rem)] leading-[0.9] tracking-[-0.04em] text-[var(--brass)] [text-shadow:0_0_40px_rgba(201,162,39,0.25)]">
            Frame
          </p>
          <h1 className="mt-[0.35rem] mb-0 max-w-[14ch] font-[var(--font-display)] text-[clamp(1.45rem,4.2vw,2.1rem)] leading-[1.1] tracking-[-0.02em] text-[var(--paper)]">
            AI-Powered Card Discovery
          </h1>
          <p className="mt-3 mb-0 max-w-[34rem] text-[1.02rem] leading-[1.55] text-[var(--paper-dim)]">
            Discover Yu-Gi-Oh! OCG cards with intelligent search and personalized recommendations.
          </p>
        </div>

        <CurrencySelector />

        {/* Search Bar */}
        <div 
          className="relative cursor-pointer group"
          onClick={handleSearchClick}
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brass)] pointer-events-none">
            <Search className="w-5 h-5" />
          </div>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cards or ask AI for recommendations..."
            className="pl-12 pr-4 h-14 text-base cursor-pointer transition-all group-hover:border-[var(--brass)] group-hover:shadow-[0_0_20px_rgba(201,162,39,0.2)]"
            readOnly
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Badge variant="default" className="bg-[var(--brass)] text-[var(--ink)] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI
            </Badge>
          </div>
        </div>
      </header>

      {/* Recommendations Section */}
      <section className="animate-[rise_0.8s_ease_both]">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[var(--brass)]" />
          <h2 className="m-0 font-[var(--font-display)] text-[1.4rem] tracking-[-0.02em] text-[var(--paper)]">
            Recommended For You
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {recommendedCards.map((card, index) => (
            <Card 
              key={card.id}
              className="cursor-pointer transition-all hover:translate-y-[-4px] hover:shadow-[0_12px_24px_rgba(201,162,39,0.25)] animate-[fade-up_0.4s_ease_both]"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <CardContent className="p-3">
                <div className="aspect-[7/10] rounded-lg overflow-hidden bg-[var(--panel-soft)] shadow-[0_8px_18px_rgba(0,0,0,0.28)] mb-2">
                  {card.imageSmall && (
                    <Image
                      src={card.imageSmall}
                      alt={card.name}
                      width={168}
                      height={240}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <p className="m-0 text-sm font-bold truncate">{card.name}</p>
                <p className="m-0 text-xs text-[var(--paper-dim)] truncate">{card.japaneseName}</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {card.reason}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* What's Hot Section */}
      <section className="animate-[rise_0.9s_ease_both]">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[var(--brass)]" />
          <h2 className="m-0 font-[var(--font-display)] text-[1.4rem] tracking-[-0.02em] text-[var(--paper)]">
            What's Hot
          </h2>
        </div>
        <div className="grid gap-3">
          {trendingCards.map((card, index) => (
            <Button
              key={card.id}
              variant="outline"
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3.5 h-auto text-left p-3 transition-all hover:translate-y-[-2px] hover:border-[rgba(201,162,39,0.55)] animate-[fade-up_0.35s_ease_both]"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span className="w-[54px] h-[78px] rounded-lg overflow-hidden bg-[var(--panel-soft)] shadow-[0_8px_18px_rgba(0,0,0,0.28)]">
                {card.imageSmall && (
                  <Image
                    src={card.imageSmall}
                    alt={card.name}
                    width={54}
                    height={78}
                    unoptimized
                    className="w-full h-full object-cover block"
                  />
                )}
              </span>
              <span className="grid gap-1 min-w-0">
                <span className="font-bold text-base">{card.name}</span>
                <span className="text-sm text-[var(--paper-dim)]">{card.japaneseName}</span>
              </span>
              <Badge variant="default" className="bg-[var(--brass)] text-[var(--ink)]">
                {card.trending}
              </Badge>
            </Button>
          ))}
        </div>
      </section>

      {/* Quick Access to Classic View */}
      <section className="pt-4 border-t border-[rgba(232,213,163,0.18)] animate-[rise_1s_ease_both]">
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => window.location.href = "/classic"}
        >
          Switch to Classic Price Lookup
        </Button>
      </section>
    </div>
  );
}
