from sqlalchemy import Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base, TimestampMixin


class Contact(Base, TimestampMixin):
    __tablename__ = "contacts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="New", index=True, nullable=False)  # New, In Progress, Resolved
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    notes: Mapped[list["ContactNote"]] = relationship("ContactNote", back_populates="contact", cascade="all, delete-orphan", order_by="ContactNote.created_at.desc()")


class ContactNote(Base, TimestampMixin):
    __tablename__ = "contact_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    contact_id: Mapped[int] = mapped_column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False, index=True)
    admin_user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    admin_name: Mapped[str] = mapped_column(String(100), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)

    contact: Mapped["Contact"] = relationship("Contact", back_populates="notes")
