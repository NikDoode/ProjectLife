from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from . import crud
from .database import get_db
from .schemas import WorkspaceCreate, WorkspaceRead


router = APIRouter(prefix="/workspaces", tags=["workspaces"])
DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[WorkspaceRead])
def read_workspaces(db: DbSession) -> list[WorkspaceRead]:
    crud.ensure_general_workspace(db)
    return crud.get_workspaces(db)


@router.post("", response_model=WorkspaceRead, status_code=status.HTTP_201_CREATED)
def create_workspace(data: WorkspaceCreate, db: DbSession) -> WorkspaceRead:
    if crud.get_workspace(db, data.id) is not None:
        raise HTTPException(status_code=409, detail="Рабочее пространство уже существует")
    return crud.create_workspace(db, data)


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(workspace_id: str, db: DbSession) -> None:
    workspace = crud.get_workspace(db, workspace_id)
    if workspace is None:
        raise HTTPException(status_code=404, detail="Рабочее пространство не найдено")
    if workspace.system:
        raise HTTPException(status_code=409, detail="Системное пространство нельзя удалить")
    crud.delete_workspace(db, workspace)
