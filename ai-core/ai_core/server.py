"""
AI Core gRPC server. Initializes Neo4j knowledge graph, then listens for Optimize RPCs and streams progress.
TRANSACT integration is mandatory for quant-level DeFi yield strategies.
"""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_core.neo4j_schema import init_and_seed
from ai_core.optimizer_servicer import add_servicer_to_server

import grpc
from concurrent import futures


def main() -> None:
    if not os.environ.get("TRANSACT_API_URL", "").strip():
        print("ERROR: TRANSACT_API_URL is required for quant-level financial-engineering DeFi yield strategies.", file=sys.stderr)
        print("Set TRANSACT_API_URL to the base URL of the TRANSACT (psychic-invention) API, e.g. http://localhost:8000", file=sys.stderr)
        sys.exit(1)
    print("Initializing Neo4j knowledge graph...")
    init_and_seed()

    try:
        from ai_core import optimize_pb2_grpc  # noqa: F401  (import ensures generated code is available)
    except ImportError:
        print("Generated gRPC modules not found. Run: python -m grpc_tools.protoc -I../proto --python_out=./ai_core --grpc_python_out=./ai_core ../proto/optimize.proto")
        return

    # gRPC Python requires a thread pool executor
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    add_servicer_to_server(server)
    port = int(os.environ.get("GRPC_PORT", "50051"))
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    print(f"AI Core gRPC server listening on [::]:{port}")
    server.wait_for_termination()


if __name__ == "__main__":
    main()
