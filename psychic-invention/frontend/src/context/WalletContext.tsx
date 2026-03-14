import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface WalletContextValue {
  address: string | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
    if (!ethereum) {
      console.warn('No injected wallet (e.g. MetaMask) found.');
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts?.[0]) setAddress(accounts[0]);
    } catch (e) {
      console.error('Wallet connect failed:', e);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => setAddress(null), []);

  return (
    <WalletContext.Provider value={{ address, isConnecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) return { address: null, isConnecting: false, connect: async () => {}, disconnect: () => {} };
  return ctx;
}
