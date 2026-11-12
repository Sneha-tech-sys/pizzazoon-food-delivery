from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.session import get_db
from app.models.order import Order, OrderStatusHistory
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderItemResponse, OrderStatusHistoryResponse
from app.schemas.common import APIResponse
from app.core.dependencies import get_current_user
from app.services.order_service import create_order_from_cart_or_items
from app.services.websocket_manager import ws_manager

router = APIRouter(prefix="/orders", tags=["Orders"])


def _format_order(order: Order) -> OrderResponse:
    items_resp = [
        OrderItemResponse(
            id=i.id,
            product_id=i.product_id,
            product_name=i.product_name,
            product_image=i.product_image,
            price_at_purchase=i.price_at_purchase,
            quantity=i.quantity,
            total_price=i.total_price
        )
        for i in order.items
    ]
    history_resp = [
        OrderStatusHistoryResponse(
            id=h.id,
            status=h.status,
            comment=h.comment,
            created_at=h.created_at
        )
        for h in order.status_history
    ]
    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        user_id=order.user_id,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        customer_phone=order.customer_phone,
        delivery_address=order.delivery_address,
        order_notes=order.order_notes,
        subtotal=order.subtotal,
        tax=order.tax,
        shipping_fee=order.shipping_fee,
        total_amount=order.total_amount,
        status=order.status,
        payment_method=order.payment_method,
        payment_status=order.payment_status,
        payment_reference_id=order.payment_reference_id,
        items=items_resp,
        status_history=history_resp,
        created_at=order.created_at,
        updated_at=order.updated_at
    )


@router.post("/", response_model=APIResponse[OrderResponse])
def place_order(
    payload: OrderCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    custom_items = [it.model_dump() for it in payload.items] if payload.items else None
    order = create_order_from_cart_or_items(
        db=db,
        user=current_user,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone,
        delivery_address=payload.delivery_address,
        order_notes=payload.order_notes,
        payment_method=payload.payment_method,
        payment_reference_id=payload.payment_reference_id,
        custom_items=custom_items,
        background_tasks=background_tasks
    )
    return APIResponse(message="Order placed successfully!", data=_format_order(order))


@router.get("/", response_model=APIResponse[List[OrderResponse]])
def get_user_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stmt = (
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    orders = db.scalars(stmt).all()
    data = [_format_order(o) for o in orders]
    return APIResponse(data=data)


@router.get("/{order_id}", response_model=APIResponse[OrderResponse])
def get_order_by_id(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.get(Order, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Order not found")
    return APIResponse(data=_format_order(order))


@router.post("/{order_id}/cancel", response_model=APIResponse[OrderResponse])
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.get(Order, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status not in ["Pending", "Confirmed"]:
        raise HTTPException(
            status_code=400,
            detail=f"Order cannot be cancelled because it is already in '{order.status}' stage."
        )

    order.status = "Cancelled"
    history = OrderStatusHistory(
        order_id=order.id,
        status="Cancelled",
        comment="Cancelled by customer",
        updated_by_user_id=current_user.id
    )
    db.add(history)
    db.commit()
    db.refresh(order)

    # Broadcast event
    await ws_manager.broadcast_order_update(
        str(order.id),
        {
            "event": "ORDER_STATUS_UPDATED",
            "order_id": order.id,
            "order_number": order.order_number,
            "status": "Cancelled",
            "comment": "Cancelled by customer",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )

    return APIResponse(message="Order successfully cancelled", data=_format_order(order))
