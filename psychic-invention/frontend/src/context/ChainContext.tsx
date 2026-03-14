import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { getV2Chains, type V2Chain } from '@/api/gatewayV2';

export type ChainId = string;

interface ChainContextValue {
  chain: ChainId;
  setChain: (chain: ChainId) => void;
  chains: V2Chain[];
  chainLabels: Record<string, string>;
}

const ChainContext = createContext<ChainContextValue | null>(null);

export function ChainProvider({ children }: { children: ReactNode }) {
  const [chains, setChains] = useState<V2Chain[]>([]);
  const [chain, setChain] = useState<ChainId>('ethereum');

  useEffect(() => {
    let mounted = true;
    getV2Chains()
      .then((r) => {
        if (!mounted) return;
        const list = Array.isArray(r.chains) ? r.chains : [];
        setChains(list);
        // If current chain isn't in returned list, pick the first configured chain or first entry.
        if (list.length && !list.some((c) => c.id === chain)) {
          const preferred = list.find((c) => c.configured) ?? list[0];
          setChain(preferred?.id ?? 'ethereum');
        }
      })
      .catch(() => {
        // If gateway is down, keep default chain and empty list (UI falls back gracefully).
      });
    return () => {
      mounted = false;
    };
  }, [chain]);

  const setChainStable = useCallback((c: ChainId) => setChain(c), []);

  const chainLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const c of chains) labels[c.id] = c.name ?? c.id;
    // Fallbacks (in case gateway is unavailable)
    labels.ethereum ??= 'Ethereum';
    labels.solana ??= 'Solana';
    labels.ton ??= 'TON';
    labels.tron ??= 'TRON';
    return labels;
  }, [chains]);

  const value = useMemo(
    () => ({ chain, setChain: setChainStable, chains, chainLabels }),
    [chain, setChainStable, chains, chainLabels]
  );

  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>;
}

export function useChain() {
  const ctx = useContext(ChainContext);
  if (!ctx) {
    return {
      chain: 'ethereum' as ChainId,
      setChain: () => {},
      chains: [] as V2Chain[],
      chainLabels: { ethereum: 'Ethereum' } as Record<string, string>,
    };
  }
  return ctx;
}
