# Environment Variables for Carousell Integration

## Required Variables

Copy these to your `.env.local` file if you want to enable Carousell integration:

```bash
# Carousell Integration Feature Flag
# Set to "true" to enable Carousell integration
# Default: false (disabled)
NEXT_PUBLIC_ENABLE_CAROUSELL=false

# Apify API Token
# Required for Carousell web scraping via Apify
# Get your token from: https://console.apify.com/account/integrations
# Costs: ~$2-4 per 1,000 results
APIFY_TOKEN=your_apify_token_here

# Exchange Rate API (Optional)
# If not provided, uses fallback rate of 1 SGD = 110 JPY
# Free tier available at: https://www.exchangerate-api.com/
# OPEN_EXCHANGE_RATES_KEY=your_key_here

# Carousell Actor ID (Optional)
# Default: "parseforge/carousell-scraper"
# Alternatives:
#   - "piotrv1001/carousell-listings-scraper"
#   - "devcake/carousell-scraper"
# APIFY_ACTOR_ID=parseforge/carousell-scraper
```

## Setup Instructions

### 1. Create Apify Account

1. Go to https://apify.com/
2. Sign up for a free account
3. Navigate to Settings → Integrations
4. Copy your API token
5. Paste it as `APIFY_TOKEN` in `.env.local`

**Free tier:**
- $5 credit per month
- Approximately 1,250-2,500 Carousell searches

**Paid tiers:**
- Pay-as-you-go: $2-4 per 1,000 results
- Monthly plans: Starting at $49/month

### 2. Test the Integration

```bash
# Enable Carousell in your environment
echo "NEXT_PUBLIC_ENABLE_CAROUSELL=true" >> .env.local
echo "APIFY_TOKEN=your_token_here" >> .env.local

# Rebuild and restart
npm run build
npm start

# Test with a popular card
curl http://localhost:3000/api/card/46986414
```

### 3. Monitor Usage

Track your Apify usage at:
https://console.apify.com/billing/usage

Set up spend alerts to avoid unexpected costs.

## Cost Estimation

### Example Scenarios

**Low Traffic (100 lookups/day):**
- Monthly requests: ~60,000 results
- Cost: ~$120-240/month

**Medium Traffic (500 lookups/day):**
- Monthly requests: ~300,000 results
- Cost: ~$600-1,200/month

**High Traffic (1,000 lookups/day):**
- Monthly requests: ~600,000 results
- Cost: ~$1,200-2,400/month

### Cost Optimization Strategies

1. **Aggressive Caching**
   ```typescript
   // Cache Carousell results for 10-15 minutes
   next: { revalidate: 600 }
   ```

2. **Conditional Fetching**
   - Only fetch if Japanese sources have < 3 results
   - Only fetch for cards worth > ¥1,000
   - Rate limit per user/IP

3. **User Opt-In**
   - Make Carousell an optional feature users enable
   - Reduces unnecessary API calls

4. **Batch Processing**
   - Pre-fetch popular cards during off-peak hours
   - Store in database/Redis cache

## Environment Variables by Environment

### Development (`.env.local`)
```bash
NEXT_PUBLIC_ENABLE_CAROUSELL=true
APIFY_TOKEN=apify_api_xxxxxxxxxxxxxxxxxxxxx
```

### Staging (`.env.staging`)
```bash
NEXT_PUBLIC_ENABLE_CAROUSELL=true
APIFY_TOKEN=apify_api_staging_token
```

### Production (`.env.production`)
```bash
# Start disabled, enable after testing
NEXT_PUBLIC_ENABLE_CAROUSELL=false
APIFY_TOKEN=apify_api_production_token
```

## Security Notes

⚠️ **NEVER commit `.env.local` to git!**

The `.env.local` file should be in your `.gitignore`. Store production secrets in:

- Vercel: Environment Variables in project settings
- AWS: Systems Manager Parameter Store or Secrets Manager
- Docker: Kubernetes Secrets or Docker Secrets
- Self-hosted: System environment variables

## Troubleshooting

### Error: "APIFY_TOKEN not configured"

**Cause:** Missing or invalid Apify token

**Solution:**
1. Verify `.env.local` exists in project root
2. Check token format: `apify_api_xxxxxxxxxxxxxxxxxxxxx`
3. Restart Next.js dev server after adding env var

### Error: "Apify API failed: 401"

**Cause:** Invalid or expired API token

**Solution:**
1. Go to https://console.apify.com/account/integrations
2. Generate a new token
3. Update `.env.local`

### Error: "Apify API failed: 429"

**Cause:** Rate limit exceeded

**Solution:**
1. Reduce request frequency
2. Increase caching duration
3. Upgrade Apify plan
4. Implement request queuing

### Warning: "Carousell integration is disabled"

**Cause:** `NEXT_PUBLIC_ENABLE_CAROUSELL` is not set to "true"

**Solution:**
```bash
echo "NEXT_PUBLIC_ENABLE_CAROUSELL=true" >> .env.local
```

### No results returned

**Possible causes:**
1. Card name doesn't match Carousell listings
2. No active listings for that card
3. Filtering too aggressive
4. Apify scraper blocked by Cloudflare

**Debug:**
```typescript
// Add logging to carousell.ts
console.log("Fetching Carousell listings for:", params);
console.log("Apify response:", items);
console.log("After filtering:", filtered);
```

## Alternative: Direct Web Scraping

If Apify costs are too high, you can implement direct web scraping:

```bash
# No external API costs
NEXT_PUBLIC_ENABLE_CAROUSELL=true
# APIFY_TOKEN not needed
```

**Pros:**
- Free (no API costs)
- No third-party dependency

**Cons:**
- Higher legal risk
- More maintenance (HTML changes)
- Must handle bot detection yourself
- Slower and less reliable

See `src/lib/yuyutei.ts` for example scraping implementation.

## Support

For Apify-related issues:
- Docs: https://docs.apify.com/
- Support: https://apify.com/contact

For Carousell integration issues:
- See `/workspace/docs/CAROUSELL_INTEGRATION_EVALUATION.md`
- Open an issue in this repository
