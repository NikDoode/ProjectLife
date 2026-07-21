from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from . import crud
from .database import get_db
from .schemas import ItemCreate, ItemRead, ItemTreeNode
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
    return crud.create_item(db, item_data)

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
    "/tree",
    response_model=list[ItemTreeNode],
)
def read_item_tree(db: DbSession) -> list[ItemTreeNode]:
    return build_item_tree(db)

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