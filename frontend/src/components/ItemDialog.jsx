import { useState } from "react";

const empty = { title: "", parent_id: "", kind: "task", description: "", status: "inbox", priority: "normal", due_at: "" };

export default function ItemDialog({ mode, item, parentId, items, onClose, onSave }) {
  const [form, setForm] = useState(() => item ? {
    title: item.title, parent_id: item.parent_id ?? "", kind: item.kind,
    description: item.description ?? "", status: item.status,
    priority: item.priority, due_at: item.due_at ?? "",
  } : { ...empty, parent_id: parentId ?? "", kind: parentId ? "task" : "area" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function change(event) { setForm((value) => ({ ...value, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await onSave({ ...form, title: form.title.trim(), parent_id: form.parent_id === "" ? null : Number(form.parent_id), description: form.description || null, due_at: form.due_at || null });
    } catch (saveError) { setError(saveError.message); setSaving(false); }
  }

  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <form className="dialog" onSubmit={submit}>
      <header><h2>{mode === "edit" ? "Редактировать" : "Новый объект"}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть">×</button></header>
      {error && <p className="form-error">{error}</p>}
      <label>Название<input autoFocus required name="title" value={form.title} onChange={change} /></label>
      <div className="form-grid">
        <label>Тип<select name="kind" value={form.kind} onChange={change}><option value="area">Область</option><option value="project">Проект</option><option value="task">Задача</option></select></label>
        <label>Родитель<select name="parent_id" value={form.parent_id} onChange={change}><option value="">Без родителя</option>{items.filter((x) => x.id !== item?.id).map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
        <label>Статус<select name="status" value={form.status} onChange={change}><option value="inbox">Входящие</option><option value="planned">Запланировано</option><option value="in_progress">В работе</option><option value="done">Завершено</option><option value="cancelled">Отменено</option></select></label>
        <label>Приоритет<select name="priority" value={form.priority} onChange={change}><option value="low">Низкий</option><option value="normal">Обычный</option><option value="high">Высокий</option><option value="critical">Критический</option></select></label>
      </div>
      <label>Срок<input type="date" name="due_at" value={form.due_at} onChange={change} /></label>
      <label>Описание<textarea name="description" rows="4" value={form.description} onChange={change} /></label>
      <footer><button type="button" className="button ghost" onClick={onClose}>Отмена</button><button className="button primary" disabled={saving}>{saving ? "Сохранение…" : "Сохранить"}</button></footer>
    </form>
  </div>;
}
