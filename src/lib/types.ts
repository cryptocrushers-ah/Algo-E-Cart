export interface User {
  id: number;
  walletAddress: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Listing {
  id: number;
  sellerId: number;
  title: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  ipfsHash?: string;
  status: 'active' | 'sold' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  seller?: User;
}

export interface Trade {
  id: number;
  listingId: number;
  buyerId: number;
  sellerId: number;
  amount: number;
  escrowAddress?: string;
  status: 'pending' | 'funded' | 'completed' | 'disputed' | 'refunded';
  txnId?: string;
  createdAt: string;
  updatedAt: string;
  listing?: Listing;
  buyer?: User;
  seller?: User;
}

export const CATEGORIES = [
  'All',
  'Electronics',
  'Fashion',
  'Art',
  'Collectibles',
  'Books',
] as const;

export type Category = typeof CATEGORIES[number];
