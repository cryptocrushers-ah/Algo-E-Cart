"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';
import algosdk from 'algosdk';

interface WalletContextType {
  wallet: PeraWalletConnect | null;
  accountAddress: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signTransactions: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<PeraWalletConnect | null>(null);
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const peraWallet = new PeraWalletConnect({
      chainId: 416002, // TestNet
    });
    setWallet(peraWallet);

    // Reconnect to session if exists
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length > 0) {
        setAccountAddress(accounts[0]);
        setIsConnected(true);
      }
    }).catch(console.error);

    // Handle disconnect
    peraWallet.connector?.on('disconnect', () => {
      setAccountAddress(null);
      setIsConnected(false);
    });
  }, []);

  const connectWallet = async () => {
    if (!wallet) return;

    try {
      const accounts = await wallet.connect();
      setAccountAddress(accounts[0]);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    if (wallet) {
      wallet.disconnect();
      setAccountAddress(null);
      setIsConnected(false);
    }
  };

  const signTransactions = async (txns: algosdk.Transaction[]): Promise<Uint8Array[]> => {
    if (!wallet || !accountAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const txnsToSign = txns.map((txn) => ({
        txn: Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64'),
      }));

      const signedTxns = await wallet.signTransaction([txnsToSign]);
      return signedTxns;
    } catch (error) {
      console.error('Failed to sign transactions:', error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        accountAddress,
        isConnected,
        connectWallet,
        disconnectWallet,
        signTransactions,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
