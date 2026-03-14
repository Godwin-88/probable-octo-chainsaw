# Add a New React Component

Guide for adding a new React component to the frontend.

## Checklist

Before writing code, confirm:
- **Component name** (PascalCase, e.g., `VolatilitySkewChart`)
- **Location** — pick the right subdirectory:
  - `src/components/Portfolio/` — portfolio construction & metrics
  - `src/components/Risk/` — VaR, stress testing
  - `src/components/Optimizer/` — efficient frontier, BLM, HRP, Kelly
  - `src/components/Scenarios/` — scenario analysis
  - `src/components/Blotter/` — trade blotter
  - `src/components/FactorLab/` — factor models
  - `src/components/` — shared / page-level
- **Which API endpoint(s)** it calls
- **Props interface** (if any)

## Implementation Steps

### 1. Create the component file

```tsx
// src/components/MySection/MyComponent.tsx
import { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '@/config/api';

interface MyResponse {
  result: number;
  model: string;
}

export const MyComponent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MyResponse | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post<MyResponse>(`${API_BASE}/my/endpoint`, {
        param1: 100,
        param2: 0.05,
      });
      setData(res.data);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.detail ?? err.message
        : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4">My Component</h2>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
      >
        {loading ? 'Loading…' : 'Calculate'}
      </button>

      {error && <p className="text-red-400 mt-2">{error}</p>}

      {data && (
        <div className="mt-4 text-slate-300">
          <p>Result: <span className="text-white font-bold">{data.result}</span></p>
        </div>
      )}
    </div>
  );
};
```

### 2. Add TypeScript interface to shared types (if reused)

```ts
// src/types/index.ts
export interface MyResponse {
  result: number;
  model: string;
}
```

### 3. Register in the parent page

If adding to the **Transact** tab, add an entry to the `tabs` array in
`src/components/Transact/TransactPage.tsx`.

If adding a standalone page, add a `<Route>` in `src/App.tsx`.

### 4. Export from index (optional)

```ts
// src/components/index.ts
export { MyComponent } from './MySection/MyComponent';
```

### 5. Write a test

```tsx
// src/components/__tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MySection/MyComponent';

test('renders heading', () => {
  render(<MyComponent />);
  expect(screen.getByText('My Component')).toBeInTheDocument();
});
```

## Styling Quick Reference

```
Card wrapper:      bg-slate-800 rounded-xl p-6
Heading:           text-xl font-semibold text-white mb-4
Sub-text:          text-slate-400 text-sm
Input:             bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white w-full
Primary button:    px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg
Error text:        text-red-400 mt-2
Success/Value:     text-green-400 font-bold
Table header:      text-slate-400 text-xs uppercase tracking-wide
Table row:         border-t border-slate-700 py-2
```
