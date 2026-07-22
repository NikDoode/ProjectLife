import { useEffect, useState } from "react";

import { fetchItemTree, updateItemStatus } from "./api/items";
import TodayPanel from "./components/TodayPanel";
import ItemDetails from "./components/ItemDetails/ItemDetails";
import ViewRenderer from "./views/ViewRenderer";
import "./App.css";

export default function App() {
  const [activeViewType, setActiveViewType] = useState("tree");
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [todayItemIds, setTodayItemIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("todayItemIds")) ?? [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTree() {
    try {
      setIsLoading(true);
      setError("");

      const tree = await fetchItemTree();
      setItems(tree);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchItemTree()
      .then(setItems)
      .catch((loadError) => setError(loadError.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem("todayItemIds", JSON.stringify(todayItemIds));
  }, [todayItemIds]);

  function flattenItems(nodes) {
    return nodes.flatMap((item) => [item, ...flattenItems(item.children ?? [])]);
  }

  function replaceItemStatus(nodes, itemId, status) {
    return nodes.map((item) => ({
      ...item,
      status: item.id === itemId ? status : item.status,
      children: replaceItemStatus(item.children ?? [], itemId, status),
    }));
  }

  const allItems = flattenItems(items);
  const selectedItem = allItems.find((item) => item.id === selectedItemId) ?? null;

  function addToToday(itemId) {
    setTodayItemIds((ids) => (ids.includes(itemId) ? ids : [...ids, itemId]));
  }

  function removeFromToday(itemId) {
    setTodayItemIds((ids) => ids.filter((id) => id !== itemId));
  }

  async function handleTaskCompletion(item, isDone) {
    const nextStatus = isDone ? "done" : "in_progress";
    const previousStatus = item.status;
    setItems((currentItems) =>
      replaceItemStatus(currentItems, item.id, nextStatus),
    );

    try {
      const updatedItem = await updateItemStatus(item.id, nextStatus);
      setItems((currentItems) =>
        replaceItemStatus(currentItems, item.id, updatedItem.status),
      );
    } catch (updateError) {
      setItems((currentItems) =>
        replaceItemStatus(currentItems, item.id, previousStatus),
      );
      setError(updateError.message);
    }
  }

  return (
    <main className="app">
      <header className="app__header">
        <div>
          <h1>Project Life</h1>
          <p>Древовидная проекция организаций</p>
        </div>

        <button
          type="button"
          className="app__refresh-button"
          onClick={loadTree}
          disabled={isLoading}
        >
          {isLoading ? "Загрузка…" : "Обновить"}
        </button>
      </header>

      {error && (
        <section className="app__error">
          <p>{error}</p>
          <button type="button" onClick={loadTree}>
            Повторить
          </button>
        </section>
      )}

      {!error && isLoading && (
        <section className="app__message">Загрузка дерева…</section>
      )}

      {!error && !isLoading && (
        <>
          <nav className="app__view-switcher" aria-label="Представление">
            <button
              type="button"
              onClick={() => setActiveViewType("tree")}
              aria-pressed={activeViewType === "tree"}
            >
              Дерево
            </button>
            <button
              type="button"
              onClick={() => setActiveViewType("spatial")}
              aria-pressed={activeViewType === "spatial"}
            >
              Пространство
            </button>
          </nav>

          <div className="app__workspace">
            <section className="app__view-panel">
              <ViewRenderer
                viewType={activeViewType}
                items={items}
                selectedItemId={selectedItemId}
                onSelectItem={(item) => setSelectedItemId(item.id)}
              />
            </section>

            <aside className="app__details-panel">
              <ItemDetails
                item={selectedItem}
                isInToday={
                  selectedItem
                    ? todayItemIds.includes(selectedItem.id)
                    : false
                }
                onAddToToday={addToToday}
                onRemoveFromToday={removeFromToday}
              />
            </aside>
            <TodayPanel
              items={allItems}
              todayItemIds={todayItemIds}
              onSelectItem={(item) => setSelectedItemId(item.id)}
              onRemoveItem={removeFromToday}
              onToggleTask={handleTaskCompletion}
            />
          </div>
        </>
      )}
    </main>
  );
}
