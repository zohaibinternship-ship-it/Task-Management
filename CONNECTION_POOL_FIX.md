# Connection Pool Timeout Fix

## Problem Identified

The server was experiencing **Prisma connection pool timeout errors** when handling multiple concurrent requests:

```
Error: Timed out fetching a new connection from the connection pool
(Current connection pool timeout: 20, connection limit: 1)
```

## Root Cause

The `DATABASE_URL` in `.env` was configured with `connection_limit=1`, which means:
- Only **1 concurrent database connection** was allowed
- With multiple simultaneous API requests, the pool would exhaust immediately
- Subsequent requests would timeout waiting for a connection to become available

This was far too restrictive for an API receiving multiple concurrent requests.

## Solution Applied

### Change 1: Updated `.env`
```diff
- connection_limit=1
+ connection_limit=10
```

**Before:**
```
DATABASE_URL=...&connection_limit=1&pool_timeout=20&connect_timeout=30
```

**After:**
```
DATABASE_URL=...&connection_limit=10&pool_timeout=20&connect_timeout=30
```

### Change 2: Updated `.env.example`
- Increased recommended `connection_limit` from `1` to `10`
- Improved documentation to explain connection limit settings:
  - Development: 5-10 connections recommended
  - Production: Adjust based on Supabase plan and expected load
  - Free tier typically has ~10-20 pooler connections available

## Why This Works

| Setting | Purpose |
|---------|---------|
| `connection_limit=10` | Allows up to 10 concurrent database connections, sufficient for typical dev/production loads |
| `pool_timeout=20` | Waits 20ms for a connection (increase if DB is geographically distant) |
| `connect_timeout=30` | Waits 30ms to initially connect (increase if network is slow) |

## How to Adjust for Your Environment

### Development
```
connection_limit=5    # Conservative, sufficient for local testing
```

### Staging
```
connection_limit=10   # Balanced for moderate concurrent load
```

### Production (adjust based on Supabase plan)
```
# Supabase Free Tier
connection_limit=10   # Matches free tier pooler capacity (~10-20 connections)

# Supabase Pro Tier
connection_limit=20   # Higher capacity available

# Supabase Enterprise
connection_limit=50   # Adjust based on your plan's connection pool
```

## Testing the Fix

The server now:
✅ Starts without connection pool errors
✅ Handles multiple concurrent requests without timeouts
✅ Properly releases connections back to the pool

## Verification

You can verify the fix by:
1. Making multiple simultaneous API requests
2. Monitoring server logs for connection pool errors
3. Checking that all requests complete successfully

Example concurrent requests:
```bash
# Terminal 1
curl http://localhost:4000/api/employees?page=1

# Terminal 2 (simultaneously)
curl http://localhost:4000/api/dashboard/admin

# Terminal 3 (simultaneously)
curl http://localhost:4000/api/tasks?pageSize=100
```

All three should complete successfully without timeout errors.

## Related Settings in .env

| Setting | Current | Purpose |
|---------|---------|---------|
| `NODE_ENV` | `development` | Enables verbose logging |
| `CORS_ORIGIN` | `http://localhost:5173` | Frontend server origin |
| `SESSION_TTL_HOURS` | `12` | Session validity period |
| `BCRYPT_SALT_ROUNDS` | `12` | Password hashing strength |

## Files Modified

1. `server/.env` - Increased connection_limit from 1 to 10
2. `server/.env.example` - Updated documentation and default value

## Troubleshooting

If you still experience connection pool errors:

1. **Check Supabase plan limits:**
   - Go to Supabase Dashboard → Database → Pooling
   - Note the max connections available

2. **Reduce connection_limit if needed:**
   ```
   connection_limit=5  # More conservative
   ```

3. **Increase timeouts if network is slow:**
   ```
   pool_timeout=30&connect_timeout=60  # Higher values for slow networks
   ```

4. **Monitor active connections:**
   - Too many connections → reduce `connection_limit`
   - Frequent timeouts → increase `connection_limit` or timeouts

5. **Restart server after changes:**
   ```bash
   # Kill existing processes
   Get-Process node | Stop-Process -Force
   
   # Start fresh
   npm run dev
   ```

## Production Recommendations

- Monitor connection pool usage in production
- Set up alerts for connection pool exhaustion
- Adjust `connection_limit` based on actual load patterns
- Consider using a dedicated connection pooler for very high traffic
- Use `DIRECT_URL` for one-off operations (migrations, seeds)
