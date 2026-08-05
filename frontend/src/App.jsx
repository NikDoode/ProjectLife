import { useEffect, useMemo, useState } from "react";
import { createItem, deleteItem, fetchItemTree, updateItem, updateItemStatus } from "./api/items";
import TodayPanel from "./components/TodayPanel";
import ItemDetails from "./components/ItemDetails/ItemDetails";
import ItemDialog from "./components/ItemDialog";
import FullItemCard from "./components/FullItemCard";
import WorkspaceSettings from "./components/WorkspaceSettings";
import AddToWorkspaceDialog from "./components/AddToWorkspaceDialog";
import ViewRenderer from "./views/ViewRenderer";
import { createInitialWorkspaceState, filterTreeByIds, flattenItems, GENERAL_WORKSPACE_ID, getVisibleItemIds, isItemIncluded, WORKSPACES_STORAGE_KEY } from "./workspaces";
import "./App.css";

const LEGACY_NODE_STORAGE_KEY = "projectLife.nodeDisplay.v1";
const PREFS_STORAGE_KEY = "projectLife.workspacePrefs.v1";
const defaultPreferences = { theme: "ocean", showGrid: true, showLines: true, showDone: true, showArchived: false };
const legacyThemes = { navy: "ocean", graphite: "slate", forest: "chalkboard", light: "sand" };
function readStorage(key, fallback) { try { return { ...fallback, ...(JSON.parse(localStorage.getItem(key)) ?? {}) }; } catch { return fallback; } }
function readWorkspaceState() {
  try {
    const stored = JSON.parse(localStorage.getItem(WORKSPACES_STORAGE_KEY));
    if (stored?.workspaces?.some((workspace) => workspace.id === GENERAL_WORKSPACE_ID)) return stored;
  } catch { /* use migrated initial state */ }
  return createInitialWorkspaceState(readStorage(LEGACY_NODE_STORAGE_KEY, {}));
}

