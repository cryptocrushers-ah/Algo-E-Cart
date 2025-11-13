"use client";

import React, { createContext, useEffect, useState, useContext } from "react";
import { PeraWalletConnect } from "@perawallet/connect";
import { toast } from "sonner";
import algosdk from "algosdk";

// --- Create the clients ONCE ---

// ✅ FIX 1: Use the numeric chainId for TestNet
const peraWallet = new PeraWalletConnect({
  chainId: 416002,
  shouldShowSignTxnToast: true,
});

// Use the more stable PeraWallet node
const algodClient = new algosdk.Algodv2(
  '',
  'https://testnet-api.algonode.cloud',
  ''
);

// Define the shape of the context
interface IWalletContext {
  accountAddress: string | null;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  peraWallet: PeraWalletConnect;
  algodClient: algosdk.Algodv2;
}

export const WalletContext = createContext<IWalletContext | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reconnect session
  useEffect(() => {
    const reconnect = async () => {
      try {
        const accounts = await peraWallet.reconnectSession();
        if (accounts.length > 0) {
          setAccountAddress(accounts[0]);
          localStorage.setItem("peraWalletAddress", accounts[0]);
          console.log("🔄 Reconnected wallet:", accounts[0]);
        }
      } catch {
        console.log("No previous session");
      }
    };
    reconnect();
  }, []);

  // Connect wallet
  async function connectWallet() {
    try {
      setIsConnecting(true);
      setError(null);
      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        setAccountAddress(accounts[0]);
        localStorage.setItem("peraWalletAddress", accounts[0]);
      }
    } catch (err: any) {
      const msg = err?.message?.toLowerCase?.() || "";
      if (msg.includes("network")) {
        toast.error("Network Mismatch: Please switch your Pera Wallet to TestNet.");
      } else if (err?.data?.type === "CONNECT_MODAL_CLOSED") {
        console.warn("Modal closed");
      } else {
        toast.error("Wallet connection failed.");
      }
    } finally {
      setIsConnecting(false);
    }
  }

  // Disconnect
  function disconnectWallet() {
    peraWallet.disconnect();
    localStorage.removeItem("peraWalletAddress");
    setAccountAddress(null);
  }

  return (
    <WalletContext.Provider
      value={{
        accountAddress,
        connectWallet,
        disconnectWallet,
        isConnecting,
        error,
        peraWallet,    // Provide the instance
        algodClient,   // Provide the instance
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// Custom hook to use the context
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside a WalletProvider");
  }
  return context;
}