# Carousell Integration - Executive Summary

**Issue:** SKY-22  
**Status:** ❌ Not Recommended for Immediate Implementation  
**Review Date:** August 14, 2026

---

## TL;DR

Carousell is a major Southeast Asian marketplace with active Yu-Gi-Oh! trading card listings, but integrating it into Frame poses significant challenges that outweigh the benefits at this time.

**Recommendation:** **Do not implement** until user demand is validated and/or an official partnership is secured.

---

## Key Findings

### ✅ Pros

- Carousell has 10,000+ trading card listings including Yu-Gi-Oh!
- Active Singapore/SEA marketplace (S$0.50 - S$500+ per card)
- Could provide international market comparison data
- Proof-of-concept code is feasible

### ❌ Cons

- **No official API** - requires web scraping via third-party service
- **$1,200-2,400/month cost** for API scraping at moderate traffic
- **Market mismatch** - C2C negotiable prices (SGD) vs. B2C retail (JPY)
- **Legal gray area** - web scraping may violate ToS
- **Confuses core use case** - Frame targets Japanese shops, not Singapore consumers

---

## Comparison: Frame's Current Model vs. Carousell

| Aspect | Current (Bigweb/Yuyutei) | Carousell |
|--------|--------------------------|-----------|
| **Market Type** | B2C Retailers | C2C Marketplace |
| **Currency** | JPY (Japanese Yen) | SGD (Singapore Dollar) |
| **Price Type** | Fixed retail | Negotiable asking price |
| **Geography** | Japan | Singapore/SEA |
| **Data Access** | API + Web Scraping | Third-party API scraping only |
| **Cost** | Free | $1,200-2,400/month |
| **Target Users** | Japanese card shops | Individual collectors |

**Verdict:** Fundamentally different markets - comparing apples to oranges.

---

## Cost-Benefit Analysis

### Estimated Monthly Costs (Medium Traffic)

| Item | Cost |
|------|------|
| Apify API scraping | $600-1,200 |
| Exchange rate API | $0-50 |
| Development time (initial) | $8,000-12,000 |
| Maintenance (monthly) | $500-1,000 |
| **Total First Month** | **$9,100-13,250** |
| **Recurring Monthly** | **$1,100-2,250** |

### Expected Benefits

- ❓ Unknown user demand (no data)
- ❓ Unclear value proposition for Japanese shops
- 🌍 Potential market expansion to SEA (speculative)
- 📊 International price comparison (marginal value)

**ROI:** Negative in short-term; unclear in long-term.

---

## Risk Assessment

| Risk | Severity | Likelihood | Impact |
|------|----------|------------|--------|
| Legal liability (ToS violation) | High | Medium | Operations blocked |
| API costs exceed budget | Medium | High | Financial drain |
| User confusion (market mismatch) | High | High | Poor UX, churn |
| Data quality issues | Medium | High | Inaccurate prices |
| Carousell blocks scraping | Medium | Medium | Integration breaks |

**Overall Risk:** 🔴 HIGH

---

## Decision Matrix

| Option | Effort | Cost | Risk | Value | Recommendation |
|--------|--------|------|------|-------|----------------|
| **No Integration** | None | $0 | None | Baseline | ✅ Recommended |
| **Beta Feature** | High | High | High | Unknown | ⚠️ Conditional |
| **Full Integration** | Very High | Very High | Very High | Low | ❌ Not Recommended |
| **Official Partnership** | Medium | Medium | Low | High | ✅ Long-term Option |

---

## Recommended Action Plan

### Phase 0: Validation (Now - 2 weeks)

**Before any development:**

1. **User Research**
   - Survey current Frame users
   - Ask: "Would you find Singapore/SEA market prices useful?"
   - Gauge willingness to pay for this feature
   
2. **Analytics Review**
   - Check if users are from Singapore/SEA
   - Review existing traffic by geography
   - Validate market fit

3. **Stakeholder Alignment**
   - Confirm product vision (Japan-focused vs. international)
   - Approve budget for potential implementation
   - Define success metrics

**Go/No-Go Decision:**
- ✅ Proceed if: >30% of users express strong interest + budget approved
- ❌ Stop if: Low interest or unclear value proposition

### Phase 1: Partnership Exploration (2-3 months)

**If validation succeeds:**

1. **Contact Carousell Business Development**
   - Propose official partnership
   - Request private API access
   - Discuss revenue sharing/affiliate model

