from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from app.models.otp import EmailOTP
from app.core.security import generate_six_digit_otp, hash_otp, verify_otp_hash
from app.core.config import settings
from app.services.email_service import send_email_sync, get_otp_email_template


def create_and_send_otp(
    db: Session,
    email: str,
    purpose: str,
    background_tasks: BackgroundTasks
) -> str:
    """Generate, store hashed OTP in database, and dispatch via email."""
    now = datetime.now(timezone.utc)
    
    # 1. Rate-limit check: Ensure at least OTP_RESEND_COOLDOWN_SECONDS between requests
    recent_otp_stmt = (
        select(EmailOTP)
        .where(
            and_(
                EmailOTP.email == email,
                EmailOTP.purpose == purpose,
                EmailOTP.created_at >= now - timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS)
            )
        )
        .order_by(EmailOTP.created_at.desc())
    )
    if db.scalars(recent_otp_stmt).first():
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {settings.OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting a new OTP."
        )

    # 2. Invalidate older unused OTPs for this email and purpose
    invalidate_stmt = (
        select(EmailOTP)
        .where(
            and_(
                EmailOTP.email == email,
                EmailOTP.purpose == purpose,
                EmailOTP.is_used == False
            )
        )
    )
    old_otps = db.scalars(invalidate_stmt).all()
    for old in old_otps:
        old.is_used = True

    # 3. Generate new 6-digit OTP
    raw_otp = generate_six_digit_otp()
    hashed = hash_otp(raw_otp)
    expires_at = now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    new_otp_record = EmailOTP(
        email=email,
        hashed_otp=hashed,
        purpose=purpose,
        attempts=0,
        is_used=False,
        expires_at=expires_at
    )
    db.add(new_otp_record)
    db.commit()

    # 4. Schedule email dispatch
    email_subject = f"Your FoodyZone {purpose.replace('_', ' ').capitalize()} Code: {raw_otp}"
    email_body = get_otp_email_template(raw_otp, purpose=purpose.replace('_', ' ').capitalize())
    background_tasks.add_task(send_email_sync, email, email_subject, email_body)

    return raw_otp


def verify_otp(db: Session, email: str, purpose: str, plain_otp: str) -> bool:
    """Validate OTP against stored hash with expiration and attempt limits."""
    now = datetime.now(timezone.utc)

    stmt = (
        select(EmailOTP)
        .where(
            and_(
                EmailOTP.email == email,
                EmailOTP.purpose == purpose,
                EmailOTP.is_used == False
            )
        )
        .order_by(EmailOTP.created_at.desc())
    )
    otp_record = db.scalars(stmt).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP found or OTP already used. Please request a new one."
        )

    # Check expiration
    if otp_record.expires_at < now:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one."
        )

    # Check attempts
    if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum OTP verification attempts exceeded. Please request a new one."
        )

    # Increment attempts
    otp_record.attempts += 1

    # Verify Hash
    if not verify_otp_hash(plain_otp, otp_record.hashed_otp):
        db.commit()
        remaining = settings.OTP_MAX_ATTEMPTS - otp_record.attempts
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP code. {remaining} attempt(s) remaining."
        )

    # Mark as successfully used
    otp_record.is_used = True
    db.commit()
    return True
