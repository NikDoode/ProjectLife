from datetime import date, datetime
from enum import Enum as PyEnum

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class ItemKind(str, PyEnum):
    AREA = "area"
    PROJECT = "project"
    TASK = "task"


class ItemStatus(str, PyEnum):
    INBOX = "inbox"
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"


class ItemPriority(str, PyEnum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class RelationType(str, PyEnum):
    PARENT_OF = "parent_of"
    BLOCKS = "blocks"
    DEPENDS_ON = "depends_on"
    RELATED_TO = "related_to"


class Item(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True)

    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("items.id"),
        nullable=True,
        index=True,
    )

    kind: Mapped[ItemKind] = mapped_column(
        Enum(ItemKind),
        default=ItemKind.TASK,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[ItemStatus] = mapped_column(
        Enum(ItemStatus),
        default=ItemStatus.INBOX,
        nullable=False,
    )

    priority: Mapped[ItemPriority] = mapped_column(
        Enum(ItemPriority),
        default=ItemPriority.NORMAL,
        nullable=False,
    )

    due_at: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        onupdate=datetime.now,
        nullable=False,
    )


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    system: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)


class Relation(Base):
    __tablename__ = "relations"
    __table_args__ = (
        UniqueConstraint(
            "source_id",
            "target_id",
            "type",
            "workspace_id",
            name="uq_relation_endpoints_type_workspace",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(
        ForeignKey("items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    target_id: Mapped[int] = mapped_column(
        ForeignKey("items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[RelationType] = mapped_column(Enum(RelationType), nullable=False, index=True)
    workspace_id: Mapped[str | None] = mapped_column(
        ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, nullable=False)
