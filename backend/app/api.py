from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from . import crud
from .database import get_db
from .schemas import ItemCreate, ItemRead, ItemStatusUpdate, ItemTreeNode, ItemUpdate
from .services.tree_projection import build_item_tree


router = APIRouter(prefix="/items", tags=["items"])

DbSession = Annotated[Session, Depends(get_db)]


@router.post(
    "",
    response_model=ItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_item(
    item_data: ItemCreate,
    db: DbSession,
) -> ItemRead:
    validate_parent(db, item_data.parent_id)
    return crud.create_item(db, item_data)


def validate_parent(db: Session, parent_id: int | None, item_id: int | None = None) -> None:
    if parent_id is None:
        return
    if parent_id == item_id:
        raise HTTPException(status_code=422, detail="Объект не может быть родителем самому себе")
    parent = crud.get_item(db, parent_id)
    if parent is None:
        raise HTTPException(status_code=422, detail="Родительский объект не найден")
    current = parent
    visited: set[int] = set()
    while current.parent_id is not None and current.id not in visited:
        visited.add(current.id)
        if current.parent_id == item_id:
            raise HTTPException(status_code=422, detail="Нельзя создать цикл в иерархии")
        current = crud.get_item(db, current.parent_id)
        if current is None:
            break

@router.get(
    "/tree",
    response_model=list[ItemTreeNode],
)
def read_item_tree(db: DbSession) -> list[ItemTreeNode]:
    return build_item_tree(db)

@router.get(
    "",
    response_model=list[ItemRead],
)
def read_items(db: DbSession) -> list[ItemRead]:
    return crud.get_items(db)

@router.get(
    "/{item_id}",
    response_model=ItemRead,
)
def read_item(
    item_id: int,
    db: DbSession,
) -> ItemRead:
    item = crud.get_item(db, item_id)

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Объект не найден",
        )


    return item


@router.patch(
    "/{item_id}/status",
    response_model=ItemRead,
)
def update_item_status(
    item_id: int,
    item_data: ItemStatusUpdate,
    db: DbSession,
) -> ItemRead:
    item = crud.get_item(db, item_id)

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Объект не найден",
        )

    return crud.update_item_status(db, item, item_data)


@router.patch("/{item_id}", response_model=ItemRead)
def update_item(item_id: int, item_data: ItemUpdate, db: DbSession) -> ItemRead:
    item = crud.get_item(db, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Объект не найден")
    for field in ("title", "kind", "status", "priority"):
        if field in item_data.model_fields_set and getattr(item_data, field) is None:
            raise HTTPException(status_code=422, detail=f"Поле {field} не может быть пустым")
    if "parent_id" in item_data.model_fields_set:
        validate_parent(db, item_data.parent_id, item_id)
    return crud.update_item(db, item, item_data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: DbSession) -> None:
    item = crud.get_item(db, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Объект не найден")
    if crud.get_children(db, item_id):
        raise HTTPException(status_code=409, detail="Сначала удалите дочерние элементы")
    crud.delete_item(db, item)
