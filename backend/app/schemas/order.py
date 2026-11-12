from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, Field


# Cart Schemas
class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_image: str
    price: Decimal
    quantity: int
    total_price: Decimal

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    id: int
    items: List[CartItemResponse]
    subtotal: Decimal
    tax: Decimal
    shipping_fee: Decimal
    total_amount: Decimal
    total_items: int


# Wishlist Schemas
class WishlistAdd(BaseModel):
    product_id: int


class WishlistItemResponse(BaseModel):
    id: int
    product_id: int
    name: str
    image: str
    price: Decimal
    rating: Decimal

    model_config = {"from_attributes": True}


# Order Schemas
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1)


class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=100)
    customer_email: str
    customer_phone: str = Field(..., min_length=10, max_length=15)
    delivery_address: str = Field(..., min_length=5)
    order_notes: Optional[str] = None
    payment_method: str = Field(default="COD")  # COD or Razorpay
    payment_reference_id: Optional[str] = None
    items: Optional[List[OrderItemCreate]] = None  # If null, backend uses user's active cart


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_image: Optional[str] = None
    price_at_purchase: Decimal
    quantity: int
    total_price: Decimal

    model_config = {"from_attributes": True}


class OrderStatusHistoryResponse(BaseModel):
    id: int
    status: str
    comment: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    order_number: str
    user_id: int
    customer_name: str
    customer_email: str
    customer_phone: str
    delivery_address: str
    order_notes: Optional[str] = None
    subtotal: Decimal
    tax: Decimal
    shipping_fee: Decimal
    total_amount: Decimal
    status: str
    payment_method: str
    payment_status: str
    payment_reference_id: Optional[str] = None
    items: List[OrderItemResponse]
    status_history: List[OrderStatusHistoryResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="Pending, Confirmed, Preparing, Ready for Dispatch, Out for Delivery, Delivered, Cancelled, Failed")
    comment: Optional[str] = None
