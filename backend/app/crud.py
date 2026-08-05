from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Item
from .schemas import ItemCreate, ItemStatusUpdate, ItemUpdate


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


def get_children(db: Session, item_id: int) -> list[Item]:
    return list(db.scalars(select(Item).where(Item.parent_id == item_id)).all())


def update_item(db: Session, item: Item, item_data: ItemUpdate) -> Item:
    for field, value in item_data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, item: Item) -> None:
    db.delete(item)
    db.commit()


def update_item_status(
    db: Session,
    item: Item,
    item_data: ItemStatusUpdate,
) -> Item:
    item.status = item_data.status
    db.commit()
    db.refresh(item)
    return item
