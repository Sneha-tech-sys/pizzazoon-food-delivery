from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.session import get_db
from app.models.wishlist import Wishlist, WishlistItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import WishlistAdd, WishlistItemResponse
from app.schemas.common import APIResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


@router.get("/", response_model=APIResponse[List[WishlistItemResponse]])
def get_user_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wishlist = db.scalars(select(Wishlist).where(Wishlist.user_id == current_user.id)).first()
    if not wishlist:
        wishlist = Wishlist(user_id=current_user.id)
        db.add(wishlist)
        db.commit()
        db.refresh(wishlist)

    data = [
        WishlistItemResponse(
            id=wi.id,
            product_id=wi.product.id,
            name=wi.product.name,
            image=wi.product.image_url,
            price=wi.product.price,
            rating=wi.product.rating
        )
        for wi in wishlist.items
        if wi.product.is_active
    ]
    return APIResponse(data=data)


@router.post("/items", response_model=APIResponse[WishlistItemResponse])
def add_to_wishlist(
    payload: WishlistAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.get(Product, payload.product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found or inactive")

    wishlist = db.scalars(select(Wishlist).where(Wishlist.user_id == current_user.id)).first()
    if not wishlist:
        wishlist = Wishlist(user_id=current_user.id)
        db.add(wishlist)
        db.commit()
        db.refresh(wishlist)

    existing = db.scalars(
        select(WishlistItem).where(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.product_id == product.id
        )
    ).first()

    if existing:
        return APIResponse(
            message="Item is already in your wishlist",
            data=WishlistItemResponse(
                id=existing.id,
                product_id=product.id,
                name=product.name,
                image=product.image_url,
                price=product.price,
                rating=product.rating
            )
        )

    new_item = WishlistItem(wishlist_id=wishlist.id, product_id=product.id)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return APIResponse(
        message="Item added to wishlist",
        data=WishlistItemResponse(
            id=new_item.id,
            product_id=product.id,
            name=product.name,
            image=product.image_url,
            price=product.price,
            rating=product.rating
        )
    )


@router.delete("/items/{product_id}", response_model=APIResponse[dict])
def remove_from_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    wishlist = db.scalars(select(Wishlist).where(Wishlist.user_id == current_user.id)).first()
    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    item = db.scalars(
        select(WishlistItem).where(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.product_id == product_id
        )
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not in wishlist")

    db.delete(item)
    db.commit()
    return APIResponse(message="Item removed from wishlist")
