from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import (
    SignupRequest,
    VerifySignupOTPRequest,
    ResendOTPRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserProfileSchema
)
from app.schemas.common import APIResponse
from app.services.auth_service import (
    register_user,
    verify_user_signup_otp,
    authenticate_user,
    rotate_refresh_token,
    logout_user,
    get_user_roles
)
from app.services.otp_service import create_and_send_otp, verify_otp
from app.core.security import hash_password
from app.core.dependencies import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=APIResponse[dict])
def signup(
    payload: SignupRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user, raw_otp = register_user(
        db=db,
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        password=payload.password,
        background_tasks=background_tasks
    )
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        msg = f"Registration initiated. (Dev Mode Code: {raw_otp})"
    else:
        msg = "Registration initiated. A 6-digit verification code has been sent to your email."

    return APIResponse(
        message=msg,
        data={"email": user.email, "is_verified": user.is_verified}
    )


@router.post("/verify-signup-otp", response_model=APIResponse[TokenResponse])
def verify_signup_otp(
    payload: VerifySignupOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    access_token, refresh_token, user, roles = verify_user_signup_otp(
        db=db,
        email=payload.email,
        otp=payload.otp,
        background_tasks=background_tasks
    )
    user_schema = UserProfileSchema(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        roles=roles
    )
    token_resp = TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_schema
    )
    return APIResponse(message="Account successfully verified!", data=token_resp)


@router.post("/resend-otp", response_model=APIResponse[dict])
def resend_otp(
    payload: ResendOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    create_and_send_otp(db, payload.email, payload.purpose, background_tasks)
    return APIResponse(message="A new 6-digit verification code has been sent.")


@router.post("/login", response_model=APIResponse[TokenResponse])
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    access_token, refresh_token, user, roles = authenticate_user(
        db=db,
        email=payload.email,
        password=payload.password
    )
    user_schema = UserProfileSchema(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        roles=roles
    )
    token_resp = TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_schema
    )
    return APIResponse(message="Login successful!", data=token_resp)


@router.post("/refresh", response_model=APIResponse[TokenResponse])
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    access_token, refresh_token, user, roles = rotate_refresh_token(
        db=db,
        raw_refresh_token=payload.refresh_token
    )
    user_schema = UserProfileSchema(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        roles=roles
    )
    token_resp = TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_schema
    )
    return APIResponse(message="Token successfully refreshed", data=token_resp)


@router.post("/logout", response_model=APIResponse[dict])
def logout(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    logout_user(db, payload.refresh_token)
    return APIResponse(message="Logged out successfully")


@router.post("/forgot-password", response_model=APIResponse[dict])
def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.scalars(select(User).where(User.email == payload.email)).first()
    if not user:
        # Prevent email enumeration: return success message anyway
        return APIResponse(message="If the email exists, a password reset code has been sent.")

    create_and_send_otp(db, payload.email, "forgot_password", background_tasks)
    return APIResponse(message="A password reset OTP has been sent to your email.")


@router.post("/reset-password", response_model=APIResponse[dict])
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    verify_otp(db, payload.email, "forgot_password", payload.otp)
    user = db.scalars(select(User).where(User.email == payload.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(payload.new_password)
    # Revoke old refresh tokens for security
    for rt in user.refresh_tokens:
        rt.is_revoked = True

    db.commit()
    return APIResponse(message="Password reset successfully. You can now login with your new password.")


@router.get("/me", response_model=APIResponse[UserProfileSchema])
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    roles = get_user_roles(db, current_user.id)
    schema = UserProfileSchema(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        roles=roles
    )
    return APIResponse(data=schema)
