from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserUpdateSchema(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)


class AddressCreate(BaseModel):
    full_name: str
    phone: str
    street_address: str
    city: str
    state: Optional[str] = None
    postal_code: str
    country: str = "India"
    is_default: bool = False


class AddressResponse(AddressCreate):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserUpdateSchema(BaseModel):
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    roles: Optional[List[str]] = None
