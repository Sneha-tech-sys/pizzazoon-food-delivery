import hashlib
from datetime import datetime, timezone, timedelta
from typing import Tuple, Dict, Any, List
from fastapi import HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select, or_

from app.models.user import User, RefreshToken
from app.models.role import Role, UserRole
from app.models.cart import Cart
from app.models.wishlist import Wishlist
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.core.config import settings
from app.services.otp_service import create_and_send_otp, verify_otp
from app.services.email_service import send_email_sync, get_welcome_email_template


def get_user_roles(db: Session, user_id: int) -> List[str]:
    stmt = (
        select(Role.name)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user_id)
    )
    return list(db.scalars(stmt).all())


def register_user(
    db: Session,
    full_name: str,
    email: str,
    phone: str,
    password: str,
    background_tasks: BackgroundTasks
) -> User:
    # 1. Check duplicate email or phone
    existing_stmt = select(User).where(or_(User.email == email, User.phone == phone))
    existing_user = db.scalars(existing_stmt).first()
    if existing_user:
        if existing_user.email == email:
            if not existing_user.is_verified:
                # User exists but not verified; update details and resend OTP
                existing_user.full_name = full_name
                existing_user.phone = phone
                existing_user.hashed_password = hash_password(password)
                db.commit()
                raw_otp = create_and_send_otp(db, email, "signup", background_tasks)
                return existing_user, raw_otp
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )
        if existing_user.phone == phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this phone number already exists."
            )

    # 2. Create unverified user
    new_user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        hashed_password=hash_password(password),
        is_active=True,
        is_verified=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 3. Ensure "customer" role exists and associate
    customer_role = db.scalars(select(Role).where(Role.name == "customer")).first()
    if not customer_role:
        customer_role = Role(name="customer", description="Standard customer account")
        db.add(customer_role)
        db.commit()
        db.refresh(customer_role)

    user_role = UserRole(user_id=new_user.id, role_id=customer_role.id)
    db.add(user_role)

    # 4. Initialize Cart & Wishlist
    db.add(Cart(user_id=new_user.id))
    db.add(Wishlist(user_id=new_user.id))
    db.commit()

    # 5. Send verification OTP
    raw_otp = create_and_send_otp(db, email, "signup", background_tasks)

    return new_user, raw_otp


def verify_user_signup_otp(
    db: Session,
    email: str,
    otp: str,
    background_tasks: BackgroundTasks
) -> Tuple[str, str, User, List[str]]:
    # 1. Verify OTP
    verify_otp(db, email, "signup", otp)

    # 2. Fetch User and activate
    user = db.scalars(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_verified = True
    db.commit()

    # 3. Send welcome email in background
    welcome_body = get_welcome_email_template(user.full_name)
    background_tasks.add_task(send_email_sync, user.email, "Welcome to FoodyZone!", welcome_body)

    # 4. Generate JWT tokens
    roles = get_user_roles(db, user.id)
    access_token = create_access_token(user.id, extra_claims={"roles": roles, "email": user.email})
    refresh_token = create_refresh_token(user.id)

    # 5. Store refresh token hash
    store_refresh_token(db, user.id, refresh_token)

    return access_token, refresh_token, user, roles


def authenticate_user(
    db: Session,
    email: str,
    password: str
) -> Tuple[str, str, User, List[str]]:
    user = db.scalars(select(User).where(User.email == email)).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact support."
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before logging in."
        )

    roles = get_user_roles(db, user.id)
    access_token = create_access_token(user.id, extra_claims={"roles": roles, "email": user.email})
    refresh_token = create_refresh_token(user.id)

    store_refresh_token(db, user.id, refresh_token)

    return access_token, refresh_token, user, roles


def store_refresh_token(db: Session, user_id: int, refresh_token: str):
    token_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    rt_record = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        is_revoked=False,
        expires_at=expires_at
    )
    db.add(rt_record)
    db.commit()


def rotate_refresh_token(
    db: Session,
    raw_refresh_token: str
) -> Tuple[str, str, User, List[str]]:
    payload = decode_token(raw_refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    token_hash = hashlib.sha256(raw_refresh_token.encode("utf-8")).hexdigest()
    rt_record = db.scalars(select(RefreshToken).where(RefreshToken.token_hash == token_hash)).first()
    
    if not rt_record or rt_record.is_revoked or rt_record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked or expired")

    # Invalidate used refresh token
    rt_record.is_revoked = True
    db.commit()

    user = db.get(User, rt_record.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not active")

    roles = get_user_roles(db, user.id)
    new_access_token = create_access_token(user.id, extra_claims={"roles": roles, "email": user.email})
    new_refresh_token = create_refresh_token(user.id)

    store_refresh_token(db, user.id, new_refresh_token)

    return new_access_token, new_refresh_token, user, roles


def logout_user(db: Session, raw_refresh_token: str):
    token_hash = hashlib.sha256(raw_refresh_token.encode("utf-8")).hexdigest()
    rt_record = db.scalars(select(RefreshToken).where(RefreshToken.token_hash == token_hash)).first()
    if rt_record:
        rt_record.is_revoked = True
        db.commit()
    return True
