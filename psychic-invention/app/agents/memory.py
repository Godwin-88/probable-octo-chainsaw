"""
Conversation memory backed by Redis (or in-process dict as fallback).

Stores a sliding window of recent turns per session_id (TTL = 1 hour).
Each turn: {"role": "user"|"assistant", "content": str}

Usage:
    mem = ConversationMemory()
    mem.add_turn(session_id, "user", "What is VaR?")
    mem.add_turn(session_id, "assistant", "VaR is...")
    history = mem.get_history(session_id)      # list of {"role", "content"} dicts
    formatted = mem.format_for_prompt(history) # multiline string
"""
from __future__ import annotations

import json
import logging
import os
import time
from typing import Any, Optional

logger = logging.getLogger(__name__)

_REDIS_TTL = 3600    # 1 hour session window
_MAX_TURNS = 20      # keep last 20 turns (40 messages) per session

# In-process fallback store for when Redis is unavailable
_in_memory: dict[str, list[dict[str, Any]]] = {}


def _get_redis():
    try:
        import redis
        url = os.environ.get("REDIS_URL", "redis://localhost:6379")
        r = redis.from_url(url, decode_responses=True, socket_connect_timeout=2)
        r.ping()
        return r
    except Exception:
        return None


class ConversationMemory:
    """
    Redis-backed sliding-window conversation memory.
    Falls back to in-process dict if Redis is unavailable.
    """

    def __init__(self, redis_client=None, ttl: int = _REDIS_TTL, max_turns: int = _MAX_TURNS):
        self._redis = redis_client or _get_redis()
        self.ttl = ttl
        self.max_turns = max_turns

    def _redis_key(self, session_id: str) -> str:
        return f"chat:memory:{session_id}"

    def add_turn(self, session_id: str, role: str, content: str) -> None:
        """Append a single turn to the conversation history."""
        turn = {"role": role, "content": content[:4000], "ts": int(time.time())}
        if self._redis:
            key = self._redis_key(session_id)
            try:
                self._redis.rpush(key, json.dumps(turn))
                self._redis.ltrim(key, -self.max_turns * 2, -1)
                self._redis.expire(key, self.ttl)
                return
            except Exception as e:
                logger.debug("Redis add_turn failed, falling back: %s", e)
        # Fallback
        hist = _in_memory.setdefault(session_id, [])
        hist.append(turn)
        if len(hist) > self.max_turns * 2:
            _in_memory[session_id] = hist[-(self.max_turns * 2):]

    def get_history(self, session_id: str, limit: Optional[int] = None) -> list[dict[str, Any]]:
        """Return conversation turns for session_id, newest last."""
        lim = limit or self.max_turns * 2
        if self._redis:
            key = self._redis_key(session_id)
            try:
                raw = self._redis.lrange(key, -lim, -1)
                turns = []
                for r in raw:
                    try:
                        turns.append(json.loads(r))
                    except Exception:
                        continue
                return turns
            except Exception as e:
                logger.debug("Redis get_history failed, falling back: %s", e)
        return _in_memory.get(session_id, [])[-lim:]

    def clear(self, session_id: str) -> None:
        if self._redis:
            try:
                self._redis.delete(self._redis_key(session_id))
            except Exception:
                pass
        _in_memory.pop(session_id, None)

    @staticmethod
    def format_for_prompt(history: list[dict[str, Any]], max_chars: int = 2000) -> str:
        """
        Format conversation history as a compact block for LLM context injection.
        Truncates oldest turns if over max_chars.
        """
        if not history:
            return ""
        lines: list[str] = []
        for turn in history:
            role = turn.get("role", "user")
            prefix = "User" if role == "user" else "Assistant"
            content = turn.get("content", "")[:500]  # per-turn cap
            lines.append(f"{prefix}: {content}")
        text = "\n".join(lines)
        if len(text) > max_chars:
            text = "...\n" + text[-max_chars:]
        return text


# Module-level singleton
_memory: Optional[ConversationMemory] = None


def get_memory() -> ConversationMemory:
    global _memory
    if _memory is None:
        _memory = ConversationMemory()
    return _memory
