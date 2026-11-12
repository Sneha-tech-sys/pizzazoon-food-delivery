import os
import shutil
import uuid
from decimal import Decimal
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, or_

from app.database.session import get_db
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order, OrderStatusHistory
from app.models.contact import Contact, ContactNote
from app.schemas.auth import UserProfileSchema
from app.schemas.user import AdminUserUpdateSchema
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, CategoryCreate, CategoryUpdate, CategoryResponse
from app.schemas.order import OrderResponse, OrderStatusUpdate, OrderItemResponse, OrderStatusHistoryResponse
from app.schemas.contact import ContactResponse, ContactStatusUpdate, ContactNoteCreate, ContactReplyRequest, ContactNoteResponse
from app.schemas.common import APIResponse, PaginatedResponse
from app.core.dependencies import get_current_admin, get_user_roles
from app.services.order_service import update_order_status_and_notify
from app.services.email_service import send_email_sync

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(get_current_admin)])


# ---------------- DASHBOARD OVERVIEW & ANALYTICS ----------------
@router.get("/dashboard", response_model=APIResponse[dict])
def get_dashboard_metrics(db: Session = Depends(get_db)):
    total_users = db.scalar(select(func.count(User.id))) or 0
    total_products = db.scalar(select(func.count(Product.id)).where(Product.is_active == True)) or 0
    total_orders = db.scalar(select(func.count(Order.id))) or 0
    pending_orders = db.scalar(select(func.count(Order.id)).where(Order.status.in_(["Pending", "Confirmed", "Preparing"]))) or 0
    completed_orders = db.scalar(select(func.count(Order.id)).where(Order.status == "Delivered")) or 0
    cancelled_orders = db.scalar(select(func.count(Order.id)).where(Order.status == "Cancelled")) or 0
    total_revenue = db.scalar(select(func.sum(Order.total_amount)).where(Order.status == "Delivered")) or Decimal("0.00")
    new_inquiries = db.scalar(select(func.count(Contact.id)).where(Contact.status == "New")) or 0

    # Order status breakdown
    status_counts_raw = db.execute(
        select(Order.status, func.count(Order.id)).group_by(Order.status)
    ).all()
    status_distribution = {st: count for st, count in status_counts_raw}

    # Recent 5 Orders
    recent_orders_stmt = select(Order).order_by(Order.created_at.desc()).limit(5)
    recent_orders = db.scalars(recent_orders_stmt).all()
    recent_orders_data = [
        {
            "id": o.id,
            "order_number": o.order_number,
            "customer_name": o.customer_name,
            "total_amount": float(o.total_amount),
            "status": o.status,
            "created_at": o.created_at.isoformat()
        }
        for o in recent_orders
    ]

    return APIResponse(
        data={
            "metrics": {
                "total_users": total_users,
                "total_products": total_products,
                "total_orders": total_orders,
                "pending_orders": pending_orders,
                "completed_orders": completed_orders,
                "cancelled_orders": cancelled_orders,
                "total_revenue": float(total_revenue),
                "new_inquiries": new_inquiries
            },
            "status_distribution": status_distribution,
            "recent_orders": recent_orders_data
        }
    )


