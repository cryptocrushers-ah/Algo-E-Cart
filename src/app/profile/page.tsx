"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ListingCard from '@/components/ListingCard';
import TradeStatusBadge from '@/components/TradeStatusBadge';
import { authClient, useSession } from '@/lib/auth-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '@/contexts/WalletContext';
import { Package, ShoppingCart, User as UserIcon, Calendar, ExternalLink, Loader2, Edit2, Save } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { User, Listing, Trade } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const { accountAddress, isConnected } = useWallet();
  const { data: session, isPending, refetch } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myTrades, setMyTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [algoPrice, setAlgoPrice] = useState<number>(0);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '', address: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      toast.error('Please sign in to view your profile');
      router.push('/login');
    } else if (session?.user) {
      fetchUserData();
      fetchAlgoPrice();
    }
  }, [session, isPending, router]);

  const fetchUserData = async () => {
    if (!session?.user) return;

    try {
      // Fetch or create user based on wallet if connected
      if (accountAddress) {
        let userResponse = await fetch(`/api/users?walletAddress=${accountAddress}`);
        let userData;
        
        if (userResponse.ok) {
          userData = await userResponse.json();
        } else {
          const createUserResponse = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: accountAddress }),
          });
          userData = await createUserResponse.json();
        }
        
        setUser(userData);
        setEditForm({ 
          username: userData.username || '', 
          bio: userData.bio || '',
          address: '' 
        });

        // Fetch user's listings
        const listingsResponse = await fetch('/api/listings');
        if (listingsResponse.ok) {
          const allListings = await listingsResponse.json();
          const userListings = allListings.filter(
            (l: Listing) => l.sellerId === userData.id
          );
          setMyListings(userListings);
        }

        // Fetch user's trades
        const tradesResponse = await fetch(`/api/trades?userId=${userData.id}`);
        if (tradesResponse.ok) {
          const trades = await tradesResponse.json();
          setMyTrades(trades);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast.error('Failed to load profile');
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

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          username: editForm.username,
          bio: editForm.bio,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setEditing(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const activeListings = myListings.filter(l => l.status === 'active');
  const soldListings = myListings.filter(l => l.status === 'sold');
  const purchases = user ? myTrades.filter(t => t.buyerId === user.id) : [];
  const sales = user ? myTrades.filter(t => t.sellerId === user.id) : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={session.user.image || undefined} />
                <AvatarFallback className="text-2xl">
                  {session.user.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                {editing ? (
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Label htmlFor="username">Display Name</Label>
                      <Input
                        id="username"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        placeholder="Your display name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        placeholder="Tell us about yourself"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleSaveProfile} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                      <h1 className="text-3xl font-bold">
                        {user?.username || session.user.name || 'Anonymous User'}
                      </h1>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      <div>{session.user.email}</div>
                      {accountAddress && (
                        <div className="flex items-center justify-center md:justify-start space-x-2 mt-1">
                          <span>Wallet: {accountAddress.slice(0, 10)}...{accountAddress.slice(-8)}</span>
                        </div>
                      )}
                    </div>
                    {user?.bio && (
                      <p className="text-muted-foreground mb-3">{user.bio}</p>
                    )}
                    <div className="flex items-center justify-center md:justify-start space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Member since {new Date(session.user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {!editing && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{myListings.length}</div>
                    <div className="text-sm text-muted-foreground">Listings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{sales.length}</div>
                    <div className="text-sm text-muted-foreground">Sales</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{purchases.length}</div>
                    <div className="text-sm text-muted-foreground">Purchases</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="listings">
              <Package className="h-4 w-4 mr-2" />
              My Listings
            </TabsTrigger>
            <TabsTrigger value="purchases">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Purchases
            </TabsTrigger>
            <TabsTrigger value="sales">
              Sales
            </TabsTrigger>
          </TabsList>

          {/* My Listings */}
          <TabsContent value="listings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">My Listings</h2>
              <Link href="/create">
                <Button>Create New Listing</Button>
              </Link>
            </div>

            {myListings.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start selling by creating your first listing
                  </p>
                  <Link href="/create">
                    <Button>Create Listing</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {activeListings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Active ({activeListings.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {activeListings.map((listing) => (
                        <ListingCard
                          key={listing.id}
                          listing={listing}
                          usdPrice={algoPrice}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {soldListings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Sold ({soldListings.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {soldListings.map((listing) => (
                        <ListingCard
                          key={listing.id}
                          listing={listing}
                          usdPrice={algoPrice}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Purchases */}
          <TabsContent value="purchases">
            <h2 className="text-2xl font-semibold mb-6">My Purchases</h2>
            
            {purchases.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No purchases yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start shopping on the marketplace
                  </p>
                  <Link href="/">
                    <Button>Browse Marketplace</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {purchases.map((trade) => (
                  <Card key={trade.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-16 w-16 bg-muted rounded" />
                          <div>
                            <h3 className="font-semibold">
                              {trade.listing?.title || 'Unknown Item'}
                            </h3>
                            <div className="text-sm text-muted-foreground">
                              Order placed {new Date(trade.createdAt).toLocaleDateString()}
                            </div>
                            <div className="font-semibold mt-1">
                              {trade.amount} ALGO
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <TradeStatusBadge status={trade.status} />
                          {trade.txnId && (
                            <a
                              href={`https://testnet.algoexplorer.io/tx/${trade.txnId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center"
                            >
                              View Tx
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sales */}
          <TabsContent value="sales">
            <h2 className="text-2xl font-semibold mb-6">My Sales</h2>
            
            {sales.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No sales yet</h3>
                  <p className="text-muted-foreground">
                    Sales will appear here when buyers purchase your listings
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sales.map((trade) => (
                  <Card key={trade.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-16 w-16 bg-muted rounded" />
                          <div>
                            <h3 className="font-semibold">
                              {trade.listing?.title || 'Unknown Item'}
                            </h3>
                            <div className="text-sm text-muted-foreground">
                              Sold on {new Date(trade.createdAt).toLocaleDateString()}
                            </div>
                            <div className="font-semibold mt-1">
                              {trade.amount} ALGO
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <TradeStatusBadge status={trade.status} />
                          {trade.txnId && (
                            <a
                              href={`https://testnet.algoexplorer.io/tx/${trade.txnId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center"
                            >
                              View Tx
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}