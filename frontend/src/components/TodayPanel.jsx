import { useState } from "react";

import "./TodayPanel.css";

const CONTEXT_STORAGE_KEY = "todayPanelShowContext";

export default function TodayPanel({
  items,
  todayItemIds,
  onSelectItem,
  onRemoveItem,
  onToggleTask,
}) {
  const [showContext, setShowContext] = useState(
    () => localStorage.getItem(CONTEXT_STORAGE_KEY) !== "false",
  );
  const itemById = new Map(items.map((item) => [item.id, item]));
  const todayTasks = todayItemIds
    .map((id) => itemById.get(id))
    .filter((item) => item?.kind === "task");

  function toggleContext() {
    setShowContext((currentValue) => {
      localStorage.setItem(CONTEXT_STORAGE_KEY, String(!currentValue));
      return !currentValue;
    });
  }

  function taskRow(task) {
    return (
      <div className="today-panel__task" key={task.id}>
        <label>
          <input
            type="checkbox"
            checked={task.status === "done"}
            onChange={(event) => onToggleTask(task, event.target.checked)}
          />
          <button type="button" onClick={() => onSelectItem(task)}>
            {task.title}
          </button>
        </label>
        <button type="button" onClick={() => onRemoveItem(task.id)}>
          Убрать
        </button>
      </div>
    );
  }

  const groups = new Map();
  todayTasks.forEach((task) => {
    const parent = itemById.get(task.parent_id);
    const groupKey = parent?.id ?? "root";
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        id: groupKey,
        title: parent?.title ?? "Без контекста",
        tasks: [],
      });
    }
    groups.get(groupKey).tasks.push(task);
  });

  return (
    <aside className="today-panel">
      <div className="today-panel__header">
        <h2>Сегодня</h2>
        <button type="button" onClick={toggleContext}>
          {showContext ? "Скрыть контекст" : "Показать контекст"}
        </button>
      </div>

      {todayTasks.length === 0 && (
        <p className="today-panel__empty">Задач на сегодня нет.</p>
      )}

      {showContext
        ? [...groups.values()].map((group) => (
            <section className="today-panel__group" key={group.id}>
              <h3>{group.title}</h3>
              {group.tasks.map(taskRow)}
            </section>
          ))
        : todayTasks.map(taskRow)}
    </aside>
  );
}
