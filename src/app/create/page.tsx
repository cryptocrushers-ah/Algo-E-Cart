"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@/contexts/WalletContext';
import { uploadToIPFS } from '@/lib/ipfs';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORIES } from '@/lib/types';

export default function CreateListingPage() {
  const router = useRouter();
  const { accountAddress, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
  });

  useEffect(() => {
    if (!isConnected) {
      toast.error('Please connect your wallet to create a listing');
      router.push('/');
    }
  }, [isConnected, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !accountAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!formData.title || !formData.price || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Get or create user
      let userResponse = await fetch(`/api/users?walletAddress=${accountAddress}`);
      let user;
      
      if (userResponse.ok) {
        user = await userResponse.json();
      } else {
        const createUserResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: accountAddress }),
        });
        user = await createUserResponse.json();
      }

      let ipfsHash = '';
      let imageUrl = '';

      // Upload image to IPFS if provided
      if (imageFile) {
        toast.info('Uploading image to IPFS...');
        const ipfsResult = await uploadToIPFS(imageFile);
        ipfsHash = ipfsResult.ipfsHash;
        imageUrl = ipfsResult.url;
      }

      // Create listing
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: user.id,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          imageUrl,
          ipfsHash,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create listing');
      }

      const listing = await response.json();
      toast.success('Listing created successfully!');
      router.push(`/listing/${listing.id}`);
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Listing</CardTitle>
            <CardDescription>
              List your item for sale on the AlgoMart marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Product Image</Label>
                <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {imagePreview ? (
                      <div className="relative h-48 w-full">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-full w-full object-cover rounded"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                        <Upload className="h-10 w-10" />
                        <div className="text-sm">Click to upload image</div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., iPhone 14 Pro 256GB"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your item in detail..."
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price (ALGO) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.000001"
                  min="0"
                  placeholder="100"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter(c => c !== 'All').map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating Listing...
                    </>
                  ) : (
                    'Create Listing'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
