# Frame Documentation

## Search Assistant State Management

This directory contains the decision, implementation, and testing documentation for the search assistant chat feature.

### Files

1. **`search-assistant-state-decision.md`** - Core decision document
   - Comprehensive analysis of ephemeral vs. persistent state
   - Rationale for choosing `useState` over Zustand
   - When to reconsider this decision

2. **`search-assistant-integration-example.md`** - Implementation guide
   - How to integrate the `SearchAssistant` component
   - Code examples for different integration patterns
   - Future migration path to Zustand if needed

3. **`TESTING_NOTES.md`** - Testing procedures
   - Manual testing checklist
   - Verification criteria
   - Code review checklist
   - Future testing considerations

### Quick Summary

**Decision**: Use ephemeral state (`useState`) for the search assistant chat.

**Why**: Frame is a quick-lookup tool for card prices. Chat sessions don't need to persist across modal close/open cycles. Ephemeral state is simpler, requires no new dependencies, and matches user expectations.

**Implementation**: See `/src/components/SearchAssistant.tsx` for the reference component.

**Status**: ✅ Complete - documented, implemented, and ready for integration when needed.

---

**Related**:
- Linear Issue: [SKY-39](https://linear.app/skylivingston-personal/issue/SKY-39)
- Pull Request: [#13](https://github.com/skypad123/Frame/pull/13)
