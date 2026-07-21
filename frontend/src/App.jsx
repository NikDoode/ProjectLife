import { useEffect, useState } from "react";

import { fetchItemTree } from "./api/items";
import ItemDetails from "./components/ItemDetails/ItemDetails";
import Tree from "./components/Tree/Tree";
import "./App.css";

export default function App() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
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
    loadTree();
  }, []);

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
        <div className="app__workspace">
          <section className="app__tree-panel">
            <Tree
              items={items}
              selectedItemId={selectedItem?.id ?? null}
              onSelectItem={setSelectedItem}
            />
          </section>

          <aside className="app__details-panel">
            <ItemDetails item={selectedItem} />
          </aside>
        </div>
      )}
    </main>
  );
}