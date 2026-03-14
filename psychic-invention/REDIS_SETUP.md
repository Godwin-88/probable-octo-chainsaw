# Redis Cache Setup Guide for Render Deployment

## Overview

The application uses a **three-tier caching architecture**:

- **L1**: In-process `TTLCache` (30s TTL) - Per-worker, zero-latency
- **L2**: Redis (5min TTL) - Shared across all workers, sub-millisecond latency
- **L3**: Redis long-TTL (1hr TTL) - Historical/yfinance/OpenBB data

## Render Configuration

### 1. Redis Service

The `render.yaml` includes a Redis service:

```yaml
services:
  - type: redis
    name: pricing-engine-redis
    plan: starter
    maxmemoryPolicy: noeviction
    ipAllowList: []
```

**Configuration Details:**
- **Plan**: Starter (free tier, 25MB memory)
- **maxmemoryPolicy**: `noeviction` - Returns errors when memory is full (safer than LRU for financial data)
- **ipAllowList**: `[]` - Only accessible by other services in the same Render project

### 2. Web Service Environment Variables

```yaml
envVars:
  - key: REDIS_URL
    fromService:
      type: redis
      name: pricing-engine-redis
      property: connectionString
  - key: CACHE_TTL_L1
    value: 30
  - key: CACHE_TTL_L2
    value: 300
  - key: CACHE_TTL_L3
    value: 3600
```

**TTL Configuration:**
- `CACHE_TTL_L1=30` - L1 cache TTL (30 seconds)
- `CACHE_TTL_L2=300` - L2 Redis TTL (5 minutes)
- `CACHE_TTL_L3=3600` - L3 Redis long TTL (1 hour)

## Cache Endpoints

### Health Check

```bash
GET /cache/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "redis-cache",
  "redis_connected": true,
  "stats": {
    "l1_hits": 150,
    "l2_hits": 45,
    "misses": 23,
    "errors": 0,
    "hit_rate": 0.897,
    "l1_size": 12,
    "l1_maxsize": 512,
    "redis_connected": true,
    "redis_url": "redis://..."
  },
  "timestamp": "2026-03-03T12:34:56.789Z"
}
```

### Cache Statistics

```bash
GET /cache/stats
```

**Response:**
```json
{
  "status": "success",
  "cache_stats": {
    "l1_hits": 150,
    "l2_hits": 45,
    "misses": 23,
    "errors": 0,
    "hit_rate": 0.897,
    "l1_size": 12,
    "l1_maxsize": 512,
    "redis_connected": true
  },
  "timestamp": "2026-03-03T12:34:56.789Z"
}
```

### Clear Cache

```bash
POST /cache/clear
```

**Response:**
```json
{
  "status": "success",
  "message": "Cleared 42 keys from cache",
  "timestamp": "2026-03-03T12:34:56.789Z"
}
```

## Cached Endpoints

### Market Data Endpoints

#### Spot Price

```bash
POST /market-data/spot
Content-Type: application/json

{
  "symbol": "AAPL",
  "asset_class": "stocks"
}
```

**Cache Key:** `spot:{symbol}:{asset_class}`
**TTL:** 300 seconds (5 minutes)

#### Option Chain

```bash
POST /market-data/option-chain
Content-Type: application/json

{
  "underlying": "AAPL",
  "expiry": "2026-04-17"
}
```

**Cache Key:** `option-chain:{underlying}:{expiry}`
**TTL:** 300 seconds (5 minutes)

## Deployment Steps

### 1. Push to Render

```bash
git add render.yaml
git commit -m "feat: add Redis cache service for Render deployment"
git push origin main
```

### 2. Render Dashboard

1. Go to **Render Dashboard** → Your Project
2. Click **Add New** → **Redis**
3. Configure:
   - **Name**: `pricing-engine-redis`
   - **Plan**: Starter (free)
   - **Max Memory Policy**: `noeviction`
   - **IP Allow List**: Leave empty (internal only)
4. Click **Add Redis Service**

### 3. Update Web Service

