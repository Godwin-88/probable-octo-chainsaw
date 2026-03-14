"""
ReAct agent loop — Thought → Action (tool call) → Observation → Final Answer.

Implements a lightweight ReAct pattern (Yao et al. 2022) for grounded financial Q&A.
Emits Server-Sent Events (SSE) for streaming responses.

Max iterations: 5 (prevents runaway loops).
Tools available:
  - graphrag_search(query)     → knowledge graph + PDF citations + live data
  - explain_formula(name)      → formula details from kb
  - explain_concept(name)      → concept details from kb
  - suggest_strategies(query)  → trading strategies from kb

The agent:
1. Classifies intent (router.py)
2. Injects conversation history (memory.py)
3. Runs Thought/Action/Observation loop
4. Emits final answer with citations
"""
from __future__ import annotations

import json
import logging
import re
import time
from typing import Any, Callable, Generator, Optional

from .memory import ConversationMemory, get_memory
from .router import Intent, classify_intent
from .skills import (
    MENU_SYSTEM_PROMPTS,
    MENU_ID_TO_NAME,
    route_and_run,
    suggest_trading_strategies,
    explain_formula,
    explain_concept,
)
from app.knowledge_base.neo4j_client import Neo4jKnowledgeClient

logger = logging.getLogger(__name__)

_MAX_ITERATIONS = 5

# ── SSE helpers ───────────────────────────────────────────────────────────────

def _sse_event(event: str, data: Any) -> str:
    payload = json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n"


# ── Tool definitions ──────────────────────────────────────────────────────────

_TOOLS_DESCRIPTION = """
Available tools (call ONE at a time):
- graphrag_search(query: str) — search the knowledge graph for concepts, formulas, strategies with PDF citations
- explain_formula(name: str)  — get full formula details
- explain_concept(name: str)  — get concept definition and domain
- suggest_strategies(query: str) — find relevant trading strategies

To call a tool, output EXACTLY:
Action: <tool_name>(<argument>)

After each observation, continue thinking or emit your final answer.
When done, output:
Final Answer: <your complete response>
""".strip()


# ── ReAct loop ────────────────────────────────────────────────────────────────

