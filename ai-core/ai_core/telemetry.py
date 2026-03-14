"""
Structured telemetry for ai-core: request latency, GraphRAG hit rate, LLM call stats.

Uses Python's structlog for JSON-line structured logging.
Metrics are tracked in-process (no external Prometheus/Grafana dependency required).

Usage:
    from ai_core.telemetry import get_logger, record_latency, record_graphrag_hit

    log = get_logger()
    log.info("request.start", endpoint="/agents/chat", session_id="abc")

    with record_latency("graphrag.retrieve"):
        ctx = retriever.retrieve_for_query(message)
    record_graphrag_hit(ctx.retrieval_hits)
"""
from __future__ import annotations

import contextlib
import logging
import os
import time
from collections import defaultdict
from typing import Any, Generator

try:
    import structlog
    _STRUCTLOG = True
except ImportError:
    _STRUCTLOG = False


# ── Logger setup ──────────────────────────────────────────────────────────────

def _setup_structlog() -> None:
    if not _STRUCTLOG:
        return
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


_setup_done = False


def get_logger(name: str = "ai_core") -> Any:
    """Return a structlog (or stdlib) logger."""
    global _setup_done
    if not _setup_done:
        _setup_structlog()
        _setup_done = True
    if _STRUCTLOG:
        return structlog.get_logger(name)
    return logging.getLogger(name)


# ── In-process metrics store ──────────────────────────────────────────────────

class _Metrics:
    def __init__(self) -> None:
        self.counters: dict[str, int] = defaultdict(int)
        self.latencies: dict[str, list[float]] = defaultdict(list)
        self._max_samples = 1000  # cap per metric

    def inc(self, name: str, amount: int = 1) -> None:
        self.counters[name] += amount

    def record_latency(self, name: str, seconds: float) -> None:
        samples = self.latencies[name]
        samples.append(seconds)
        if len(samples) > self._max_samples:
            self.latencies[name] = samples[-self._max_samples:]

    def p99(self, name: str) -> float | None:
        samples = self.latencies.get(name, [])
        if not samples:
            return None
        sorted_s = sorted(samples)
        idx = int(len(sorted_s) * 0.99)
        return sorted_s[min(idx, len(sorted_s) - 1)]

    def mean(self, name: str) -> float | None:
        samples = self.latencies.get(name, [])
        if not samples:
            return None
        return sum(samples) / len(samples)

    def summary(self) -> dict[str, Any]:
        result: dict[str, Any] = {"counters": dict(self.counters), "latencies": {}}
        for name in self.latencies:
            result["latencies"][name] = {
                "count": len(self.latencies[name]),
                "mean_ms": round((self.mean(name) or 0) * 1000, 2),
                "p99_ms": round((self.p99(name) or 0) * 1000, 2),
            }
        return result


_metrics = _Metrics()


def get_metrics() -> _Metrics:
    return _metrics


# ── Context manager for latency measurement ───────────────────────────────────

@contextlib.contextmanager
def record_latency(metric_name: str) -> Generator[None, None, None]:
    """Context manager that measures wall-clock time and records it."""
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        _metrics.record_latency(metric_name, elapsed)


# ── GraphRAG-specific helpers ─────────────────────────────────────────────────

def record_graphrag_hit(hits: int) -> None:
    """Record a GraphRAG retrieval result — hits > 0 = cache hit."""
    _metrics.inc("graphrag.total_calls")
    if hits > 0:
        _metrics.inc("graphrag.hits")
    else:
        _metrics.inc("graphrag.misses")


def record_llm_call(provider: str, latency_s: float, success: bool) -> None:
    """Record an LLM call outcome."""
    _metrics.inc(f"llm.calls.{provider}")
    _metrics.record_latency(f"llm.latency.{provider}", latency_s)
    if not success:
        _metrics.inc(f"llm.errors.{provider}")


def record_agent_request(intent: str, success: bool) -> None:
    """Record an agent chat request."""
    _metrics.inc("agent.requests.total")
    _metrics.inc(f"agent.intents.{intent}")
    if success:
        _metrics.inc("agent.requests.success")
    else:
        _metrics.inc("agent.requests.error")


# ── Metrics endpoint helper ───────────────────────────────────────────────────

def metrics_response() -> dict[str, Any]:
    """Return current metrics as a dict for /health or /metrics endpoint."""
    summary = _metrics.summary()
    graphrag_total = _metrics.counters.get("graphrag.total_calls", 0)
    graphrag_hits = _metrics.counters.get("graphrag.hits", 0)
    summary["graphrag_hit_rate"] = (
        round(graphrag_hits / graphrag_total, 4) if graphrag_total > 0 else None
    )
    return summary
