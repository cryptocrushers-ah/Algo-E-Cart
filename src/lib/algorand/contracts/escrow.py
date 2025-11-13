"""
Algorand Escrow Smart Contract
PyTeal implementation for decentralized marketplace escrow
"""

from pyteal import *


def escrow_contract():
    """
    Escrow Smart Contract for Marketplace
    
    Global State:
    - buyer: Address of buyer
    - seller: Address of seller
    - admin: Address of admin/arbiter
    - amount: Escrow amount in microALGOs
    - status: 0=created, 1=funded, 2=delivered, 3=completed, 4=disputed, 5=refunded
    - created_at: Timestamp of creation
    - listing_id: Reference to marketplace listing
    
    Local State: None (all state is global)
    
    Operations:
    - create: Initialize escrow (seller calls)
    - fund: Buyer funds the escrow
    - mark_delivered: Seller marks as delivered
    - confirm_delivery: Buyer confirms and releases funds
    - raise_dispute: Buyer raises dispute
    - resolve_dispute: Admin resolves (refund or release)
    - cancel: Cancel unfunded escrow (seller only)
    """
    
    # Operation selectors
    op_create = Bytes("create")
    op_fund = Bytes("fund")
    op_mark_delivered = Bytes("mark_delivered")
    op_confirm_delivery = Bytes("confirm_delivery")
    op_raise_dispute = Bytes("raise_dispute")
    op_resolve_dispute = Bytes("resolve_dispute")
    op_cancel = Bytes("cancel")
    
    # Global state keys
    key_buyer = Bytes("buyer")
    key_seller = Bytes("seller")
    key_admin = Bytes("admin")
    key_amount = Bytes("amount")
    key_status = Bytes("status")
    key_created_at = Bytes("created_at")
    key_listing_id = Bytes("listing_id")
    
    # Status values
    status_created = Int(0)
    status_funded = Int(1)
    status_delivered = Int(2)
    status_completed = Int(3)
    status_disputed = Int(4)
    status_refunded = Int(5)
    
    # Scratch variables
    scratch_amount = ScratchVar(TealType.uint64)
    scratch_seller = ScratchVar(TealType.bytes)
    
    # Create escrow
    create_escrow = Seq([
        # Verify 4 app args: operation, buyer, admin, listing_id
        Assert(Txn.application_args.length() == Int(4)),
        Assert(Txn.note() != Bytes("")),  # amount in note
        
        # Store global state
        App.globalPut(key_buyer, Txn.application_args[1]),
        App.globalPut(key_seller, Txn.sender()),
        App.globalPut(key_admin, Txn.application_args[2]),
        App.globalPut(key_listing_id, Txn.application_args[3]),
        App.globalPut(key_amount, Btoi(Txn.note())),
        App.globalPut(key_status, status_created),
        App.globalPut(key_created_at, Global.latest_timestamp()),
        
        Approve()
    ])
    
    # Fund escrow - buyer sends payment
    fund_escrow = Seq([
        # Verify caller is buyer
        Assert(Txn.sender() == App.globalGet(key_buyer)),
        
        # Verify status is created
        Assert(App.globalGet(key_status) == status_created),
        
        # Verify grouped transaction with payment
        Assert(Global.group_size() == Int(2)),
        Assert(Gtxn[0].type_enum() == TxnType.Payment),
        Assert(Gtxn[0].sender() == App.globalGet(key_buyer)),
        Assert(Gtxn[0].receiver() == Global.current_application_address()),
        Assert(Gtxn[0].amount() == App.globalGet(key_amount)),
        
        # Update status
        App.globalPut(key_status, status_funded),
        
        Approve()
    ])
    
    # Mark as delivered - seller only
    mark_delivered = Seq([
        # Verify caller is seller
        Assert(Txn.sender() == App.globalGet(key_seller)),
        
        # Verify status is funded
        Assert(App.globalGet(key_status) == status_funded),
        
        # Update status
        App.globalPut(key_status, status_delivered),
        
        Approve()
    ])
    
    # Confirm delivery and release funds - buyer only
    confirm_delivery = Seq([
        # Verify caller is buyer
        Assert(Txn.sender() == App.globalGet(key_buyer)),
        
        # Verify status is delivered
        Assert(App.globalGet(key_status) == status_delivered),
        
        # Store seller address and amount
        scratch_seller.store(App.globalGet(key_seller)),
        scratch_amount.store(App.globalGet(key_amount)),
        
        # Send payment to seller (amount minus min balance)
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: scratch_seller.load(),
            TxnField.amount: scratch_amount.load() - Int(1000),  # Keep 1000 microALGO for fees
            TxnField.fee: Int(1000)
        }),
        InnerTxnBuilder.Submit(),
        
        # Update status
        App.globalPut(key_status, status_completed),
        
        Approve()
    ])
    
    # Raise dispute - buyer only
    raise_dispute = Seq([
        # Verify caller is buyer
        Assert(Txn.sender() == App.globalGet(key_buyer)),
        
        # Verify status is delivered
        Assert(App.globalGet(key_status) == status_delivered),
        
        # Update status
        App.globalPut(key_status, status_disputed),
        
        Approve()
    ])
    
    # Resolve dispute - admin only
    resolve_dispute = Seq([
        # Verify caller is admin
        Assert(Txn.sender() == App.globalGet(key_admin)),
        
        # Verify status is disputed
        Assert(App.globalGet(key_status) == status_disputed),
        
        # Verify resolution arg: "release" or "refund"
        Assert(Txn.application_args.length() == Int(2)),
        
        # Store amount
        scratch_amount.store(App.globalGet(key_amount)),
        
        If(
            Txn.application_args[1] == Bytes("release"),
            # Release to seller
            Seq([
                scratch_seller.store(App.globalGet(key_seller)),
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields({
                    TxnField.type_enum: TxnType.Payment,
                    TxnField.receiver: scratch_seller.load(),
                    TxnField.amount: scratch_amount.load() - Int(1000),
                    TxnField.fee: Int(1000)
                }),
                InnerTxnBuilder.Submit(),
                App.globalPut(key_status, status_completed),
            ]),
            # Refund to buyer
            Seq([
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields({
                    TxnField.type_enum: TxnType.Payment,
                    TxnField.receiver: App.globalGet(key_buyer),
                    TxnField.amount: scratch_amount.load() - Int(1000),
                    TxnField.fee: Int(1000)
                }),
                InnerTxnBuilder.Submit(),
                App.globalPut(key_status, status_refunded),
            ])
        ),
        
        Approve()
    ])
    
    # Cancel unfunded escrow - seller only
    cancel_escrow = Seq([
        # Verify caller is seller
        Assert(Txn.sender() == App.globalGet(key_seller)),
        
        # Verify status is created (not funded yet)
        Assert(App.globalGet(key_status) == status_created),
        
        # No funds to return, just mark as cancelled
        App.globalPut(key_status, Int(6)),  # cancelled status
        
        Approve()
    ])
    
    # Main program logic
    program = Cond(
        [Txn.application_id() == Int(0), Approve()],  # Creation
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Txn.sender() == Global.creator_address())],
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Txn.sender() == Global.creator_address())],
        [Txn.on_completion() == OnComplete.CloseOut, Approve()],
        [Txn.on_completion() == OnComplete.OptIn, Approve()],
        [Txn.application_args[0] == op_create, create_escrow],
        [Txn.application_args[0] == op_fund, fund_escrow],
        [Txn.application_args[0] == op_mark_delivered, mark_delivered],
        [Txn.application_args[0] == op_confirm_delivery, confirm_delivery],
        [Txn.application_args[0] == op_raise_dispute, raise_dispute],
        [Txn.application_args[0] == op_resolve_dispute, resolve_dispute],
        [Txn.application_args[0] == op_cancel, cancel_escrow],
    )
    
    return program


def approval_program():
    """Main approval program"""
    return escrow_contract()


def clear_state_program():
    """Clear state program - always approve"""
    return Approve()


if __name__ == "__main__":
    # Compile to TEAL
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "clear":
        print(compileTeal(clear_state_program(), Mode.Application, version=8))
    else:
        print(compileTeal(approval_program(), Mode.Application, version=8))
