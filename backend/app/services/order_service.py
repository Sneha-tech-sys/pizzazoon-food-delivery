import secrets
from decimal import Decimal
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.product import Product
from app.models.cart import Cart, CartItem
from app.models.user import User
from app.core.config import settings
from app.services.email_service import (
    send_email_sync,
    get_order_confirmation_template,
    get_order_status_update_template
)
from app.services.websocket_manager import ws_manager


def generate_unique_order_number() -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_suffix = secrets.token_hex(3).upper()
    return f"FZ-{timestamp}-{random_suffix}"


def create_order_from_cart_or_items(
    db: Session,
    user: User,
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    delivery_address: str,
    order_notes: Optional[str],
    payment_method: str,
    payment_reference_id: Optional[str],
    custom_items: Optional[List[dict]],
    background_tasks: BackgroundTasks
) -> Order:
    items_to_process = []

    if custom_items and len(custom_items) > 0:
        for it in custom_items:
            product = db.get(Product, it["product_id"])
            if not product or not product.is_active:
                raise HTTPException(status_code=400, detail=f"Product #{it['product_id']} not available")
            items_to_process.append({"product": product, "quantity": it["quantity"]})
    else:
        # Load from user's persistent cart
        cart = db.scalars(select(Cart).where(Cart.user_id == user.id)).first()
        if not cart or len(cart.items) == 0:
            raise HTTPException(status_code=400, detail="Cannot place order with an empty cart.")
        
        for c_item in cart.items:
            if not c_item.product.is_active:
                raise HTTPException(status_code=400, detail=f"Item {c_item.product.name} is no longer available.")
            items_to_process.append({"product": c_item.product, "quantity": c_item.quantity})

    # Recalculate everything from DB source of truth
    subtotal = Decimal("0.00")
    order_item_records = []
    items_summary_list = []

    for item_data in items_to_process:
        prod = item_data["product"]
        qty = item_data["quantity"]
        item_total = prod.price * qty
        subtotal += item_total

        order_item_records.append(
            OrderItem(
                product_id=prod.id,
                product_name=prod.name,
                product_image=prod.image_url,
                price_at_purchase=prod.price,
                quantity=qty,
                total_price=item_total
            )
        )
        items_summary_list.append(f"• {prod.name} x {qty} - ₹{item_total:.2f}")

    tax = (subtotal * Decimal(str(settings.TAX_RATE))).quantize(Decimal("0.01"))
    shipping_fee = Decimal(str(settings.DEFAULT_SHIPPING_FEE)).quantize(Decimal("0.01"))
    total_amount = (subtotal + tax + shipping_fee).quantize(Decimal("0.01"))

    # Create Order
    new_order = Order(
        order_number=generate_unique_order_number(),
        user_id=user.id,
        subtotal=subtotal,
        tax=tax,
        shipping_fee=shipping_fee,
        total_amount=total_amount,
        status="Pending",
        payment_method=payment_method,
        payment_status="Completed" if payment_method == "Razorpay" and payment_reference_id else "Pending",
        payment_reference_id=payment_reference_id,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        delivery_address=delivery_address,
        order_notes=order_notes,
        items=order_item_records
    )
    db.add(new_order)
    db.flush()

    # Initial status history
    history = OrderStatusHistory(
        order_id=new_order.id,
        status="Pending",
        comment="Order placed successfully",
        updated_by_user_id=user.id
    )
    db.add(history)

    # Clear active cart
    cart = db.scalars(select(Cart).where(Cart.user_id == user.id)).first()
    if cart:
        for c_item in list(cart.items):
            db.delete(c_item)

    db.commit()
    db.refresh(new_order)

    # Background confirmation email
    summary_text = "<br/>".join(items_summary_list)
    email_html = get_order_confirmation_template(
        order_number=new_order.order_number,
        customer_name=customer_name,
        total_amount=float(total_amount),
        items_summary=summary_text
    )
    background_tasks.add_task(
        send_email_sync,
        customer_email,
        f"Order Confirmed: #{new_order.order_number}",
        email_html
    )

    return new_order


async def update_order_status_and_notify(
    db: Session,
    order: Order,
    new_status: str,
    comment: Optional[str],
    admin_user_id: int,
    background_tasks: BackgroundTasks
) -> Order:
    order.status = new_status
    if new_status == "Delivered" and order.payment_method == "COD":
        order.payment_status = "Completed"

    history = OrderStatusHistory(
        order_id=order.id,
        status=new_status,
        comment=comment or f"Status updated to {new_status}",
        updated_by_user_id=admin_user_id
    )
    db.add(history)
    db.commit()
    db.refresh(order)

    # Publish real-time WebSocket update
    event_payload = {
        "event": "ORDER_STATUS_UPDATED",
        "order_id": order.id,
        "order_number": order.order_number,
        "status": order.status,
        "comment": comment,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await ws_manager.broadcast_order_update(str(order.id), event_payload)

    # Send status email notification
    email_html = get_order_status_update_template(
        order_number=order.order_number,
        status=new_status,
        comment=comment or ""
    )
    background_tasks.add_task(
        send_email_sync,
        order.customer_email,
        f"Order #{order.order_number} Update: {new_status}",
        email_html
    )

    return order
