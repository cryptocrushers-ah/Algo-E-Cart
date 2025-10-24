"use client";

import { useState, useEffect } from "react";
import { PeraWalletConnect } from "@perawallet/connect";
import QRCode from "qrcode.react";

// Initialize PeraWallet connection once globally
const peraWallet = new PeraWalletConnect();

export default function WalletConnectQR() {
  const [account, setAccount] = useState<string | null>(null);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);

  useEffect(() => {
    // Try to reconnect existing session if available
    peraWallet
      .reconnectSession()
      .then((accounts) => {
        if (accounts.length) setAccount(accounts[0]);
      })
      .catch((error) => console.error("Reconnect error:", error));

    // Listen for disconnection
    peraWallet.connector?.on("disconnect", () => setAccount(null));

    // Create QR session for mobile wallet
    const connector = peraWallet.connector as any; // Type workaround
    connector
      ?.createSession()
      .then(({ uri }: any) => {
        setConnectUrl(uri);
      })
      .catch((err: any) => console.error("Session error:", err));
  }, []);

  // If already connected
  if (account) {
    return (
      <div className="text-center">
        <p className="text-green-600 font-medium">
          ✅ Connected: <span className="font-mono">{account}</span>
        </p>
      </div>
    );
  }

  // Default UI — waiting for user to connect
  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-xl shadow-md bg-card text-card-foreground">
      <h3 className="text-lg font-semibold">Connect with Pera Wallet</h3>
      {connectUrl ? (
        <>
          <QRCode value={connectUrl} size={200} includeMargin />
          <p className="text-xs text-muted-foreground">
            Scan this QR with your Pera Wallet app
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground animate-pulse">
          Generating QR...
        </p>
      )}
    </div>
  );
}
