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

export function getPresenceRuleMode(items, rules, itemId) {
  const direct = rules.find((rule) => rule.itemId === itemId);
  if (direct) return direct.mode;
  const byId = new Map(flattenItems(items).map((item) => [item.id, item]));
  const item = byId.get(itemId);
  if (!item) return "self";
  if (rules.some((rule) => rule.mode === "children" && rule.itemId === item.parent_id)) return "self";
  let parentId = item.parent_id;
  while (parentId !== null) {
    if (rules.some((rule) => rule.mode === "subtree" && rule.itemId === parentId)) return "subtree";
    parentId = byId.get(parentId)?.parent_id ?? null;
  }
  return "self";
}
