"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useWallet } from '@/contexts/WalletContext';
import { authClient, useSession } from '@/lib/auth-client';
import { Wallet, ShoppingBag, Plus, User, Menu, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { accountAddress, isConnected, connectWallet, disconnectWallet } = useWallet();
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shortAddress = accountAddress
    ? `${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}`
    : '';

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
      toast.success("Wallet connected successfully!");
    } catch (error) {
      toast.error("Failed to connect wallet");
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = () => {
    disconnectWallet();
    toast.success("Wallet disconnected");
  };

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token");
    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    if (error?.code) {
      toast.error("Failed to sign out");
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      toast.success("Signed out successfully");
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">AlgoMart</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
            Marketplace
          </Link>
          <Link href="/create" className="text-sm font-medium transition-colors hover:text-primary">
            Sell Item
          </Link>
          {mounted && (session?.user || isConnected) && (
            <Link href="/profile" className="text-sm font-medium transition-colors hover:text-primary">
              My Profile
            </Link>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-2">
          <ThemeToggle />
          {mounted && (
            <>
              {/* Wallet Connection */}
              {isConnected ? (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Wallet className="h-4 w-4 mr-2" />
                    {shortAddress}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDisconnectWallet}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              )}
              
              {/* Auth Actions */}
              <div className="flex items-center space-x-2 ml-2 pl-2 border-l">
                {session?.user ? (
                  <>
                    <Link href="/profile">
                      <Button variant="outline" size="sm">
                        <User className="h-4 w-4 mr-2" />
                        {session.user.name || session.user.email}
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline" size="sm">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button size="sm">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center space-x-2 md:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4 mt-8">
                <Link href="/" className="text-lg font-medium">
                  Marketplace
                </Link>
                <Link href="/create" className="text-lg font-medium">
                  Sell Item
                </Link>
                {mounted && (session?.user || isConnected) && (
                  <Link href="/profile" className="text-lg font-medium">
                    My Profile
                  </Link>
                )}
                
                <div className="pt-4 border-t space-y-4">
                  {/* Wallet Section */}
                  {mounted && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-muted-foreground">Wallet</div>
                      {isConnected ? (
                        <>
                          <div className="text-sm">
                            Connected: {shortAddress}
                          </div>
                          <Button variant="outline" className="w-full" onClick={handleDisconnectWallet}>
                            Disconnect Wallet
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={handleConnectWallet}
                          disabled={isConnecting}
                        >
                          <Wallet className="h-4 w-4 mr-2" />
                          {isConnecting ? "Connecting..." : "Connect Wallet"}
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Auth Section */}
                  {mounted && (
                    <div className="space-y-2 pt-4 border-t">
                      <div className="text-sm font-semibold text-muted-foreground">Account</div>
                      {session?.user ? (
                        <>
                          <div className="text-sm text-muted-foreground">
                            {session.user.email}
                          </div>
                          <Button variant="outline" className="w-full" onClick={handleSignOut}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                          </Button>
                        </>
                      ) : (
                        <>
                          <Link href="/login" className="block">
                            <Button variant="outline" className="w-full">
                              Sign In
                            </Button>
                          </Link>
                          <Link href="/register" className="block">
                            <Button className="w-full">
                              Sign Up
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}