import { useState } from "react";
import { relationDirectionLabel, relationOtherItemId } from "../relations";

const TYPES = [
  ["parent_of", "Дополнительный родитель"],
  ["depends_on", "Зависит от"],
  ["blocks", "Блокирует"],
  ["related_to", "Связан с"],
];

export default function RelationsPanel({
  item,
  items,
  relations,
  workspaces,
  activeWorkspace,
  onCreate,
  onDelete,
}) {
  const candidates = items.filter((candidate) => candidate.id !== item.id);
  const [adding, setAdding] = useState(false);
  const [otherId, setOtherId] = useState("");
  const [type, setType] = useState("related_to");
  const [scope, setScope] = useState("global");
  const [saving, setSaving] = useState(false);
  const workspaceNames = new Map(workspaces.map((workspace) => [workspace.id, workspace.name]));
  const itemNames = new Map(items.map((candidate) => [candidate.id, candidate.title]));

  async function submit(event) {
    event.preventDefault();
    if (!otherId) return;
    const chosenId = Number(otherId);
    const parentRelation = type === "parent_of";
    setSaving(true);
    try {
      const created = await onCreate({
        source_id: parentRelation ? chosenId : item.id,
        target_id: parentRelation ? item.id : chosenId,
        type,
        workspace_id: scope === "workspace" ? activeWorkspace.id : null,
      });
      if (!created) return;
      setAdding(false);
      setOtherId("");
      setType("related_to");
      setScope("global");
    } finally {
      setSaving(false);
    }
  }

  return <section className="relations-panel">
    <div className="relations-panel__heading">
      <span className="inspector-label">Связи</span>
      <button type="button" onClick={() => setAdding((value) => !value)}>
        {adding ? "Отмена" : "＋ Добавить"}
      </button>
    </div>
    {relations.length === 0 && !adding && <p className="relations-panel__empty">Связей пока нет.</p>}
    {relations.map((relation) => {
      const otherIdValue = relationOtherItemId(relation, item.id);
      const scopeLabel = relation.workspace_id === null
        ? "Везде"
        : `Только здесь: ${workspaceNames.get(relation.workspace_id) ?? relation.workspace_id}`;
      return <div className="relation-row" key={relation.id}>
        <div>
          <strong>{relationDirectionLabel(relation, item.id)}</strong>
          <span>{itemNames.get(otherIdValue) ?? `Объект #${otherIdValue}`}</span>
          <small>{scopeLabel}</small>
        </div>
        <button type="button" onClick={() => onDelete(relation.id)} aria-label="Удалить связь">×</button>
      </div>;
    })}
    {adding && <form className="relation-form" onSubmit={submit}>
      <label>Тип<select value={type} onChange={(event) => setType(event.target.value)}>
        {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label>{type === "parent_of" ? "Родитель" : "Объект"}<select required value={otherId} onChange={(event) => setOtherId(event.target.value)}>
        <option value="">Выберите объект</option>
        {candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}
      </select></label>
      <label>Область<select value={scope} onChange={(event) => setScope(event.target.value)}>
        <option value="global">Везде</option>
        {!activeWorkspace.system && <option value="workspace">Только здесь</option>}
      </select></label>
      <button type="submit" disabled={saving || !otherId}>{saving ? "Сохранение…" : "Создать связь"}</button>
    </form>}
  </section>;
}
