# CLAUDE.md — React Frontend

## Overview

React 18 + TypeScript + Vite frontend for the Derivatives Pricing Engine.
Proxies all API calls to the FastAPI backend at `http://localhost:8000`.

## Commands

```bash
npm run dev          # dev server → http://localhost:3000  (auto-proxies /api → :8000)
npm run build        # production build → dist/
npm run preview      # serve production build locally
npm run lint         # ESLint (TypeScript strict)
npm run type-check   # tsc --noEmit
npm test             # vitest (single run)
npm run test:watch   # vitest watch mode
npm run test:ui      # vitest browser UI
```

## Component Map

```
src/
├── App.tsx                        ← router root (React Router v6)
├── main.tsx                       ← ReactDOM.createRoot
├── config/api.ts                  ← Axios instance (baseURL = VITE_API_URL)
├── hooks/useApi.ts                ← generic useFetch hook
├── types/index.ts                 ← shared TypeScript interfaces
├── utils/
│   ├── api.ts                     ← typed API call helpers
│   ├── export.ts                  ← CSV/JSON export
│   └── greeks.ts                  ← client-side Greeks utilities
└── components/
    ├── Header.tsx / Hero.tsx      ← landing page layout
    ├── PricingWorkspace.tsx       ← BS / FFT / Heston pricer form + results
    ├── GreeksChart.tsx            ← Greeks visualisation (Delta, Gamma…)
    ├── VolatilitySurfaceChart.tsx ← 3-D vol surface
    ├── OptionChainDisplay.tsx     ← option chain table
    ├── MarketDataDashboard.tsx    ← Deriv live market data dashboard
    ├── MarketDataVisualization.tsx
    ├── ApiPlayground.tsx          ← interactive API explorer
    ├── ExportButton.tsx           ← export CSV / JSON
    ├── Transact/
    │   └── TransactPage.tsx       ← Transact shell (tabs: Portfolio/Risk/Optimizer/Scenarios/Blotter)
    ├── Portfolio/
    │   ├── PortfolioBuilder.tsx   ← weights input + moments display
    │   ├── PerformanceAppraisalCard.tsx
    │   └── MomentsPanel.tsx
    ├── Risk/
    │   └── VaRDashboard.tsx       ← VaR / ES across methods
    ├── Optimizer/
    │   ├── OptimizerPhase2.tsx    ← BLM / Risk Parity / HRP / Kelly
    │   └── EfficientFrontierChart.tsx  ← MVO frontier chart
    ├── Scenarios/
    │   └── ScenarioLabPhase4.tsx  ← custom / historical / MC / behavioural scenarios
    ├── Blotter/
    │   ├── TradeEntryForm.tsx     ← new trade form
    │   ├── PositionTable.tsx      ← open positions + P&L
    │   └── AttributionCard.tsx    ← performance attribution breakdown
    └── FactorLab/
        └── FactorLabPhase3.tsx    ← OLS factor model / Fama-MacBeth / Smart Beta
```

## API Configuration

- Base URL is read from `VITE_API_URL` (default `http://localhost:8000`).
- Vite dev-server proxies `/api/*` → `http://localhost:8000` (strips the `/api` prefix).
- Direct calls use the full backend URL (not the `/api` prefix).

## Adding a New API-Connected Component

1. Add a typed response interface to `src/types/index.ts`.
2. Add a helper function to `src/utils/api.ts` using the Axios instance from `src/config/api.ts`.
3. Use `useApi` hook (or direct Axios calls) inside the component.
4. Add the component route in `App.tsx` if it needs its own page.

## Adding a New Route/Page

```tsx
// App.tsx
import { MyNewPage } from './components/MyNewPage';

<Route path="/my-page" element={<MyNewPage />} />
```

## Styling Conventions

- **Tailwind CSS** utility classes only — no custom CSS unless unavoidable.
- Dark theme: `bg-slate-900` background, `text-white` / `text-slate-400` for text.
- Primary colour: `bg-primary-600` (blue). Define custom colours in `tailwind.config.js`.
- Cards: `bg-slate-800 rounded-xl p-6`.
- Form inputs: `bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white`.

## Testing Conventions

- Test files: `src/components/__tests__/*.test.tsx` or `src/utils/__tests__/*.test.ts`.
- Test runner: **vitest** (jest-compatible API, jsdom environment).
- Setup file: `src/test/setup.ts` (imports `@testing-library/jest-dom`).
- Mock API calls with `vi.mock` or MSW.

## Key Environment Variables (`frontend/.env`)

```bash
VITE_API_URL=http://localhost:8000   # backend base URL
VITE_ENV=development
VITE_ENABLE_DEMO=true
```

## Common Issues

| Issue | Fix |
|-------|-----|
| CORS error | Ensure backend is running on port 8000 and frontend on 3000 |
| 404 on API call | Check `VITE_API_URL` in `.env`; run `npm run dev` not `npm run build` |
| Type error on response | Update interface in `src/types/index.ts` to match actual API shape |
| Chart not rendering | Verify data arrays are non-empty; add loading/empty-state guards |
