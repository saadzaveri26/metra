from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
import os

from db import get_db
from models import User, UserRole
from security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_roles,
)
from schemas import (
    RegisterConsumer,
    RegisterVendor,
    RegisterInspector,
    RegisterHQ,
    LoginRequest,
    TokenResponse,
    UserOut,
)
from config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


def _ensure_unique_email(db: Session, email: str):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")


@router.get("/me")
def get_current_user_profile(user: dict = Depends(get_current_user)):
    """Returns verified Clerk identity claims and assigned role."""
    return {
        "sub": user.get("sub"),
        "role": user.get("role"),
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "state_region": user.get("state_region"),
    }


@router.get("/probe/officer")
def officer_probe(user: dict = Depends(require_roles("officer"))):
    """Test endpoint accessible exclusively by verified Officers / Inspectors."""
    return {"status": "authorized", "role": user.get("role"), "sub": user.get("sub")}


@router.get("/probe/vendor")
def vendor_probe(user: dict = Depends(require_roles("vendor"))):
    """Test endpoint accessible exclusively by Vendors."""
    return {"status": "authorized", "role": user.get("role"), "sub": user.get("sub")}


@router.get("/probe/hq")
def hq_probe(user: dict = Depends(require_roles("headquarters"))):
    """Test endpoint accessible exclusively by Legal Metrology HQ."""
    return {"status": "authorized", "role": user.get("role"), "sub": user.get("sub")}


@router.post("/admin/assign-role")
def admin_assign_role(
    user_id: str,
    target_role: str,
    admin_secret: Optional[str] = Header(None, alias="X-Admin-Secret"),
    caller: Optional[dict] = Depends(require_roles("headquarters")),
):
    """
    Administrative role provisioning for Officer and Headquarters accounts.
    Cannot be called via public self-service.
    Requires either active Headquarters JWT claim or valid CLERK_SECRET_KEY / METRA_SECRET_KEY header.
    """
    valid_roles = ["officer", "inspector", "vendor", "consumer", "headquarters", "hq"]
    if target_role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid target role: {target_role}")

    # Check authorization: caller has headquarters role OR valid admin secret provided
    is_authorized = False
    if caller and caller.get("role") in ["headquarters", "hq"]:
        is_authorized = True
    elif admin_secret and (
        admin_secret == settings.CLERK_SECRET_KEY or admin_secret == settings.SECRET_KEY
    ):
        is_authorized = True

    if not is_authorized:
        raise HTTPException(status_code=403, detail="Forbidden: Administrative authority required")

    return {
        "success": True,
        "user_id": user_id,
        "assigned_role": target_role,
        "message": f"User {user_id} provisioned with role {target_role}",
    }


# Dev / Offline Mock Auth Endpoints
@router.post("/register/consumer", response_model=UserOut, status_code=201)
def register_consumer(payload: RegisterConsumer, db: Session = Depends(get_db)):
    _ensure_unique_email(db, payload.email)
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=UserRole.consumer,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/register/vendor", response_model=UserOut, status_code=201)
def register_vendor(payload: RegisterVendor, db: Session = Depends(get_db)):
    _ensure_unique_email(db, payload.email)
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        phone=payload.phone,
        role=UserRole.vendor,
        business_name=payload.business_name,
        gstin=payload.gstin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = create_access_token(
        data={
            "sub": user.id,
            "role": user.role.value,
            "full_name": user.full_name,
            "email": user.email,
            "state_region": user.state_region,
            "government_id": user.government_id,
            "designation": user.designation,
            "department_name": user.department_name,
        }
    )
    return TokenResponse(access_token=token, role=user.role.value, full_name=user.full_name)
