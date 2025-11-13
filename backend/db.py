# backend/db.py
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# ==========================================================
# ✅ Database Configuration
# ==========================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "algocart.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite-specific
    echo=False  # Turn to True for SQL debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==========================================================
# 🧱 Database Models
# ==========================================================
# In backend/db.py

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    buyer = Column(String(128), nullable=True) # Buyer wallet address
    seller = Column(String(128), nullable=False)
    product_name = Column(String(255), nullable=False)
    product_description = Column(String(255))
    image_url = Column(String(512), nullable=True) 
    amount = Column(Integer, nullable=False) # In microAlgos
    status = Column(String(32), default="INIT")

    # ✅ ADD THESE NEW COLUMNS FOR BUYER INFO
    buyer_name = Column(String(255), nullable=True)
    buyer_email = Column(String(255), nullable=True)
    buyer_address = Column(String(512), nullable=True) # Residential address

    # Blockchain-related fields
    escrow_address = Column(String(255), nullable=True)
    app_id = Column(Integer, nullable=True)
    tx_id = Column(String(255), nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ... (keep your Product model)
# ... (keep your init_db function)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    seller = Column(String(128), nullable=False)
    image = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================================================
# ⚙️ Database Initialization
# ==========================================================
def init_db():
    """
    Initialize the database and create tables if not exist.
    """
    if not os.path.exists(DB_PATH):
        print(f"📦 Creating new database at: {DB_PATH}")
    else:
        print(f"✅ Using existing database: {DB_PATH}")

    Base.metadata.create_all(bind=engine)
    print("🗄️  Database initialized successfully.")
