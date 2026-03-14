"""
Structured telemetry for psychic-invention FastAPI service.

Uses structlog (already a project dependency) for JSON-line logging.
Tracks in-process counters and latency histograms — no external
Prometheus/Grafana dependency required.

Usage:
    from app.telemetry import get_logger, record_latency, record_agent_request, metrics_response

    log = get_logger("agents")
    log.info("chat.start", session_id="abc", intent="FORMULA_EXPLAIN")

    with record_latency("agent.chat"):
        result = agent.run(...)
    record_agent_request(intent="FORMULA_EXPLAIN", success=True)
"""
from __future__ import annotations

import contextlib
import logging
import time
from collections import defaultdict
from typing import Any, Generator

try:
    import structlog

    _STRUCTLOG = True
except ImportError:
    _STRUCTLOG = False


# ── Logger setup ───────────────────────────────────────────────────────────────

_setup_done = False


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


def get_logger(name: str = "psychic") -> Any:
    """Return a structlog (or stdlib) logger."""
    global _setup_done
    if not _setup_done:
        _setup_structlog()
        _setup_done = True
    if _STRUCTLOG:
        return structlog.get_logger(name)
    return logging.getLogger(name)


# ── In-process metrics store ───────────────────────────────────────────────────

class _Metrics:
    def __init__(self) -> None:
        self.counters: dict[str, int] = defaultdict(int)
        self.latencies: dict[str, list[float]] = defaultdict(list)
        self._max_samples = 1000

    def inc(self, name: str, amount: int = 1) -> None:
        self.counters[name] += amount

    def record_latency(self, name: str, seconds: float) -> None:
        samples = self.latencies[name]
        samples.append(seconds)
        if len(samples) > self._max_samples:
            self.latencies[name] = samples[-self._max_samples :]

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


# ── Latency context manager ────────────────────────────────────────────────────

@contextlib.contextmanager
def record_latency(metric_name: str) -> Generator[None, None, None]:
    """Measure wall-clock time and record it under metric_name."""
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - start
        _metrics.record_latency(metric_name, elapsed)


# ── Domain-specific helpers ────────────────────────────────────────────────────

def record_agent_request(intent: str, success: bool) -> None:
    """Record an agent chat request outcome."""
    _metrics.inc("agent.requests.total")
    _metrics.inc(f"agent.intents.{intent}")
    if success:
        _metrics.inc("agent.requests.success")
    else:
        _metrics.inc("agent.requests.error")


def record_graphrag_hit(hits: int) -> None:
    _metrics.inc("graphrag.total_calls")
    if hits > 0:
        _metrics.inc("graphrag.hits")
    else:
        _metrics.inc("graphrag.misses")


def record_llm_call(provider: str, latency_s: float, success: bool) -> None:
    _metrics.inc(f"llm.calls.{provider}")
    _metrics.record_latency(f"llm.latency.{provider}", latency_s)
    if not success:
        _metrics.inc(f"llm.errors.{provider}")


# ── /metrics endpoint helper ───────────────────────────────────────────────────

def metrics_response() -> dict[str, Any]:
    """Serialisable dict for GET /agents/metrics."""
    summary = _metrics.summary()
    total = _metrics.counters.get("graphrag.total_calls", 0)
    hits = _metrics.counters.get("graphrag.hits", 0)
    summary["graphrag_hit_rate"] = round(hits / total, 4) if total > 0 else None
    return summary
