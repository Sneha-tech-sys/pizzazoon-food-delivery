from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.session import get_db
from app.models.category import Category
from app.schemas.product import CategoryResponse
from app.schemas.common import APIResponse

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=APIResponse[List[CategoryResponse]])
def get_categories(db: Session = Depends(get_db)):
    stmt = select(Category).where(Category.is_active == True).order_by(Category.name.asc())
    cats = db.scalars(stmt).all()
    data = [CategoryResponse.model_validate(c) for c in cats]
    return APIResponse(data=data)


@router.get("/{category_id}", response_model=APIResponse[CategoryResponse])
def get_category_by_id(category_id: int, db: Session = Depends(get_db)):
    cat = db.get(Category, category_id)
    if not cat or not cat.is_active:
        raise HTTPException(status_code=404, detail="Category not found")
    return APIResponse(data=CategoryResponse.model_validate(cat))
