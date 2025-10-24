"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import EscrowModal from '@/components/EscrowModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet } from '@/contexts/WalletContext';
import { ShoppingCart, ArrowLeft, User, Calendar, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Listing } from '@/lib/types';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isConnected } = useWallet();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEscrow, setShowEscrow] = useState(false);
  const [algoPrice, setAlgoPrice] = useState<number>(0);

  useEffect(() => {
    if (params.id) {
      fetchListing();
      fetchAlgoPrice();
    }
  }, [params.id]);

  const fetchListing = async () => {
    try {
      const response = await fetch(`/api/listings/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setListing(data);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to fetch listing:', error);
      router.push('/');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const usdValue = algoPrice ? (listing.price * algoPrice).toFixed(2) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="relative h-96 md:h-[600px] w-full overflow-hidden rounded-lg border bg-muted">
            {listing.imageUrl ? (
              <Image
                src={listing.imageUrl}
                alt={listing.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No Image Available
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-2">{listing.category}</Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {listing.title}
              </h1>
              <div className="flex items-baseline space-x-3">
                <div className="text-4xl font-bold text-primary">
                  {listing.price} ALGO
                </div>
                {usdValue && (
                  <div className="text-xl text-muted-foreground">
                    ≈ ${usdValue} USD
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                {listing.description || 'No description provided.'}
              </p>
            </div>

            <Separator />

            {/* Seller Info */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Seller Information</h2>
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={listing.seller?.avatarUrl} />
                  <AvatarFallback>
                    {listing.seller?.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {listing.seller?.username || 'Anonymous'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {listing.seller?.walletAddress?.slice(0, 10)}...
                    {listing.seller?.walletAddress?.slice(-8)}
                  </div>
                </div>
              </div>
              {listing.seller?.bio && (
                <p className="text-sm text-muted-foreground mt-3">
                  {listing.seller.bio}
                </p>
              )}
            </div>

            <Separator />

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Listed {new Date(listing.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>ID: #{listing.id}</span>
              </div>
            </div>

            {/* Purchase Button */}
            <div className="pt-4">
              {listing.status === 'active' ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => setShowEscrow(true)}
                  disabled={!isConnected}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isConnected ? 'Purchase with Escrow' : 'Connect Wallet to Purchase'}
                </Button>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  Item No Longer Available
                </Button>
              )}
              
              {!isConnected && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Connect your Algorand wallet to make a purchase
                </p>
              )}
            </div>

            {/* Security Notice */}
            <div className="bg-muted rounded-lg p-4 text-sm">
              <div className="font-semibold mb-2">🔒 Buyer Protection</div>
              <p className="text-muted-foreground">
                Your payment is held securely in a smart contract escrow until you confirm delivery.
                Disputes can be raised if there are any issues with your order.
              </p>
            </div>
          </div>
        </div>
      </div>

      {listing && (
        <EscrowModal
          listing={listing}
          open={showEscrow}
          onClose={() => {
            setShowEscrow(false);
            // Refresh listing after purchase
            fetchListing();
          }}
        />
      )}
    </div>
  );
}
