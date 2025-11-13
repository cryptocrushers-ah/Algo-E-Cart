import os, traceback, base64
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from backend.db import SessionLocal, Order
from backend.smartcontracts.deploy_escrow import deploy_escrow_app
from backend.smartcontracts.release import release_escrow_funds  # implement (see notes)
from algosdk.v2client import algod
from algosdk import logic as algo_logic
from algosdk import encoding as algo_encoding
from dotenv import load_dotenv

load_dotenv()
router = APIRouter(prefix="/api/escrow", tags=["escrow"])

ALGOD_ADDRESS = os.getenv("ALGOD_ADDRESS")
ALGOD_TOKEN = os.getenv("ALGOD_TOKEN", "")
ADMIN_MNEMONIC = os.getenv("ADMIN_MNEMONIC", "")
ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "")

algod_client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def serialize_order(order):
    data = order.__dict__.copy()
    data.pop("_sa_instance_state", None)
    return data

@router.get("/status")
def get_all_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return {"orders": [serialize_order(o) for o in orders]}

@router.post("/create")
def create_order(payload: dict, db: Session = Depends(get_db)):
    try:
        seller = payload["seller"]
        amount = int(payload["amount"])
        deploy_res = deploy_escrow_app(seller, amount)

        new_order = Order(
            seller=seller,
            product_name=payload.get("product_name"),
            product_description=payload.get("product_description"),
            image_url=payload.get("image_url"),
            amount=amount,
            app_id=deploy_res["app_id"],
            escrow_address=deploy_res["escrow_address"],
            status="INIT",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        return {"message": "created", "order": serialize_order(new_order)}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))

@router.post("/update_buyer/{order_id}")
async def update_buyer(order_id: int, buyer: dict, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status != "INIT":
        raise HTTPException(400, "Not available for funding")
    order.buyer = buyer.get("buyer_wallet")
    order.buyer_name = buyer.get("buyer_name")
    order.buyer_email = buyer.get("buyer_email")
    order.buyer_address = buyer.get("buyer_address")
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return {"message": "buyer saved", "order": serialize_order(order)}

@router.get("/prepare_fund/{order_id}")
def prepare_fund(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")

    # validate stored address; if missing compute from app_id and persist
    try:
        escrow_addr = order.escrow_address
        valid = False
        if escrow_addr:
            try:
                valid = algo_encoding.is_valid_address(escrow_addr)
            except Exception:
                try:
                    algo_encoding.decode_address(escrow_addr)
                    valid = True
                except Exception:
                    valid = False
        if not valid:
            escrow_addr = algo_logic.get_application_address(order.app_id)
            order.escrow_address = escrow_addr
            order.updated_at = datetime.utcnow()
            db.commit(); db.refresh(order)

        return {
            "app_id": order.app_id,
            "escrow_address": escrow_addr,
            "amount_micro": order.amount,
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))

@router.post("/fund/verify")
async def verify_funding(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    order_id = data.get("order_id") or data.get("id")
    tx_id = data.get("tx_id")
    if not order_id or not tx_id:
        raise HTTPException(400, "Missing order id or tx_id")
    order = db.query(Order).filter(Order.id == int(order_id)).first()
    if not order:
        raise HTTPException(404, "Order not found")
    order.tx_id = tx_id
    order.status = "FUNDED"
    order.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "verified", "order": serialize_order(order)}

@router.post("/admin/release")
async def admin_release(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    admin_key = data.get("admin_key")
    order_id = data.get("order_id")
    if admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(401, "Invalid admin key")
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status != "FUNDED":
        raise HTTPException(400, "Order not funded")
    try:
        # you must implement release_escrow_funds to call app 'release'
        txid = release_escrow_funds(algod_client, order.app_id, order.seller)
        order.status = "RELEASED"
        order.tx_id = txid
        order.updated_at = datetime.utcnow()
        db.commit()
        return {"message": "released", "tx_id": txid}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))

@router.post("/cancel/{order_id}")
async def cancel_order(order_id: int, request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    admin_key = data.get("admin_key")
    if admin_key != ADMIN_SECRET_KEY:
        raise HTTPException(401, "Invalid admin key")
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    # buyer cancel allowed only before funding
    if order.status != "INIT":
        raise HTTPException(400, "Cannot cancel, already funded or released")
    order.status = "CANCELLED"
    order.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "cancelled"}
