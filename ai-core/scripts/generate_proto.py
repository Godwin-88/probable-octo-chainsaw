"""Generate _pb2 and _pb2_grpc from proto. Run from repo root: python ai-core/scripts/generate_proto.py"""
import subprocess
import sys
from pathlib import Path

repo_root = Path(__file__).resolve().parents[2]
proto_dir = repo_root / "proto"
out_dir = repo_root / "ai-core" / "ai_core"
proto_file = proto_dir / "optimize.proto"

if not proto_file.exists():
    print("Proto file not found:", proto_file, file=sys.stderr)
    sys.exit(1)

out_dir.mkdir(parents=True, exist_ok=True)
subprocess.run([
    sys.executable, "-m", "grpc_tools.protoc",
    f"-I{proto_dir}",
    f"--python_out={out_dir}",
    f"--grpc_python_out={out_dir}",
    str(proto_file),
], check=True)
print("Generated", out_dir / "optimize_pb2.py", out_dir / "optimize_pb2_grpc.py")
