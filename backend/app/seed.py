from sqlalchemy.orm import Session

from .database import SessionLocal, engine, Base
from .models import User, UserRole, Category, Location
from .security import hash_password


def seed():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    try:
        if not db.query(User).filter(User.login == "admin").first():
            db.add(User(
                name="Администратор",
                login="admin",
                role=UserRole.admin,
                password_hash=hash_password("admin123"),
            ))
        if not db.query(User).filter(User.login == "staff").first():
            db.add(User(
                name="Сотрудник УПК",
                login="staff",
                role=UserRole.staff,
                password_hash=hash_password("staff123"),
            ))

        cats = {
            "Оборудование": "Проекторы, компьютеры, принтеры",
            "Имущество": "Мебель, двери, окна",
            "Инфраструктура": "Свет, розетки, интернет",
            "Уборка": "Загрязнения и мусор",
            "Справка": "Типовые вопросы",
        }
        for name, desc in cats.items():
            if not db.query(Category).filter(Category.name == name).first():
                db.add(Category(name=name, description=desc))

        locs = [
            ("Корпус 1", "2", "214", "", "cab-214"),
            ("Корпус 1", "3", "305", "", "cab-305"),
            ("Лабораторный корпус", "1", "101", "Лаборатория", "lab-101"),
        ]
        for building, floor, room, zone, qr in locs:
            if not db.query(Location).filter(Location.qr_key == qr).first():
                db.add(Location(building=building, floor=floor, room=room, zone_name=zone, qr_key=qr))

        db.commit()
        print("Seed OK: admin/admin123, staff/staff123, 5 категорий, 3 локации")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
