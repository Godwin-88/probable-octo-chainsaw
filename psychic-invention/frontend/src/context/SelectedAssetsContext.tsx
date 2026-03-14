import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getAssetTypes, searchAssets } from '@/utils/api';

export type AssetType =
  | 'all'
  | 'tokens'
  | 'cryptocurrency'
  | 'pools'
  | 'lp'
  | 'staking'
  | 'lending'
  | 'vaults'
  | 'equity'
  | 'etf'
  | 'index'
  | 'currency'
  | 'future'
  | 'mutualfund';

export interface SelectedAsset {
  symbol: string;
  type: AssetType;
  name?: string;
}

/** Web3-centric asset types for chain-based analysis (user or autonomous agent). */
const WEB3_FALLBACK_ASSET_TYPES: { id: AssetType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'cryptocurrency', label: 'Crypto' },
  { id: 'pools', label: 'Pools' },
  { id: 'lp', label: 'LP' },
  { id: 'staking', label: 'Staking' },
  { id: 'lending', label: 'Lending' },
  { id: 'vaults', label: 'Vaults' },
  { id: 'equity', label: 'Equity' },
  { id: 'etf', label: 'ETFs' },
  { id: 'index', label: 'Indices' },
  { id: 'currency', label: 'Forex' },
  { id: 'future', label: 'Commodities' },
  { id: 'mutualfund', label: 'Mutual Funds' },
];

const FALLBACK_ASSET_TYPES = WEB3_FALLBACK_ASSET_TYPES;

const MAX_SELECTED = 5;

interface SelectedAssetsContextValue {
  selectedAssetType: AssetType;
  setSelectedAssetType: (t: AssetType) => void;
  selectedAssets: SelectedAsset[];
  addAsset: (asset: SelectedAsset) => boolean;
  removeAsset: (symbol: string) => void;
  clearAssets: () => void;
  searchUniverse: (query: string) => Promise<{ symbol: string; type: AssetType; name: string }[]>;
  assetTypes: { id: AssetType; label: string }[];
  assetTypesLoading: boolean;
  maxSelected: number;
}

const defaultValue: SelectedAssetsContextValue = {
  selectedAssetType: 'all',
  setSelectedAssetType: () => {},
  selectedAssets: [],
  addAsset: () => false,
  removeAsset: () => {},
  clearAssets: () => {},
  searchUniverse: async () => [],
  assetTypes: FALLBACK_ASSET_TYPES,
  assetTypesLoading: false,
  maxSelected: MAX_SELECTED,
};

const Context = createContext<SelectedAssetsContextValue>(defaultValue);

export function SelectedAssetsProvider({ children }: { children: ReactNode }) {
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType>('all');
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([]);
  const [assetTypes, setAssetTypes] = useState<{ id: AssetType; label: string }[]>(FALLBACK_ASSET_TYPES);
  const [assetTypesLoading, setAssetTypesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setAssetTypesLoading(true);
    getAssetTypes()
      .then((types) => {
        if (!cancelled && Array.isArray(types) && types.length > 0) {
          const apiTypes = types as { id: string; label: string }[];
          const web3Ids = new Set(WEB3_FALLBACK_ASSET_TYPES.map((t) => t.id));
          const merged = [...WEB3_FALLBACK_ASSET_TYPES];
          for (const t of apiTypes) {
            if (!web3Ids.has(t.id)) {
              merged.push({ id: t.id as AssetType, label: t.label });
              web3Ids.add(t.id);
            }
          }
          setAssetTypes(merged);
        } else {
          setAssetTypes(FALLBACK_ASSET_TYPES);
        }
      })
      .catch(() => {
        if (!cancelled) setAssetTypes(FALLBACK_ASSET_TYPES);
      })
      .finally(() => {
        if (!cancelled) setAssetTypesLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const addAsset = useCallback((asset: SelectedAsset): boolean => {
    setSelectedAssets((prev) => {
      if (prev.length >= MAX_SELECTED) return prev;
      if (prev.some((a) => a.symbol === asset.symbol)) return prev;
      return [...prev, asset];
    });
    return selectedAssets.length < MAX_SELECTED;
  }, [selectedAssets.length]);

  const removeAsset = useCallback((symbol: string) => {
    setSelectedAssets((prev) => prev.filter((a) => a.symbol !== symbol));
  }, []);

  const clearAssets = useCallback(() => setSelectedAssets([]), []);

  const searchUniverse = useCallback(async (query: string): Promise<{ symbol: string; type: AssetType; name: string }[]> => {
    if (!query.trim()) return [];
    return searchAssets(query, selectedAssetType, 50);
  }, [selectedAssetType]);

  return (
    <Context.Provider
      value={{
        selectedAssetType,
        setSelectedAssetType,
        selectedAssets,
        addAsset,
        removeAsset,
        clearAssets,
        searchUniverse,
        assetTypes,
        assetTypesLoading,
        maxSelected: MAX_SELECTED,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useSelectedAssets() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useSelectedAssets must be used within SelectedAssetsProvider');
  return ctx;
}
