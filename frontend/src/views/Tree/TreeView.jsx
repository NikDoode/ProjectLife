import TreeNode from "./TreeNode";
import "./Tree.css";

export default function TreeView({
  items,
  relations = [],
  selectedItemId,
  onSelectItem,
}) {
  const itemById = new Map();
  function index(nodes) {
    nodes.forEach((item) => {
      itemById.set(item.id, item);
      index(item.children ?? []);
    });
  }
  index(items);
  const parentRelations = relations.filter((relation) => relation.type === "parent_of" && relation.workspace_id === null);

  if (items.length === 0) {
    return <p className="tree-message">Объектов пока нет.</p>;
  }

  return (
    <div className="tree">
      {items.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          itemById={itemById}
          parentRelations={parentRelations}
          selectedItemId={selectedItemId}
          onSelectItem={onSelectItem}
        />
      ))}
    </div>
  );
}
