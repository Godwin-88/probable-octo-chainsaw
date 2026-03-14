# Check System Health

Verify that all services are running and healthy.

## Steps

1. **Backend health check**:
   ```bash
   curl -sf http://localhost:8000/health | python -m json.tool
   ```
   Check the response for `status: "healthy"`.

2. **Detailed backend diagnostics**:
   ```bash
   curl -sf http://localhost:8000/health/detailed | python -m json.tool
   ```
   This returns:
   - System info (CPU, memory usage)
   - `pricing_engine` module status (Rust or mock)
   - Cache statistics (L1, L2 hit rates)
   - Recent error counts

3. **Error statistics**:
   ```bash
   curl -sf http://localhost:8000/health/errors | python -m json.tool
   ```

4. **Market data health**:
   ```bash
   curl -sf http://localhost:8000/market-data/health | python -m json.tool
   ```

5. **Frontend check** — verify Vite dev server is serving:
   ```bash
   curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000
   ```
   Expect `200`.

## Interpreting Results

| Status | Meaning | Action |
|--------|---------|--------|
| `pricing_engine: rust` | Rust core loaded correctly | — |
| `pricing_engine: mock` | Rust not built; using Python mock | Run `maturin develop` |
| Backend `500` or timeout | Server crash | Check terminal for traceback |
| Frontend `ECONNREFUSED` | Vite not running | Run `cd frontend && npm run dev` |
| High error count | Recent API failures | Check `/health/errors` for details |

## If Services Are Down

```bash
# Restart everything
./start-local.sh

# Or individually
make dev-api       # backend only
make dev-frontend  # frontend only
```
