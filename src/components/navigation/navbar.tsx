'use client';

import React from 'react';
import Link from 'next/link';
import { useWallet } from '@/lib/wallet/WalletContext'; // Your custom wallet hook
import { Button } from '@/components/ui/button';
import { Loader2, List, ClipboardList, UserCog } from 'lucide-react'; // Icons for nav

export function Navbar() {
  // Get wallet state and functions from your context
  const { 
    accountAddress, 
    connectWallet, 
    disconnectWallet, 
    isConnecting 
  } = useWallet();

  // Create a simple boolean to check connection status
  const isConnected = !!accountAddress;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-6xl items-center px-4">
        
        {/* --- Left Side: Brand and Nav Links (Unchanged) --- */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-lg">Algo-E-Cart</span>
        </Link>
        
        <div className="flex items-center gap-4 text-sm">
          <Link 
            href="/marketplace" 
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Marketplace
          </Link>
          <Link 
            href="/create-listing" 
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <List size={16} /> List Item
          </Link>
          <Link 
            href="/my-orders" 
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ClipboardList size={16} /> My Orders
          </Link>
          <Link 
            href="/admin" 
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <UserCog size={16} /> Admin
          </Link>
        </div>

        {/* --- Right Side: Wallet Button (This is the changed part) --- */}
        <div className="ml-auto">
          {isConnected ? (
            // --- 1. CONNECTED STATE ---
            // Shows a "Disconnect" button with a green "connected" dot
            // NO wallet address is displayed
            <Button variant="outline" onClick={disconnectWallet}>
              {/* This span is the green "connected" dot */}
              <span className="relative mr-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Disconnect
            </Button>
          ) : (
            // --- 2. DISCONNECTED STATE ---
            // Shows the original "Connect Wallet" button
            <Button onClick={connectWallet} disabled={isConnecting}>
              {isConnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}