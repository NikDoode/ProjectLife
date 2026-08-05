import { useEffect, useMemo, useState } from "react";
import { createItem, deleteItem, fetchItemTree, updateItem, updateItemStatus } from "./api/items";
import TodayPanel from "./components/TodayPanel";
import ItemDetails from "./components/ItemDetails/ItemDetails";
import ItemDialog from "./components/ItemDialog";
import FullItemCard from "./components/FullItemCard";
import ViewRenderer from "./views/ViewRenderer";
import "./App.css";

const flatten = (nodes) => nodes.flatMap((item) => [item, ...flatten(item.children ?? [])]);

export default function App() {
  const [view, setView] = useState("spatial"); const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null); const [dialog, setDialog] = useState(null);
  const [full, setFull] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [todayIds, setTodayIds] = useState(() => { try { return JSON.parse(localStorage.getItem("todayItemIds")) ?? []; } catch { return []; } });
  const allItems = useMemo(() => flatten(items), [items]); const selected = allItems.find((x) => x.id === selectedId) ?? null;

  async function load() { setError(""); try { setItems(await fetchItemTree()); } catch (e) { setError(e.message); } finally { setLoading(false); } }
  useEffect(() => { fetchItemTree().then(setItems).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  useEffect(() => localStorage.setItem("todayItemIds", JSON.stringify(todayIds)), [todayIds]);
  async function save(data) { dialog === "edit" ? await updateItem(selected.id, data) : await createItem(data); setDialog(null); await load(); }
  async function remove() { if (!selected || !window.confirm(`Удалить «${selected.title}»?`)) return; try { await deleteItem(selected.id); setTodayIds((ids) => ids.filter((id) => id !== selected.id)); setSelectedId(null); setFull(false); await load(); } catch (e) { setError(e.message); window.alert(e.message); } }
  async function toggle(item, done) { try { await updateItemStatus(item.id, done ? "done" : "in_progress"); await load(); } catch (e) { setError(e.message); } }

  return <main className="app-shell">
    <section className="workspace">
      <header className="topbar"><nav className="view-switcher" aria-label="Представление"><button aria-pressed={view === "spatial"} onClick={() => setView("spatial")}>Пространство</button><button aria-pressed={view === "tree"} onClick={() => setView("tree")}>Дерево</button></nav><button className="button primary" onClick={() => setDialog("create")}>＋ Создать</button></header>
      {error && <div className="error-banner"><span>{error}</span><button onClick={() => setError("")} aria-label="Закрыть">×</button></div>}
      {loading ? <div className="state-message">Загрузка пространства…</div> : <div className="canvas" onClick={(e) => e.target === e.currentTarget && setSelectedId(null)}>
        <ViewRenderer viewType={view} items={items} selectedItemId={selectedId} onSelectItem={(item) => setSelectedId(item.id)} inspector={selected && <ItemDetails item={selected} isInToday={todayIds.includes(selected.id)} onAddToToday={(id) => setTodayIds((ids) => ids.includes(id) ? ids : [...ids, id])} onRemoveFromToday={(id) => setTodayIds((ids) => ids.filter((x) => x !== id))} onEdit={() => setDialog("edit")} onAddChild={() => setDialog("child")} onOpen={() => setFull(true)} onClose={() => setSelectedId(null)} />} />
      </div>}
    </section>
    <TodayPanel items={allItems} todayItemIds={todayIds} onSelectItem={(item) => setSelectedId(item.id)} onRemoveItem={(id) => setTodayIds((ids) => ids.filter((x) => x !== id))} onToggleTask={toggle} />
    {dialog && <ItemDialog mode={dialog} item={dialog === "edit" ? selected : null} parentId={dialog === "child" ? selected?.id : null} items={allItems} onClose={() => setDialog(null)} onSave={save} />}
    {full && selected && <FullItemCard item={selected} items={allItems} isInToday={todayIds.includes(selected.id)} onClose={() => setFull(false)} onEdit={() => { setFull(false); setDialog("edit"); }} onDelete={remove} />}
  </main>;
}
