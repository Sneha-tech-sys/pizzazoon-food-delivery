from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.database.connection import engine, Base
from app.seed.create_admin import seed_database
import app.models  # ensure all models registered
from app.routers import (
    auth,
    users,
    categories,
    products,
    cart,
    wishlist,
    orders,
    contacts,
    admin,
    websocket
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Automatically create tables if not existing
    Base.metadata.create_all(bind=engine)
    print("Database tables verified.")
    try:
        seed_database()
        print("Database seeded with initial admin, roles, categories, and products.")
    except Exception as e:
        print(f"Seed note: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-ready FastAPI backend for FoodyZone Full-Stack Food Delivery Application",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all during local fullstack development, or restrict via settings.CORS_ORIGINS
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 Router inclusion
api_v1_prefix = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(users.router, prefix=api_v1_prefix)
app.include_router(categories.router, prefix=api_v1_prefix)
app.include_router(products.router, prefix=api_v1_prefix)
app.include_router(cart.router, prefix=api_v1_prefix)
app.include_router(wishlist.router, prefix=api_v1_prefix)
app.include_router(orders.router, prefix=api_v1_prefix)
app.include_router(contacts.router, prefix=api_v1_prefix)
app.include_router(admin.router, prefix=api_v1_prefix)

# WebSocket Router
app.include_router(websocket.router)


@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "documentation": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
