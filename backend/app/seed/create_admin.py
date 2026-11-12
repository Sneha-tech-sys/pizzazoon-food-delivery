from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.session import SessionLocal, engine
from app.database.base import Base
import app.models
from app.models.role import Role, UserRole
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.cart import Cart
from app.models.wishlist import Wishlist
from app.core.security import hash_password

INITIAL_CATEGORIES = [
    {"name": "Indian Food", "slug": "indian", "description": "Authentic North & Traditional Indian delicacies"},
    {"name": "South Indian", "slug": "south_indian", "description": "Crispy dosas, idlis and South Indian flavors"},
    {"name": "Fast Food", "slug": "fast_food", "description": "Quick bites, pizzas, momos and noodles"},
    {"name": "Drinks", "slug": "drinks", "description": "Refreshing smoothies, coffees and cold beverages"}
]

# From existing React Data.jsx
INITIAL_PRODUCTS = [
    {"title": "Dosa", "category": "south_indian", "price": 100, "rate": 4.5, "img": "Assets/dosa.jpeg"},
    {"title": "Idali", "category": "south_indian", "price": 80, "rate": 4.0, "img": "Assets/idali.jpg"},
    {"title": "Paneer", "category": "indian", "price": 150, "rate": 4.5, "img": "Assets/paneer.avif"},
    {"title": "Paneer Naan", "category": "indian", "price": 190, "rate": 5.0, "img": "Assets/paneernaan.avif"},
    {"title": "Chhola", "category": "indian", "price": 100, "rate": 4.8, "img": "Assets/chhola.avif"},
    {"title": "Chhola Puri", "category": "indian", "price": 140, "rate": 4.7, "img": "Assets/chholapuri.jpg"},
    {"title": "Biryani", "category": "indian", "price": 70, "rate": 4.3, "img": "Assets/biryani.avif"},
    {"title": "Momos", "category": "fast_food", "price": 100, "rate": 4.8, "img": "Assets/momos.avif"},
    {"title": "Pizza", "category": "fast_food", "price": 200, "rate": 4.4, "img": "Assets/pizza.jpeg"},
    {"title": "Spring Roll", "category": "fast_food", "price": 90, "rate": 4.0, "img": "Assets/roll.avif"},
    {"title": "Noodles", "category": "fast_food", "price": 13, "rate": 4.5, "img": "Assets/nodles.avif"},
    {"title": "Manchurian", "category": "fast_food", "price": 110, "rate": 4.7, "img": "Assets/manchurian.avif"},
    {"title": "Fried Rice", "category": "fast_food", "price": 90, "rate": 4.3, "img": "Assets/frie rice.avif"},
    {"title": "Smoothie", "category": "drinks", "price": 120, "rate": 4.5, "img": "Assets/smoodi.avif"},
    {"title": "Mojito", "category": "drinks", "price": 130, "rate": 4.7, "img": "Assets/mojito.avif"},
    {"title": "Mango Juice", "category": "drinks", "price": 100, "rate": 4.5, "img": "Assets/mango.avif"},
    {"title": "Cola", "category": "drinks", "price": 140, "rate": 4.4, "img": "Assets/cola.avif"},
    {"title": "Cold Coffee", "category": "drinks", "price": 160, "rate": 4.5, "img": "Assets/cold coffe.avif"},
    {"title": "Hot Coffee", "category": "drinks", "price": 140, "rate": 4.5, "img": "Assets/coffe.avif"},
    {"title": "Pasta", "category": "fast_food", "price": 190, "rate": 4.8, "img": "Assets/download.png"},
    {"title": "Chawal", "category": "indian", "price": 100, "rate": 4.5, "img": "Assets/bir.avif"}
]


def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed Roles
        role_names = ["admin", "customer", "staff"]
        for r_name in role_names:
            role = db.scalars(select(Role).where(Role.name == r_name)).first()
            if not role:
                db.add(Role(name=r_name, description=f"{r_name.capitalize()} role"))
        db.commit()

        # 2. Seed Admin User
        admin_email = "admin@foodyzone.com"
        admin = db.scalars(select(User).where(User.email == admin_email)).first()
        admin_role = db.scalars(select(Role).where(Role.name == "admin")).first()

        if not admin:
            admin = User(
                full_name="System Administrator",
                email=admin_email,
                phone="9999999999",
                hashed_password=hash_password("Admin@123"),
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

            db.add(UserRole(user_id=admin.id, role_id=admin_role.id))
            db.add(Cart(user_id=admin.id))
            db.add(Wishlist(user_id=admin.id))
            db.commit()
            print(f"Admin created: {admin_email} / Admin@123")
        else:
            print("Admin user already exists.")

        # 3. Seed Categories
        category_map = {}
        for c in INITIAL_CATEGORIES:
            cat = db.scalars(select(Category).where(Category.slug == c["slug"])).first()
            if not cat:
                cat = Category(name=c["name"], slug=c["slug"], description=c["description"], is_active=True)
                db.add(cat)
                db.commit()
                db.refresh(cat)
                print(f"Category added: {cat.name}")
            category_map[cat.slug] = cat.id

        # 4. Seed Products
        for p in INITIAL_PRODUCTS:
            prod = db.scalars(select(Product).where(Product.name == p["title"])).first()
            cat_id = category_map.get(p["category"].lower())
            if not prod and cat_id:
                prod = Product(
                    category_id=cat_id,
                    name=p["title"],
                    description=f"Freshly prepared delicious {p['title']}",
                    price=Decimal(str(p["price"])),
                    rating=Decimal(str(p["rate"])),
                    stock=100,
                    image_url=p["img"],
                    is_active=True
                )
                db.add(prod)
                print(f"Product seeded: {p['title']} (INR {p['price']})")
        db.commit()
        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
