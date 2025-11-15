import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Zap, Lock, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-20">
          <h1 className="text-5xl font-bold tracking-tight">
            Decentralized Escrow Marketplace
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Buy and sell with confidence using Algorand blockchain. 
            Secure multisignature escrow protects both buyers and sellers.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button asChild size="lg">
              <Link href="/marketplace">
                Browse Marketplace
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/create-listing">
                List Your Item
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Secure Escrow</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
              Fully automated escrow using PyTeal smart contracts. On-chain state machine ensures trustless transactions
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Fast Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
              Algorand's 3.7s block time means instant confirmations. No waiting for multiple block confirmations
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Lock className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Low Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
              0.001 ALGO per transaction (~$0.0003). No hidden fees, no intermediaries taking cuts
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Globe className="h-10 w-10 mb-2 text-primary" />
              <CardTitle>Token Support</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Pay with ALGO or ARC-20 tokens. Full Algorand Standard Asset compatibility.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                1
              </div>
              <h3 className="font-semibold">Create Order</h3>
              <p className="text-sm text-muted-foreground">
                Buyer selects item and funds multisig escrow address
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                2
              </div>
              <h3 className="font-semibold">Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Seller ships product and marks as delivered
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                3
              </div>
              <h3 className="font-semibold">Confirm & Release</h3>
              <p className="text-sm text-muted-foreground">
                Buyer confirms receipt, funds automatically released to seller
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}