import { useState } from "react";

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
    return null;
  }

  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("ru-RU").format(date);
}

export default function TreeNode({
  item,
  level = 0,
  selectedItemId,
  onSelectItem,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const children = item.children ?? [];
  const hasChildren = children.length > 0;
  const dueDate = formatDate(item.due_at);
  const isSelected = selectedItemId === item.id;

  function toggleExpanded() {
    if (hasChildren) {
      setIsExpanded((currentValue) => !currentValue);
    }
  }

  return (
    <div className="tree-node">
      <div
        className={[
          "tree-node__row",
          `tree-node__row--${item.kind}`,
          isSelected ? "tree-node__row--selected" : "",
        ].join(" ")}
        style={{ paddingLeft: `${12 + level * 28}px` }}
        onClick={() => onSelectItem(item)}
      >
        <button
          type="button"
          className="tree-node__toggle"
          onClick={(event) => {
            event.stopPropagation();
            toggleExpanded();
          }}
          disabled={!hasChildren}
          aria-label={isExpanded ? "Свернуть ветку" : "Развернуть ветку"}
        >
          {hasChildren ? (isExpanded ? "▼" : "▶") : "•"}
        </button>

        <div className="tree-node__content">
          <div className="tree-node__header">
            <span className="tree-node__title">{item.title}</span>

            <span
              className={`tree-node__kind tree-node__kind--${item.kind}`}
            >
              {KIND_NAMES[item.kind] ?? item.kind}
            </span>
          </div>

          <div className="tree-node__meta">
            <span>{STATUS_NAMES[item.status] ?? item.status}</span>

            <span>
              Приоритет: {PRIORITY_NAMES[item.priority] ?? item.priority}
            </span>

            {dueDate && <span>Срок: {dueDate}</span>}
          </div>

          {item.description && (
            <p className="tree-node__description">{item.description}</p>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="tree-node__children">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
              selectedItemId={selectedItemId}
              onSelectItem={onSelectItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}