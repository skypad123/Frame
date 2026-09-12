# Search Assistant Integration Example

## Overview

This document shows how to integrate the ephemeral `SearchAssistant` component into the Frame app.

## Integration Steps

### 1. Add Assistant Toggle to PriceLookup Component

```tsx
// In src/components/PriceLookup.tsx

import { SearchAssistant } from "./SearchAssistant";
import { MessageCircle } from "lucide-react";

export function PriceLookup() {
  // ... existing state ...
  
  // Add assistant state
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="grid gap-5">
      {/* ... existing content ... */}
      
      {/* Add assistant button near search input */}
      <Button
        variant="outline"
        onClick={() => setAssistantOpen(true)}
        className="w-fit"
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        Ask Assistant
      </Button>

      {/* Add assistant component */}
      <SearchAssistant
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />
    </div>
  );
}
```

### 2. State Lifecycle Behavior

When `assistantOpen` changes from `true` to `false`:
1. The `SearchAssistant` component unmounts
2. React automatically cleans up all internal state (`messages`, `thinking`, `draft`)
3. Next time the assistant opens, it starts with a fresh state

This is the **natural React behavior** for ephemeral state - no cleanup code needed!

### 3. Alternative: Route-Based Modal

If the assistant should be accessible via URL (e.g., `/assistant`), create a route:

```tsx
// src/app/assistant/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { SearchAssistant } from "@/components/SearchAssistant";

export default function AssistantPage() {
  const router = useRouter();
  
  return (
    <SearchAssistant
      isOpen={true}
      onClose={() => router.back()}
    />
  );
}
```

Even with routing, the state remains ephemeral - navigating away unmounts the component.

## Testing Checklist

- [ ] Open assistant → send messages → close → reopen → verify fresh start
- [ ] Verify "thinking" state shows/hides correctly
- [ ] Draft text persists while modal is open
- [ ] Draft clears when modal closes
- [ ] No console errors on rapid open/close cycles
- [ ] Accessible via keyboard (Tab, Enter, Escape)

## Future Persistence Migration

If user feedback indicates persistence is needed, migrate to Zustand:

```tsx
// stores/useChatStore.ts (future)
import { create } from 'zustand';

type ChatStore = {
  messages: Message[];
  thinking: boolean;
  draft: string;
  addMessage: (message: Message) => void;
  setThinking: (value: boolean) => void;
  setDraft: (value: string) => void;
  clearChat: () => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  thinking: false,
  draft: "",
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setThinking: (thinking) => set({ thinking }),
  setDraft: (draft) => set({ draft }),
  clearChat: () => set({ messages: [], thinking: false, draft: "" }),
}));
```

Then add a "Clear Chat" button to give users control over when to reset.

## Design Considerations

1. **User Notification**: The assistant shows a subtle message that chat history resets on close
2. **No Surprise**: Consistent with modal/dialog UX patterns across the web
3. **Performance**: No localStorage writes, no state synchronization overhead
4. **Privacy**: Conversations are truly ephemeral, not stored anywhere
