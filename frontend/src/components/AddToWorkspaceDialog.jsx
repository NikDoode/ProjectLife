import { useState } from "react";

export default function AddToWorkspaceDialog({ item, workspaces, onClose, onAdd }) {
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id ?? "");
  const [mode, setMode] = useState("self");
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="dialog add-workspace-dialog" onSubmit={(event) => { event.preventDefault(); onAdd(workspaceId, item.id, mode); }}>
      <header><div><span className="eyebrow">Добавить в пространство</span><h2>{item.title}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть">×</button></header>
      <label>Рабочее пространство<select value={workspaceId} onChange={(event) => setWorkspaceId(event.target.value)}>{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></label>
      <fieldset className="rule-options"><legend>Что отображать</legend><label><input type="radio" name="rule" value="self" checked={mode === "self"} onChange={(event) => setMode(event.target.value)} />Только объект</label><label><input type="radio" name="rule" value="children" checked={mode === "children"} onChange={(event) => setMode(event.target.value)} />Объект и непосредственные дети</label><label><input type="radio" name="rule" value="subtree" checked={mode === "subtree"} onChange={(event) => setMode(event.target.value)} />Объект и всё поддерево</label></fieldset>
      <footer><button type="button" className="button ghost" onClick={onClose}>Отмена</button><button className="button primary" disabled={!workspaceId}>Добавить</button></footer>
    </form>
  </div>;
}
