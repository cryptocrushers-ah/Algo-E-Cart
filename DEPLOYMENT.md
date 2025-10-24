# 🚀 AlgoMart - Complete Deployment Guide

## Overview
AlgoMart is a fully functional decentralized marketplace with secure escrow functionality powered by Algorand blockchain. This guide will help you deploy and run the application.

## ✨ Features Implemented

### 🛍️ Marketplace Features
- **Browse & Search** - Filter by category, search by keywords
- **Product Listings** - Rich product cards with images, prices, and seller info
- **Real-time Pricing** - Live ALGO to USD conversion via CoinGecko API
- **Category Filters** - Electronics, Fashion, Art, Collectibles, Books

### 💰 Buying Features
- **Secure Checkout** - Smart contract escrow protection
- **Order Tracking** - Monitor purchase status in real-time
- **Transaction History** - View all purchases in your profile
- **Buyer Protection** - Funds held securely until delivery confirmed

### 📦 Selling Features
- **Easy Listing Creation** - Simple form with IPFS image upload
- **Inventory Management** - Track active and sold listings
- **Sales Dashboard** - View all sales and transaction details
- **Seller Profile** - Public profile with reputation tracking

### 🔐 Security & Web3
- **Wallet Integration** - Pera Wallet connection via WalletConnect
- **Blockchain Escrow** - Smart contract fund protection
- **IPFS Storage** - Decentralized image hosting via Pinata
- **Transaction Verification** - View on AlgoExplorer

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/UI
- **Database**: Turso (SQLite), Drizzle ORM
- **Blockchain**: Algorand (Testnet), Pera Wallet
- **Storage**: IPFS (Pinata)
- **APIs**: CoinGecko for price feeds

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/bun
- Algorand Pera Wallet (mobile app or browser extension)
- Pinata account for IPFS (already configured)
- Turso database (already configured)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
# or
yarn install
# or
bun install
```

### 2. Environment Variables
The `.env` file is already configured with:
- ✅ Algorand Testnet API endpoints
- ✅ IPFS/Pinata API key
- ✅ Turso database connection
- ✅ CoinGecko API endpoint

### 3. Database Setup
Database is already set up with sample data including:
- 10 sample listings across all categories
- 3 sample users (sellers)
- Sample transactions

To reset the database:
```bash
npm run db:push
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
# or
yarn dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 User Guide

### For Buyers
1. **Browse Marketplace**
   - Visit homepage to see all active listings
   - Use search bar to find specific items
   - Filter by category (Electronics, Fashion, etc.)

2. **Connect Wallet**
   - Click "Connect Wallet" in header
   - Approve connection in Pera Wallet
   - Your wallet address will appear in header

3. **Purchase Item**
   - Click on any listing to view details
   - Click "Purchase with Escrow" button
   - Approve transaction in Pera Wallet
   - Funds held in escrow until delivery confirmed

4. **Track Orders**
   - Go to Profile → Purchases tab
   - View order status and transaction details
   - Click "View Tx" to see blockchain transaction

### For Sellers
1. **Connect Wallet** (same as buyers)

2. **Create Listing**
   - Click "Sell Item" in navigation
   - Upload product image (stored on IPFS)
   - Fill in title, description, price, category
   - Click "Create Listing"

3. **Manage Listings**
   - Go to Profile → My Listings tab
   - View active and sold items
   - Track inventory and sales

4. **View Sales**
   - Go to Profile → Sales tab
   - See all completed sales
   - View transaction confirmations

## 🎨 Design Features

### Compelling Tagline
**"Buy, Sell, Trust - Protected Every Step"**
- Emphasizes the marketplace's core value proposition
- Highlights security through blockchain escrow
- Positions AlgoMart as the trustworthy marketplace choice

### UI/UX Highlights
- 🎯 Clean, modern interface with Shadcn/UI components
- 🌗 Dark/Light mode support
- 📱 Fully responsive design (mobile, tablet, desktop)
- ⚡ Loading states and smooth transitions
- 🔔 Toast notifications for user feedback
- 🎨 Consistent design system with proper spacing and typography

