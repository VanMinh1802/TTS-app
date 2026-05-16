from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.system_alert import SystemAlert
from app.models.user import User
from app.api.auth import get_current_user

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("/")
def get_alerts(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    alerts = db.query(SystemAlert).order_by(SystemAlert.created_at.desc()).limit(50).all()
    return alerts

@router.post("/mark-read")
def mark_read(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    unread_alerts = db.query(SystemAlert).filter(SystemAlert.is_read == False).all()
    for alert in unread_alerts:
        alert.is_read = True
    db.commit()
    return {"status": "success", "marked_count": len(unread_alerts)}

@router.delete("/{alert_id}")
def delete_alert(alert_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    alert = db.query(SystemAlert).filter(SystemAlert.id == alert_id).first()
    if alert:
        db.delete(alert)
        db.commit()
    return {"status": "success"}

@router.delete("/")
def clear_all_alerts(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    db.query(SystemAlert).delete()
    db.commit()
    return {"status": "success"}
