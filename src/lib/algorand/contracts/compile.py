"""
Compile PyTeal smart contracts to TEAL
"""

import sys
import os
from pathlib import Path
from pyteal import *
from escrow import approval_program, clear_state_program


def compile_contract():
    """Compile both approval and clear state programs"""
    
    # Create contracts directory if it doesn't exist
    output_dir = Path(__file__).parent / "teal"
    output_dir.mkdir(exist_ok=True)
    
    # Compile approval program
    approval_teal = compileTeal(
        approval_program(), 
        Mode.Application, 
        version=8
    )
    
    # Compile clear state program
    clear_teal = compileTeal(
        clear_state_program(), 
        Mode.Application, 
        version=8
    )
    
    # Write to files
    with open(output_dir / "escrow_approval.teal", "w") as f:
        f.write(approval_teal)
    
    with open(output_dir / "escrow_clear.teal", "w") as f:
        f.write(clear_teal)
    
    print("✅ Smart contracts compiled successfully!")
    print(f"📁 Output directory: {output_dir}")
    print(f"   - escrow_approval.teal ({len(approval_teal)} bytes)")
    print(f"   - escrow_clear.teal ({len(clear_teal)} bytes)")


if __name__ == "__main__":
    compile_contract()
