"""
Resilience patterns: retry with exponential backoff + jitter, circuit breaker.

Usage:
    from ai_core.resilience import retry_with_backoff, circuit_breaker

    @retry_with_backoff(max_attempts=3, base_delay=0.5)
    def call_external_api():
        ...

    @circuit_breaker(name="neo4j", failure_threshold=5, recovery_timeout=60)
    def query_neo4j():
        ...
"""
from __future__ import annotations

import asyncio
import functools
import logging
import random
import time
from typing import Any, Callable, TypeVar

logger = logging.getLogger(__name__)

F = TypeVar("F", bound=Callable[..., Any])


# ── Retry with exponential backoff ────────────────────────────────────────────

def retry_with_backoff(
    max_attempts: int = 3,
    base_delay: float = 0.5,
    max_delay: float = 30.0,
    jitter: bool = True,
    retryable_exceptions: tuple[type[Exception], ...] = (Exception,),
) -> Callable[[F], F]:
    """
    Decorator: retry a function up to `max_attempts` times with exponential backoff.

    Parameters
    ----------
    max_attempts    : total attempts (first call + retries)
    base_delay      : initial sleep duration in seconds
    max_delay       : cap on sleep duration
    jitter          : add ±25% random jitter to each delay
    retryable_exceptions : exception types to retry (default: all)
    """
    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exc: Exception | None = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exc = e
                    if attempt == max_attempts - 1:
                        break
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    if jitter:
                        delay *= 0.75 + 0.5 * random.random()
                    logger.debug(
                        "Retry %d/%d for %s after %.2fs: %s",
                        attempt + 1, max_attempts - 1, func.__name__, delay, e,
                    )
                    time.sleep(delay)
            raise last_exc  # type: ignore[misc]
        return wrapper  # type: ignore[return-value]
    return decorator


# ── Circuit breaker ───────────────────────────────────────────────────────────

class CircuitOpenError(Exception):
    """Raised when a circuit breaker is open (service considered down)."""
    pass


_circuits: dict[str, "_CircuitState"] = {}


class _CircuitState:
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing; reject calls immediately
    HALF_OPEN = "half_open"  # Testing if service recovered

    def __init__(self, name: str, failure_threshold: int, recovery_timeout: float):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = self.CLOSED
        self.failure_count = 0
        self.last_failure_time: float = 0.0
        self.success_count = 0

    def record_success(self) -> None:
        self.failure_count = 0
        self.success_count += 1
        if self.state == self.HALF_OPEN:
            self.state = self.CLOSED
            logger.info("Circuit '%s' closed (service recovered)", self.name)

    def record_failure(self) -> None:
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            if self.state != self.OPEN:
                logger.warning("Circuit '%s' OPEN after %d failures", self.name, self.failure_count)
            self.state = self.OPEN

    def allow_call(self) -> bool:
        if self.state == self.CLOSED:
            return True
        if self.state == self.OPEN:
            if time.time() - self.last_failure_time >= self.recovery_timeout:
                self.state = self.HALF_OPEN
                logger.info("Circuit '%s' HALF-OPEN (testing recovery)", self.name)
                return True
            return False
        # HALF_OPEN: allow one probe call
        return True


def circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    recovery_timeout: float = 60.0,
) -> Callable[[F], F]:
    """
    Decorator: wrap a function in a circuit breaker named `name`.

    - After `failure_threshold` consecutive failures, the circuit opens.
    - After `recovery_timeout` seconds, one probe call is allowed (HALF_OPEN).
    - On success: circuit closes. On failure: circuit stays open.

    Raises CircuitOpenError when the circuit is open.
    """
    if name not in _circuits:
        _circuits[name] = _CircuitState(name, failure_threshold, recovery_timeout)

    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            state = _circuits[name]
            if not state.allow_call():
                raise CircuitOpenError(
                    f"Circuit '{name}' is OPEN — service unavailable. "
                    f"Will retry after {recovery_timeout}s."
                )
            try:
                result = func(*args, **kwargs)
                state.record_success()
                return result
            except Exception as e:
                state.record_failure()
                raise
        return wrapper  # type: ignore[return-value]
    return decorator


def async_retry_with_backoff(
    max_attempts: int = 3,
    base_delay: float = 0.5,
    max_delay: float = 30.0,
    jitter: bool = True,
    retryable_exceptions: tuple[type[Exception], ...] = (Exception,),
) -> Callable[[F], F]:
    """Async variant of retry_with_backoff — uses asyncio.sleep for coroutines."""
    def decorator(func: F) -> F:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exc: Exception | None = None
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exc = e
                    if attempt == max_attempts - 1:
                        break
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    if jitter:
                        delay *= 0.75 + 0.5 * random.random()
                    logger.debug(
                        "Async retry %d/%d for %s after %.2fs: %s",
                        attempt + 1, max_attempts - 1, func.__name__, delay, e,
                    )
                    await asyncio.sleep(delay)
            raise last_exc  # type: ignore[misc]
        return wrapper  # type: ignore[return-value]
    return decorator


def get_circuit_status() -> dict[str, dict[str, Any]]:
    """Return current state of all registered circuits (for health checks)."""
    return {
        name: {
            "state": s.state,
            "failure_count": s.failure_count,
            "last_failure": s.last_failure_time,
        }
        for name, s in _circuits.items()
    }
