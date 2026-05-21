#!/bin/sh
# One Python gateway: gRPC (50051) + TRANSACT FastAPI (8000)
set -e
export GRPC_PORT="${GRPC_PORT:-50051}"
export TRANSACT_HTTP_PORT="${TRANSACT_HTTP_PORT:-8000}"
export PYTHONPATH="${PYTHONPATH:-/app/ai-core:/app/psychic-invention}"

# Generate gRPC code
echo "Checking gRPC modules in /app/ai-core/ai_core..."
mkdir -p /app/ai-core/ai_core
cd /app/ai-core

echo "Generating gRPC modules from /app/proto/optimize.proto..."
python -m grpc_tools.protoc -I/app/proto --python_out=. --grpc_python_out=. /app/proto/optimize.proto

# Verify and fix paths
if [ -f "optimize_pb2.py" ]; then
    echo "Fixing generated module paths..."
    mv optimize_pb2*.py ai_core/
fi

if [ -f "ai_core/optimize_pb2_grpc.py" ]; then
    echo "gRPC modules generated successfully in /app/ai-core/ai_core."
else
    echo "ERROR: Failed to generate gRPC modules."
fi

# Start gRPC server in background (ai-core)
echo "Starting AI Core gRPC server on port $GRPC_PORT..."
cd /app && python -m ai_core.server > /app/grpc_server.log 2>&1 &
GRPC_PID=$!

# Start TRANSACT FastAPI on 8000 (from psychic-invention app)
echo "Starting TRANSACT FastAPI on port $TRANSACT_HTTP_PORT..."
cd /app/psychic-invention && exec uvicorn app.main:app --host 0.0.0.0 --port "$TRANSACT_HTTP_PORT"
