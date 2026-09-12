"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { X, Send, Loader2 } from "lucide-react";

/**
 * Search Assistant - Mock Implementation with Ephemeral State
 * 
 * State Management Decision: EPHEMERAL (useState)
 * - All chat state (messages, thinking, draft) resets on modal close
 * - No persistence via Zustand or localStorage
 * - Rationale documented in /docs/search-assistant-state-decision.md
 */

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

type SearchAssistantProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SearchAssistant({ isOpen, onClose }: SearchAssistantProps) {
  // EPHEMERAL STATE: All state lives here and resets when component unmounts
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState("");

  const handleSend = async () => {
    if (!draft.trim() || thinking) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: draft.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setThinking(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `I can help you search for Yu-Gi-Oh! cards. Try searching for a specific card name or asking about price trends!`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setThinking(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-2xl max-h-[85vh] m-4 flex flex-col animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between p-4 border-b border-[rgba(232,213,163,0.18)]">
          <h2 className="text-lg font-semibold">Search Assistant</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="Close assistant"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-[var(--paper-dim)]">
              <p className="text-sm">
                Ask me anything about Yu-Gi-Oh! cards and prices.
              </p>
              <p className="text-xs mt-2 text-[var(--brass-soft)]">
                Note: Chat history will reset when you close this window
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-[var(--brass)] text-[var(--panel)]"
                      : "bg-[var(--panel-soft)] text-[var(--paper)]"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))
          )}

          {thinking && (
            <div className="flex justify-start">
              <div className="bg-[var(--panel-soft)] rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-[var(--paper-dim)]">
                  Thinking...
                </span>
              </div>
            </div>
          )}
        </CardContent>

        <div className="p-4 border-t border-[rgba(232,213,163,0.18)]">
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about cards or prices..."
              disabled={thinking}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!draft.trim() || thinking}
              size="icon"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