2. **Legal Review**
   - Review Carousell Terms of Service
   - Assess web scraping legality in Singapore
   - Evaluate liability exposure

**Go/No-Go Decision:**
- ✅ Official partnership → Proceed to Phase 2
- ⚠️ No partnership but legal ok → Consider Beta Feature
- ❌ Legal concerns → Stop

### Phase 2: Beta Implementation (3-4 weeks)

**If approved:**

1. Implement as opt-in beta feature (see technical docs)
2. Launch to 10% of users
3. Monitor: usage, costs, feedback
4. Iterate based on data

**Success Metrics:**
- >20% of users enable the feature
- <$2,000/month API costs
- >70% positive feedback
- No legal issues

### Phase 3: Rollout or Shutdown

- ✅ If metrics met → Graduate to production
- ❌ If metrics missed → Deprecate feature, cut losses

---

## Alternative Options

### Option A: User-Contributed Data

Instead of automated scraping, allow users to manually submit Carousell prices.

**Pros:**
- Zero API costs
- Community engagement
- No legal concerns

**Cons:**
- Data sparsity
- Quality control issues
- Manual moderation needed

### Option B: Singapore Market Research Report

Instead of live integration, provide periodic market reports comparing JP vs. SG prices.

**Pros:**
- One-time effort
- Lower cost
- Informational value

**Cons:**
- Not real-time
- Requires ongoing maintenance

### Option C: Focus on Core Market

Double down on Japanese market by adding more Japanese sources.

**Potential sources:**
- Card Rush
- Hareruya
- Amenity Dream
- Suruga-ya

**Pros:**
- Aligns with core use case
- Same currency/market type
- Higher user value

**Cons:**
- Requires development effort
- May face similar API challenges

---

## Questions for Stakeholders

Before proceeding, answer these:

1. **Product Vision**
   - Is Frame focused on Japanese market or expanding internationally?
   - What problem are we solving for users?

2. **User Demand**
   - Have users requested Singapore/SEA market data?
   - What % of users are from Singapore/Southeast Asia?

3. **Budget**
   - Is $1,000-2,000/month recurring cost acceptable?
   - What's the expected ROI?

4. **Legal**
   - Have we consulted legal counsel about web scraping?
   - What's our risk tolerance?

5. **Technical**
   - Who will maintain this integration?
   - What happens if Carousell blocks us?

---

## Deliverables

The following has been prepared for this evaluation:

1. ✅ **Comprehensive Evaluation Report**
   - `/workspace/docs/CAROUSELL_INTEGRATION_EVALUATION.md`
   - 20+ pages covering all aspects

2. ✅ **Proof-of-Concept Code**
   - `/workspace/src/lib/carousell.ts`
   - Fully documented, production-ready structure

3. ✅ **Type Extensions Documentation**
   - `/workspace/docs/CAROUSELL_TYPE_EXTENSIONS.md`
   - TypeScript types and migration guide

4. ✅ **Environment Setup Guide**
   - `/workspace/docs/CAROUSELL_ENVIRONMENT_SETUP.md`
   - Step-by-step configuration instructions

5. ✅ **This Executive Summary**
   - `/workspace/docs/CAROUSELL_EXECUTIVE_SUMMARY.md`
   - Quick decision-making reference

---

## Conclusion

**Carousell integration is technically feasible but strategically questionable.**

The fundamental mismatch between Frame's core value proposition (Japanese retail prices for shops) and Carousell's market (Singapore C2C collector prices) makes this integration a poor fit without clear user demand.

**Immediate Action:** Validate user demand before investing in development.

**Long-term Path:** Pursue official partnership if demand is confirmed.

---

## Approval

- [ ] Product Manager: Reviewed and approved/rejected
- [ ] Engineering Lead: Technical feasibility confirmed
- [ ] Legal: Terms of Service review complete
- [ ] Finance: Budget approved/rejected

**Final Decision:** _____________  
**Decision Date:** _____________  
**Decision Maker:** _____________

---

**Related Documents:**
- [Full Evaluation Report](./CAROUSELL_INTEGRATION_EVALUATION.md)
- [Technical Implementation](../src/lib/carousell.ts)
- [Type Extensions](./CAROUSELL_TYPE_EXTENSIONS.md)
- [Environment Setup](./CAROUSELL_ENVIRONMENT_SETUP.md)
