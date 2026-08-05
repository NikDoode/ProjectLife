from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from .models import ItemKind, ItemPriority, ItemStatus


class ItemCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)

    parent_id: int | None = None
    kind: ItemKind = ItemKind.TASK
    description: str | None = None
    status: ItemStatus = ItemStatus.INBOX
    priority: ItemPriority = ItemPriority.NORMAL
    due_at: date | None = None


class ItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    parent_id: int | None = None
    kind: ItemKind | None = None
    description: str | None = None
    status: ItemStatus | None = None
    priority: ItemPriority | None = None
    due_at: date | None = None


class ItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parent_id: int | None
    kind: ItemKind
    title: str
    description: str | None
    status: ItemStatus
    priority: ItemPriority
    due_at: date | None
    created_at: datetime
    updated_at: datetime


class ItemStatusUpdate(BaseModel):
    status: ItemStatus


class ItemTreeNode(ItemRead):
    children: list["ItemTreeNode"] = Field(default_factory=list)


ItemTreeNode.model_rebuild()
