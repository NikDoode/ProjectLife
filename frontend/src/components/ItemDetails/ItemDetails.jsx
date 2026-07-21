import "./ItemDetails.css";

const KIND_NAMES = {
  area: "Область",
  project: "Проект",
  task: "Задача",
};

const STATUS_NAMES = {
  inbox: "Входящие",
  planned: "Запланировано",
  in_progress: "В работе",
  done: "Завершено",
  cancelled: "Отменено",
};

const PRIORITY_NAMES = {
  low: "Низкий",
  normal: "Обычный",
  high: "Высокий",
};

function formatDate(dateString) {
  if (!dateString) {
    return "Не указан";
  }

  return new Intl.DateTimeFormat("ru-RU").format(
    new Date(`${dateString}T00:00:00`),
  );
}

export default function ItemDetails({ item }) {
  if (!item) {
    return (
      <div className="item-details item-details--empty">
        Выберите объект в дереве.
      </div>
    );
  }

  return (
    <div className="item-details">
      <div className="item-details__header">
        <h2>{item.title}</h2>
        <span className={`item-details__kind item-details__kind--${item.kind}`}>
          {KIND_NAMES[item.kind] ?? item.kind}
        </span>
      </div>

      <dl className="item-details__fields">
        <div>
          <dt>Статус</dt>
          <dd>{STATUS_NAMES[item.status] ?? item.status}</dd>
        </div>

        <div>
          <dt>Приоритет</dt>
          <dd>{PRIORITY_NAMES[item.priority] ?? item.priority}</dd>
        </div>

        <div>
          <dt>Срок</dt>
          <dd>{formatDate(item.due_at)}</dd>
        </div>

        <div>
          <dt>Описание</dt>
          <dd>{item.description || "Не указано"}</dd>
        </div>
      </dl>
    </div>
  );
}