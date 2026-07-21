from sqlalchemy.orm import Session

from .. import crud
from ..models import Item
from ..schemas import ItemRead, ItemTreeNode


def build_item_tree(db: Session) -> list[ItemTreeNode]:
    """
    Строит древовидную проекцию из плоского списка объектов.
    """
    items = crud.get_items(db)

    nodes: dict[int, ItemTreeNode] = {
        item.id: item_to_tree_node(item)
        for item in items
    }

    roots: list[ItemTreeNode] = []

    for item in items:
        node = nodes[item.id]

        if item.parent_id is None:
            roots.append(node)
            continue

        parent = nodes.get(item.parent_id)

        if parent is None:
            # Объект с отсутствующим родителем показываем как корневой,
            # чтобы он не исчезал из проекции.
            roots.append(node)
            continue

        parent.children.append(node)

    return roots


def item_to_tree_node(item: Item) -> ItemTreeNode:
    item_data = ItemRead.model_validate(item).model_dump()

    return ItemTreeNode(
        **item_data,
        children=[],
    )