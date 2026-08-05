import TreeView from "./Tree/TreeView";
import SpatialView from "./SpatialView";

export default function ViewRenderer({
  viewType,
  items,
  selectedItemId,
  onSelectItem,
  inspector,
  nodeDisplay,
  onNodeDisplayChange,
  preferences,
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
        nodeDisplay={nodeDisplay}
        onNodeDisplayChange={onNodeDisplayChange}
        preferences={preferences}
      />
    );
  }

  return <p>Неизвестный тип представления.</p>;
}
