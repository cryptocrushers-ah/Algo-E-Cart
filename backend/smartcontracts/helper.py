# backend/smartcontracts/helpers.py
from algosdk import transaction
from algosdk.v2client.algod import AlgodClient
from algosdk import account, mnemonic
from algosdk.transaction import PaymentTxn, ApplicationNoOpTxn, OnComplete, calculate_group_id
from algosdk.transaction import LogicSig, LogicSigAccount

MICRO = 1_000_000

def build_fund_group(algod_client: AlgodClient, buyer_addr: str, buyer_pk: str, app_id: int, amount_micro: int):
    # payment -> app account
    app_address = transaction.logic.get_application_address(app_id)
    params = algod_client.suggested_params()
    ptxn = PaymentTxn(buyer_addr, params, app_address, amount_micro)
    # app call (no extra accounts)
    call_txn = ApplicationNoOpTxn(buyer_addr, params, app_id, app_args=[b"fund"])
    # group them
    gid = calculate_group_id([ptxn, call_txn])
    ptxn.group = gid
    call_txn.group = gid
    # sign
    signed_pay = ptxn.sign(buyer_pk)
    signed_call = call_txn.sign(buyer_pk)
    return [signed_pay, signed_call]

def build_release_tx(algod_client: AlgodClient, admin_addr: str, admin_pk: str, app_id: int):
    params = algod_client.suggested_params()
    call_txn = ApplicationNoOpTxn(admin_addr, params, app_id, app_args=[b"release"])
    signed_call = call_txn.sign(admin_pk)
    return signed_call
