import os
from algosdk.v2client import algod
from algosdk.transaction import LogicSigAccount

ALGOD_URL = os.getenv("ALGOD_URL", "https://testnet-api.algonode.cloud")
ALGOD_TOKEN = os.getenv("ALGOD_TOKEN", "")
algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_URL)

def get_escrow_lsig(app_id: int):
    """
    Load LogicSig for the given escrow app ID.
    This function must reconstruct or read the escrow logic signature from storage.
    """
    # Example: load TEAL logic from file (modify for your setup)
    with open(f"backend/smartcontracts/escrow_approval.teal", "r") as f:
        teal_source = f.read()

    # Replace with logic from your own contract deployment
    compiled = algod_client.compile(teal_source)
    program = bytes.fromhex(compiled["result"])
    lsig = LogicSigAccount(program)
    return lsig
