from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.session import get_db
from app.models.contact import Contact
from app.schemas.contact import (
    ContactSendOTPRequest,
    ContactVerifyOTPRequest,
    ContactSubmitRequest,
    ContactResponse
)
from app.schemas.common import APIResponse
from app.services.otp_service import create_and_send_otp, verify_otp
from app.services.email_service import (
    send_email_sync,
    get_contact_ack_email_template,
    get_contact_admin_notification_template
)
from app.core.config import settings

router = APIRouter(prefix="/contacts", tags=["Contacts"])


@router.post("/send-otp", response_model=APIResponse[dict])
def send_contact_otp(
    payload: ContactSendOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    raw_otp = create_and_send_otp(db, payload.email, "contact", background_tasks)
    
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        msg = f"A 6-digit verification code has been dispatched. (Dev Mode Code: {raw_otp})"
    else:
        msg = "A 6-digit verification code has been dispatched to your email."
        
    return APIResponse(message=msg, data={"email": payload.email})


@router.post("/verify-otp", response_model=APIResponse[dict])
def verify_contact_otp(
    payload: ContactVerifyOTPRequest,
    db: Session = Depends(get_db)
):
    # Note: verify_otp consumes the OTP once checked
    verify_otp(db, payload.email, "contact", payload.otp)
    return APIResponse(message="Email successfully verified for contact submission.")


@router.post("/submit", response_model=APIResponse[dict])
def submit_contact_form(
    payload: ContactSubmitRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # 1. Verify OTP first (prevents unverified entries)
    verify_otp(db, payload.email, "contact", payload.otp)

    # 2. Persist verified contact inquiry
    new_contact = Contact(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        subject=payload.subject,
        message=payload.message,
        status="New",
        is_verified=True
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)

    # 3. Send acknowledgement email to customer
    ack_html = get_contact_ack_email_template(payload.full_name, payload.subject, payload.message)
    background_tasks.add_task(
        send_email_sync,
        payload.email,
        f"We have received your message: {payload.subject}",
        ack_html
    )

    # 4. Send notification email to admin
    if settings.ADMIN_EMAIL:
        admin_html = get_contact_admin_notification_template({
            "full_name": payload.full_name,
            "email": payload.email,
            "phone": payload.phone,
            "subject": payload.subject,
            "message": payload.message
        })
        background_tasks.add_task(
            send_email_sync,
            settings.ADMIN_EMAIL,
            f"New Contact Inquiry: {payload.subject}",
            admin_html
        )

    return APIResponse(
        message="Thank you! Your verified message has been submitted. Our team will get back to you shortly.",
        data={"contact_id": new_contact.id}
    )
