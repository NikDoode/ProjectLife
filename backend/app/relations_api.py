from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from . import crud
from .database import get_db
from .models import RelationType
from .schemas import RelationCreate, RelationRead
from .services.relation_validation import (
    global_parent_relation_would_break_workspace,
    would_create_parent_cycle,
)


router = APIRouter(prefix="/relations", tags=["relations"])
DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[RelationRead])
def read_relations(
    db: DbSession,
    item_id: int | None = None,
    workspace_id: str | None = None,
    global_only: bool = Query(default=False),
) -> list[RelationRead]:
    if workspace_id is not None and crud.get_workspace(db, workspace_id) is None:
        raise HTTPException(status_code=404, detail="Рабочее пространство не найдено")
    return crud.get_relations(db, item_id, workspace_id, global_only)


@router.post("", response_model=RelationRead, status_code=status.HTTP_201_CREATED)
def create_relation(data: RelationCreate, db: DbSession) -> RelationRead:
    if data.source_id == data.target_id:
        raise HTTPException(status_code=422, detail="Нельзя связать объект с самим собой")
    source = crud.get_item(db, data.source_id)
    target = crud.get_item(db, data.target_id)
    if source is None:
        raise HTTPException(status_code=422, detail="Исходный объект не найден")
    if target is None:
        raise HTTPException(status_code=422, detail="Целевой объект не найден")
    if data.workspace_id is not None and crud.get_workspace(db, data.workspace_id) is None:
        raise HTTPException(status_code=422, detail="Рабочее пространство не найдено")
    if crud.find_duplicate_relation(db, data) is not None:
        raise HTTPException(status_code=409, detail="Такая связь уже существует")

    if data.type == RelationType.PARENT_OF:
        if target.parent_id == source.id:
            raise HTTPException(
                status_code=409,
                detail="Этот объект уже является каноническим родителем",
            )
        creates_cycle = (
            global_parent_relation_would_break_workspace(db, data.source_id, data.target_id)
            if data.workspace_id is None
            else would_create_parent_cycle(
                db, data.source_id, data.target_id, data.workspace_id
            )
        )
        if creates_cycle:
            raise HTTPException(status_code=422, detail="Нельзя создать цикл родительства")

    return crud.create_relation(db, data)


@router.delete("/{relation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_relation(relation_id: int, db: DbSession) -> None:
    relation = crud.get_relation(db, relation_id)
    if relation is None:
        raise HTTPException(status_code=404, detail="Связь не найдена")
    crud.delete_relation(db, relation)
