from pyteal import *

def approval_program():
    # keys
    KEY_SELLER = Bytes("s")
    KEY_AMOUNT = Bytes("a")
    KEY_FUNDED = Bytes("f")  # 0 or 1

    # on create: expect [seller_addr (bytes), amount (uint64)]
    on_create = Seq(
        Assert(Txn.application_args.length() == Int(2)),
        App.globalPut(KEY_SELLER, Txn.application_args[0]),
        App.globalPut(KEY_AMOUNT, Btoi(Txn.application_args[1])),
        App.globalPut(KEY_FUNDED, Int(0)),
        Approve()
    )

    # fund: grouped transaction where Gtxn[0] is payment to contract address
    on_fund = Seq(
        Assert(
            And(
                Gtxn[0].type_enum() == TxnType.Payment,
                Gtxn[0].receiver() == Global.current_application_address(),
                Gtxn[0].amount() == App.globalGet(KEY_AMOUNT),
                Gtxn[0].sender() == Txn.sender(),
                App.globalGet(KEY_FUNDED) == Int(0)
            )
        ),
        App.globalPut(KEY_FUNDED, Int(1)),
        Approve()
    )

    # release: only creator can call, contract must be funded; contract does inner txn to pay seller
    on_release = Seq(
        Assert(Txn.sender() == Global.creator_address()),
        Assert(App.globalGet(KEY_FUNDED) == Int(1)),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: App.globalGet(KEY_SELLER),
            TxnField.amount: App.globalGet(KEY_AMOUNT),
            TxnField.fee: Int(0)
        }),
        InnerTxnBuilder.Submit(),
        App.globalPut(KEY_FUNDED, Int(0)),  # optionally reset
        Approve()
    )

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.DeleteApplication, Reject()],
        [Txn.on_completion() == OnComplete.UpdateApplication, Reject()],
        [Txn.on_completion() == OnComplete.CloseOut, Reject()],
        [Txn.on_completion() == OnComplete.OptIn, Reject()],
        [Txn.application_args[0] == Bytes("fund"), on_fund],
        [Txn.application_args[0] == Bytes("release"), on_release],
    )
    return program

def clear_state_program():
    return Approve()
