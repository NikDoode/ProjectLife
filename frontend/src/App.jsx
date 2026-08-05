import { useEffect, useMemo, useState } from "react";
import { createItem, deleteItem, fetchItemTree, updateItem, updateItemStatus } from "./api/items";
import TodayPanel from "./components/TodayPanel";
import ItemDetails from "./components/ItemDetails/ItemDetails";
import ItemDialog from "./components/ItemDialog";
import FullItemCard from "./components/FullItemCard";
import WorkspaceSettings from "./components/WorkspaceSettings";
import ViewRenderer from "./views/ViewRenderer";
import "./App.css";

const NODE_STORAGE_KEY = "projectLife.nodeDisplay.v1";
const PREFS_STORAGE_KEY = "projectLife.workspacePrefs.v1";
const defaultPreferences = { theme: "ocean", showGrid: true, showLines: true, showDone: true, showArchived: false };
const legacyThemes = { navy: "ocean", graphite: "slate", forest: "chalkboard", light: "sand" };
const flatten = (nodes) => nodes.flatMap((item) => [item, ...flatten(item.children ?? [])]);
function readStorage(key, fallback) { try { return { ...fallback, ...(JSON.parse(localStorage.getItem(key)) ?? {}) }; } catch { return fallback; } }

export default function App() {
  const [view, setView] = useState("spatial");
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [full, setFull] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [todayIds, setTodayIds] = useState(() => { try { return JSON.parse(localStorage.getItem("todayItemIds")) ?? []; } catch { return []; } });
  const [nodeDisplay, setNodeDisplay] = useState(() => readStorage(NODE_STORAGE_KEY, {}));
  const [preferences, setPreferences] = useState(() => { const stored = readStorage(PREFS_STORAGE_KEY, defaultPreferences); return { ...stored, theme: legacyThemes[stored.theme] ?? stored.theme }; });
  const allItems = useMemo(() => flatten(items), [items]);
  const selected = allItems.find((item) => item.id === selectedId) ?? null;

  async function load() { setError(""); try { setItems(await fetchItemTree()); } catch (loadError) { setError(loadError.message); } finally { setLoading(false); } }
  useEffect(() => { fetchItemTree().then(setItems).catch((loadError) => setError(loadError.message)).finally(() => setLoading(false)); }, []);
  useEffect(() => localStorage.setItem("todayItemIds", JSON.stringify(todayIds)), [todayIds]);
  useEffect(() => localStorage.setItem(NODE_STORAGE_KEY, JSON.stringify(nodeDisplay)), [nodeDisplay]);
  useEffect(() => localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences)), [preferences]);

  async function save(data) { dialog === "edit" ? await updateItem(selected.id, data) : await createItem(data); setDialog(null); await load(); }
  async function remove() { if (!selected || !window.confirm(`Удалить «${selected.title}»?`)) return; try { await deleteItem(selected.id); setTodayIds((ids) => ids.filter((id) => id !== selected.id)); setNodeDisplay((current) => { const next = { ...current }; delete next[selected.id]; return next; }); setSelectedId(null); setFull(false); await load(); } catch (removeError) { setError(removeError.message); window.alert(removeError.message); } }
  async function toggle(item, done) { try { await updateItemStatus(item.id, done ? "done" : "in_progress"); await load(); } catch (toggleError) { setError(toggleError.message); } }
  function updateNodeDisplay(itemId, patch) { setNodeDisplay((current) => ({ ...current, [itemId]: { ...current[itemId], ...patch } })); }
  function resetLayout() { setNodeDisplay((current) => Object.fromEntries(Object.entries(current).map(([id, value]) => [id, { size: value.size, color: value.color }]))); }

  const inspector = selected && <ItemDetails item={selected} isInToday={todayIds.includes(selected.id)} onAddToToday={(id) => setTodayIds((ids) => ids.includes(id) ? ids : [...ids, id])} onRemoveFromToday={(id) => setTodayIds((ids) => ids.filter((value) => value !== id))} onEdit={() => setDialog("edit")} onAddChild={() => setDialog("child")} onOpen={() => setFull(true)} onClose={() => setSelectedId(null)} display={nodeDisplay[selected.id]} onDisplayChange={(patch) => updateNodeDisplay(selected.id, patch)} />;

  return <main className={`app-shell theme-${preferences.theme}`}>
    <section className="workspace">
      <header className="topbar"><nav className="view-switcher" aria-label="Представление"><button aria-pressed={view === "spatial"} onClick={() => setView("spatial")}>Пространство</button><button aria-pressed={view === "tree"} onClick={() => setView("tree")}>Дерево</button></nav><div className="topbar__actions">{view === "spatial" && <button className="button ghost" onClick={() => setSettingsOpen((open) => !open)} aria-expanded={settingsOpen}>⚙ Настройки</button>}<button className="button primary" onClick={() => setDialog("create")}>＋ Создать</button></div></header>
      {settingsOpen && view === "spatial" && <><button className="settings-dismiss" onClick={() => setSettingsOpen(false)} aria-label="Закрыть настройки" /><WorkspaceSettings preferences={preferences} onChange={setPreferences} onClose={() => setSettingsOpen(false)} onResetLayout={resetLayout} /></>}
      {error && <div className="error-banner"><span>{error}</span><button onClick={() => setError("")} aria-label="Закрыть">×</button></div>}
      {loading ? <div className="state-message">Загрузка пространства…</div> : <div className="canvas"><ViewRenderer viewType={view} items={items} selectedItemId={selectedId} onSelectItem={(item) => setSelectedId(item?.id ?? null)} inspector={inspector} nodeDisplay={nodeDisplay} onNodeDisplayChange={updateNodeDisplay} preferences={preferences} /></div>}
    </section>
    <TodayPanel items={allItems} todayItemIds={todayIds} onSelectItem={(item) => setSelectedId(item.id)} onRemoveItem={(id) => setTodayIds((ids) => ids.filter((value) => value !== id))} onToggleTask={toggle} />
    {dialog && <ItemDialog mode={dialog} item={dialog === "edit" ? selected : null} parentId={dialog === "child" ? selected?.id : null} items={allItems} onClose={() => setDialog(null)} onSave={save} />}
    {full && selected && <FullItemCard item={selected} items={allItems} isInToday={todayIds.includes(selected.id)} onClose={() => setFull(false)} onEdit={() => { setFull(false); setDialog("edit"); }} onDelete={remove} />}
  </main>;
}
