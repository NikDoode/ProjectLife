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
  itemById,
  parentRelations,
  level = 0,
  virtual = false,
  ancestry = new Set(),
  selectedItemId,
  onSelectItem,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const children = item.children ?? [];
  const virtualChildren = parentRelations
    .filter((relation) => relation.source_id === item.id)
    .map((relation) => itemById.get(relation.target_id))
    .filter((child) => child && !ancestry.has(child.id));
  const hasChildren = children.length > 0 || virtualChildren.length > 0;
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
            <span className="tree-node__title">{virtual && <span className="tree-node__virtual" title="Дополнительное появление">↗ </span>}{item.title}</span>

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
              itemById={itemById}
              parentRelations={parentRelations}
              level={level + 1}
              ancestry={new Set([...ancestry, item.id])}
              selectedItemId={selectedItemId}
              onSelectItem={onSelectItem}
            />
          ))}
          {virtualChildren.map((child) => (
            <TreeNode
              key={`virtual-${item.id}-${child.id}`}
              item={child}
              itemById={itemById}
              parentRelations={parentRelations}
              level={level + 1}
              virtual
              ancestry={new Set([...ancestry, item.id])}
              selectedItemId={selectedItemId}
              onSelectItem={onSelectItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
