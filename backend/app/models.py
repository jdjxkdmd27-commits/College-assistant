from datetime import datetime
from sqlalchemy import String, Text, ForeignKey, DateTime, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from .database import Base


class UserRole(str, enum.Enum):
    applicant = "applicant"
    staff = "staff"
    admin = "admin"


class TicketStatus(str, enum.Enum):
    new = "new"
    in_review = "in_review"
    assigned = "assigned"
    in_progress = "in_progress"
    needs_info = "needs_info"
    resolved = "resolved"
    rejected = "rejected"


class CommentVisibility(str, enum.Enum):
    public = "public"
    internal = "internal"


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    login: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.staff)
    password_hash: Mapped[str] = mapped_column(String(255))


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    description: Mapped[str] = mapped_column(Text, default="")
    tickets: Mapped[list["Ticket"]] = relationship(back_populates="category")


class Location(Base):
    __tablename__ = "locations"
    id: Mapped[int] = mapped_column(primary_key=True)
    building: Mapped[str] = mapped_column(String(80))
    floor: Mapped[str] = mapped_column(String(20), default="")
    room: Mapped[str] = mapped_column(String(40))
    zone_name: Mapped[str] = mapped_column(String(120), default="")
    qr_key: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    tickets: Mapped[list["Ticket"]] = relationship(back_populates="location")


class Ticket(Base):
    __tablename__ = "tickets"
    id: Mapped[int] = mapped_column(primary_key=True)
    public_number: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200), default="")
    description: Mapped[str] = mapped_column(Text)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id"), nullable=True)
    status: Mapped[TicketStatus] = mapped_column(SAEnum(TicketStatus), default=TicketStatus.new, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    assignee_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    tracking_token_hash: Mapped[str] = mapped_column(String(64), index=True)

    category: Mapped[Category | None] = relationship(back_populates="tickets")
    location: Mapped[Location | None] = relationship(back_populates="tickets")
    comments: Mapped[list["Comment"]] = relationship(back_populates="ticket", cascade="all, delete-orphan")
    history: Mapped[list["TicketHistory"]] = relationship(back_populates="ticket", cascade="all, delete-orphan")
    attachments: Mapped[list["Attachment"]] = relationship(back_populates="ticket", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"
    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("tickets.id"), index=True)
    author_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    body: Mapped[str] = mapped_column(Text)
    visibility: Mapped[CommentVisibility] = mapped_column(SAEnum(CommentVisibility), default=CommentVisibility.public)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ticket: Mapped[Ticket] = relationship(back_populates="comments")


class TicketHistory(Base):
    __tablename__ = "ticket_history"
    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("tickets.id"), index=True)
    old_status: Mapped[str] = mapped_column(String(40), default="")
    new_status: Mapped[str] = mapped_column(String(40))
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    note: Mapped[str] = mapped_column(Text, default="")

    ticket: Mapped[Ticket] = relationship(back_populates="history")


class Attachment(Base):
    __tablename__ = "attachments"
    id: Mapped[int] = mapped_column(primary_key=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("tickets.id"), index=True)
    storage_key: Mapped[str] = mapped_column(String(255))
    file_type: Mapped[str] = mapped_column(String(80), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ticket: Mapped[Ticket] = relationship(back_populates="attachments")


class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"
    id: Mapped[int] = mapped_column(primary_key=True)
    question: Mapped[str] = mapped_column(String(300))
    answer: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(80), default="")
    source: Mapped[str] = mapped_column(String(200), default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
