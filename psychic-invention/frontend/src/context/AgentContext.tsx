/**
 * AgentContext — workspace data bridge + persistent chat history for the AI assistant.
 *
 * Chat history is:
 *   1. Lifted here so it survives popup open/close cycles
 *   2. Persisted to localStorage — survives page refresh
 *   3. POST-ed to backend on conversation close for DRL graph enrichment
 *
 * Each Transact workspace writes its computed results here via setWorkspaceContext().
 * Provided at TransactLayout level so ALL workspace children can access it.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';

// ── Shared message type (used by AgentPopup + ChatInterface) ──────────────────

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: number;
  sources?: Array<{ id?: string; title?: string; type?: string }>;
}

// ── localStorage helpers ──────────────────────────────────────────────────────

const CHAT_STORAGE_KEY = 'dpe_agent_chat_v2';
const MAX_MSGS_PER_MENU = 100;

function _loadHistory(): Record<string, Message[]> {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Message[]>) : {};
  } catch { return {}; }
}

function _saveHistory(h: Record<string, Message[]>): void {
  try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(h)); } catch { /* quota */ }
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface WorkspaceAgentContext {
  /** Menu id — matches MENU_ID_TO_NAME in skills.py */
  menuId: string;
  /** One-sentence summary of current workspace state (shown in popup header) */
  summary?: string;
  /** Key metrics for the inline context strip (label → formatted value) */
  metrics?: Record<string, string | number | null>;
  /** Clickable question chips shown in the popup */
  suggestedQuestions?: string[];
  /** Full raw data forwarded to the backend as context.workspace_data */
  rawData?: Record<string, unknown>;
}

interface AgentContextValue {
  workspaceContext: WorkspaceAgentContext | null;
  setWorkspaceContext: (ctx: WorkspaceAgentContext) => void;
  clearWorkspaceContext: () => void;
  // Persistent chat history keyed by menuId
  chatHistory: Record<string, Message[]>;
  addMessage: (menuId: string, msg: Message) => void;
  clearChat: (menuId: string) => void;
  clearAllChats: () => void;
}

// ── Default per-menu suggested questions ────────────────────────────────────

export const DEFAULT_SUGGESTED_QUESTIONS: Record<string, string[]> = {
  pricer: [
    'Explain what this Delta means for my position',
    'Should I use Black-Scholes or Heston for this option?',
    'What are the model assumptions and when do they break down?',
    'Interpret my Theta decay — how much time value am I losing per day?',
    'Compare Black-Scholes vs Heston for this scenario',
  ],
  portfolio: [
    'Analyze my portfolio\'s overall risk-return profile',
    'What does my Sharpe ratio tell me about efficiency?',
    'How diversified is my portfolio really?',
    'Interpret my portfolio beta and systematic risk exposure',
    'What do the skewness and kurtosis tell me about tail risk?',
  ],
  risk: [
    'How severe is my Value at Risk — is it acceptable?',
    'Compare historical vs parametric vs Monte Carlo VaR for my portfolio',
    'What is driving my largest risk exposures?',
    'Explain my covariance matrix health and what the condition number means',
    'Interpret the minimum spanning tree — which assets are most connected?',
  ],
  optimizer: [
    'Analyze my optimized portfolio — is it well constructed?',
    'Why did MVO choose these specific weights?',
    'Should I use HRP or Black-Litterman for this asset universe?',
    'Explain the efficient frontier and where my portfolio sits on it',
    'Compare MVO vs Risk Parity vs HRP for my assets',
  ],
  volatility: [
    'Is implied volatility expensive or cheap relative to realized vol?',
    'Interpret the volatility term structure — what does the shape tell me?',
    'Explain my calibrated Heston parameters (κ, θ, σᵥ, ρ)',
    'What is the volatility risk premium in my data?',
    'How should I trade given the current vol surface shape?',
  ],
  factor: [
    'Interpret my factor exposures — what are my main risk drivers?',
    'Is my alpha statistically significant? What is the t-stat?',
    'Which factors explain most of my portfolio returns?',
    'Assess my Fama-MacBeth regression results',
    'How crowded are my factor bets — what is the herding risk?',
  ],
  scenarios: [
    'How did my portfolio perform under the GFC 2008 scenario?',
    'Interpret the Monte Carlo simulation results — what is my tail risk?',
    'What is my worst-case drawdown across all scenarios?',
    'Explain the behavioral scenario — how does prospect theory change the analysis?',
    'Which scenario poses the greatest threat to my portfolio?',
  ],
  blotter: [
    'Analyze my P&L attribution — am I generating alpha or just beta returns?',
    'Recommend position sizing strategies for my current portfolio',
    'Where should I place stop-losses on my positions?',
    'Which positions should I cut and which should I add to?',
    'Suggest trading strategies from the knowledge graph for my blotter state',
  ],
  overview: [
    'Give me a holistic summary of my current portfolio state',
    'What are the key risks I should be monitoring?',
    'Explain the CAPM framework and its use in this platform',
    'How does this platform connect pricing, risk, and optimization?',
  ],
};

// ── Context ────────────────────────────────────────────────────────────────────

const AgentCtx = createContext<AgentContextValue>({
  workspaceContext: null,
  setWorkspaceContext: () => {},
  clearWorkspaceContext: () => {},
  chatHistory: {},
  addMessage: () => {},
  clearChat: () => {},
  clearAllChats: () => {},
});

// ── Provider ───────────────────────────────────────────────────────────────────

export function AgentContextProvider({ children }: { children: ReactNode }) {
  const [workspaceContext, setCtx] = useState<WorkspaceAgentContext | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>(_loadHistory);
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  // Persist chat history to localStorage whenever it changes
  useEffect(() => {
    _saveHistory(chatHistory);
  }, [chatHistory]);

  // Clear workspace context when top-level menu changes (not sub-page navigation)
  useEffect(() => {
    const prev = prevPathRef.current;
    const curr = location.pathname;
    prevPathRef.current = curr;

    // Extract top-level segment: /transact/portfolio/moments → "portfolio"
    const topOf = (p: string) => p.replace(/^\/transact\/?/, '').split('/')[0] ?? '';
    if (topOf(prev) !== topOf(curr)) {
      setCtx(null);
    }
  }, [location.pathname]);

  const setWorkspaceContext = useCallback((ctx: WorkspaceAgentContext) => {
    setCtx(ctx);
  }, []);

  const clearWorkspaceContext = useCallback(() => {
    setCtx(null);
  }, []);

  const addMessage = useCallback((menuId: string, msg: Message) => {
    setChatHistory(prev => {
      const existing = prev[menuId] ?? [];
      const updated = [...existing, msg].slice(-MAX_MSGS_PER_MENU);
      return { ...prev, [menuId]: updated };
    });
  }, []);

  const clearChat = useCallback((menuId: string) => {
    setChatHistory(prev => {
      const next = { ...prev };
      delete next[menuId];
      return next;
    });
  }, []);

  const clearAllChats = useCallback(() => {
    setChatHistory({});
  }, []);

  return (
    <AgentCtx.Provider value={{
      workspaceContext,
      setWorkspaceContext,
      clearWorkspaceContext,
      chatHistory,
      addMessage,
      clearChat,
      clearAllChats,
    }}>
      {children}
    </AgentCtx.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAgentContext() {
  return useContext(AgentCtx);
}
