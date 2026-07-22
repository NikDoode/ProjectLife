from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Item
from .schemas import ItemCreate, ItemStatusUpdate


def create_item(db: Session, item_data: ItemCreate):
    item = Item(**item_data.model_dump())

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


def get_items(db: Session) -> list[Item]:
    statement = select(Item).order_by(Item.id)
    return list(db.scalars(statement).all())


def get_item(db: Session, item_id: int) -> Item | None:
    return db.get(Item, item_id)


def update_item_status(
    db: Session,
    item: Item,
    item_data: ItemStatusUpdate,
) -> Item:
    item.status = item_data.status
    db.commit()
    db.refresh(item)
    return item
