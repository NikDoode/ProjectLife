from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from .models import Item, Relation, RelationType, Workspace
from .schemas import ItemCreate, ItemStatusUpdate, ItemUpdate, RelationCreate, WorkspaceCreate


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
    db.query(Relation).filter(
        or_(Relation.source_id == item.id, Relation.target_id == item.id)
    ).delete(synchronize_session=False)
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


def get_workspaces(db: Session) -> list[Workspace]:
    return list(db.scalars(select(Workspace).order_by(Workspace.created_at, Workspace.id)).all())


def get_workspace(db: Session, workspace_id: str) -> Workspace | None:
    return db.get(Workspace, workspace_id)


def create_workspace(db: Session, data: WorkspaceCreate) -> Workspace:
    workspace = Workspace(**data.model_dump(), system=False)
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return workspace


def delete_workspace(db: Session, workspace: Workspace) -> None:
    db.query(Relation).filter(Relation.workspace_id == workspace.id).delete(
        synchronize_session=False
    )
    db.delete(workspace)
    db.commit()


def ensure_general_workspace(db: Session) -> Workspace:
    workspace = get_workspace(db, "general")
    if workspace is None:
        workspace = Workspace(id="general", name="Общее", system=True)
        db.add(workspace)
        db.commit()
        db.refresh(workspace)
    return workspace


def get_relation(db: Session, relation_id: int) -> Relation | None:
    return db.get(Relation, relation_id)


def get_relations(
    db: Session,
    item_id: int | None = None,
    workspace_id: str | None = None,
    global_only: bool = False,
) -> list[Relation]:
    statement = select(Relation).order_by(Relation.id)
    if item_id is not None:
        statement = statement.where(
            or_(Relation.source_id == item_id, Relation.target_id == item_id)
        )
    if global_only:
        statement = statement.where(Relation.workspace_id.is_(None))
    elif workspace_id is not None:
        statement = statement.where(
            or_(
                Relation.workspace_id.is_(None),
                Relation.workspace_id == workspace_id,
            )
        )
    return list(db.scalars(statement).all())


def find_duplicate_relation(db: Session, data: RelationCreate) -> Relation | None:
    source_id, target_id = data.source_id, data.target_id
    if data.type == RelationType.RELATED_TO and source_id > target_id:
        source_id, target_id = target_id, source_id
    statement = select(Relation).where(
        Relation.source_id == source_id,
        Relation.target_id == target_id,
        Relation.type == data.type,
    )
    if data.workspace_id is None:
        statement = statement.where(Relation.workspace_id.is_(None))
    else:
        statement = statement.where(Relation.workspace_id == data.workspace_id)
    return db.scalar(statement)


def create_relation(db: Session, data: RelationCreate) -> Relation:
    values = data.model_dump()
    if data.type == RelationType.RELATED_TO and data.source_id > data.target_id:
        values["source_id"], values["target_id"] = data.target_id, data.source_id
    relation = Relation(**values)
    db.add(relation)
    db.commit()
    db.refresh(relation)
    return relation


def delete_relation(db: Session, relation: Relation) -> None:
    db.delete(relation)
    db.commit()
