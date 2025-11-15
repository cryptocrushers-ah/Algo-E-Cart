from algosdk import transaction, account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import AssetConfigTxn
from datetime import datetime

def create_asa(algod_client, creator_sk, total, decimals, unit_name, asset_name, url=""):
    creator_addr = account.address_from_private_key(creator_sk)
    params = algod_client.suggested_params()

    txn = AssetConfigTxn(
        sender=creator_addr,
        sp=params,
        total=total,
        default_frozen=False,
        unit_name=unit_name,
        asset_name=asset_name,
        manager=creator_addr,
        reserve=creator_addr,
        freeze=creator_addr,
        clawback=creator_addr,
        url=url,
        decimals=decimals,
    )

    signed = txn.sign(creator_sk)
    txid = algod_client.send_transaction(signed)
    transaction.wait_for_confirmation(algod_client, txid, 4)
    # fetch tx info for asset id
    ptx = algod_client.pending_transaction_info(txid)
    created_asset_id = ptx["asset-index"]
    return created_asset_id
