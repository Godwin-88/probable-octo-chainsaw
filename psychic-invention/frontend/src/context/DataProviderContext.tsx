/**
 * Data provider selection (yfinance | openbb | nautilus) for asset history, quote, and options.
 * Persisted to localStorage; used by all menus that fetch real market data.
 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type DataProviderId = 'yfinance' | 'openbb' | 'nautilus';

const STORAGE_KEY = 'transact_data_provider';
const DEFAULT_PROVIDER: DataProviderId = 'yfinance';

const VALID_PROVIDERS: { id: DataProviderId; label: string }[] = [
  { id: 'yfinance', label: 'Yahoo Finance' },
  { id: 'openbb', label: 'OpenBB' },
  { id: 'nautilus', label: 'Nautilus' },
];

interface DataProviderContextValue {
  dataProvider: DataProviderId;
  setDataProvider: (p: DataProviderId) => void;
  providerOptions: { id: DataProviderId; label: string }[];
}

const defaultValue: DataProviderContextValue = {
  dataProvider: DEFAULT_PROVIDER,
  setDataProvider: () => {},
  providerOptions: VALID_PROVIDERS,
};

const Context = createContext<DataProviderContextValue>(defaultValue);

function loadStored(): DataProviderId {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s && (s === 'yfinance' || s === 'openbb' || s === 'nautilus')) return s as DataProviderId;
  } catch {
    /* ignore */
  }
  return DEFAULT_PROVIDER;
}

export function DataProviderProvider({ children }: { children: ReactNode }) {
  const [dataProvider, setState] = useState<DataProviderId>(loadStored);

  const setDataProvider = useCallback((p: DataProviderId) => {
    setState(p);
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const stored = loadStored();
    if (stored !== dataProvider) setState(stored);
  }, []);

  return (
    <Context.Provider
      value={{
        dataProvider,
        setDataProvider,
        providerOptions: VALID_PROVIDERS,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useDataProvider() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useDataProvider must be used within DataProviderProvider');
  return ctx;
}
