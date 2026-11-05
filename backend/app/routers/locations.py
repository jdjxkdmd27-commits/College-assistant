from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_staff
from ..models import Location, User
from ..schemas import LocationIn, LocationOut
import io
from fastapi import Response
import qrcode


router = APIRouter(prefix="/api/locations", tags=["locations"])


@router.get("", response_model=list[LocationOut])
def list_locations(db: Session = Depends(get_db)):
    return db.query(Location).order_by(Location.id).all()


@router.get("/by-key/{qr_key}", response_model=LocationOut)
def get_by_key(qr_key: str, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.qr_key == qr_key).first()
    if not loc:
        raise HTTPException(404, "Локация не найдена")
    return loc


@router.post("", response_model=LocationOut)
def create_location(
    data: LocationIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_staff),
):
    if db.query(Location).filter(Location.qr_key == data.qr_key).first():
        raise HTTPException(400, "QR-ключ уже существует")
    loc = Location(**data.model_dump())
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


@router.get("/{location_id}/qr.png")
def get_qr_png(location_id: int, origin: str = "http://localhost:5173", db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(404, "Локация не найдена")
    url = f"{origin}/?loc={loc.qr_key}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return Response(content=buf.getvalue(), media_type="image/png",
                    headers={"Content-Disposition": f'attachment; filename="qr-{loc.qr_key}.png"'})