# ---------------- USER MANAGEMENT ----------------
@router.get("/users", response_model=APIResponse[List[UserProfileSchema]])
def list_users(
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = select(User).order_by(User.id.asc())
    if search:
        p = f"%{search.strip().lower()}%"
        query = query.where(or_(func.lower(User.full_name).like(p), func.lower(User.email).like(p)))

    users = db.scalars(query).all()
    result = []
    for u in users:
        roles = get_user_roles(u, db)
        result.append(
            UserProfileSchema(
                id=u.id,
                full_name=u.full_name,
                email=u.email,
                phone=u.phone,
                is_active=u.is_active,
                is_verified=u.is_verified,
                roles=roles
            )
        )
    return APIResponse(data=result)


@router.put("/users/{user_id}", response_model=APIResponse[UserProfileSchema])
def update_user(
    user_id: int,
    payload: AdminUserUpdateSchema,
    db: Session = Depends(get_db)
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.is_verified is not None:
        user.is_verified = payload.is_verified

    if payload.roles is not None:
        # clear existing roles
        for ur in list(user.user_roles):
            db.delete(ur)
        for r_name in payload.roles:
            role = db.scalars(select(Role).where(Role.name == r_name)).first()
            if not role:
                role = Role(name=r_name)
                db.add(role)
                db.flush()
            db.add(UserRole(user_id=user.id, role_id=role.id))

    db.commit()
    db.refresh(user)

    roles = get_user_roles(user, db)
    schema = UserProfileSchema(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        roles=roles
    )
    return APIResponse(message="User updated successfully", data=schema)


# ---------------- PRODUCT MANAGEMENT ----------------
@router.post("/products", response_model=APIResponse[ProductResponse])
def add_product(payload: ProductCreate, db: Session = Depends(get_db)):
    category = db.get(Category, payload.category_id)
    if not category:
        raise HTTPException(status_code=400, detail="Invalid category ID")

    new_prod = Product(
        category_id=payload.category_id,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        rating=payload.rating,
        stock=payload.stock,
        image_url=payload.image_url,
        is_active=payload.is_active
    )
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)

    resp = ProductResponse(
        id=new_prod.id,
        category_id=new_prod.category_id,
        category_name=category.name,
        category_slug=category.slug,
        name=new_prod.name,
        description=new_prod.description,
        price=new_prod.price,
        rating=new_prod.rating,
        stock=new_prod.stock,
        image_url=new_prod.image_url,
        is_active=new_prod.is_active,
        created_at=new_prod.created_at,
        updated_at=new_prod.updated_at
    )
    return APIResponse(message="Product created successfully", data=resp)


@router.put("/products/{product_id}", response_model=APIResponse[ProductResponse])
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db)
):
    prod = db.get(Product, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    if payload.category_id is not None:
        cat = db.get(Category, payload.category_id)
        if not cat:
            raise HTTPException(status_code=400, detail="Category not found")
        prod.category_id = payload.category_id

    if payload.name is not None:
        prod.name = payload.name
    if payload.description is not None:
        prod.description = payload.description
    if payload.price is not None:
        prod.price = payload.price
    if payload.rating is not None:
        prod.rating = payload.rating
    if payload.stock is not None:
        prod.stock = payload.stock
    if payload.image_url is not None:
        prod.image_url = payload.image_url
    if payload.is_active is not None:
        prod.is_active = payload.is_active

    db.commit()
    db.refresh(prod)

    resp = ProductResponse(
        id=prod.id,
        category_id=prod.category_id,
        category_name=prod.category.name,
        category_slug=prod.category.slug,
        name=prod.name,
        description=prod.description,
        price=prod.price,
        rating=prod.rating,
        stock=prod.stock,
        image_url=prod.image_url,
        is_active=prod.is_active,
        created_at=prod.created_at,
        updated_at=prod.updated_at
    )
    return APIResponse(message="Product updated successfully", data=resp)


@router.delete("/products/{product_id}", response_model=APIResponse[dict])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    prod = db.get(Product, product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Soft deletion
    prod.is_active = False
    db.commit()
    return APIResponse(message="Product deactivated successfully")


@router.post("/products/upload-image", response_model=APIResponse[dict])
async def upload_product_image(file: UploadFile = File(...)):
    # Validate mime
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed.")
    
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".avif"]:
        raise HTTPException(status_code=400, detail="Unsupported image extension.")

    # Save into Food/public/Assets/
    assets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "Food", "public", "Assets"))
    os.makedirs(assets_dir, exist_ok=True)

    filename = f"prod_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(assets_dir, filename)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    relative_url = f"Assets/{filename}"
    return APIResponse(message="Image uploaded successfully", data={"image_url": relative_url})


# ---------------- CATEGORY MANAGEMENT ----------------
@router.post("/categories", response_model=APIResponse[CategoryResponse])
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    cat = Category(
        name=payload.name,
        slug=payload.slug.lower().replace(" ", "_"),
        description=payload.description,
        is_active=payload.is_active
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return APIResponse(message="Category created successfully", data=CategoryResponse.model_validate(cat))


@router.put("/categories/{category_id}", response_model=APIResponse[CategoryResponse])
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)):
    cat = db.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    if payload.name is not None:
        cat.name = payload.name
    if payload.slug is not None:
        cat.slug = payload.slug.lower().replace(" ", "_")
    if payload.description is not None:
        cat.description = payload.description
    if payload.is_active is not None:
        cat.is_active = payload.is_active

    db.commit()
    db.refresh(cat)
    return APIResponse(message="Category updated successfully", data=CategoryResponse.model_validate(cat))


# ---------------- ORDER MANAGEMENT ----------------
@router.get("/orders", response_model=APIResponse[List[OrderResponse]])
def get_all_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = select(Order).order_by(Order.created_at.desc())
    if status_filter and status_filter.lower() != "all":
        query = query.where(Order.status == status_filter)
    if search:
        p = f"%{search.strip().lower()}%"
        query = query.where(or_(
            func.lower(Order.order_number).like(p),
            func.lower(Order.customer_name).like(p),
            func.lower(Order.customer_email).like(p)
        ))

    orders = db.scalars(query).all()
    results = []
    for o in orders:
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
            for i in o.items
        ]
        history_resp = [
            OrderStatusHistoryResponse(
                id=h.id,
                status=h.status,
                comment=h.comment,
                created_at=h.created_at
            )
            for h in o.status_history
        ]
        results.append(
            OrderResponse(
                id=o.id,
                order_number=o.order_number,
                user_id=o.user_id,
                customer_name=o.customer_name,
                customer_email=o.customer_email,
                customer_phone=o.customer_phone,
                delivery_address=o.delivery_address,
                order_notes=o.order_notes,
                subtotal=o.subtotal,
                tax=o.tax,
                shipping_fee=o.shipping_fee,
                total_amount=o.total_amount,
                status=o.status,
                payment_method=o.payment_method,
                payment_status=o.payment_status,
                payment_reference_id=o.payment_reference_id,
                items=items_resp,
                status_history=history_resp,
                created_at=o.created_at,
                updated_at=o.updated_at
            )
        )
    return APIResponse(data=results)


