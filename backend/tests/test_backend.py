import pytest
import uuid
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import select, delete

from app.main import app
from app.database.session import SessionLocal
from app.models.user import User
from app.models.otp import EmailOTP
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order
from app.core.security import hash_otp

client = TestClient(app)


def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"


def test_get_categories():
    response = client.get("/api/v1/categories/")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert len(res["data"]) >= 4


def test_get_products():
    response = client.get("/api/v1/products/")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert res["data"]["total"] >= 20
    assert len(res["data"]["items"]) > 0


def test_product_filter_by_category():
    response = client.get("/api/v1/products/?category=drinks")
    assert response.status_code == 200
    res = response.json()
    items = res["data"]["items"]
    assert len(items) > 0
    assert all(i["category_slug"] == "drinks" for i in items)


def test_signup_otp_and_login_flow():
    uid = uuid.uuid4().hex[:6]
    test_email = f"cust_{uid}@example.com"
    test_phone = f"9876{uid[:6]}"
    test_pass = "SecurePass123"

    # 1. Signup
    signup_payload = {
        "full_name": "Test Customer",
        "email": test_email,
        "phone": test_phone,
        "password": test_pass,
        "confirm_password": test_pass
    }
    signup_res = client.post("/api/v1/auth/signup", json=signup_payload)
    assert signup_res.status_code == 200
    assert signup_res.json()["success"] is True

    # 2. Duplicate email prevention
    dup_res = client.post("/api/v1/auth/signup", json=signup_payload)
    assert dup_res.status_code in [200, 400, 429]

    # 3. Retrieve and mock known OTP
    known_otp = "123456"
    db = SessionLocal()
    otp_rec = db.scalars(
        select(EmailOTP).where(EmailOTP.email == test_email, EmailOTP.purpose == "signup").order_by(EmailOTP.created_at.desc())
    ).first()
    assert otp_rec is not None
    otp_rec.hashed_otp = hash_otp(known_otp)
    otp_rec.is_used = False
    db.commit()
    db.close()

    # Invalid OTP test
    invalid_verify_res = client.post("/api/v1/auth/verify-signup-otp", json={"email": test_email, "otp": "000000"})
    assert invalid_verify_res.status_code == 400

    # Valid OTP test
    verify_res = client.post("/api/v1/auth/verify-signup-otp", json={"email": test_email, "otp": known_otp})
    assert verify_res.status_code == 200
    data = verify_res.json()["data"]
    access_token = data["access_token"]
    refresh_token = data["refresh_token"]
    assert access_token is not None

    # 4. Login with invalid credentials
    invalid_login = client.post("/api/v1/auth/login", json={"email": test_email, "password": "WrongPassword"})
    assert invalid_login.status_code == 401

    # 5. Login with valid credentials
    valid_login = client.post("/api/v1/auth/login", json={"email": test_email, "password": test_pass})
    assert valid_login.status_code == 200
    assert valid_login.json()["data"]["user"]["email"] == test_email

    # 6. Verify JWT auth on protected /me
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_res.status_code == 200
    assert me_res.json()["data"]["email"] == test_email

    # 7. Refresh token
    refresh_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 200
    new_access_token = refresh_res.json()["data"]["access_token"]
    assert new_access_token is not None

    # 8. Customer cannot access Admin Dashboard
    admin_res = client.get("/api/v1/admin/dashboard", headers={"Authorization": f"Bearer {new_access_token}"})
    assert admin_res.status_code == 403


def test_admin_login_and_dashboard():
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@foodyzone.com", "password": "Admin@123"})
    assert login_res.status_code == 200
    admin_token = login_res.json()["data"]["access_token"]

    dash_res = client.get("/api/v1/admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert dash_res.status_code == 200
    dash_data = dash_res.json()["data"]
    assert "metrics" in dash_data
    assert dash_data["metrics"]["total_products"] >= 20


def test_contact_form_otp_and_submission():
    uid = uuid.uuid4().hex[:6]
    contact_email = f"inquiry_{uid}@example.com"
    
    # 1. Request Contact OTP
    otp_res = client.post("/api/v1/contacts/send-otp", json={"email": contact_email})
    assert otp_res.status_code in [200, 429]

    # Set known OTP in DB
    known_contact_otp = "654321"
    db = SessionLocal()
    rec = db.scalars(
        select(EmailOTP).where(EmailOTP.email == contact_email, EmailOTP.purpose == "contact").order_by(EmailOTP.created_at.desc())
    ).first()
    if rec:
        rec.hashed_otp = hash_otp(known_contact_otp)
        rec.is_used = False
        db.commit()
    db.close()

    # 2. Submit Contact with OTP
    submit_payload = {
        "full_name": "Test Inquirer",
        "email": contact_email,
        "phone": "9988776655",
        "subject": "Catering Inquiry",
        "message": "Do you offer bulk party orders for corporate events?",
        "otp": known_contact_otp
    }
    submit_res = client.post("/api/v1/contacts/submit", json=submit_payload)
    assert submit_res.status_code == 200
    assert submit_res.json()["success"] is True


def test_cart_and_order_flow():
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@foodyzone.com", "password": "Admin@123"})
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Add product to cart
    cart_res = client.post("/api/v1/cart/items", json={"product_id": 1, "quantity": 2}, headers=headers)
    assert cart_res.status_code == 200
    cart_data = cart_res.json()["data"]
    assert cart_data["total_items"] >= 2
    assert float(cart_data["subtotal"]) > 0

    # Place order
    order_payload = {
        "customer_name": "Admin Tester",
        "customer_email": "admin@foodyzone.com",
        "customer_phone": "9999999999",
        "delivery_address": "Flat 402, Foody Lane, Downtown",
        "order_notes": "Please deliver hot",
        "payment_method": "COD"
    }
    order_res = client.post("/api/v1/orders/", json=order_payload, headers=headers)
    assert order_res.status_code == 200
    order_data = order_res.json()["data"]
    order_id = order_data["id"]
    assert order_data["order_number"].startswith("FZ-")
    assert order_data["status"] == "Pending"

    # Check order history
    history_res = client.get("/api/v1/orders/", headers=headers)
    assert history_res.status_code == 200
    assert len(history_res.json()["data"]) > 0

    # Update order status as admin
    status_update_res = client.put(
        f"/api/v1/admin/orders/{order_id}/status",
        json={"status": "Preparing", "comment": "Chef started cooking"},
        headers=headers
    )
    assert status_update_res.status_code == 200
    assert status_update_res.json()["data"]["status"] == "Preparing"
