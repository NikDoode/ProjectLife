import TreeNode from "./TreeNode";
import "./Tree.css";

export default function Tree({
  items,
  selectedItemId,
  onSelectItem,
}) {
  if (items.length === 0) {
    return <p className="tree-message">Объектов пока нет.</p>;
  }

  return (
    <div className="tree">
      {items.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          selectedItemId={selectedItemId}
          onSelectItem={onSelectItem}
        />
      ))}
    </div>
  );
}