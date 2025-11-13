from pyteal import *
from escrow_approval import approval_program
from escrow_clear import clear_program
import json

# --- build ARC-32 (ARC-4) compliant AppSpec for Lora ---
def get_arc32_spec(app_name="AlgoECartEscrow"):
    approval_teal = compileTeal(approval_program(), mode=Mode.Application, version=7)
    clear_teal = compileTeal(clear_program(), mode=Mode.Application, version=7)

    # This structure follows ARC-32 exactly
    spec = {
        "name": app_name,
        "description": "Secure escrow contract for Algo-E-Cart marketplace",
        "networks": {"testnet": {"appID": 749436186}},
        "source": {
            "approval": approval_teal,
            "clear": clear_teal,
        },
        "schema": {
            "local": {"declared": {"ints": 0, "bytes": 0}},
            "global": {"declared": {"ints": 1, "bytes": 2}},
        },
        "hints": {},
        "methods": [
            {
                "name": "release",
                "desc": "Release escrow funds to seller (admin only)",
                "args": [],
                "returns": {"type": "void"},
                "readonly": False,
            }
        ],
        "bare_call_config": {
            "no_op": "CREATE",
            "update_application": "NEVER",
            "delete_application": "NEVER",
            "opt_in": "NEVER",
            "close_out": "NEVER",
        },
    }

    return spec


if __name__ == "__main__":
    print("🧠 Generating ARC-32 / ARC-4 compliant spec for Lora…")
    spec = get_arc32_spec()
    with open("escrow_app_spec.json", "w") as f:
        json.dump(spec, f, indent=2)
    print("✅ Generated: escrow_app_spec.json  (ready for Lora upload)")
