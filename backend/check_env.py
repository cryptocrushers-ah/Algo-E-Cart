import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
print(f"Loading from: {env_path}")
print("Exists:", os.path.exists(env_path))

load_dotenv(dotenv_path=env_path, override=True)

admin = os.getenv("ADMIN_MNEMONIC")
creator = os.getenv("CREATOR_MNEMONIC")

if not admin and not creator:
    print("❌ Mnemonic not loaded from .env — check encoding or file name (must be .env, not .env.txt).")
else:
    print("✅ Mnemonics loaded successfully!")
    print("ADMIN_MNEMONIC (first 40 chars):", (admin or creator)[:40])
