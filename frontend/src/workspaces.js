export const GENERAL_WORKSPACE_ID = "general";
export const WORKSPACES_STORAGE_KEY = "projectLife.workspaces.v1";

export function createInitialWorkspaceState(legacyPlacements = {}) {
  return {
    activeId: GENERAL_WORKSPACE_ID,
    workspaces: [{ id: GENERAL_WORKSPACE_ID, name: "Общее", system: true, rules: [], placements: legacyPlacements }],
  };
}

export function flattenItems(nodes) {
  return nodes.flatMap((item) => [item, ...flattenItems(item.children ?? [])]);
}

export function getVisibleItemIds(items, rules) {
  const byId = new Map(flattenItems(items).map((item) => [item.id, item]));
  const visible = new Set();
  function addSubtree(item) { visible.add(item.id); (item.children ?? []).forEach(addSubtree); }
  rules.forEach((rule) => {
    const item = byId.get(rule.itemId);
    if (!item) return;
    visible.add(item.id);
    if (rule.mode === "children") (item.children ?? []).forEach((child) => visible.add(child.id));
    if (rule.mode === "subtree") addSubtree(item);
  });
  return visible;
}

export function filterTreeByIds(items, visibleIds) {
  function visit(item) {
    const visibleChildren = (item.children ?? []).flatMap(visit);
    return visibleIds.has(item.id) ? [{ ...item, children: visibleChildren }] : visibleChildren;
  }
  return items.flatMap(visit);
}

export function isItemIncluded(items, rules, itemId) {
  return getVisibleItemIds(items, rules).has(itemId);
}