export default function App() {
  const [view, setView] = useState("spatial");
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [full, setFull] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [workspaceDialogItem, setWorkspaceDialogItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [todayIds, setTodayIds] = useState(() => { try { return JSON.parse(localStorage.getItem("todayItemIds")) ?? []; } catch { return []; } });
  const [workspaceState, setWorkspaceState] = useState(readWorkspaceState);
  const [preferences, setPreferences] = useState(() => { const stored = readStorage(PREFS_STORAGE_KEY, defaultPreferences); return { ...stored, theme: legacyThemes[stored.theme] ?? stored.theme }; });
  const allItems = useMemo(() => flattenItems(items), [items]);
  const selected = allItems.find((item) => item.id === selectedId) ?? null;
  const activeWorkspace = workspaceState.workspaces.find((workspace) => workspace.id === workspaceState.activeId) ?? workspaceState.workspaces[0];
  const customWorkspaces = workspaceState.workspaces.filter((workspace) => !workspace.system);
  const spatialItems = useMemo(() => activeWorkspace.system ? items : filterTreeByIds(items, getVisibleItemIds(items, activeWorkspace.rules)), [activeWorkspace, items]);

  async function load() { setError(""); try { const tree = await fetchItemTree(); setItems(tree); return tree; } catch (loadError) { setError(loadError.message); return []; } finally { setLoading(false); } }
  useEffect(() => { fetchItemTree().then(setItems).catch((loadError) => setError(loadError.message)).finally(() => setLoading(false)); }, []);
  useEffect(() => localStorage.setItem("todayItemIds", JSON.stringify(todayIds)), [todayIds]);
  useEffect(() => localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(workspaceState)), [workspaceState]);
  useEffect(() => localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences)), [preferences]);

  function updateWorkspace(workspaceId, updater) { setWorkspaceState((current) => ({ ...current, workspaces: current.workspaces.map((workspace) => workspace.id === workspaceId ? updater(workspace) : workspace) })); }
  function updateNodeDisplay(itemId, patch) { updateWorkspace(activeWorkspace.id, (workspace) => ({ ...workspace, placements: { ...workspace.placements, [itemId]: { ...workspace.placements?.[itemId], ...patch } } })); }
  function resetLayout() { updateWorkspace(activeWorkspace.id, (workspace) => ({ ...workspace, placements: Object.fromEntries(Object.entries(workspace.placements ?? {}).map(([id, value]) => [id, { size: value.size, color: value.color }])) })); }
  function selectWorkspace(workspaceId) { setWorkspaceState((current) => ({ ...current, activeId: workspaceId })); setSelectedId(null); setSettingsOpen(false); }
  function createWorkspace() { const name = window.prompt("Название рабочего пространства"); if (!name?.trim()) return; setWorkspaceState((current) => { const id = `workspace-${current.workspaces.length}`; return { activeId: id, workspaces: [...current.workspaces, { id, name: name.trim(), system: false, rules: [], placements: {} }] }; }); setSelectedId(null); }
  function addWorkspaceRule(workspaceId, itemId, mode) { updateWorkspace(workspaceId, (workspace) => ({ ...workspace, rules: [...workspace.rules.filter((rule) => rule.itemId !== itemId), { itemId, mode }] })); setWorkspaceDialogItem(null); }

  async function save(data) {
    if (dialog === "edit") await updateItem(selected.id, data);
    else {
      const created = await createItem(data);
      const tree = await load();
      if (!activeWorkspace.system && !isItemIncluded(tree, activeWorkspace.rules, created.id)) addWorkspaceRule(activeWorkspace.id, created.id, "self");
    }
    setDialog(null);
    if (dialog === "edit") await load();
  }
  async function remove() { if (!selected || !window.confirm(`Удалить «${selected.title}»?`)) return; try { await deleteItem(selected.id); setTodayIds((ids) => ids.filter((id) => id !== selected.id)); setWorkspaceState((current) => ({ ...current, workspaces: current.workspaces.map((workspace) => ({ ...workspace, rules: workspace.rules.filter((rule) => rule.itemId !== selected.id), placements: Object.fromEntries(Object.entries(workspace.placements ?? {}).filter(([id]) => Number(id) !== selected.id)) })) })); setSelectedId(null); setFull(false); await load(); } catch (removeError) { setError(removeError.message); window.alert(removeError.message); } }
  async function toggle(item, done) { try { await updateItemStatus(item.id, done ? "done" : "in_progress"); await load(); } catch (toggleError) { setError(toggleError.message); } }

  const placements = activeWorkspace.placements ?? {};
  const inspector = selected && <ItemDetails item={selected} isInToday={todayIds.includes(selected.id)} onAddToToday={(id) => setTodayIds((ids) => ids.includes(id) ? ids : [...ids, id])} onRemoveFromToday={(id) => setTodayIds((ids) => ids.filter((value) => value !== id))} onEdit={() => setDialog("edit")} onAddChild={() => setDialog("child")} onOpen={() => setFull(true)} onClose={() => setSelectedId(null)} display={placements[selected.id]} onDisplayChange={(patch) => updateNodeDisplay(selected.id, patch)} onAddToWorkspace={activeWorkspace.system && customWorkspaces.length ? () => setWorkspaceDialogItem(selected) : null} />;

  return <main className={`app-shell theme-${preferences.theme}`}>
    <section className="workspace"><header className="topbar"><nav className="view-switcher" aria-label="Представление"><button aria-pressed={view === "spatial"} onClick={() => setView("spatial")}>Пространство</button><button aria-pressed={view === "tree"} onClick={() => setView("tree")}>Дерево</button></nav><div className="topbar__actions">{view === "spatial" && <button className="button ghost" onClick={() => setSettingsOpen((open) => !open)} aria-expanded={settingsOpen}>⚙ Настройки</button>}<button className="button primary" onClick={() => setDialog("create")}>＋ Создать</button></div></header>
      {settingsOpen && view === "spatial" && <><button className="settings-dismiss" onClick={() => setSettingsOpen(false)} aria-label="Закрыть настройки" /><WorkspaceSettings preferences={preferences} onChange={setPreferences} onClose={() => setSettingsOpen(false)} onResetLayout={resetLayout} /></>}
      {error && <div className="error-banner"><span>{error}</span><button onClick={() => setError("")} aria-label="Закрыть">×</button></div>}
      {loading ? <div className="state-message">Загрузка пространства…</div> : <div className="canvas"><ViewRenderer viewType={view} items={view === "spatial" ? spatialItems : items} selectedItemId={selectedId} onSelectItem={(item) => setSelectedId(item?.id ?? null)} inspector={inspector} nodeDisplay={placements} onNodeDisplayChange={updateNodeDisplay} preferences={preferences} workspaces={workspaceState.workspaces} activeWorkspaceId={activeWorkspace.id} onSelectWorkspace={selectWorkspace} onCreateWorkspace={createWorkspace} /></div>}
    </section>
    <TodayPanel items={allItems} todayItemIds={todayIds} onSelectItem={(item) => setSelectedId(item.id)} onRemoveItem={(id) => setTodayIds((ids) => ids.filter((value) => value !== id))} onToggleTask={toggle} />
    {dialog && <ItemDialog mode={dialog} item={dialog === "edit" ? selected : null} parentId={dialog === "child" ? selected?.id : null} items={allItems} onClose={() => setDialog(null)} onSave={save} />}
    {full && selected && <FullItemCard item={selected} items={allItems} isInToday={todayIds.includes(selected.id)} onClose={() => setFull(false)} onEdit={() => { setFull(false); setDialog("edit"); }} onDelete={remove} />}
    {workspaceDialogItem && <AddToWorkspaceDialog item={workspaceDialogItem} workspaces={customWorkspaces} onClose={() => setWorkspaceDialogItem(null)} onAdd={addWorkspaceRule} />}
  </main>;
}