class ReActAgent:
    """
    Lightweight ReAct agent with SSE streaming.

    Parameters
    ----------
    kb   : Neo4jKnowledgeClient — may be None (graceful degradation)
    llm  : LLM client (OllamaClient or GroqClient)
    memory : ConversationMemory
    """

    def __init__(
        self,
        kb: Optional[Neo4jKnowledgeClient],
        llm: Any,
        memory: Optional[ConversationMemory] = None,
    ):
        self.kb = kb
        self.llm = llm
        self.memory = memory or get_memory()

    def _call_tool(self, tool_name: str, arg: str) -> str:
        """Execute a tool call and return observation string."""
        if self.kb is None:
            return "Knowledge base unavailable."

        try:
            if tool_name == "graphrag_search":
                result = self.kb.graphrag_retrieve(arg)
                ctx = result.get("prompt_context", "No results.")
                hits = result.get("hits", 0)
                return f"[{hits} graph hits]\n{ctx[:1500]}"

            elif tool_name == "explain_formula":
                r = explain_formula(self.kb, self.llm, arg)
                return r.get("reply", "No formula found.")

            elif tool_name == "explain_concept":
                r = explain_concept(self.kb, self.llm, arg)
                return r.get("reply", "No concept found.")

            elif tool_name == "suggest_strategies":
                r = suggest_trading_strategies(self.kb, self.llm, arg)
                return r.get("reply", "No strategies found.")

            else:
                return f"Unknown tool: {tool_name}"

        except Exception as e:
            logger.debug("Tool %s(%s) failed: %s", tool_name, arg, e)
            return f"Tool error: {e}"

    def _parse_action(self, text: str) -> Optional[tuple[str, str]]:
        """Parse 'Action: tool_name(argument)' from LLM output."""
        m = re.search(r"Action:\s*(\w+)\(([^)]*)\)", text)
        if m:
            return m.group(1), m.group(2).strip("'\"")
        return None

    def _has_final_answer(self, text: str) -> Optional[str]:
        """Extract 'Final Answer: ...' from LLM output."""
        m = re.search(r"Final Answer:\s*(.+)", text, re.DOTALL)
        if m:
            return m.group(1).strip()
        return None

    def run(
        self,
        message: str,
        session_id: str = "default",
        menu_id: Optional[str] = None,
        context: Optional[dict[str, Any]] = None,
        sse_callback: Optional[Callable[[str], None]] = None,
    ) -> dict[str, Any]:
        """
        Run the ReAct loop synchronously.

        Parameters
        ----------
        message     : user message
        session_id  : for conversation memory
        menu_id     : active module (pricer, risk, etc.)
        context     : frontend context dict (workspace_data, formula_name, etc.)
        sse_callback: if provided, called with SSE event strings for streaming

        Returns dict with keys: reply, sources, intent, iterations
        """
        ctx = context or {}
        intent = classify_intent(message, ctx)
        menu_name = MENU_ID_TO_NAME.get((menu_id or "").lower(), "Transact")

        # Retrieve conversation history
        history = self.memory.get_history(session_id)
        history_text = ConversationMemory.format_for_prompt(history)

        def emit(event: str, data: Any) -> None:
            if sse_callback:
                sse_callback(_sse_event(event, data))

        emit("intent", {"intent": intent.value, "menu": menu_id})

        # Fast path: workspace analysis and explicit context don't need the loop
        if intent in (Intent.WORKSPACE_ANALYZE, Intent.FORMULA_EXPLAIN,
                      Intent.CONCEPT_EXPLAIN, Intent.METRIC_INTERPRET,
                      Intent.COMPARE, Intent.DERIVATION):
            result = route_and_run(self.kb, self.llm, message, menu_id, ctx)
            reply = result.get("reply", "")
            sources = result.get("sources", [])
            self.memory.add_turn(session_id, "user", message)
            self.memory.add_turn(session_id, "assistant", reply)
            emit("final_answer", {"reply": reply, "sources": sources, "intent": intent.value})
            return {"reply": reply, "sources": sources, "intent": intent.value, "iterations": 1}

        # ── ReAct loop for GRAPH_QUERY and STRATEGY_SUGGEST ──────────────────
        system_prompt = MENU_SYSTEM_PROMPTS.get((menu_id or "").lower(), MENU_SYSTEM_PROMPTS["overview"])

        scratchpad_parts: list[str] = []
        if history_text:
            scratchpad_parts.append(f"Conversation history:\n{history_text}\n")

        scratchpad_parts.append(
            f"Question: {message}\n\n"
            f"{_TOOLS_DESCRIPTION}\n\n"
            "Think step by step. Start with Thought:"
        )
        scratchpad = "\n".join(scratchpad_parts)

        observations: list[str] = []
        sources: list[dict[str, Any]] = []
        final_reply = ""
        iterations = 0

        for i in range(_MAX_ITERATIONS):
            iterations = i + 1
            emit("thinking", {"step": i + 1})

            # Build prompt with accumulated scratchpad
            obs_block = ""
            if observations:
                obs_block = "\n".join(
                    f"Observation {j+1}: {o}" for j, o in enumerate(observations)
                )
                obs_block = "\n" + obs_block + "\n"

            prompt = scratchpad + obs_block

            try:
                llm_out = self.llm.generate(prompt, system=system_prompt, temperature=0.35)
            except Exception as e:
                logger.warning("LLM error in ReAct step %d: %s", i + 1, e)
                llm_out = "Final Answer: I encountered an error. Please try again."

            # Check for final answer
            final = self._has_final_answer(llm_out)
            if final:
                final_reply = final
                break

            # Check for action
            action = self._parse_action(llm_out)
            if action:
                tool_name, arg = action
                emit("action", {"tool": tool_name, "arg": arg})
                observation = self._call_tool(tool_name, arg)
                observations.append(observation[:800])
                emit("observation", {"step": i + 1, "preview": observation[:200]})
                # Accumulate scratchpad
                scratchpad += f"\nThought: {llm_out.split('Action:')[0].strip()}\nAction: {tool_name}({arg})"
            else:
                # No action, no final answer — treat the whole output as final
                final_reply = llm_out.strip()
                break

        if not final_reply:
            # Hit max iterations — use last LLM output
            final_reply = self.llm.generate(
                f"Based on everything gathered:\n{scratchpad}\n\nProvide a concise Final Answer:",
                system=system_prompt,
                temperature=0.35,
            )

        # Persist turns
        self.memory.add_turn(session_id, "user", message)
        self.memory.add_turn(session_id, "assistant", final_reply)

        emit("final_answer", {"reply": final_reply, "sources": sources, "intent": intent.value})
        return {
            "reply": final_reply,
            "sources": sources,
            "intent": intent.value,
            "iterations": iterations,
        }

    def stream(
        self,
        message: str,
        session_id: str = "default",
        menu_id: Optional[str] = None,
        context: Optional[dict[str, Any]] = None,
    ) -> Generator[str, None, None]:
        """
        Generator that yields SSE-formatted strings for FastAPI StreamingResponse.
        """
        events: list[str] = []

        def collect(evt: str) -> None:
            events.append(evt)

        result = self.run(message, session_id, menu_id, context, sse_callback=collect)

        # Yield all collected events
        for evt in events:
            yield evt

        # Ensure final_answer is always the last event if not already emitted
        if not any("final_answer" in e for e in events):
            yield _sse_event("final_answer", {
                "reply": result.get("reply", ""),
                "sources": result.get("sources", []),
            })

        yield _sse_event("done", {"iterations": result.get("iterations", 1)})
