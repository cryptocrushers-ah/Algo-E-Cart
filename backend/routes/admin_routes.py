from fastapi import APIRouter, HTTPException, Request
from backend.db import SessionLocal, Order
from datetime import datetime

router = APIRouter(prefix="/api/admin", tags=["Admin"])
ADMIN_SECRET = "849969"

@router.post("/validate")
async def validate_admin(request: Request):
    data = await request.json()
    key = data.get("key")
    if not key:
        raise HTTPException(status_code=400, detail="Admin key missing")
    if key != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Invalid admin key")
    return {"success": True, "message": "Admin validated successfully"}

@router.post("/release")
async def release_via_admin(request: Request):
    """
    Alternative admin release endpoint under /api/admin/release
    Body: { admin_key: "...", escrow_id: 123, note: "..." }
    """
    data = await request.json()
    admin_key = data.get("admin_key") or data.get("adminKey")
    if admin_key != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Invalid admin key")

    escrow_id = data.get("escrow_id") or data.get("id")
    if not escrow_id:
        raise HTTPException(status_code=400, detail="Missing escrow_id")

    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == int(escrow_id)).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        order.status = "COMPLETED"
        order.updated_at = datetime.utcnow()
        note = data.get("note")
        if note:
            order.tx_id = (order.tx_id or "") + f" | admin_note:{note}"
        db.commit()
        return {"success": True, "message": "Released to seller", "order_id": order.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@router.post("/resolve-dispute")
async def resolve_dispute(request: Request):
    """
    Admin resolves dispute:
    Body: { admin_key: "...", escrow_id: 123, resolution: "COMPLETED" | "REFUND", note: "..." }
    """
    data = await request.json()
    admin_key = data.get("admin_key")
    if admin_key != ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Invalid admin key")

    escrow_id = data.get("escrow_id") or data.get("id")
    resolution = data.get("resolution")
    if not escrow_id or not resolution:
        raise HTTPException(status_code=400, detail="Missing escrow_id or resolution")

    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == int(escrow_id)).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        if resolution == "COMPLETED":
            order.status = "COMPLETED"
        elif resolution == "REFUND":
            order.status = "REFUNDED"
        else:
            raise HTTPException(status_code=400, detail="Invalid resolution")

        order.updated_at = datetime.utcnow()
        note = data.get("note")
        if note:
            order.tx_id = (order.tx_id or "") + f" | dispute_resolved_note:{note}"
        db.commit()
        return {"success": True, "message": f"Dispute resolved: {resolution}", "order_id": order.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
