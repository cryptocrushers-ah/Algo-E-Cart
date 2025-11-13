'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useWallet } from '@/lib/wallet/WalletContext'; // Your custom hook

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Search, Filter } from 'lucide-react';

// Define a clear type for the order data
interface EscrowOrder {
  id: number;
  product_name: string;
  product_description: string;
  amount: number;
  seller: string;
  status: 'INIT' | 'FUNDED' | 'RELEASED' | 'CANCELLED';
}

export default function MarketplacePage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  
  // ✅ Correctly get wallet state
  const { accountAddress } = useWallet();
  const isConnected = !!accountAddress; 

  const [orders, setOrders] = useState<EscrowOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('INIT'); // Default to "Available"

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/escrow/status`);
      if (!res.ok) throw new Error('Failed to fetch marketplace orders');
      
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading marketplace data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product_description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const formatAddress = (addr: string) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'N/A');
  const formatPrice = (microAlgos: number) => (microAlgos / 1_000_000).toFixed(2);
  
  // Renders skeleton cards
  const renderSkeletons = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
          <CardContent><Skeleton className="h-4 w-1/2" /></CardContent>
          <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">🛒 Marketplace</h1>
          <p className="text-muted-foreground mt-2">
            Browse secure escrow listings on the Algorand network.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="INIT">✅ Available</SelectItem>
              <SelectItem value="FUNDED">🔒 Funded</SelectItem>
              <SelectItem value="RELEASED">💸 Released</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Listings Grid */}
        {loading ? (
          renderSkeletons()
        ) : filteredOrders.length === 0 ? (
          <Card><CardContent className="py-16 text-center"><p>No items found.</p></CardContent></Card>
        ) : (
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <motion.div key={order.id} layout variants={cardVariants} initial="hidden" animate="visible" exit="exit">
                  <Card className="shadow-md hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-xl break-words line-clamp-2">{order.product_name}</CardTitle>
                        <Badge variant={order.status === 'INIT' ? 'default' : 'secondary'}>{order.status}</Badge>
                      </div>
                      <CardDescription className="pt-1 line-clamp-3">{order.product_description}</CardDescription>
                    </CardHeader>

                    <CardContent className="flex-grow space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-muted-foreground">Price</span>
                        <span className="font-bold text-lg text-primary">{formatPrice(order.amount)} ALGO</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="font-semibold text-muted-foreground">Seller</span>
                         <span className="font-mono">{formatAddress(order.seller)}</span>
                      </div>
                    </CardContent>
                    
                    {/* This button will now work correctly */}
                    <CardFooter>
                      {order.status === 'INIT' && (
                        isConnected ? (
                          <Button asChild className="w-full">
                            <Link href={`/buy/${order.id}`}>🛍️ Buy Now</Link>
                          </Button>
                        ) : (
                          <Button className="w-full" disabled>
                            Connect Wallet to Buy
                          </Button>
                        )
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </main>
  );
}