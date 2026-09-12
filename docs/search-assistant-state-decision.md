# Search Assistant State Management Decision

## Context

The Frame app is a Yu-Gi-Oh! OCG card price lookup tool. This decision addresses whether a future search assistant chat feature should persist its state (messages, thinking, draft) across modal open/close cycles.

## Analysis

### Current Application State
- **Primary Function**: Quick card price lookups from Japanese market
- **User Flow**: Search → View card → Check prices → Return to search
- **Existing State**: Recent cards persist via localStorage (see `PriceLookup.tsx`)
- **Dependencies**: No state management library (no Redux, Zustand, etc.)

### Use Case Characteristics
1. **Search Pattern**: Users perform discrete, independent card lookups
2. **Modal Context**: Assistant would likely appear in a modal/overlay context
3. **Session Nature**: Price checks are typically quick, one-off queries
4. **User Intent**: Users close modals as a clear "I'm done" signal

### Option 1: Ephemeral State (useState)
**Pros:**
- ✅ Matches user mental model (close = reset)
- ✅ Simple implementation, no new dependencies
- ✅ Consistent with one-off query pattern
- ✅ Privacy-friendly (no conversation history stored)
- ✅ Lower memory footprint
- ✅ Clear state lifecycle tied to component mount/unmount

**Cons:**
- ❌ Lost context if user accidentally closes modal
- ❌ Cannot review previous conversation after reopening
- ❌ Each interaction starts fresh

### Option 2: Persistent State (Zustand Store)
**Pros:**
- ✅ Survives accidental modal closes
- ✅ Maintains conversation context
- ✅ Better for extended troubleshooting sessions

**Cons:**
- ❌ Adds new dependency (~3KB Zustand)
- ❌ More complex state management
- ❌ Unclear when to clear old conversations
- ❌ Doesn't match typical usage pattern
- ❌ May confuse users (stale messages on reopen)

## Decision: **Ephemeral State (useState)**

### Rationale

1. **Alignment with App Purpose**: Frame is optimized for quick, discrete price lookups, not extended AI conversations. The existing UX pattern (search, select, view, back) supports ephemeral interactions.

2. **Simplicity**: The app currently has no global state management. Adding Zustand solely for chat state adds complexity without clear user benefit.

3. **User Expectations**: In a modal context, closing typically signals "I'm done with this". Persisting state could surprise users who expect a fresh start.

4. **Privacy**: Chat queries might contain personal search patterns. Ephemeral state means no conversation tracking.

5. **Consistency**: The app already uses ephemeral state for search results and selected cards. Only "recent cards" persist, which serves a different purpose (quick access shortcuts).

### Implementation Approach

```tsx
// Ephemeral state within the SearchAssistant component
const [messages, setMessages] = useState<Message[]>([]);
const [thinking, setThinking] = useState(false);
const [draft, setDraft] = useState("");

// State resets automatically when modal closes (component unmounts)
```

### When to Reconsider

This decision should be revisited if:
- User research shows frequent accidental modal closes
- The assistant becomes a primary navigation method (not just occasional help)
- Multi-turn conversations become common (>3-4 exchanges per session)
- Users explicitly request conversation persistence

## Implementation Guidelines

1. **Component Structure**: Create `SearchAssistant.tsx` as a modal/dialog component
2. **State Location**: All chat state lives within the component (no global store)
3. **Cleanup**: Rely on React's natural unmount behavior to clear state
4. **User Feedback**: Consider a gentle reminder that closing will reset the conversation
5. **Future Migration**: If persistence becomes needed, the local state can be lifted to a Zustand store with minimal refactoring

## Testing Considerations

Manual testing should verify:
- [ ] Messages display correctly during a session
- [ ] Thinking indicator works as expected
- [ ] Draft text is maintained while modal is open
- [ ] All state clears when modal closes
- [ ] Reopening shows a clean slate
- [ ] No memory leaks from repeated open/close cycles
