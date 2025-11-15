# backend/test_deploy_escrow.py
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from dotenv import load_dotenv
from algosdk.v2client import algod
from algosdk import mnemonic, account, transaction
from backend.smartcontracts.deploy import deploy_escrow_app

# === Load environment variables ===
load_dotenv()

ALGOD_ADDRESS = os.getenv("ALGOD_ADDRESS", "https://testnet-api.algonode.cloud")
ALGOD_TOKEN = os.getenv("ALGOD_TOKEN", "")
ADMIN_MNEMONIC = os.getenv("ADMIN_MNEMONIC")

if not ADMIN_MNEMONIC:
    raise Exception("❌ ADMIN_MNEMONIC not found in .env file!")

# === Setup algod client ===
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
creator_private_key = mnemonic.to_private_key(ADMIN_MNEMONIC)
creator_address = account.address_from_private_key(creator_private_key)

# === Example seller and amount ===
seller_address = "E2V3N2O7F3EBKIQHTJXGOZRQEZZR4DMEWDYWLCOOXP6L7PEMKQDVTX3B3Q"  # can use your test account
amount_micro = 5_000_000  # 5 ALGO

print(f"🧠 Deploying escrow app from admin: {creator_address}")
print(f"Seller: {seller_address}")
print(f"Amount: {amount_micro / 1_000_000} ALGO")

app_id = deploy_escrow_app(algod_client, creator_private_key, seller_address, amount_micro)

print("\n✅ Deployment successful!")
print(f"App ID: {app_id}")
print(f"🔗 View on AlgoExplorer: https://testnet.algoexplorer.io/application/{app_id}")

