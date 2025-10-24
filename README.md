# AlgoMart - Decentralized Marketplace with Secure Escrow

A modern, peer-to-peer marketplace built on the Algorand blockchain featuring secure smart contract escrow protection for all transactions.

## 🚀 Features

- **Algorand Blockchain Integration**: Built on Algorand's fast and secure blockchain
- **Pera Wallet Connect**: Seamless wallet connection for transactions
- **Smart Contract Escrow**: Buyer protection through automated escrow contracts
- **IPFS Storage**: Decentralized image storage via Pinata
- **Real-time Price Feed**: Live ALGO/USD conversion via CoinGecko API
- **Category Filtering**: Browse listings by Electronics, Fashion, Art, Collectibles, and Books
- **User Profiles**: Track your listings, purchases, and sales
- **Dark Mode**: Full dark mode support
- **Responsive Design**: Mobile-first design with Shadcn/UI components

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI
- **Blockchain**: Algorand SDK, Pera Wallet Connect
- **Database**: Turso (LibSQL), Drizzle ORM
- **Storage**: IPFS via Pinata
- **APIs**: CoinGecko price feed

## 📦 Prerequisites

- Node.js 18+ or Bun
- Pera Wallet (browser extension or mobile app)
- Pinata account for IPFS (optional, for image uploads)

## 🔧 Environment Variables

The following environment variables are already configured in `.env`:

```env
# Database (Pre-configured)
TURSO_CONNECTION_URL=libsql://db-7585af78-99c6-402e-ba19-16c307c18794-orchids.aws-us-west-2.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...

# IPFS/Pinata (Optional - for creating listings with images)
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
```

**Note**: Pinata API keys are only required if you want to upload images when creating listings. The app will work without them, but image uploads will fail.

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   # or
   bun dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Connect your wallet:**
   - Install Pera Wallet browser extension or mobile app
   - Click "Connect Wallet" in the header
   - Approve the connection in Pera Wallet

## 📱 Using AlgoMart

### Browsing Listings
- View all active listings on the homepage
- Filter by category (Electronics, Fashion, Art, etc.)
- Search for specific items
- View ALGO and USD prices

### Creating a Listing
1. Connect your Algorand wallet
2. Click "Sell Item" in the navigation
3. Fill in the listing details (title, description, price, category)
4. Optionally upload an image (requires Pinata API keys)
5. Submit to create your listing

### Purchasing an Item
1. Connect your Algorand wallet
2. Browse to a listing and click "View"
3. Click "Purchase with Escrow"
4. Approve the transaction in Pera Wallet
5. Funds are held in escrow until delivery confirmation

### Managing Your Profile
- View "My Listings" (active and sold items)
- Track "Purchases" with transaction status
- Monitor "Sales" from your listings
- View transaction details on Algorand TestNet explorer

## 🔐 Escrow System

AlgoMart uses smart contract escrow to protect buyers:

1. **Initiate**: Escrow account is created when purchase is initiated
2. **Fund**: Buyer sends payment to escrow (held securely)
3. **Deliver**: Seller ships item
4. **Confirm**: Buyer confirms receipt, funds released to seller
5. **Dispute**: Optional dispute resolution if issues arise

## 🗄️ Database Schema

### Users Table
- `id`: Auto-increment primary key
- `walletAddress`: Unique Algorand wallet address
- `username`: Display name
- `bio`: User biography
- `avatarUrl`: Profile picture URL

### Listings Table
- `id`: Auto-increment primary key
- `sellerId`: Reference to user
- `title`: Product title
- `description`: Product description
- `price`: Price in ALGO
- `category`: Product category
- `imageUrl`: Image URL
- `ipfsHash`: IPFS hash of image
- `status`: active, sold, or cancelled

### Trades Table
- `id`: Auto-increment primary key
- `listingId`: Reference to listing
- `buyerId`: Reference to buyer user
- `sellerId`: Reference to seller user
- `amount`: Transaction amount in ALGO
- `escrowAddress`: Smart contract escrow address
- `status`: pending, funded, completed, disputed, or refunded
- `txnId`: Algorand transaction ID

## 🌐 API Endpoints

- `GET /api/listings` - Fetch all listings
- `GET /api/listings/[id]` - Fetch single listing
- `POST /api/listings` - Create new listing
- `PATCH /api/listings/[id]` - Update listing
- `DELETE /api/listings/[id]` - Delete listing
- `GET /api/trades` - Fetch trades
- `POST /api/trades` - Create new trade
- `PATCH /api/trades/[id]` - Update trade status
- `GET /api/users` - Fetch user by wallet address
- `POST /api/users` - Create new user
- `GET /api/price` - Get current ALGO/USD price

## 🎨 UI Components

Built with Shadcn/UI:
- **Header**: Navigation with wallet connect and theme toggle
- **ListingCard**: Product card with image, price, and seller info
- **CategoryFilter**: Filter listings by category
- **EscrowModal**: Purchase flow with escrow status tracking
- **TradeStatusBadge**: Visual trade status indicator
- **ThemeToggle**: Light/dark mode switcher

## 🔗 Useful Links

- [Algorand TestNet Explorer](https://testnet.algoexplorer.io/)
- [Pera Wallet](https://perawallet.app/)
- [Algorand Documentation](https://developer.algorand.org/)
- [IPFS/Pinata](https://www.pinata.cloud/)

## 🧪 Testing

The app comes with seeded sample data:
- 3 sample users with wallet addresses
- 10 sample listings across different categories
- 5 sample trades with various statuses

Connect your wallet to interact with the marketplace and test the full purchase flow on Algorand TestNet.

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🤝 Contributing

This is a demo project showcasing Algorand blockchain integration. Feel free to fork and extend with additional features!

## ⚠️ Important Notes

- This app uses Algorand **TestNet** for development/testing
- Real ALGO tokens are NOT used - only TestNet tokens
- Get TestNet ALGO from the [Algorand Dispenser](https://testnet.algoexplorer.io/dispenser)
- The escrow smart contract is simplified for demo purposes
- For production use, implement proper smart contract auditing and security measures

## 🆘 Support

For issues or questions:
1. Check the browser console for error messages
2. Ensure Pera Wallet is properly installed and connected
3. Verify you have TestNet ALGO in your wallet
4. Make sure you're on the correct network (TestNet, ChainID: 416002)

---

Built with ❤️ using Next.js, Algorand, and Shadcn/UI