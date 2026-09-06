from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db import get_db
from models import User, UserRole
from security import hash_password, verify_password, create_access_token
from schemas import (
    RegisterConsumer, RegisterVendor, RegisterInspector, RegisterHQ,
    LoginRequest, TokenResponse, UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _ensure_unique_email(db: Session, email: str):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")


@router.post("/register/consumer", response_model=UserOut, status_code=201)
def register_consumer(payload: RegisterConsumer, db: Session = Depends(get_db)):
    _ensure_unique_email(db, payload.email)
    user = User(email=payload.email, hashed_password=hash_password(payload.password),
                full_name=payload.full_name, phone=payload.phone, role=UserRole.consumer)
    db.add(user); db.commit(); db.refresh(user)
    return user


@router.post("/register/vendor", response_model=UserOut, status_code=201)
def register_vendor(payload: RegisterVendor, db: Session = Depends(get_db)):
    _ensure_unique_email(db, payload.email)
    user = User(email=payload.email, hashed_password=hash_password(payload.password),
                full_name=payload.full_name, phone=payload.phone, role=UserRole.vendor,
                business_name=payload.business_name, gstin=payload.gstin)
    db.add(user); db.commit(); db.refresh(user)
    return user


@router.post("/register/inspector", response_model=UserOut, status_code=201)
def register_inspector(payload: RegisterInspector, db: Session = Depends(get_db)):
    """inspector_verified starts False; HQ must approve before login works."""
    _ensure_unique_email(db, payload.email)
    user = User(email=payload.email, hashed_password=hash_password(payload.password),
                full_name=payload.full_name, phone=payload.phone, role=UserRole.inspector,
                government_id=payload.government_id, designation=payload.designation,
                department_name=payload.department_name, state_region=payload.state_region,
                photograph_url=payload.photograph_url, inspector_verified=False)
    db.add(user); db.commit(); db.refresh(user)
    return user


@router.post("/register/hq", response_model=UserOut, status_code=201)
def register_hq(payload: RegisterHQ, db: Session = Depends(get_db)):
    _ensure_unique_email(db, payload.email)
    user = User(email=payload.email, hashed_password=hash_password(payload.password),
                full_name=payload.full_name, role=UserRole.hq,
                state_region=payload.state_region, department_name=payload.department_name)
    db.add(user); db.commit(); db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    if user.role == UserRole.inspector and not user.inspector_verified:
        raise HTTPException(status_code=403, detail="Inspector account pending verification by Legal Metrology HQ")

    token = create_access_token(data={
        "sub": user.id, "role": user.role.value, "full_name": user.full_name,
        "state_region": user.state_region, "government_id": user.government_id,
        "designation": user.designation, "department_name": user.department_name,
    })
    return TokenResponse(access_token=token, role=user.role.value, full_name=user.full_name)
