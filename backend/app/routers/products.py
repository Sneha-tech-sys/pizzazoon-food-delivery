from typing import Optional, List
from math import ceil
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, and_, func

from app.database.session import get_db
from app.models.product import Product
from app.models.category import Category
from app.schemas.product import ProductResponse
from app.schemas.common import APIResponse, PaginatedResponse

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=APIResponse[PaginatedResponse[ProductResponse]])
def get_products(
    category: Optional[str] = Query(None, description="Category slug or name filter"),
    search: Optional[str] = Query(None, description="Search term in product name or description"),
    sort_by: Optional[str] = Query("id", description="Sort by: id, price_asc, price_desc, rating, name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = select(Product).join(Category).where(Product.is_active == True, Category.is_active == True)

    if category and category.lower() != "all":
        query = query.where(
            or_(
                func.lower(Category.slug) == category.lower(),
                func.lower(Category.name) == category.lower()
            )
        )

    if search:
        search_pattern = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(Product.name).like(search_pattern),
                func.lower(Product.description).like(search_pattern)
            )
        )

    # Sorting
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "rating":
        query = query.order_by(Product.rating.desc())
    elif sort_by == "name":
        query = query.order_by(Product.name.asc())
    else:
        query = query.order_by(Product.id.asc())

    # Count total
    count_stmt = select(func.count()).select_from(query.subquery())
    total_count = db.scalar(count_stmt) or 0

    # Paginate
    items_stmt = query.offset((page - 1) * page_size).limit(page_size)
    products = db.scalars(items_stmt).all()

    # Format responses
    product_responses = []
    for p in products:
        p_resp = ProductResponse(
            id=p.id,
            category_id=p.category_id,
            category_name=p.category.name,
            category_slug=p.category.slug,
            name=p.name,
            description=p.description,
            price=p.price,
            rating=p.rating,
            stock=p.stock,
            image_url=p.image_url,
            is_active=p.is_active,
            created_at=p.created_at,
            updated_at=p.updated_at
        )
        product_responses.append(p_resp)

    paginated = PaginatedResponse(
        items=product_responses,
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=ceil(total_count / page_size) if page_size > 0 else 1
    )
    return APIResponse(data=paginated)


@router.get("/{product_id}", response_model=APIResponse[ProductResponse])
def get_product(product_id: int, db: Session = Depends(get_db)):
    prod = db.get(Product, product_id)
    if not prod or not prod.is_active:
        raise HTTPException(status_code=404, detail="Product not found")

    p_resp = ProductResponse(
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
    return APIResponse(data=p_resp)
