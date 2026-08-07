from collections import defaultdict

from sqlalchemy.orm import Session

from .. import crud
from ..models import RelationType


def would_create_parent_cycle(
    db: Session,
    source_id: int,
    target_id: int,
    workspace_id: str | None,
) -> bool:
    """Return True when source -> target closes a structural cycle."""
    adjacency: dict[int, set[int]] = defaultdict(set)

    for item in crud.get_items(db):
        if item.parent_id is not None:
            adjacency[item.parent_id].add(item.id)

    relations = crud.get_relations(
        db,
        workspace_id=workspace_id,
        global_only=workspace_id is None,
    )
    for relation in relations:
        if relation.type == RelationType.PARENT_OF:
            adjacency[relation.source_id].add(relation.target_id)

    stack = [target_id]
    visited: set[int] = set()
    while stack:
        current = stack.pop()
        if current == source_id:
            return True
        if current in visited:
            continue
        visited.add(current)
        stack.extend(adjacency[current])
    return False


def global_parent_relation_would_break_workspace(
    db: Session,
    source_id: int,
    target_id: int,
) -> bool:
    if would_create_parent_cycle(db, source_id, target_id, None):
        return True
    return any(
        would_create_parent_cycle(db, source_id, target_id, workspace.id)
        for workspace in crud.get_workspaces(db)
        if not workspace.system
    )