## 🔧 API Endpoints

### Listings
- `GET /api/listings` - Get all listings
- `GET /api/listings/:id` - Get single listing
- `POST /api/listings` - Create new listing
- `PATCH /api/listings/:id` - Update listing

### Trades
- `GET /api/trades` - Get all trades
- `GET /api/trades/:id` - Get single trade
- `POST /api/trades` - Create new trade
- `PATCH /api/trades/:id` - Update trade status

### Users
- `GET /api/users?walletAddress=<address>` - Get user by wallet
- `POST /api/users` - Create new user

### Utilities
- `GET /api/price` - Get current ALGO price in USD

## 🔐 Escrow Flow

1. **Buyer Initiates Purchase**
   - Selects item and clicks "Purchase with Escrow"
   - Trade record created in database

2. **Smart Contract Initialization**
   - Escrow contract deployed on Algorand
   - Escrow address generated and stored

3. **Buyer Funds Escrow**
   - Buyer approves payment in Pera Wallet
   - ALGO transferred to escrow contract
   - Trade status updated to "funded"

4. **Seller Ships Item**
   - Seller notified of sale
   - Ships item to buyer

5. **Buyer Confirms Delivery**
   - Buyer confirms receipt
   - Funds released from escrow to seller
   - Trade status updated to "completed"

6. **Dispute Resolution** (if needed)
   - Either party can raise dispute
   - Admin reviews and resolves
   - Funds distributed accordingly

## 📊 Database Schema

### Users Table
- `id` - Primary key
- `walletAddress` - Algorand wallet address (unique)
- `username` - Display name
- `bio` - User biography
- `avatarUrl` - Profile picture
- `createdAt`, `updatedAt` - Timestamps

### Listings Table
- `id` - Primary key
- `sellerId` - Foreign key to users
- `title` - Product title
- `description` - Product description
- `price` - Price in ALGO
- `category` - Product category
- `imageUrl` - IPFS image URL
- `ipfsHash` - IPFS content hash
- `status` - active | sold | cancelled
- `createdAt`, `updatedAt` - Timestamps

### Trades Table
- `id` - Primary key
- `listingId` - Foreign key to listings
- `buyerId` - Foreign key to users
- `sellerId` - Foreign key to users
- `amount` - Transaction amount
- `escrowAddress` - Blockchain escrow address
- `status` - pending | funded | completed | disputed | refunded
- `txnId` - Algorand transaction ID
- `createdAt`, `updatedAt` - Timestamps

## 🌐 Network Information

### Algorand Testnet
- Network: TestNet (Chain ID: 416002)
- Node: https://mainnet-api.algonode.cloud
- Explorer: https://testnet.algoexplorer.io

### IPFS/Pinata
- API: https://api.pinata.cloud
- Gateway: https://gateway.pinata.cloud

## 🎯 Key Features

### ✅ Complete Buy/Sell Marketplace
- Users can list items for sale
- Buyers can browse and purchase
- Full transaction lifecycle management

### ✅ Blockchain Integration
- Algorand blockchain for transactions
- Smart contract escrow system
- Decentralized storage (IPFS)

### ✅ User Experience
- Wallet connection with Pera Wallet
- Real-time price updates
- Transaction history tracking
- Profile management

### ✅ Security
- Smart contract fund protection
- Wallet-based authentication
- Dispute resolution system
- Transaction verification

## 🚧 Future Enhancements

- Multi-currency support (ASA tokens)
- Rating and review system
- Direct messaging between users
- Advanced search and filters
- Mobile app development
- Mainnet deployment

## 📝 Export Code

Click the "Export Code" button in the header to download the complete source code for local development or deployment to your own infrastructure.

## 🤝 Support

For issues or questions:
1. Check the documentation
2. Review error messages in browser console
3. Verify wallet connection and network settings
4. Ensure proper environment configuration

## 📄 License

This project is provided as-is for educational and commercial use.

---

**Built with ❤️ using Next.js, Algorand, and IPFS**

🎉 **Happy Trading on AlgoMart!**
