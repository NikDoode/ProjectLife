import TreeView from "./Tree/TreeView";

export default function ViewRenderer({
  viewType,
  items,
  selectedItemId,
  onSelectItem,
}) {
  if (viewType === "tree") {
    return (
      <TreeView
        items={items}
        selectedItemId={selectedItemId}
        onSelectItem={onSelectItem}
      />
    );
  }

  return <p>Неизвестный тип представления.</p>;
}
