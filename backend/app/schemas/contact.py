from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class ContactSendOTPRequest(BaseModel):
    email: EmailStr


class ContactVerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class ContactSubmitRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    subject: str = Field(..., min_length=3, max_length=200)
    message: str = Field(..., min_length=5)
    otp: str = Field(..., min_length=6, max_length=6)


class ContactNoteCreate(BaseModel):
    note: str = Field(..., min_length=1)


class ContactNoteResponse(BaseModel):
    id: int
    admin_name: str
    note: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ContactStatusUpdate(BaseModel):
    status: str = Field(..., description="New, In Progress, Resolved")


class ContactReplyRequest(BaseModel):
    message: str = Field(..., min_length=5)


class ContactResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    subject: str
    message: str
    status: str
    is_verified: bool
    notes: List[ContactNoteResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}
