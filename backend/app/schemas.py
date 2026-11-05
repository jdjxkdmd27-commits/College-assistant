from datetime import datetime
from pydantic import BaseModel, Field
from .models import TicketStatus, CommentVisibility, UserRole


class LoginIn(BaseModel):
    login: str
    password: str


class LoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    name: str


class UserOut(BaseModel):
    id: int
    name: str
    login: str
    role: UserRole
    model_config = {"from_attributes": True}


class LocationOut(BaseModel):
    id: int
    building: str
    floor: str
    room: str
    zone_name: str
    qr_key: str
    model_config = {"from_attributes": True}


class LocationIn(BaseModel):
    building: str = Field(min_length=1, max_length=80)
    floor: str = ""
    room: str = Field(min_length=1, max_length=40)
    zone_name: str = ""
    qr_key: str = Field(min_length=1, max_length=120)


class CategoryOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class CommentIn(BaseModel):
    body: str = Field(min_length=1, max_length=4000)
    visibility: CommentVisibility = CommentVisibility.public


class CommentOut(BaseModel):
    id: int
    body: str
    visibility: CommentVisibility
    created_at: datetime
    model_config = {"from_attributes": True}


class StatusIn(BaseModel):
    status: TicketStatus
    note: str = ""


class HistoryOut(BaseModel):
    id: int
    old_status: str
    new_status: str
    created_at: datetime
    note: str
    model_config = {"from_attributes": True}


class TicketListOut(BaseModel):
    id: int
    public_number: str
    description: str
    status: TicketStatus
    created_at: datetime
    category: str | None = None
    location: str | None = None


class TicketDetailOut(TicketListOut):
    updated_at: datetime
    history: list[HistoryOut] = []
    comments: list[CommentOut] = []
    photo_url: str | None = None


class TicketPublicOut(BaseModel):
    public_number: str
    description: str
    status: TicketStatus
    created_at: datetime
    category: str | None = None
    location: str | None = None
    comments: list[CommentOut] = []


class TicketCreateOut(BaseModel):
    public_number: str
    tracking_token: str


class AIAssistIn(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class AIAssistOut(BaseModel):
    classification: str  # question | fault | danger | unknown
    answer: str
    category: str | None = None
    category_id: int | None = None
    recommend_ticket: bool = False
    source: str | None = None
    confidence: str = "high"  # high | low
