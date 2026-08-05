import TreeView from "./Tree/TreeView";
import SpatialView from "./SpatialView";

export default function ViewRenderer({
  viewType,
  items,
  selectedItemId,
  onSelectItem,
  inspector,
}) {
  if (viewType === "tree") {
    return <div className="view-with-inspector">
      <TreeView
        items={items}
        selectedItemId={selectedItemId}
        onSelectItem={onSelectItem}
      />
      {inspector}
    </div>;
  }

  if (viewType === "spatial") {
    return (
      <SpatialView
        items={items}
        selectedItemId={selectedItemId}
        onSelectItem={onSelectItem}
        inspector={inspector}
      />
    );
  }

  return <p>Неизвестный тип представления.</p>;
}
