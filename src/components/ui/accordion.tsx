"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ListingCard from '@/components/ListingCard';
import CategoryFilter from '@/components/CategoryFilter';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ShoppingBag, Shield, Zap, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { Listing, Category } from '@/lib/types';
import Link from 'next/link';
import { useWallet } from '@/contexts/WalletContext';

export default function Home() {
  const { isConnected } = useWallet();
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [algoPrice, setAlgoPrice] = useState<number>(0);

  useEffect(() => {
    fetchListings();
    fetchAlgoPrice();
  }, []);

  useEffect(() => {
    filterListings();
  }, [selectedCategory, searchQuery, listings]);

  const fetchListings = async () => {
    try {
      const response = await fetch('/api/listings?status=active');
      if (response.ok) {
        const data = await response.json();
        setListings(data);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlgoPrice = async () => {
    try {
      const response = await fetch('/api/price');
      if (response.ok) {
        const data = await response.json();
        setAlgoPrice(data.algo_usd);
      }
    } catch (error) {
      console.error('Failed to fetch ALGO price:', error);
    }
  };

  const filterListings = () => {
    let filtered = listings;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(l => l.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(l =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredListings(filtered);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-block mb-4">
              <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                🚀 Blockchain-Powered Marketplace
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Buy, Sell, Trust
              <span className="block text-primary mt-2">Protected Every Step</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The only marketplace where your money stays safe in escrow until you're 100% satisfied. Powered by Algorand blockchain.
            </p>
            
            <div className="flex flex-wrap justify-center gap-8 pt-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Secure Escrow</div>
                  <div className="text-sm text-muted-foreground">Smart contract protection</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Instant Transactions</div>
                  <div className="text-sm text-muted-foreground">Lightning-fast Algorand</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Zero Middleman</div>
                  <div className="text-sm text-muted-foreground">Keep more of your money</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Section */}
      <section className="container px-4 py-12 flex-1">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filter */}
        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No listings found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                usdPrice={algoPrice}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="border-t bg-gradient-to-b from-background to-muted/50">
        <div className="container px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Ready to Start Selling?
            </h2>
            <p className="text-xl text-muted-foreground">
              List your items in minutes and reach buyers worldwide with secure blockchain transactions
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              {isConnected ? (
                <Link href="/create">
                  <Button size="lg" className="gap-2">
                    <Plus className="h-5 w-5" />
                    Create Your First Listing
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="gap-2" disabled>
                  Connect Wallet to Start Selling
                </Button>
              )}
              <Link href="/">
                <Button size="lg" variant="outline" className="gap-2">
                  Browse Marketplace
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}