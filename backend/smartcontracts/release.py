import os
from algosdk import transaction, account, mnemonic
from algosdk.v2client import algod
from algosdk.logic import get_application_address

def release_escrow_funds(algod_client: algod.AlgodClient, app_id: int, seller_address: str):
    params = algod_client.suggested_params()
    # admin/creator must call app; creator set in deploy_escrow_app
    # Build app call: send ['release'] and include seller in accounts
    from_addr = account.address_from_private_key(mnemonic.to_private_key(os.getenv("ADMIN_MNEMONIC")))
    tx = transaction.ApplicationNoOpTxn(
        sender=from_addr,
        index=app_id,
        on_complete=transaction.OnComplete.NoOpOC,
        app_args=[b"release"],
        accounts=[seller_address],
        sp=params
    )
    signed = tx.sign(mnemonic.to_private_key(os.getenv("ADMIN_MNEMONIC")))
    txid = algod_client.send_transaction(signed)
    transaction.wait_for_confirmation(algod_client, txid, 4)
    return txid
