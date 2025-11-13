'use client';

import { useState } from 'react';
import { useWallet } from '@/lib/wallet/WalletContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation'; // ✅ 1. Import the router

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function CreateListingPage() {
  const { accountAddress, connectWallet } = useWallet();
  const isConnected = !!accountAddress;
  const router = useRouter(); // ✅ 2. Initialize the router

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isConnected || !accountAddress) {
      toast.error('Please connect your wallet before listing a product.');
      await connectWallet();
      setIsLoading(false);
      return;
    }

    if (!form.name || !form.description || !form.price) {
      toast.error('Please fill out all required fields.');
      setIsLoading(false);
      return;
    }

    const payload = {
      product_name: form.name,
      product_description: form.description,
      image_url: form.image || null, // Send null if empty
      seller: accountAddress,
      amount: parseFloat(form.price) * 1_000_000, // Convert ALGO to microALGO
    };

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${API_URL}/api/escrow/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to create listing');

      // ✅ 3. THIS IS YOUR SUCCESS POP-UP AND REDIRECT
      toast.success('Product listed successfully!');
      router.push('/marketplace'); // Redirect to the marketplace
      
      // We don't need to reset the form since we are navigating away
      // setForm({ name: '', description: '', price: '', image: '' }); 

    } catch (err: any) {
      toast.error(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Listing</CardTitle>
          <CardDescription>
            Fill out the details below to list your item on the marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="text-center">
              <p className="mb-4 text-muted-foreground">
                You must connect your wallet to list an item.
              </p>
              <Button onClick={connectWallet}>
                Connect Wallet
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Smart Watch"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Product Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe your product..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Price (in ALGO)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="e.g., 25.50"
                  step="0.01"
                  min="0.1" // Set a minimum price
                  required
                />
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.png (optional)"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Listing
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}