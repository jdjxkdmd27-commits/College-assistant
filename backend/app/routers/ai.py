import re
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Category
from ..schemas import AIAssistIn, AIAssistOut

router = APIRouter(prefix="/api/ai", tags=["ai"])

KB = [
    {
        "q": ["подключить ноутбук", "подключить проектор", "hdmi", "vga"],
        "category": "Оборудование",
        "answer": "1) Подключите кабель HDMI/VGA к ноутбуку и проектору.\n2) На ноутбуке нажмите Win+P (или Cmd+F1 на Mac) и выберите «Дублировать».\n3) На проекторе выберите источник HDMI/VGA.\nЕсли изображения нет — сообщите заявкой.",
        "source": "kb://projector-connect",
    },
    {
        "q": ["принтер", "не печатает"],
        "category": "Оборудование",
        "answer": "Проверьте: включён ли принтер, есть ли бумага и тонер, нет ли ошибок в очереди печати (Настройки → Принтеры). Если не помогло — оформите заявку.",
        "source": "kb://printer-basic",
    },
    {
        "q": ["ручка окна", "сломалась мебель", "сломана дверь"],
        "category": "Имущество",
        "answer": "Сообщите об этом через заявку с указанием кабинета. Не пытайтесь ремонтировать самостоятельно.",
        "source": "kb://furniture",
    },
    {
        "q": ["грязно", "уборка", "мусор"],
        "category": "Уборка",
        "answer": "Оформите заявку с указанием кабинета — сотрудник УПК передаст её службе уборки.",
        "source": "kb://cleaning",
    },
    {
        "q": ["статус заявки", "где посмотреть заявку"],
        "category": "Справка",
        "answer": "После отправки заявки вы получите ссылку для отслеживания. Сохраните её — по ссылке виден актуальный статус и публичные комментарии.",
        "source": "kb://track",
    },
    {
        "q": ["wi-fi пароль", "wifi пароль", "пароль от wi-fi"],
        "category": "Справка",
        "answer": "Пароль от Wi-Fi не публикуется. Обратитесь в IT-отдел или к ответственному сотруднику.",
        "source": "kb://wifi-policy",
    },
    {
        "q": ["когда починят", "сроки ремонта", "когда будет готово"],
        "category": "Справка",
        "answer": "Точные сроки не определяются автоматически. Проверьте актуальный статус по ссылке или обратитесь к ответственному сотруднику.",
        "source": "kb://eta",
    },
    {
        "q": ["повреждение имущества", "разбил", "сломал"],
        "category": "Имущество",
        "answer": "Сообщите о повреждении через заявку с указанием места и по возможности приложите фото.",
        "source": "kb://damage",
    },
    {
        "q": ["как оформить заявку", "как отправить заявку"],
        "category": "Справка",
        "answer": "Откройте форму по QR-коду в кабинете или по ссылке, опишите проблему, при необходимости приложите фото и отправьте.",
        "source": "kb://how-create",
    },
    {
        "q": ["не работает интернет", "нет сети", "пропал интернет"],
        "category": "Оборудование",
        "answer": "Проверьте, подключён ли сетевой кабель, и работает ли Wi-Fi на других устройствах. Если проблема сохраняется — оформите заявку.",
        "source": "kb://network-basic",
    },
    {
        "q": ["свет", "освещение", "не горит лампа", "перегорела лампа"],
        "category": "Инфраструктура",
        "answer": "Оформите заявку с указанием кабинета. Не пытайтесь самостоятельно менять лампы и трогать электропроводку.",
        "source": "kb://lighting",
    },
]

DANGER_PATTERNS = re.compile(r"искр|дым|гарь|запах газ|провод|током|пожар|возгоран|вскрыт|огол", re.I)
FAULT_PATTERNS = re.compile(r"не работает|не включается|сломал|не печатает|разбит|не грузит|не открывается|завис", re.I)


def _match_kb(text: str):
    t = text.lower()
    for item in KB:
        for key in item["q"]:
            if key in t:
                return item
    return None


@router.post("/assist", response_model=AIAssistOut)
def assist(data: AIAssistIn, db: Session = Depends(get_db)):
    text = data.text

    if DANGER_PATTERNS.search(text):
        return AIAssistOut(
            classification="danger",
            answer="⚠ Потенциально опасная ситуация. Не приближайтесь, не трогайте оборудование, не пытайтесь ремонтировать самостоятельно. Сообщите ответственному сотруднику или экстренной службе согласно правилам учреждения.",
            recommend_ticket=True,
            confidence="high",
        )

    kb = _match_kb(text)
    if kb:
        cat_id = None
        c = db.query(Category).filter(Category.name == kb["category"]).first()
        if c:
            cat_id = c.id
        return AIAssistOut(
            classification="question" if not FAULT_PATTERNS.search(text) else "fault",
            answer=kb["answer"],
            category=kb["category"],
            category_id=cat_id,
            recommend_ticket=bool(FAULT_PATTERNS.search(text)),
            source=kb["source"],
            confidence="high",
        )

    if FAULT_PATTERNS.search(text):
        return AIAssistOut(
            classification="fault",
            answer="Похоже на неисправность. Рекомендуем оформить заявку — сотрудник УПК проверит и поможет.",
            recommend_ticket=True,
            confidence="high",
        )

    return AIAssistOut(
        classification="unknown",
        answer="Недостаточно проверенной информации. Оформите заявку или обратитесь к ответственному сотруднику.",
        recommend_ticket=True,
        confidence="low",
    )
