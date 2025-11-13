'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@/lib/wallet/WalletContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Define the Order type
interface Order {
  id: number;
  product_name: string;
  amount: number;
  seller: string;
  buyer: string | null;
  status: 'INIT' | 'FUNDED' | 'RELEASED' | 'CANCELLED';
  tx_id: string | null;
  app_id: number;
  escrow_address: string;
}

export default function MyOrdersPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const { accountAddress, connectWallet } = useWallet();
  const isConnected = !!accountAddress;

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (currentAddress: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/escrow/status`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      
      const data = await res.json();
      const allOrders: Order[] = data.orders || [];

      // Filter to find orders where the user is the seller OR the buyer
      const userOrders = allOrders.filter(
        (order) =>
          order.seller.toLowerCase() === currentAddress.toLowerCase() ||
          (order.buyer && order.buyer.toLowerCase() === currentAddress.toLowerCase())
      );
      
      setMyOrders(userOrders);
    } catch (err: any) {
      toast.error(err.message || 'Error loading your orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && accountAddress) {
      fetchOrders(accountAddress);
    } else {
      setLoading(false); // Not connected, so stop loading
    }
  }, [isConnected, accountAddress]);

  // Helper function to truncate addresses
  const formatAddress = (addr: string | null) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'N/A';
  
  // Helper function to format price
  const formatPrice = (microAlgos: number) => (microAlgos / 1_000_000).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {!isConnected ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              Please connect your wallet to see your orders.
            </p>
            <Button onClick={connectWallet}>Connect Wallet</Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin h-6 w-6 mr-2" />
          Loading your orders...
        </div>
      ) : myOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              You have not created or purchased any orders yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {myOrders.map((order) => {
            // Determine the user's role in this order
            const isSeller = order.seller.toLowerCase() === accountAddress?.toLowerCase();
            const role = isSeller ? "Seller" : "Buyer";

            return (
              <Card key={order.id} className="shadow-md">
                <CardHeader className="flex flex-row justify-between items-start">
                  <CardTitle className="text-xl">{order.product_name}</CardTitle>
                  <Badge
                    variant={
                      order.status === 'FUNDED' ? 'default'
                      : order.status === 'INIT' ? 'secondary'
                      : order.status === 'RELEASED' ? 'outline'
                      : 'destructive'
                    }
                  >
                    {order.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold text-muted-foreground">Your Role</span>
                    <span className={isSeller ? "text-blue-500" : "text-green-500"}>{role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-muted-foreground">Price</span>
                    <span className="font-bold">{formatPrice(order.amount)} ALGO</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-muted-foreground">Seller</span>
                    <span className="font-mono">{formatAddress(order.seller)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-muted-foreground">Buyer</span>
                    <span className="font-mono">{formatAddress(order.buyer)}</span>
                  </div>
                  
                  {/* Show "Fund Now" button if user is the buyer and it's INIT */}
                  {!isSeller && order.status === 'INIT' && (
                    <Button asChild className="w-full pt-2">
                      <Link href={`/buy/${order.id}`}>🛍️ Fund Now</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}