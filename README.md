🚀 Algo-E-Cart Escrow System

A trustless escrow & payment protection system built on the Algorand-powered Lora network.

📄 Overview

Online marketplaces fail when buyers don’t trust sellers — and sellers don’t trust buyers.
Algo-E-Cart Escrow System solves this by introducing a fully-automated, decentralized escrow layer where funds are locked in a smart contract until both sides complete their part of the deal.

Our system ensures:
The buyer pays into a smart contract, not to a random seller.
The seller ships only after funds are securely locked.
An admin can release funds only with a secret-key login.
All interactions are transparent, verifiable, and permissionless through Lora’s Algorand-compatible environment.
This project integrates a clean Next.js frontend, a secure FastAPI backend, and a deployed Algorand smart contract to create a seamless Web3 commerce workflow.

🧠 Architecture
Our architecture is intentionally simple and robust, focusing on real-world usability:
1. Smart Contract (Lora Network)
A lightweight Algorand application handles:
fund_escrow → Locks buyer funds
release_funds → Releases funds to the seller

Validates actors and protects against unauthorized access
Deployed App ID: 749436186
Lora Explorer Link : https://lora.algokit.io/testnet/application/749436186

2. Backend (FastAPI)
The backend serves as the trusted orchestration layer for admin-controlled actions:
Verifies admin login via secret key → JWT
Provides protected endpoint /escrow/release
Executes contract calls using server-side private key
Stores no user funds or sensitive data
This keeps all administrative actions auditable yet secure.

3. Frontend (Next.js 14 + Tailwind CSS)
A clean, minimal UI designed for buyers and internal admins:
✔ Buyer:
Connects Pera Wallet
Enters purchase details
Funds the escrow in one click
✔ Admin:
Hidden admin login (/admin-login)
Secret-key access only
Can release funds through a secure dashboard
No admin navigation tab is shown in the UI.

4. Wallet Layer – Pera Wallet
The buyer signs real transactions directly using Pera Wallet on the Lora network.
No funds ever touch the backend.

⚙ Setup & Installation
1. Clone the Repository
git clone <your-repo-url>
cd algo-e-cart

2. Backend Setup (FastAPI)
cd backend
pip install -r requirements.txt

Create .env:
ADMIN_SECRET_KEY=your_admin_secret
ADMIN_LOGIN_TOKEN=your_jwt_secret
ALGOD_URL=https://testnet-api.lora.network
APP_OPERATOR_KEY=your_private_key_here

Run backend:
python -m uvicorn main:app --reload

3. Frontend Setup (Next.js)
cd frontend
npm install
npm run dev

Update environment variables in .env.local if needed:

NEXT_PUBLIC_APP_ID=749436186
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000

Open frontend at:

http://localhost:3000

🔗 Contract Deployment (Lora Network)

The escrow contract is deployed to the Lora Testnet with the following identifiers:

Application ID: 749436186 (link mentioned above )

This contract is used for:
Escrow funding
Authorization checks
Admin-controlled release
Buyer protection

🧪 User Flow Summary

🔹 Buyer Flow
1. Connect Pera Wallet
2. Upload order details
3. Fund escrow (smart contract receives funds)
4. Wait for delivery confirmation

🔹 Admin Flow
1. Visit /admin-login
2. Enter secret admin key
3. Admin dashboard opens
4. Release funds to seller with a single click