@router.put("/orders/{order_id}/status", response_model=APIResponse[OrderResponse])
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    background_tasks: BackgroundTasks,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    updated = await update_order_status_and_notify(
        db=db,
        order=order,
        new_status=payload.status,
        comment=payload.comment,
        admin_user_id=current_admin.id,
        background_tasks=background_tasks
    )

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
        for i in updated.items
    ]
    history_resp = [
        OrderStatusHistoryResponse(
            id=h.id,
            status=h.status,
            comment=h.comment,
            created_at=h.created_at
        )
        for h in updated.status_history
    ]
    resp = OrderResponse(
        id=updated.id,
        order_number=updated.order_number,
        user_id=updated.user_id,
        customer_name=updated.customer_name,
        customer_email=updated.customer_email,
        customer_phone=updated.customer_phone,
        delivery_address=updated.delivery_address,
        order_notes=updated.order_notes,
        subtotal=updated.subtotal,
        tax=updated.tax,
        shipping_fee=updated.shipping_fee,
        total_amount=updated.total_amount,
        status=updated.status,
        payment_method=updated.payment_method,
        payment_status=updated.payment_status,
        payment_reference_id=updated.payment_reference_id,
        items=items_resp,
        status_history=history_resp,
        created_at=updated.created_at,
        updated_at=updated.updated_at
    )
    return APIResponse(message=f"Order status updated to {payload.status}", data=resp)


# ---------------- CONTACT MANAGEMENT ----------------
@router.get("/contacts", response_model=APIResponse[List[ContactResponse]])
def get_all_contacts(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = select(Contact).order_by(Contact.created_at.desc())
    if status_filter and status_filter.lower() != "all":
        query = query.where(Contact.status == status_filter)
    if search:
        p = f"%{search.strip().lower()}%"
        query = query.where(or_(
            func.lower(Contact.full_name).like(p),
            func.lower(Contact.email).like(p),
            func.lower(Contact.subject).like(p)
        ))

    contacts = db.scalars(query).all()
    results = []
    for c in contacts:
        notes_resp = [
            ContactNoteResponse(
                id=n.id,
                admin_name=n.admin_name,
                note=n.note,
                created_at=n.created_at
            )
            for n in c.notes
        ]
        results.append(
            ContactResponse(
                id=c.id,
                full_name=c.full_name,
                email=c.email,
                phone=c.phone,
                subject=c.subject,
                message=c.message,
                status=c.status,
                is_verified=c.is_verified,
                notes=notes_resp,
                created_at=c.created_at
            )
        )
    return APIResponse(data=results)


@router.put("/contacts/{contact_id}/status", response_model=APIResponse[dict])
def update_contact_status(
    contact_id: int,
    payload: ContactStatusUpdate,
    db: Session = Depends(get_db)
):
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    contact.status = payload.status
    db.commit()
    return APIResponse(message=f"Inquiry marked as {payload.status}")


@router.post("/contacts/{contact_id}/notes", response_model=APIResponse[ContactNoteResponse])
def add_contact_note(
    contact_id: int,
    payload: ContactNoteCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    note = ContactNote(
        contact_id=contact.id,
        admin_user_id=current_admin.id,
        admin_name=current_admin.full_name,
        note=payload.note
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return APIResponse(
        message="Note added successfully",
        data=ContactNoteResponse(
            id=note.id,
            admin_name=note.admin_name,
            note=note.note,
            created_at=note.created_at
        )
    )


@router.post("/contacts/{contact_id}/reply", response_model=APIResponse[dict])
def reply_to_contact(
    contact_id: int,
    payload: ContactReplyRequest,
    background_tasks: BackgroundTasks,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    email_html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; padding: 20px;">
      <div style="background-color: #1e1e1e; border: 1px solid #333; border-radius: 8px; max-width: 550px; margin: auto; padding: 25px;">
        <h2 style="color: #ff9800;">Response to Your Inquiry: {contact.subject}</h2>
        <p>Hello <strong>{contact.full_name}</strong>,</p>
        <p>Our support team has responded to your message:</p>
        <div style="background-color: #2b2b2b; padding: 15px; border-left: 4px solid #ff9800; margin: 15px 0;">
          {payload.message}
        </div>
        <p>Best regards,<br/>{current_admin.full_name}<br/>FoodyZone Support Team</p>
      </div>
    </body>
    </html>
    """
    background_tasks.add_task(
        send_email_sync,
        contact.email,
        f"Update regarding: {contact.subject}",
        email_html
    )

    # Automatically add an internal note that reply was dispatched
    note = ContactNote(
        contact_id=contact.id,
        admin_user_id=current_admin.id,
        admin_name=current_admin.full_name,
        note=f"[Email Reply Sent]: {payload.message}"
    )
    db.add(note)
    contact.status = "Resolved"
    db.commit()

    return APIResponse(message="Reply sent to customer via email")


@router.delete("/contacts/{contact_id}", response_model=APIResponse[dict])
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    contact = db.get(Contact, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    db.delete(contact)
    db.commit()
    return APIResponse(message="Contact inquiry deleted")
