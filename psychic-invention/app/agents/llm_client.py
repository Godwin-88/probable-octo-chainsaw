"""
LLM clients for the agent layer.

Supports:
- Ollama (local, /api/generate)
- Groq (remote, OpenAI-compatible /chat/completions)

Selection is controlled by environment variables:
- If GROQ_API_KEY is set and non-empty, Groq is used.
- Otherwise, Ollama is used.
"""

import json
import os
import logging
from typing import Optional, Callable, Dict, Any

import requests

logger = logging.getLogger(__name__)


def _load_env():
    """Best-effort .env loader checking multiple locations."""
    try:
        from dotenv import load_dotenv
        from pathlib import Path
        # 1. Check project root absolute
        load_dotenv("/home/ed/projects/probable-octo-chainsaw/.env", override=False)
        # 2. Check current working directory
        load_dotenv(Path.cwd() / ".env", override=False)
        # 3. Check relative to this file
        load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env", override=False)
    except ImportError:
        pass


# Load .env immediately on import so env vars are available before any get_*() call
_load_env()


# ── Ollama client ─────────────────────────────────────────────────────────────


def _get_ollama_config() -> Dict[str, Any]:
    _load_env()
    host = (os.getenv("OLLAMA_HOST") or "http://127.0.0.1:11434").strip().rstrip("/")
    # Use 127.0.0.1 instead of localhost to avoid Windows IPv6 (::1) vs Ollama on IPv4
    if host in ("http://localhost:11434", "http://localhost:11434/"):
        host = "http://127.0.0.1:11434"
    return {
        "host": host,
        "model": os.getenv("OLLAMA_MODEL", "llama3:8b"),
        "fallback": os.getenv("OLLAMA_MODEL_FALLBACK", "qwen2:7b"),
        "timeout": float(os.getenv("OLLAMA_TIMEOUT", "60")),
    }


class OllamaClient:
    """Sync Ollama API client for /api/generate."""

    def __init__(self, host: Optional[str] = None, model: Optional[str] = None, timeout: float = 60.0):
        cfg = _get_ollama_config()
        self._base = (host or cfg["host"]).rstrip("/")
        self._model = model or cfg["model"]
        self._fallback = cfg["fallback"]
        self._timeout = timeout or cfg["timeout"]

    def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.3,
        model: Optional[str] = None,
        stream_callback: Optional[Callable[[str], None]] = None,
    ) -> str:
        """
        Call Ollama /api/generate. Returns full response text.
        On timeout or error, retries with fallback model once.
        """
        model = model or self._model
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": stream_callback is not None,
            "options": {"temperature": temperature},
        }
        if system:
            payload["system"] = system

        def _call(m: str) -> str:
            payload["model"] = m
            if stream_callback:
                return self._generate_stream(payload, stream_callback)
            return self._generate_sync(payload)

        try:
            return _call(model)
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
            logger.warning("Ollama primary model failed: %s", e)
            if model != self._fallback:
                try:
                    return _call(self._fallback)
                except Exception as e2:
                    logger.warning("Ollama fallback failed: %s", e2)
                    raise
            raise

    def _generate_sync(self, payload: dict) -> str:
        payload = {**payload, "stream": False}
        r = requests.post(f"{self._base}/api/generate", json=payload, timeout=self._timeout)
        r.raise_for_status()
        data = r.json()
        return (data.get("response") or "").strip()

    def _generate_stream(self, payload: dict, callback: Callable[[str], None]) -> str:
        payload["stream"] = True
        full: list[str] = []
        r = requests.post(
            f"{self._base}/api/generate",
            json=payload,
            timeout=self._timeout,
            stream=True,
        )
        r.raise_for_status()
        for line in r.iter_lines(decode_unicode=True):
            if not line:
                continue
            try:
                chunk = json.loads(line)
                piece = chunk.get("response") or ""
                if piece:
                    full.append(piece)
                    callback(piece)
            except json.JSONDecodeError:
                continue
        return "".join(full)

    def health_check(self) -> bool:
        """Verify Ollama is reachable (e.g. GET /api/tags)."""
        try:
            r = requests.get(f"{self._base}/api/tags", timeout=10.0)
            return r.status_code == 200
        except Exception as e:
            logger.warning("Ollama health_check failed at %s: %s", self._base, e)
            return False


