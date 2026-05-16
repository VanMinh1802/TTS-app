"""Admin System Logs API endpoints."""
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, and_

from app.api.auth import get_current_user
from app.core.di import get_uow
from app.core.uow import UnitOfWork
from app.models.user import User
from app.models.analytics import RequestLog


router = APIRouter(prefix="/admin/logs", tags=["Admin Logs"])


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


class RequestLogResponse(BaseModel):
    id: int
    timestamp: datetime
    method: str
    path: str
    status_code: int
    latency_ms: int
    user_id: Optional[str]
    user_email: Optional[str] = None
    ip_address: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)


class RequestLogListResponse(BaseModel):
    items: List[RequestLogResponse]
    total: int
    page: int
    per_page: int


@router.get("", response_model=RequestLogListResponse)
def list_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    status_code: Optional[int] = Query(None),
    path_filter: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    admin: User = Depends(require_admin),
    uow: UnitOfWork = Depends(get_uow),
):
    """Get system request logs with pagination and filters."""
    query = uow.session.query(RequestLog, User.email.label("user_email"))\
        .outerjoin(User, RequestLog.user_id == User.id)
    
    if status_code:
        if status_code >= 400 and status_code < 500:
            query = query.filter(RequestLog.status_code >= 400, RequestLog.status_code < 500)
        elif status_code >= 500:
            query = query.filter(RequestLog.status_code >= 500)
        else:
            query = query.filter(RequestLog.status_code == status_code)
            
    if path_filter:
        query = query.filter(RequestLog.path.ilike(f"%{path_filter}%"))
        
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(RequestLog.timestamp >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(RequestLog.timestamp < end_dt)
        except ValueError:
            pass
            
    total = query.count()
    results = query.order_by(desc(RequestLog.timestamp)).offset((page - 1) * per_page).limit(per_page).all()
    
    # Format the results to match the Pydantic schema
    formatted_logs = []
    for log, email in results:
        log_dict = {
            "id": log.id,
            "timestamp": log.timestamp,
            "method": log.method,
            "path": log.path,
            "status_code": log.status_code,
            "latency_ms": log.latency_ms,
            "user_id": log.user_id,
            "user_email": email,
            "ip_address": log.ip_address
        }
        formatted_logs.append(log_dict)
    
    return RequestLogListResponse(
        items=formatted_logs,
        total=total,
        page=page,
        per_page=per_page,
    )
