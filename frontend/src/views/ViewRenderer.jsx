import TreeView from "./Tree/TreeView";
import SpatialView from "./SpatialView";

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

  if (viewType === "spatial") {
    return (
      <SpatialView
        items={items}
        selectedItemId={selectedItemId}
        onSelectItem={onSelectItem}
      />
    );
  }

  return <p>Неизвестный тип представления.</p>;
}