# ── Unified OpenAI-compatible client (Groq, Gaia, Galadriel, etc.) ────────────


def _get_llm_config() -> Dict[str, Any]:
    _load_env()
    # Support generic LLM_* env vars for easier sponsor integration
    provider = os.getenv("LLM_PROVIDER", "groq").lower()
    api_key = os.getenv("LLM_API_KEY") or os.getenv("GROQ_API_KEY") or ""
    model = os.getenv("LLM_MODEL") or os.getenv("GROQ_MODEL") or "llama3-8b-8192"
    base = (os.getenv("LLM_API_BASE") or os.getenv("GROQ_API_BASE") or "https://api.groq.com/openai/v1").rstrip("/")
    timeout = float(os.getenv("LLM_TIMEOUT") or os.getenv("GROQ_TIMEOUT") or "60")
    
    return {
        "api_key": api_key,
        "model": model,
        "base": base,
        "timeout": timeout,
        "provider": provider
    }


class OpenAICompatibleClient:
    """Generic client for any OpenAI-compatible /chat/completions API."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, base_url: Optional[str] = None):
        cfg = _get_llm_config()
        self._api_key = api_key or cfg["api_key"]
        self._model = model or cfg["model"]
        self._base = (base_url or cfg["base"]).rstrip("/")
        self._timeout = cfg["timeout"]

    def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        temperature: float = 0.3,
        model: Optional[str] = None,
        stream_callback: Optional[Callable[[str], None]] = None,
    ) -> str:
        """Call /chat/completions and return the assistant text."""
        if not self._api_key:
            raise RuntimeError("LLM API key not set (set LLM_API_KEY or GROQ_API_KEY)")
        
        url = f"{self._base}/chat/completions"
        m = model or self._model
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": m,
            "messages": messages,
            "temperature": float(temperature),
            "stream": stream_callback is not None,
        }

        try:
            if stream_callback:
                return self._generate_stream(url, payload, stream_callback)
            return self._generate_sync(url, payload)
        except Exception as e:
            logger.error("LLM request failed: %s", e)
            raise

    def _generate_sync(self, url: str, payload: dict) -> str:
        r = requests.post(url, headers=self._headers(), json=payload, timeout=self._timeout)
        r.raise_for_status()
        data = r.json()
        try:
            return (data["choices"][0]["message"]["content"] or "").strip()
        except (KeyError, IndexError):
            logger.warning("Unexpected LLM response schema: %s", data)
            return ""

    def _generate_stream(self, url: str, payload: dict, callback: Callable[[str], None]) -> str:
        full: list[str] = []
        r = requests.post(url, headers=self._headers(), json=payload, timeout=self._timeout, stream=True)
        r.raise_for_status()
        
        for line in r.iter_lines(decode_unicode=True):
            if not line: continue
            if line.startswith("data: "):
                data_str = line[6:].strip()
                if data_str == "[DONE]": break
                try:
                    chunk = json.loads(data_str)
                    delta = chunk["choices"][0].get("delta", {})
                    content = delta.get("content", "")
                    if content:
                        full.append(content)
                        callback(content)
                except Exception:
                    continue
        return "".join(full)

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

    def health_check(self) -> bool:
        if not self._api_key: return False
        try:
            # Try to list models as a generic health check
            r = requests.get(f"{self._base}/models", headers=self._headers(), timeout=10.0)
            return r.status_code == 200
        except Exception:
            return False


# Keep GroqClient for backward compatibility if needed, but point it to the new unified class
class GroqClient(OpenAICompatibleClient):
    pass


# ── Factory ───────────────────────────────────────────────────────────────────


def get_llm_client():
    """
    Return the default LLM client based on environment configuration.

    Precedence:
    1. If LLM_API_KEY or GROQ_API_KEY is set → OpenAICompatibleClient (Groq, Gaia, Galadriel, etc.)
    2. Else → OllamaClient
    """
    cfg = _get_llm_config()
    if cfg["api_key"]:
        logger.info("Using OpenAI-compatible client for agent LLM (Base: %s, Model: %s)", cfg["base"], cfg["model"])
        return OpenAICompatibleClient()
    
    logger.info("Using OllamaClient for agent LLM")
    return OllamaClient()
