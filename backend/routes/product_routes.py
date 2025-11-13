print("--- LOADING PRODUCT_ROUTES FILE (v2) ---")

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db import SessionLocal, Product

router = APIRouter(prefix="/api/products", tags=["Products"])

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/create")
def create_product(
    name: str,
    description: str,
    price: float,
    seller: str,
    image: str = None,
    db: Session = Depends(get_db),
):
    """Create new product listing."""
    new_product = Product(
        name=name,
        description=description,
        price=price,
        seller=seller,
        image=image
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return {"message": "✅ Product created successfully", "product": new_product}

@router.get("/list")
def list_products(db: Session = Depends(get_db)):
    """Get all marketplace listings."""
    products = db.query(Product).order_by(Product.created_at.desc()).all()
    return {"products": products}
