import TreeView from "./Tree/TreeView";
import SpatialView from "./SpatialView";

export default function ViewRenderer({
  viewType,
  items,
  relations,
  selectedItemId,
  onSelectItem,
  inspector,
  nodeDisplay,
  onNodeDisplayChange,
  preferences,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onSpatialCenterChange,
}) {
  if (viewType === "tree") {
    return <div className="view-with-inspector">
      <TreeView
        items={items}
        relations={relations}
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
        relations={relations}
        selectedItemId={selectedItemId}
        onSelectItem={onSelectItem}
        inspector={inspector}
        nodeDisplay={nodeDisplay}
        onNodeDisplayChange={onNodeDisplayChange}
        preferences={preferences}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={onSelectWorkspace}
        onCreateWorkspace={onCreateWorkspace}
        onCenterChange={onSpatialCenterChange}
      />
    );
  }

  return <p>Неизвестный тип представления.</p>;
}
