const names = { area: "Область", project: "Проект", task: "Задача", inbox: "Входящие", planned: "Запланировано", in_progress: "В работе", done: "Завершено", cancelled: "Отменено", low: "Низкий", normal: "Обычный", high: "Высокий", critical: "Критический" };
export default function FullItemCard({ item, items, isInToday, onClose, onEdit, onDelete }) {
  const byId = new Map(items.map((x) => [x.id, x])); const path = []; let current = item;
  while (current) { path.unshift(current.title); current = byId.get(current.parent_id); }
  const children = items.filter((x) => x.parent_id === item.id);
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><article className="dialog full-card">
    <header><div><span className="eyebrow">{names[item.kind]}</span><h2>{item.title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Закрыть">×</button></header>
    <p className="full-card__path">{path.join("  ›  ")}</p><p>{item.description || "Описание не добавлено."}</p>
    <dl className="detail-grid"><div><dt>Статус</dt><dd>{names[item.status]}</dd></div><div><dt>Приоритет</dt><dd>{names[item.priority]}</dd></div><div><dt>Срок</dt><dd>{item.due_at || "Не указан"}</dd></div><div><dt>Сегодня</dt><dd>{isInToday ? "Добавлено" : "Нет"}</dd></div><div><dt>Родитель</dt><dd>{byId.get(item.parent_id)?.title || "Нет"}</dd></div><div><dt>Дочерние</dt><dd>{children.length ? children.map((x) => x.title).join(", ") : "Нет"}</dd></div></dl>
    <footer><button className="button danger" onClick={onDelete}>Удалить</button><button className="button primary" onClick={onEdit}>Редактировать</button></footer>
  </article></div>;
}
