import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger("email_service")
logging.basicConfig(level=logging.INFO)


def send_email_sync(recipient_email: str, subject: str, html_content: str):
    """Send an HTML email via SMTP, logging fallback if SMTP credentials not configured."""
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.info(
            f"\n================ [EMAIL SIMULATION] ================\n"
            f"To: {recipient_email}\n"
            f"Subject: {subject}\n"
            f"Content Preview: {html_content[:300]}...\n"
            f"====================================================\n"
        )
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = recipient_email

        part = MIMEText(html_content, "html")
        msg.attach(part)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, recipient_email, msg.as_string())
        logger.info(f"Email successfully sent to {recipient_email} via SMTP")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
        return False


def get_otp_email_template(otp: str, purpose: str = "Verification") -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #121212; color: #ffffff; padding: 20px; }}
        .card {{ background-color: #1e1e1e; border: 1px solid #333333; border-radius: 10px; max-width: 500px; margin: auto; padding: 30px; }}
        .header {{ text-align: center; color: #ff9800; font-size: 28px; font-weight: bold; margin-bottom: 20px; }}
        .otp-box {{ background-color: #2c2c2c; border: 2px dashed #ff9800; border-radius: 8px; text-align: center; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ff9800; margin: 25px 0; }}
        .footer {{ font-size: 12px; color: #888888; text-align: center; margin-top: 25px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">Foody<span style="color: #ffffff;">Zone</span></div>
        <p>Hello,</p>
        <p>Your one-time verification code for <strong>{purpose}</strong> is:</p>
        <div class="otp-box">{otp}</div>
        <p>This OTP will expire in <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
        <div class="footer">© 2026 FoodyZone - Delicious Food Delivered Fast.</div>
      </div>
    </body>
    </html>
    """


def get_welcome_email_template(full_name: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #121212; color: #ffffff; padding: 20px; }}
        .card {{ background-color: #1e1e1e; border: 1px solid #333333; border-radius: 10px; max-width: 500px; margin: auto; padding: 30px; }}
        .header {{ text-align: center; color: #ff9800; font-size: 28px; font-weight: bold; margin-bottom: 20px; }}
        .footer {{ font-size: 12px; color: #888888; text-align: center; margin-top: 25px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">Welcome to Foody<span style="color: #ffffff;">Zone</span>!</div>
        <p>Hi <strong>{full_name}</strong>,</p>
        <p>Your account has been successfully verified! You can now explore our delicious menu, add items to your cart, and enjoy fresh food delivered straight to your door.</p>
        <p>Bon Appétit!<br/>The FoodyZone Team</p>
        <div class="footer">© 2026 FoodyZone - Delicious Food Delivered Fast.</div>
      </div>
    </body>
    </html>
    """


def get_contact_ack_email_template(full_name: str, subject: str, message: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; padding: 20px;">
      <div style="background-color: #1e1e1e; border: 1px solid #333; border-radius: 8px; max-width: 500px; margin: auto; padding: 25px;">
        <h2 style="color: #ff9800;">Foody<span style="color: #fff;">Zone</span> Contact Confirmation</h2>
        <p>Hello <strong>{full_name}</strong>,</p>
        <p>Thank you for reaching out! We have received your verified message regarding: <strong>{subject}</strong>.</p>
        <p style="background-color: #2b2b2b; padding: 12px; border-left: 4px solid #ff9800; font-style: italic;">"{message}"</p>
        <p>Our support team is reviewing it and will respond promptly.</p>
        <p style="font-size: 12px; color: #888;">© 2026 FoodyZone Support</p>
      </div>
    </body>
    </html>
    """


def get_contact_admin_notification_template(contact_data: dict) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333; padding: 20px;">
      <div style="background-color: #fff; border: 1px solid #ddd; border-radius: 8px; max-width: 550px; margin: auto; padding: 25px;">
        <h2 style="color: #e65100;">New Verified Contact Inquiry</h2>
        <p><strong>From:</strong> {contact_data.get('full_name')} ({contact_data.get('email')})</p>
        <p><strong>Phone:</strong> {contact_data.get('phone')}</p>
        <p><strong>Subject:</strong> {contact_data.get('subject')}</p>
        <p><strong>Message:</strong></p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #e65100;">
          {contact_data.get('message')}
        </div>
      </div>
    </body>
    </html>
    """


def get_order_confirmation_template(order_number: str, customer_name: str, total_amount: float, items_summary: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; padding: 20px;">
      <div style="background-color: #1e1e1e; border: 1px solid #333; border-radius: 8px; max-width: 550px; margin: auto; padding: 25px;">
        <h2 style="color: #ff9800;">Order Confirmed! #{order_number}</h2>
        <p>Hello <strong>{customer_name}</strong>,</p>
        <p>Thank you for ordering with FoodyZone! Your order has been placed successfully.</p>
        <p><strong>Items:</strong></p>
        <div>{items_summary}</div>
        <p><strong>Total Amount:</strong> ₹{total_amount:.2f}</p>
        <p>You can track the live preparation and delivery status directly in your dashboard.</p>
        <p style="font-size: 12px; color: #888;">© 2026 FoodyZone Delivery</p>
      </div>
    </body>
    </html>
    """


def get_order_status_update_template(order_number: str, status: str, comment: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; padding: 20px;">
      <div style="background-color: #1e1e1e; border: 1px solid #333; border-radius: 8px; max-width: 550px; margin: auto; padding: 25px;">
        <h2 style="color: #ff9800;">Order Status Update: {status}</h2>
        <p>Your order <strong>#{order_number}</strong> is now: <strong style="color: #ff9800;">{status}</strong></p>
        {f"<p>Note: {comment}</p>" if comment else ""}
        <p style="font-size: 12px; color: #888;">© 2026 FoodyZone Delivery</p>
      </div>
    </body>
    </html>
    """
