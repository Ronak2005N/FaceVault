import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  isMetaMaskInstalled,
  connectWallet,
  getBalance,
  getChainId,
  switchToAmoy,
  listenToAccounts,
  listenToChain,
  removeListeners,
  isConnectedToAmoy,
} from "@/lib/blockchain/metamask";
import { POLYGON_AMOY } from "@/lib/blockchain/contracts";
import type { WalletState } from "@/lib/blockchain/types";

interface WalletContextType extends WalletState {
  isMetaMaskInstalled: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  shortenAddress: (addr: string) => string;
  refreshBalance: () => Promise<void>;
  isConnecting: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    address: "",
    chainId: 0,
    balance: "0",
    isConnected: false,
    isAmoy: false,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shortenAddress = (addr: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  const refreshBalance = useCallback(async () => {
    if (wallet.address) {
      const bal = await getBalance(wallet.address);
      setWallet((prev) => ({ ...prev, balance: bal }));
    }
  }, [wallet.address]);

  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError("Please install MetaMask to continue.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Revoke permissions first so MetaMask shows the approval popup
      try {
        await window.ethereum!.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
      } catch {
        // Ignore — older MetaMask versions may not support this
      }

      const address = await connectWallet();
      const chainId = await getChainId();
      const balance = await getBalance(address);
      const isAmoy = chainId === POLYGON_AMOY.chainId;

      setWallet({ address, chainId, balance, isConnected: true, isAmoy });

      if (!isAmoy) {
        setError("Wrong network. Please switch to Polygon Amoy.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const switchNetwork = useCallback(async () => {
    try {
      await switchToAmoy();
      const chainId = await getChainId();
      setWallet((prev) => ({ ...prev, chainId, isAmoy: chainId === POLYGON_AMOY.chainId }));
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to switch network";
      setError(message);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ address: "", chainId: 0, balance: "0", isConnected: false, isAmoy: false });
    setError(null);
  }, []);

  useEffect(() => {
    listenToAccounts((accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected from MetaMask extension
        setWallet({ address: "", chainId: 0, balance: "0", isConnected: false, isAmoy: false });
      }
      // Do NOT auto-connect on account change — user must click Connect
    });

    listenToChain(() => {
      // Re-check connection status on chain change if already connected
      setWallet((prev) => {
        if (prev.isConnected) {
          getChainId().then((chainId) => {
            setWallet((p) => ({ ...p, chainId, isAmoy: chainId === POLYGON_AMOY.chainId }));
          });
        }
        return prev;
      });
    });

    return () => {
      removeListeners();
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        ...wallet,
        isMetaMaskInstalled: isMetaMaskInstalled(),
        connect,
        disconnect,
        switchNetwork,
        shortenAddress,
        refreshBalance,
        isConnecting,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
