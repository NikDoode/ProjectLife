import { cloneElement, useEffect, useMemo, useRef, useState } from "react";
import "./SpatialView.css";

const MIN_SCALE = 0.55;
const MAX_SCALE = 1.8;
const DRAG_THRESHOLD = 4;

function indexTree(items) {
  const map = new Map();
  const visit = (item, parent = null) => { map.set(item.id, { item, parent }); (item.children ?? []).forEach((child) => visit(child, item)); };
  items.forEach((item) => visit(item));
  return map;
}

function automaticPosition(index, total, isCenter) {
  if (isCenter) return { x: 50, y: 18 };
  if (total === 1) return { x: 50, y: 58 };
  const angle = Math.PI * (0.12 + (0.76 * index) / Math.max(total - 1, 1));
  return { x: 50 - Math.cos(angle) * 37, y: 47 + Math.sin(angle) * 31 };
}

function isVisible(item, preferences) {
  if (!preferences.showDone && item.kind === "task" && item.status === "done") return false;
  if (!preferences.showArchived && item.status === "cancelled") return false;
  return true;
}

export default function SpatialView({ items, selectedItemId, onSelectItem, inspector, nodeDisplay = {}, onNodeDisplayChange, preferences, workspaces, activeWorkspaceId, onSelectWorkspace, onCreateWorkspace }) {
  const [centerId, setCenterId] = useState(null);
  const [dragPosition, setDragPosition] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [viewport, setViewport] = useState({ scale: 1, x: 0, y: 0 });
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [inspectorSize, setInspectorSize] = useState({ width: 0, height: 0 });
  const stageRef = useRef(null);
  const inspectorRef = useRef(null);
  const index = useMemo(() => indexTree(items), [items]);
  const entry = index.get(centerId);
  const center = entry?.item ?? null;
  const candidates = center ? center.children ?? [] : items;
  const visible = candidates.filter((item) => isVisible(item, preferences));
  const path = [];
  let pathItem = center;
  while (pathItem) { path.unshift(pathItem); pathItem = index.get(pathItem.id)?.parent; }

  const positions = new Map();
  if (center) positions.set(center.id, nodeDisplay[center.id]?.position ?? automaticPosition(0, 1, true));
  visible.forEach((item, itemIndex) => positions.set(item.id, nodeDisplay[item.id]?.position ?? automaticPosition(itemIndex, visible.length, false)));
  if (dragPosition) positions.set(dragPosition.id, dragPosition.position);
  const selectedPosition = positions.get(selectedItemId);
  const selectedDisplay = selectedItemId ? nodeDisplay[selectedItemId] ?? {} : {};
  const nodeDiameter = { small: 56, medium: 110, large: 170 }[selectedDisplay.size ?? "medium"];
  const selectedScreenPosition = selectedPosition ? { x: viewport.x + stageSize.width * selectedPosition.x / 100 * viewport.scale, y: viewport.y + stageSize.height * selectedPosition.y / 100 * viewport.scale } : null;
  const inspectorStyle = selectedScreenPosition ? (() => {
    const margin = 10;
    const gap = 12;
    const radius = nodeDiameter * viewport.scale / 2;
    const right = selectedScreenPosition.x + radius + gap;
    const preferredLeft = right + inspectorSize.width <= stageSize.width - margin ? right : selectedScreenPosition.x - radius - gap - inspectorSize.width;
    const maxLeft = Math.max(margin, stageSize.width - inspectorSize.width - margin);
    const maxTop = Math.max(margin, stageSize.height - inspectorSize.height - margin);
    return { left: `${Math.max(margin, Math.min(preferredLeft, maxLeft))}px`, top: `${Math.max(margin, Math.min(selectedScreenPosition.y - 28, maxTop))}px`, maxHeight: `${Math.max(0, stageSize.height - margin * 2)}px`, visibility: inspectorSize.width > 0 ? "visible" : "hidden" };
  })() : null;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const observer = new ResizeObserver(([entry]) => setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const panel = inspectorRef.current;
    if (!panel) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      const next = { width: box?.inlineSize ?? entry.target.offsetWidth, height: box?.blockSize ?? entry.target.offsetHeight };
      setInspectorSize((current) => current.width === next.width && current.height === next.height ? current : next);
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, [selectedItemId, inspector]);

  function pointerPosition(event) {
    const rect = event.currentTarget.closest(".spatial-stage").getBoundingClientRect();
    const worldX = (event.clientX - rect.left - viewport.x) / viewport.scale;
    const worldY = (event.clientY - rect.top - viewport.y) / viewport.scale;
    return { x: Math.max(7, Math.min(93, (worldX / rect.width) * 100)), y: Math.max(10, Math.min(90, (worldY / rect.height) * 100)) };
  }

  function startPointer(event, item) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({ id: item.id, startX: event.clientX, startY: event.clientY, moved: false });
  }
  function movePointer(event, item) {
    if (dragState?.id !== item.id) return;
    const moved = dragState.moved || Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) >= DRAG_THRESHOLD;
    if (moved && !dragState.moved) setDragState({ ...dragState, moved: true });
    if (moved) setDragPosition({ id: item.id, position: pointerPosition(event) });
  }
  function finishPointer(event, item) {
    if (dragState?.id !== item.id) return;
    const moved = dragState.moved || Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY) >= DRAG_THRESHOLD;
    if (moved) onNodeDisplayChange(item.id, { position: pointerPosition(event) });
    else onSelectItem(item);
    setDragPosition(null);
    setDragState(null);
  }
  function cancelPointer() { setDragPosition(null); setDragState(null); }
  function open(item) { onSelectItem(item); if (!center || item.children?.length) setCenterId(item.id); }
  function zoom(event) {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;
    const factor = Math.exp(-event.deltaY * 0.0015);
    const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewport.scale * factor));
    if (nextScale === viewport.scale) return;
    const ratio = nextScale / viewport.scale;
    setViewport({ scale: nextScale, x: cursorX - (cursorX - viewport.x) * ratio, y: cursorY - (cursorY - viewport.y) * ratio });
  }

  function node(item, isCenter = false) {
    const position = positions.get(item.id); const display = nodeDisplay[item.id] ?? {};
    return <button key={item.id} type="button" className={`spatial-node size-${display.size ?? "medium"} color-${display.color ?? "slate"} ${isCenter ? "center" : ""} ${selectedItemId === item.id ? "selected" : ""} ${dragPosition?.id === item.id ? "dragging" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} onPointerDown={(event) => startPointer(event, item)} onPointerMove={(event) => movePointer(event, item)} onPointerUp={(event) => finishPointer(event, item)} onPointerCancel={cancelPointer} onDoubleClick={() => open(item)}>
      <i className={`kind-dot ${item.kind}`} /><span>{item.title}</span>
    </button>;
  }

  return <section className="spatial-view">
    <div className="spatial-nav"><div className="workspace-picker"><select value={activeWorkspaceId} onChange={(event) => { setCenterId(null); onSelectWorkspace(event.target.value); }} aria-label="Рабочее пространство">{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select><button className="workspace-picker__add" onClick={onCreateWorkspace} title="Создать рабочее пространство" aria-label="Создать рабочее пространство">＋</button></div><div className="spatial-breadcrumbs"><button onClick={() => setCenterId(entry?.parent?.id ?? null)} disabled={!center} aria-label="Назад">‹</button><button onClick={() => setCenterId(null)}>Обзор</button>{path.map((item) => <span key={item.id}>› <button onClick={() => setCenterId(item.id)}>{item.title}</button></span>)}</div></div>
    {!items.length ? <p className="spatial-empty">Здесь пока пусто. Создайте первую область.</p> : <div className="spatial-stage" ref={stageRef} onWheel={zoom} onClick={(event) => { if (event.target === event.currentTarget || event.target.classList.contains("spatial-viewport")) onSelectItem(null); }}>
      <div className={`spatial-viewport ${preferences.showGrid ? "show-grid" : ""}`} style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})` }}>
        {center && preferences.showLines && <svg className="spatial-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{visible.map((item) => { const source = positions.get(center.id); const target = positions.get(item.id); return <line key={item.id} x1={source.x} y1={source.y} x2={target.x} y2={target.y} />; })}</svg>}
        {center && node(center, true)}{visible.map((item) => node(item))}
      </div>
      {inspector && selectedPosition && <div ref={inspectorRef} className="spatial-inspector-shell" style={inspectorStyle}>{cloneElement(inspector, { style: { position: "relative", left: "auto", top: "auto", maxHeight: "inherit" } })}</div>}
    </div>}
    {center && !visible.length && <p className="spatial-empty spatial-empty--children">Нет отображаемых дочерних элементов.</p>}
  </section>;
}