1. Go to your **Web Service** settings
2. Add environment variables:
   - `REDIS_URL` → Connect to Redis service
   - `CACHE_TTL_L1` = `30`
   - `CACHE_TTL_L2` = `300`
   - `CACHE_TTL_L3` = `3600`
3. Redeploy the service

### 4. Verify Cache Connection

After deployment, test the cache health:

```bash
curl https://your-app.onrender.com/cache/health
```

Expected response:
```json
{
  "status": "healthy",
  "redis_connected": true,
  ...
}
```

## Monitoring

### Cache Hit Rate

Monitor the cache hit rate via `/cache/stats`:

```bash
curl https://your-app.onrender.com/cache/stats | jq '.cache_stats.hit_rate'
```

**Target:** > 80% hit rate

### Cache Size

Monitor L1 cache size:

```bash
curl https://your-app.onrender.com/cache/stats | jq '.cache_stats.l1_size'
```

**Target:** < 400 (out of 512 max)

### Error Rate

Monitor cache errors:

```bash
curl https://your-app.onrender.com/cache/stats | jq '.cache_stats.errors'
```

**Target:** 0 errors

## Troubleshooting

### Redis Connection Failed

**Symptoms:**
- `/cache/health` returns `"redis_connected": false`
- High cache miss rate

**Solutions:**
1. Check Render dashboard for Redis service status
2. Verify `REDIS_URL` environment variable is set
3. Check Render logs for connection errors
4. Ensure Redis service is in the same project

### High Memory Usage

**Symptoms:**
- Redis returning memory errors
- Cache writes failing

**Solutions:**
1. Reduce `CACHE_TTL_L2` (e.g., from 300 to 120)
2. Upgrade Redis plan (Starter → Standard)
3. Implement cache key expiration strategies

### Cache Invalidation

To manually clear cache:

```bash
curl -X POST https://your-app.onrender.com/cache/clear
```

## Performance Benchmarks

### Expected Latency

| Operation | Latency |
|-----------|---------|
| L1 Cache Hit | < 1ms |
| L2 Redis Hit | 1-5ms |
| Cache Miss (API) | 100-500ms |

### Expected Hit Rates

| Endpoint | Target Hit Rate |
|----------|-----------------|
| `/market-data/spot` | > 90% |
| `/market-data/option-chain` | > 85% |

## Cost

### Render Redis Pricing (as of 2026)

- **Starter**: Free (25MB, 100 connections)
- **Standard**: $7/month (256MB, 1000 connections)
- **Pro**: $28/month (1GB, 5000 connections)

**Recommendation:** Start with Starter, upgrade if hit rate drops below 80% due to memory pressure.

## Security

### Network Isolation

- Redis is only accessible by services in the same Render project
- No public IP exposure
- No authentication required (internal network only)

### Data Sensitivity

**Cached Data:**
- Market prices (public data)
- Option chains (public data)
- No user data or API keys cached

## Best Practices

1. **Monitor Hit Rates**: Check `/cache/stats` daily
2. **Set Appropriate TTLs**: Balance freshness vs. performance
3. **Clear Cache on Deploy**: Use `/cache/clear` after deployments
4. **Monitor Memory**: Watch for Redis memory warnings
5. **Log Cache Misses**: High miss rates indicate TTL issues

## Migration from Local Development

### Local Development (No Redis)

```bash
# .env.local
REDIS_URL=redis://localhost:6379/0
CACHE_TTL_L1=30
CACHE_TTL_L2=300
```

The cache gracefully degrades to L1-only if Redis is unavailable.

### Production (Render Redis)

```bash
# Set via Render dashboard
REDIS_URL=redis://pricing-engine-redis:6379
CACHE_TTL_L1=30
CACHE_TTL_L2=300
CACHE_TTL_L3=3600
```

## Next Steps

1. ✅ Deploy Redis service to Render
2. ✅ Update environment variables
3. ✅ Test cache health endpoint
4. ✅ Monitor cache hit rates
5. ⚠️ Adjust TTLs based on usage patterns
6. ⚠️ Set up alerts for cache errors

---

**Last Updated:** 2026-03-03
**Version:** 1.0
