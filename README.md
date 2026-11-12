# FoodyZone - Full-Stack Food Delivery Application

A production-ready full-stack Food Ordering and Delivery platform engineered with a **React.js frontend** and a high-performance **Python FastAPI + PostgreSQL backend**, featuring JWT authentication with refresh token rotation, Argon2/Bcrypt password hashing, email verification OTP, verified contact inquiry workflows, real-time WebSocket order tracking, and an integrated Admin Management Portal.

---

## 1. Project Architecture

```
Fooddelevery/
├── Food/                         # React Frontend Application
│   ├── public/
│   │   ├── Assets/              # Food images & media assets
│   │   └── index.html           # Bootstrap & FontAwesome CDN links
│   ├── src/
│   │   ├── Admin/               # Admin Management Portal
│   │   │   ├── AdminLayout.jsx      # Admin Sidebar & navigation guard
│   │   │   ├── AdminDashboard.jsx   # Metrics, charts, revenue, recent orders
│   │   │   ├── AdminOrders.jsx      # Order lifecycle & WebSocket trigger
│   │   │   ├── AdminProducts.jsx    # Dish catalog, price, stock, image upload
│   │   │   ├── AdminCategories.jsx  # Category management
│   │   │   ├── AdminUsers.jsx       # User accounts & verification status
│   │   │   ├── AdminContacts.jsx    # Verified inquiries, notes, email reply
│   │   │   └── AdminSettings.jsx    # System connectivity & environment status
│   │   ├── api/
│   │   │   └── client.js        # Centralized Axios with JWT interceptors
│   │   ├── Components/          # Header, Fotter, CartItem, Slider, Filter
│   │   ├── Contex/              # AuthContext, CartContext, FilterContext
│   │   ├── Pages/               # Home, Food, Cart, Wishlist, Checkout, Login, Signup, Contact, OrderTracking
│   │   └── App.js               # Route declarations & AuthProvider
│   ├── .env                     # Frontend environment variables
│   ├── .env.example
│   └── package.json
│
├── backend/                     # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py              # Application entrypoint & CORS middleware
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic v2 settings
│   │   │   ├── security.py      # Argon2/Bcrypt hashing, JWT access/refresh tokens, OTP
│   │   │   ├── dependencies.py  # Auth dependencies (get_current_user, get_current_admin)
│   │   │   └── permissions.py   # RBAC & order status enumerations
│   │   ├── database/
│   │   │   ├── connection.py    # Engine & Base exports
│   │   │   ├── session.py       # SessionLocal & get_db dependency
│   │   │   └── base.py          # DeclarativeBase with timestamp mixin
│   │   ├── models/              # SQLAlchemy 2.0 ORM models (User, Role, Product, Order, etc.)
│   │   ├── schemas/             # Pydantic v2 validation models
│   │   ├── routers/             # Versioned REST APIs & WebSocket gateway
│   │   ├── services/            # Email (SMTP), OTP, Auth, Order, and WebSocket Manager
│   │   ├── utils/               # Responses & regex validators
│   │   └── seed/
│   │       └── create_admin.py  # Initial admin, categories & dish catalogue seeder
│   ├── alembic_migrations/      # Alembic database migration revisions
│   ├── tests/                   # Pytest test suite (100% passing)
│   ├── .env                     # Backend environment configuration
│   ├── .env.example
│   └── requirements.txt
└── README.md
```

---

## 2. Prerequisites

- **Python**: 3.12+ (tested and running on Python 3.13.1)
- **Node.js**: v18+ (tested on Node.js v26.3.0 and npm 10.8.3)
- **PostgreSQL**: PostgreSQL 14+ (tested on PostgreSQL 18.1, Port 5432)

---

## 3. Database Setup (PostgreSQL)

1. Ensure the PostgreSQL service is running on `localhost:5432`.
2. Connect using `psql` or pgAdmin:
   ```bash
   psql -U postgres
   ```
3. Create the database:
   ```sql
   CREATE DATABASE fooddel;
   ```

---

## 4. Backend Installation & Setup

1. Open PowerShell and navigate to the `backend` directory:
   ```powershell
   cd backend
   ```
