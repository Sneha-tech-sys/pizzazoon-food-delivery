from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.session import get_db
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import CartItemAdd, CartItemUpdate, CartResponse, CartItemResponse
from app.schemas.common import APIResponse
from app.core.dependencies import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/cart", tags=["Cart"])


def _build_cart_response(cart: Cart) -> CartResponse:
    subtotal = Decimal("0.00")
    total_items = 0
    item_responses = []

    for ci in cart.items:
        prod = ci.product
        item_total = prod.price * ci.quantity
        subtotal += item_total
        total_items += ci.quantity

        item_responses.append(
            CartItemResponse(
                id=ci.id,
                product_id=prod.id,
                product_name=prod.name,
                product_image=prod.image_url,
                price=prod.price,
                quantity=ci.quantity,
                total_price=item_total
            )
        )

    tax = (subtotal * Decimal(str(settings.TAX_RATE))).quantize(Decimal("0.01"))
    shipping_fee = Decimal(str(settings.DEFAULT_SHIPPING_FEE)).quantize(Decimal("0.01")) if total_items > 0 else Decimal("0.00")
    total_amount = (subtotal + tax + shipping_fee).quantize(Decimal("0.01"))

    return CartResponse(
        id=cart.id,
        items=item_responses,
        subtotal=subtotal,
        tax=tax,
        shipping_fee=shipping_fee,
        total_amount=total_amount,
        total_items=total_items
    )


@router.get("/", response_model=APIResponse[CartResponse])
def get_user_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = db.scalars(select(Cart).where(Cart.user_id == current_user.id)).first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    return APIResponse(data=_build_cart_response(cart))


@router.post("/items", response_model=APIResponse[CartResponse])
def add_to_cart(
    payload: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.get(Product, payload.product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found or inactive")

    cart = db.scalars(select(Cart).where(Cart.user_id == current_user.id)).first()
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    existing_item = db.scalars(
        select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == product.id)
    ).first()

    if existing_item:
        existing_item.quantity += payload.quantity
    else:
        new_item = CartItem(cart_id=cart.id, product_id=product.id, quantity=payload.quantity)
        db.add(new_item)

    db.commit()
    db.refresh(cart)
    return APIResponse(message="Item added to cart", data=_build_cart_response(cart))


@router.put("/items/{item_id}", response_model=APIResponse[CartResponse])
def update_cart_item(
    item_id: int,
    payload: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = db.scalars(select(Cart).where(Cart.user_id == current_user.id)).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    item = db.get(CartItem, item_id)
    if not item or item.cart_id != cart.id:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if payload.quantity <= 0:
        db.delete(item)
    else:
        item.quantity = payload.quantity

    db.commit()
    db.refresh(cart)
    return APIResponse(message="Cart updated", data=_build_cart_response(cart))


@router.delete("/items/{item_id}", response_model=APIResponse[CartResponse])
def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = db.scalars(select(Cart).where(Cart.user_id == current_user.id)).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    item = db.get(CartItem, item_id)
    if not item or item.cart_id != cart.id:
        raise HTTPException(status_code=404, detail="Cart item not found")

    db.delete(item)
    db.commit()
    db.refresh(cart)
    return APIResponse(message="Item removed from cart", data=_build_cart_response(cart))


@router.delete("/clear", response_model=APIResponse[CartResponse])
def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cart = db.scalars(select(Cart).where(Cart.user_id == current_user.id)).first()
    if cart:
        for ci in list(cart.items):
            db.delete(ci)
        db.commit()
        db.refresh(cart)

    return APIResponse(message="Cart cleared", data=_build_cart_response(cart))
