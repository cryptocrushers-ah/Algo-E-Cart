import os
import base64
from algosdk.v2client import algod
from algosdk import mnemonic, transaction, account
from algosdk.logic import get_application_address
from algosdk.encoding import decode_address
from pyteal import compileTeal, Mode
from dotenv import load_dotenv

from backend.smartcontracts.escrow_approval import approval_program, clear_state_program

load_dotenv()

ALGOD_ADDRESS = os.getenv("ALGOD_ADDRESS")
ALGOD_TOKEN = os.getenv("ALGOD_TOKEN", "")
CREATOR_MNEMONIC = os.getenv("CREATOR_MNEMONIC")

if not all([ALGOD_ADDRESS, CREATOR_MNEMONIC]):
    raise ValueError("ALGOD_ADDRESS and CREATOR_MNEMONIC must be set in .env")

algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)
creator_private_key = mnemonic.to_private_key(CREATOR_MNEMONIC)
creator_address = account.address_from_private_key(creator_private_key)

def deploy_escrow_app(seller_address: str, amount: int):
    approval_teal = compileTeal(approval_program(), mode=Mode.Application, version=8)
    clear_teal = compileTeal(clear_state_program(), mode=Mode.Application, version=8)

    # compile to base64 -> decode to bytes
    apc = algod_client.compile(approval_teal)
    cpc = algod_client.compile(clear_teal)
    approval_bytes = base64.b64decode(apc["result"])
    clear_bytes = base64.b64decode(cpc["result"])

    global_schema = transaction.StateSchema(num_uints=2, num_byte_slices=1)
    local_schema = transaction.StateSchema(num_uints=0, num_byte_slices=0)

    # app args: seller public key bytes (32) and amount uint64
    seller_pk = decode_address(seller_address)
    app_args = [
        seller_pk,
        (int(amount)).to_bytes(8, "big")
    ]

    params = algod_client.suggested_params()
    create_txn = transaction.ApplicationCreateTxn(
        sender=creator_address,
        sp=params,
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=approval_bytes,
        clear_program=clear_bytes,
        global_schema=global_schema,
        local_schema=local_schema,
        app_args=app_args
    )

    signed = create_txn.sign(creator_private_key)
    tx_id = algod_client.send_transaction(signed)
    confirmed = transaction.wait_for_confirmation(algod_client, tx_id, 4)
    app_id = confirmed["application-index"]
    escrow_address = get_application_address(app_id)

    return {"app_id": app_id, "escrow_address": escrow_address}
