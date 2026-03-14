/**
 * Agent API config — same base URL as main API.
 * Menu IDs must match navConfig (overview, pricer, portfolio, risk, optimizer, volatility, factor, scenarios, blotter).
 */
import { API_CONFIG } from './api';

export const AGENTS_CONFIG = {
  BASE_URL: API_CONFIG.BASE_URL,
  CHAT: `${API_CONFIG.BASE_URL}/agents/chat`,
  CHAT_STREAM: `${API_CONFIG.BASE_URL}/agents/chat/stream`,
  EXPLAIN: `${API_CONFIG.BASE_URL}/agents/explain`,
  FEEDBACK: `${API_CONFIG.BASE_URL}/agents/feedback`,
  ENRICH: `${API_CONFIG.BASE_URL}/agents/enrich`,
  HEALTH: `${API_CONFIG.BASE_URL}/agents/health`,
  MENU_CONCEPTS: (menuId: string) => `${API_CONFIG.BASE_URL}/agents/menus/${menuId}/concepts`,
  TIMEOUT_MS: 65000,
} as const;

export const MENU_IDS = [
  'overview',
  'pricer',
  'portfolio',
  'risk',
  'optimizer',
  'volatility',
  'factor',
  'scenarios',
  'blotter',
] as const;
export type MenuId = (typeof MENU_IDS)[number];
