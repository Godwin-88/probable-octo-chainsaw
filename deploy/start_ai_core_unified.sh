#!/bin/sh
# One Python gateway: gRPC (50051) + TRANSACT FastAPI (8000)
set -e
export GRPC_PORT="${GRPC_PORT:-50051}"
export TRANSACT_HTTP_PORT="${TRANSACT_HTTP_PORT:-8000}"
export PYTHONPATH="${PYTHONPATH:-/app/ai-core}"

# Start gRPC server in background (ai-core)
cd /app && python -m ai_core.server &
GRPC_PID=$!

# Start TRANSACT FastAPI on 8000 (from psychic-invention app)
cd /app/psychic-invention && exec uvicorn app.main:app --host 0.0.0.0 --port "$TRANSACT_HTTP_PORT"
