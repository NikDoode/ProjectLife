export const RELATION_LABELS = {
  parent_of: "Дополнительный родитель",
  blocks: "Блокирует",
  depends_on: "Зависит от",
  related_to: "Связан с",
};

export function relationsForWorkspace(relations, workspaceId) {
  return relations.filter((relation) => (
    relation.workspace_id === null || relation.workspace_id === workspaceId
  ));
}

export function globalRelations(relations) {
  return relations.filter((relation) => relation.workspace_id === null);
}

export function relationOtherItemId(relation, itemId) {
  return relation.source_id === itemId ? relation.target_id : relation.source_id;
}

export function relationDirectionLabel(relation, itemId) {
  if (relation.type === "related_to") return "Связан с";
  if (relation.type === "parent_of") {
    return relation.source_id === itemId ? "Дополнительный ребёнок" : "Дополнительный родитель";
  }
  if (relation.type === "blocks") {
    return relation.source_id === itemId ? "Блокирует" : "Заблокирован объектом";
  }
  if (relation.type === "depends_on") {
    return relation.source_id === itemId ? "Зависит от" : "От него зависит";
  }
  return RELATION_LABELS[relation.type] ?? relation.type;
}
