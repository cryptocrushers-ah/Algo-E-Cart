# backend/validate_mnemonic.py
import os
from dotenv import load_dotenv

# Load .env explicitly from backend folder
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

mn = os.getenv("ADMIN_MNEMONIC") or os.getenv("CREATOR_MNEMONIC")
if not mn:
    print("No ADMIN_MNEMONIC or CREATOR_MNEMONIC found in backend/.env")
    raise SystemExit(1)

# lazy import (will use installed SDK)
from algosdk.mnemonic import word_to_index

words = mn.strip().replace('"', '').split()
print("Mnemonic word count:", len(words))
invalid = [w for w in words if w not in word_to_index]
if not invalid:
    print("✅ All words are present in local algosdk wordlist.")
else:
    print("❌ Invalid / unknown words found:")
    for w in invalid:
        print(" -", repr(w))
    print("\nSuggestion: fix the above word(s) in backend/.env or generate a new wallet.")