2. Activate or create the virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Verify or configure environment variables in `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:newpassword@localhost:5432/fooddel
   SECRET_KEY=dev_secret_jwt_key_foodyzone_super_secure_923847923847923
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   REFRESH_TOKEN_EXPIRE_DAYS=7

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=
   SMTP_PASSWORD=
   EMAIL_FROM=no-reply@foodyzone.com
   ADMIN_EMAIL=admin@foodyzone.com

   FRONTEND_URL=http://localhost:3000
   ```
   *(Note: If SMTP credentials are empty, the backend simulates email dispatch by logging the full HTML and OTP code directly to console/logs without breaking API responses).*

5. Run database migrations / seed script:
   ```powershell
   python -m app.seed.create_admin
   ```
   This automatically initializes all database tables, seeds roles (`admin`, `customer`, `staff`), sets up the initial Administrator (`admin@foodyzone.com` / `Admin@123`), and populates all 21 food products and 4 categories!

6. Run the automated test suite with pytest:
   ```powershell
   python -m pytest tests
   ```

7. Start the FastAPI backend server:
   ```powershell
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   Interactive Swagger documentation will be available at:
   👉 **http://127.0.0.1:8000/docs**

---

## 5. Frontend Installation & Running

1. Open a new terminal and navigate to the `Food` frontend directory:
   ```powershell
   cd Food
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Verify `Food/.env`:
   ```env
   REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
   REACT_APP_WS_BASE_URL=ws://localhost:8000/ws
   ```
4. Start the React development server:
   ```powershell
   npm start
   ```
   The application will launch at:
   👉 **http://localhost:3000**

---

## 6. Default Credentials

- **Admin Account**:
  - Email: `admin@foodyzone.com`
  - Password: `Admin@123`
  - Role: `admin` (Full access to `/admin/dashboard`, product CRUD, category CRUD, order management, user accounts, and contact inquiries)
- **Customer Registration**:
  - Visit `/signup`, register with your email and phone.
  - An OTP is generated and emailed (or printed to backend terminal in simulation mode).
  - Enter the 6-digit OTP to activate your verified account.

---

## 7. Key Features & Workflows

### A. Contact Form with Email OTP Verification (`/contact`)
1. User enters Full Name, Email, Phone, Subject, and Message.
2. User clicks **Send Verification OTP**.
3. Backend generates a cryptographic 6-digit OTP with a 5-minute expiry and dispatches it via SMTP.
4. User enters the 6-digit OTP and submits.
5. Backend verifies OTP, stores the verified inquiry in PostgreSQL (`is_verified=true`), sends an acknowledgement email to the customer, and sends an alert email to the admin.
6. The inquiry immediately appears in the Admin Portal under `/admin/contacts`, where the admin can add internal staff notes or reply directly by email.

### B. Real-Time Order Tracking via WebSockets (`/orders/:id`)
1. Customer adds items to Cart and checks out at `/checkout`.
2. Backend computes order subtotal, 5% tax, and shipping fee from the database source of truth.
3. Order is created and customer is redirected to `/orders/:id`.
4. The page opens an authenticated WebSocket connection to `ws://127.0.0.1:8000/ws/orders/{order_id}?token={jwt}`.
5. When the Admin changes the order status in `/admin/orders` (e.g. *Pending* ➔ *Confirmed* ➔ *Preparing* ➔ *Ready for Dispatch* ➔ *Out for Delivery* ➔ *Delivered*), the status updates immediately on the customer's screen with zero page refreshes!

### C. Admin Management Portal (`/admin`)
- Accessible only by users with the `admin` role.
- **Dashboard**: Real-time KPI counters (Revenue, Orders, Products, Users, Inquiries) and status distributions.
- **Orders**: Status transition dropdowns with custom notes; sends live WebSocket events and customer emails.
- **Products**: Add, edit, soft-delete, and upload images to `Food/public/Assets/`.
- **Categories**: Manage cuisine sections.
- **Users**: Search, view email verification status, and activate/deactivate accounts.
- **Contacts**: Search inquiries, add private notes, update statuses, and email replies.

---

## 8. Common Troubleshooting

1. **PostgreSQL Connection Error**:
   Ensure PostgreSQL is running on port 5432 and credentials in `backend/.env` match your local PostgreSQL password.
2. **WebSocket Disconnected**:
   Make sure you are logged in; WebSocket connections require an authenticated JWT access token.
3. **Email OTP Not Arriving in Inbox**:
   If `SMTP_USERNAME` and `SMTP_PASSWORD` are not configured in `backend/.env`, the backend operates in simulation mode and prints the OTP to the backend server terminal console.
