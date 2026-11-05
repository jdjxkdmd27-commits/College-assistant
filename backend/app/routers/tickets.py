import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..config import settings
from ..database import get_db
from ..deps import require_staff
from ..models import (
    Ticket, TicketStatus, Comment, TicketHistory, Category, Location,
    Attachment, CommentVisibility, User,
)
from ..schemas import (
    TicketCreateOut, TicketPublicOut, TicketListOut, TicketDetailOut,
    CommentIn, CommentOut, StatusIn, HistoryOut,
)
from ..security import new_tracking_token, hash_tracking_token

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


def _loc_str(loc: Location | None) -> str | None:
    if not loc:
        return None
    return f"{loc.building}, каб. {loc.room}" + (f" ({loc.zone_name})" if loc.zone_name else "")


@router.post("", response_model=TicketCreateOut)
def create_ticket(
    description: str = Form(...),
    location_id: int = Form(...),
    category_id: int | None = Form(None),
    photo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    if not description.strip():
        raise HTTPException(400, "Описание обязательно")
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(400, "Неизвестное помещение")

    raw_token, token_hash = new_tracking_token()
    public_number = f"UPK-{datetime.utcnow():%Y%m%d}-{uuid.uuid4().hex[:5].upper()}"

    ticket = Ticket(
        public_number=public_number,
        title=description[:80],
        description=description,
        category_id=category_id,
        location_id=location_id,
        status=TicketStatus.new,
        tracking_token_hash=token_hash,
    )
    db.add(ticket)
    db.flush()

    if photo is not None and photo.filename:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = os.path.splitext(photo.filename)[1].lower() or ".bin"
        if ext not in (".jpg", ".jpeg", ".png", ".webp", ".heic"):
            raise HTTPException(400, "Допустимы только изображения")
        key = f"{uuid.uuid4().hex}{ext}"
        with open(os.path.join(settings.UPLOAD_DIR, key), "wb") as f:
            f.write(photo.file.read())
        db.add(Attachment(ticket_id=ticket.id, storage_key=key, file_type=photo.content_type or ""))

    db.add(TicketHistory(
        ticket_id=ticket.id,
        old_status="",
        new_status=TicketStatus.new.value,
        actor_id=None,
        note="Заявка создана",
    ))
    db.commit()
    return TicketCreateOut(public_number=public_number, tracking_token=raw_token)


@router.get("/track/{token}", response_model=TicketPublicOut)
def track_ticket(token: str, db: Session = Depends(get_db)):
    h = hash_tracking_token(token)
    t = db.query(Ticket).filter(Ticket.tracking_token_hash == h).first()
    if not t:
        raise HTTPException(404, "Заявка не найдена")
    public_comments = [c for c in t.comments if c.visibility == CommentVisibility.public]
    return TicketPublicOut(
        public_number=t.public_number,
        description=t.description,
        status=t.status,
        created_at=t.created_at,
        category=t.category.name if t.category else None,
        location=_loc_str(t.location),
        comments=[CommentOut.model_validate(c) for c in public_comments],
    )


@router.get("", response_model=list[TicketListOut])
def list_tickets(
    q: str | None = Query(None),
    status: TicketStatus | None = Query(None),
    category_id: int | None = Query(None),
    location_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    query = db.query(Ticket)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Ticket.public_number.ilike(like), Ticket.description.ilike(like)))
    if status:
        query = query.filter(Ticket.status == status)
    if category_id:
        query = query.filter(Ticket.category_id == category_id)
    if location_id:
        query = query.filter(Ticket.location_id == location_id)
    rows = query.order_by(Ticket.created_at.desc()).limit(200).all()
    return [
        TicketListOut(
            id=t.id, public_number=t.public_number, description=t.description,
            status=t.status, created_at=t.created_at,
            category=t.category.name if t.category else None,
            location=_loc_str(t.location),
        )
        for t in rows
    ]


@router.get("/{ticket_id}", response_model=TicketDetailOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(404, "Заявка не найдена")
    photo_url = None
    if t.attachments:
        photo_url = f"/uploads/{t.attachments[0].storage_key}"
    return TicketDetailOut(
        id=t.id, public_number=t.public_number, description=t.description,
        status=t.status, created_at=t.created_at, updated_at=t.updated_at,
        category=t.category.name if t.category else None,
        location=_loc_str(t.location),
        history=[HistoryOut.model_validate(h) for h in t.history],
        comments=[CommentOut.model_validate(c) for c in t.comments],
        photo_url=photo_url,
    )


@router.patch("/{ticket_id}/status", response_model=TicketDetailOut)
def change_status(
    ticket_id: int,
    data: StatusIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff),
):
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(404, "Заявка не найдена")
    if data.status in (TicketStatus.resolved, TicketStatus.rejected) and not data.note.strip():
        raise HTTPException(400, "Для этого статуса нужен комментарий/причина")
    old = t.status.value
    t.status = data.status
    db.add(TicketHistory(
        ticket_id=t.id, old_status=old, new_status=data.status.value,
        actor_id=user.id, note=data.note,
    ))
    db.commit()
    return get_ticket(ticket_id, db, user)


@router.post("/{ticket_id}/comments", response_model=CommentOut)
def add_comment(
    ticket_id: int,
    data: CommentIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff),
):
    t = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not t:
        raise HTTPException(404, "Заявка не найдена")
    c = Comment(
        ticket_id=t.id, author_id=user.id,
        body=data.body, visibility=data.visibility,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c
