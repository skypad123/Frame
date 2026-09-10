"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Send, Sparkles, Loader2 } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards?: Array<{
    id: number;
    name: string;
    japaneseName?: string;
    type: string;
    imageSmall: string;
  }>;
};

type AISearchChatProps = {
  onBack: () => void;
  initialQuery?: string;
};

export function AISearchChat({ onBack, initialQuery = "" }: AISearchChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your Yu-Gi-Oh! card discovery assistant. Ask me anything about cards, deck building, or tell me what kind of cards you're looking for!",
    },
  ]);
  const [input, setInput] = useState(initialQuery);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response with card recommendations
    setTimeout(() => {
      const assistantMessage = generateAIResponse(userMessage.content);
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userQuery: string): Message => {
    const query = userQuery.toLowerCase();
    
    // Simple keyword-based responses (in a real app, this would use an actual AI API)
    if (query.includes("dragon") || query.includes("ドラゴン")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "Great choice! Dragons are some of the most powerful cards in Yu-Gi-Oh!. Here are some popular dragon cards you might be interested in:",
        cards: [
          {
            id: 89631139,
            name: "Blue-Eyes White Dragon",
            japaneseName: "青眼の白龍",
            type: "Monster",
            imageSmall: "https://images.ygoprodeck.com/images/cards_small/89631139.jpg",
          },
          {
            id: 74677422,
            name: "Red-Eyes Black Dragon",
            japaneseName: "真紅眼の黒竜",
            type: "Monster",
            imageSmall: "https://images.ygoprodeck.com/images/cards_small/74677422.jpg",
          },
        ],
      };
    } else if (query.includes("spell") || query.includes("magic") || query.includes("魔法")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "Looking for spell cards? Here are some essential spell cards for competitive play:",
        cards: [
          {
            id: 83764718,
            name: "Monster Reborn",
            japaneseName: "死者蘇生",
            type: "Spell",
            imageSmall: "https://images.ygoprodeck.com/images/cards_small/83764718.jpg",
          },
          {
            id: 14558127,
            name: "Pot of Desires",
            japaneseName: "強欲で貪欲な壺",
            type: "Spell",
            imageSmall: "https://images.ygoprodeck.com/images/cards_small/14558127.jpg",
          },
        ],
      };
    } else if (query.includes("popular") || query.includes("meta") || query.includes("competitive")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "Here are some of the most popular cards in the current competitive meta:",
        cards: [
          {
            id: 23995346,
            name: "Ash Blossom & Joyous Spring",
            japaneseName: "灰流うらら",
            type: "Monster",
            imageSmall: "https://images.ygoprodeck.com/images/cards_small/23995346.jpg",
          },
          {
            id: 40044918,
            name: "Elemental HERO Stratos",
            japaneseName: "E・HERO エアーマン",
            type: "Monster",
            imageSmall: "https://images.ygoprodeck.com/images/cards_small/40044918.jpg",
          },
        ],
      };
    } else if (query.includes("dark magician") || query.includes("ブラック・マジシャン")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "Dark Magician is an iconic card! Here are some cards from the Dark Magician archetype:",
        cards: [
          {
            id: 46986414,
            name: "Dark Magician",
            japaneseName: "ブラック・マジシャン",
            type: "Monster",
            imageSmall: "https://images.ygoprodeck.com/images/cards_small/46986414.jpg",
          },
        ],
      };
    } else {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "I can help you find cards based on various criteria! Try asking me about specific card types (like 'dragons' or 'spell cards'), archetypes (like 'Dark Magician' or 'Blue-Eyes'), or general queries (like 'popular cards' or 'competitive meta'). What are you looking for?",
      };
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-[rise_0.4s_ease_both]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[rgba(232,213,163,0.18)]">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--brass)]" />
          <h2 className="m-0 font-[var(--font-display)] text-[1.4rem] tracking-[-0.02em] text-[var(--paper)]">
            AI Card Assistant
          </h2>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-[fade-up_0.3s_ease_both]`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`max-w-[85%] ${message.role === "user" ? "order-2" : "order-1"}`}>
              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-[var(--brass)] text-[var(--ink)]"
                    : "bg-[var(--panel)] border border-[rgba(232,213,163,0.18)]"
                }`}
              >
                <p className="m-0 text-[0.95rem] leading-[1.5] whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>

              {/* Card Recommendations */}
              {message.cards && message.cards.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {message.cards.map((card) => (
                    <Card
                      key={card.id}
                      className="cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-[0_8px_16px_rgba(201,162,39,0.25)]"
                    >
                      <CardContent className="p-3">
                        <div className="aspect-[7/10] rounded-lg overflow-hidden bg-[var(--panel-soft)] shadow-[0_8px_18px_rgba(0,0,0,0.28)] mb-2">
                          {card.imageSmall && (
                            <Image
                              src={card.imageSmall}
                              alt={card.name}
                              width={140}
                              height={200}
                              unoptimized
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <p className="m-0 text-sm font-bold truncate">{card.name}</p>
                        {card.japaneseName && (
                          <p className="m-0 text-xs text-[var(--paper-dim)] truncate">
                            {card.japaneseName}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start animate-[fade-up_0.3s_ease_both]">
            <div className="bg-[var(--panel)] border border-[rgba(232,213,163,0.18)] rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--brass)]" />
                <span className="text-sm text-[var(--paper-dim)]">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Animated from top to bottom */}
      <div className="pt-4 border-t border-[rgba(232,213,163,0.18)] animate-[slide-up_0.5s_cubic-bezier(0.4,0,0.2,1)_both]">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about cards, decks, or strategies..."
            className="flex-1 h-12"
            disabled={isTyping}
          />
          <Button
            type="submit"
            size="default"
            disabled={!input.trim() || isTyping}
            className="h-12 px-5 bg-[var(--brass)] text-[var(--ink)] hover:bg-[var(--brass-soft)] transition-all"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(-100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
