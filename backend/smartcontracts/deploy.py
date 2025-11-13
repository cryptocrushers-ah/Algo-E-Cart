from pyteal import *
from algosdk import transaction, account
from algosdk.v2client import algod
import base64

# =============================================================
# ✅ Smart Contract Logic
# =============================================================
def approval_program():
    """
    Escrow Approval Program — handles admin-controlled release.
    """
    admin = App.globalGet(Bytes("admin"))
    seller = App.globalGet(Bytes("seller"))
    amount = App.globalGet(Bytes("amount"))

    on_create = Seq(
        [
            App.globalPut(Bytes("admin"), Txn.application_args[0]),
            App.globalPut(Bytes("seller"), Txn.application_args[1]),
            App.globalPut(Bytes("amount"), Btoi(Txn.application_args[2])),
            Return(Int(1)),
        ]
    )

    on_release = Seq(
        [
            Assert(Txn.sender() == admin),
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: seller,
                TxnField.amount: amount,
            }),
            InnerTxnBuilder.Submit(),
            Return(Int(1)),
        ]
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.application_id() != Int(0), on_release],
    )
    return program


def clear_program():
    return Return(Int(1))


# =============================================================
# ✅ Helper to Compile PyTeal → TEAL → Binary
# =============================================================
def compile_program(client: algod.AlgodClient, source_code: Expr):
    teal = compileTeal(source_code, mode=Mode.Application, version=7)
    response = client.compile(teal)
    return base64.b64decode(response["result"])


# =============================================================
# ✅ Deploy Function (main entry)
# =============================================================
def deploy_escrow_app(client, creator_private_key, seller_address, amount_micro):
    """
    Deploys the escrow smart contract to Algorand blockchain.
    Returns the new App ID.
    """
    from algosdk.transaction import ApplicationCreateTxn, StateSchema

    creator_address = account.address_from_private_key(creator_private_key)

    approval_prog = compile_program(client, approval_program())
    clear_prog = compile_program(client, clear_program())

    global_schema = StateSchema(num_uints=1, num_byte_slices=2)
    local_schema = StateSchema(num_uints=0, num_byte_slices=0)

    params = client.suggested_params()
    app_args = [
        creator_address.encode(),   # admin
        seller_address.encode(),    # seller
        amount_micro.to_bytes(8, "big")  # amount
    ]

    txn = ApplicationCreateTxn(
        sender=creator_address,
        sp=params,
        on_complete=transaction.OnComplete.NoOpOC.real,
        approval_program=approval_prog,
        clear_program=clear_prog,
        global_schema=global_schema,
        local_schema=local_schema,
        app_args=app_args,
    )

    signed_txn = txn.sign(creator_private_key)
    txid = client.send_transaction(signed_txn)
    transaction.wait_for_confirmation(client, txid, 4)

    pending = client.pending_transaction_info(txid)
    app_id = pending["application-index"]

    print("✅ Deployment successful!")
    print(f"App ID: {app_id}")
    print(f"TxID: {txid}")
    return app_id
