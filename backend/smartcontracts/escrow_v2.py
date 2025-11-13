# backend/smartcontracts/escrow_v2.py
from pyteal import *

# Globals keys
KEY_ADMIN = Bytes("admin")
KEY_SELLER = Bytes("seller")
KEY_AMOUNT = Bytes("amount")     # uint = microAlgos expected
KEY_BUYER = Bytes("buyer")
KEY_STATUS = Bytes("status")     # 0 = INIT,1=FUNDED,2=DELIVERED,3=COMPLETED

# status constants
STATUS_INIT = Int(0)
STATUS_FUNDED = Int(1)
STATUS_DELIVERED = Int(2)
STATUS_COMPLETED = Int(3)

def approval_program():
    @Subroutine(TealType.none)
    def do_inner_payment(receiver: Expr, amt: Expr):
        # build and submit an inner payment from the app account to receiver
        return Seq(
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: receiver,
                TxnField.amount: amt,
                TxnField.fee: Int(0)  # fee pooling assumed; caller pays fee (outer txn)
            }),
            InnerTxnBuilder.Submit()
        )

    # on_create: args: [ admin_addr, seller_addr, amount_uint_bytes ]
    on_create = Seq(
        Assert(Txn.application_args.length() == Int(3)),
        App.globalPut(KEY_ADMIN, Txn.application_args[0]),
        App.globalPut(KEY_SELLER, Txn.application_args[1]),
        App.globalPut(KEY_AMOUNT, Btoi(Txn.application_args[2])),
        App.globalPut(KEY_STATUS, STATUS_INIT),
        Approve()
    )

    # Helper: only admin
    is_admin = Txn.sender() == App.globalGet(KEY_ADMIN)
    is_seller = Txn.sender() == App.globalGet(KEY_SELLER)
    is_buyer = Txn.sender() == App.globalGet(KEY_BUYER)

    # fund: expects to be called as second txn in a group, where first txn is Payment into the application's address
    # Group structure: Gtxn[0] => Payment (from buyer to current application address)
    #                 Gtxn[1] => ApplicationCall with arg "fund"
    fund_handler = Seq(
        # ensure grouped txns
        Assert(Global.group_size() >= Int(2)),
        # payment should be the first transaction in the group
        Assert(Gtxn[0].type_enum() == TxnType.Payment),
        # payment receiver must be this application address
        Assert(Gtxn[0].receiver() == Global.current_application_address()),
        # amount must equal required amount
        Assert(Gtxn[0].amount() == App.globalGet(KEY_AMOUNT)),
        # store buyer address
        App.globalPut(KEY_BUYER, Gtxn[0].sender()),
        App.globalPut(KEY_STATUS, STATUS_FUNDED),
        Approve()
    )

    # deliver: only seller can call and only from FUNDED
    deliver_handler = Seq(
        Assert(is_seller),
        Assert(App.globalGet(KEY_STATUS) == STATUS_FUNDED),
        App.globalPut(KEY_STATUS, STATUS_DELIVERED),
        Approve()
    )

    # confirm: buyer confirms and app pays seller via inner tx
    confirm_handler = Seq(
        Assert(Txn.sender() == App.globalGet(KEY_BUYER)),
        Assert(App.globalGet(KEY_STATUS) == STATUS_DELIVERED),
        # inner pay to seller
        do_inner_payment(App.globalGet(KEY_SELLER), App.globalGet(KEY_AMOUNT)),
        App.globalPut(KEY_STATUS, STATUS_COMPLETED),
        Approve()
    )

    # admin release: admin can release to seller from any status (funded/delivered)
    release_handler = Seq(
        Assert(is_admin),
        # require that app holds at least amount (optional, but we'll try)
        # Perform inner payment
        do_inner_payment(App.globalGet(KEY_SELLER), App.globalGet(KEY_AMOUNT)),
        App.globalPut(KEY_STATUS, STATUS_COMPLETED),
        Approve()
    )

    # opt-in, closeout, update, delete
    # allow admin to delete (if desired)
    on_delete = Seq(
        Assert(is_admin),
        Approve()
    )

    # handle NoOp calls with method names in first arg
    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.DeleteApplication, on_delete],  # only admin allowed
        # NoOp handlers: method dispatch by first string arg
        [Txn.on_completion() == OnComplete.NoOp, 
            Cond(
                [Txn.application_args[0] == Bytes("fund"), fund_handler],
                [Txn.application_args[0] == Bytes("deliver"), deliver_handler],
                [Txn.application_args[0] == Bytes("confirm"), confirm_handler],
                [Txn.application_args[0] == Bytes("release"), release_handler],
            )
        ],
    )

    return program

def clear_program():
    return Approve()
