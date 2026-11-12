from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.session import get_db
from app.models.user import User, Address
from app.schemas.user import UserUpdateSchema, AddressCreate, AddressResponse
from app.schemas.auth import UserProfileSchema
from app.schemas.common import APIResponse
from app.core.dependencies import get_current_user, get_user_roles

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=APIResponse[UserProfileSchema])
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roles = get_user_roles(current_user, db)
    schema = UserProfileSchema(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        roles=roles
    )
    return APIResponse(data=schema)


@router.put("/profile", response_model=APIResponse[UserProfileSchema])
def update_user_profile(
    payload: UserUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.phone is not None:
        # Check phone conflict
        exist = db.scalars(select(User).where(User.phone == payload.phone, User.id != current_user.id)).first()
        if exist:
            raise HTTPException(status_code=400, detail="Phone number is already associated with another account")
        current_user.phone = payload.phone

    db.commit()
    db.refresh(current_user)

    roles = get_user_roles(current_user, db)
    schema = UserProfileSchema(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        roles=roles
    )
    return APIResponse(message="Profile updated successfully", data=schema)


@router.get("/addresses", response_model=APIResponse[List[AddressResponse]])
def get_addresses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stmt = select(Address).where(Address.user_id == current_user.id).order_by(Address.created_at.desc())
    addresses = db.scalars(stmt).all()
    data = [AddressResponse.model_validate(a) for a in addresses]
    return APIResponse(data=data)


@router.post("/addresses", response_model=APIResponse[AddressResponse])
def add_address(
    payload: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.is_default:
        # reset existing defaults
        existing_defaults = db.scalars(select(Address).where(Address.user_id == current_user.id, Address.is_default == True)).all()
        for d in existing_defaults:
            d.is_default = False

    addr = Address(
        user_id=current_user.id,
        full_name=payload.full_name,
        phone=payload.phone,
        street_address=payload.street_address,
        city=payload.city,
        state=payload.state,
        postal_code=payload.postal_code,
        country=payload.country,
        is_default=payload.is_default
    )
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return APIResponse(message="Address added successfully", data=AddressResponse.model_validate(addr))


@router.delete("/addresses/{address_id}", response_model=APIResponse[dict])
def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    addr = db.get(Address, address_id)
    if not addr or addr.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Address not found")
    
    db.delete(addr)
    db.commit()
    return APIResponse(message="Address deleted successfully")
