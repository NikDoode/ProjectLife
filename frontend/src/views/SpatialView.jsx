import { cloneElement, useMemo, useState } from "react";
import "./SpatialView.css";

function indexTree(items) {
  const map = new Map();
  const visit = (item, parent = null) => {
    map.set(item.id, { item, parent });
    (item.children ?? []).forEach((child) => visit(child, item));
  };
  items.forEach((item) => visit(item));
  return map;
}

function childPosition(index, total) {
  if (total === 1) return { x: 50, y: 58 };
  const angle = Math.PI * (0.12 + (0.76 * index) / Math.max(total - 1, 1));
  return { x: 50 - Math.cos(angle) * 37, y: 47 + Math.sin(angle) * 31 };
}

export default function SpatialView({ items, selectedItemId, onSelectItem, inspector }) {
  const [centerId, setCenterId] = useState(null);
  const index = useMemo(() => indexTree(items), [items]);
  const entry = index.get(centerId);
  const center = entry?.item ?? null;
  const visible = center ? center.children ?? [] : items;
  const path = [];
  let pathItem = center;
  while (pathItem) { path.unshift(pathItem); pathItem = index.get(pathItem.id)?.parent; }

  const positions = new Map();
  if (center) positions.set(center.id, { x: 50, y: 18 });
  visible.forEach((item, itemIndex) => positions.set(item.id, childPosition(itemIndex, visible.length)));
  const selectedPosition = positions.get(selectedItemId);
  const inspectorStyle = selectedPosition ? {
    "--inspector-left": `calc(${selectedPosition.x}% ${selectedPosition.x > 65 ? "- 275px" : "+ 70px"})`,
    "--inspector-top": `calc(${selectedPosition.y}% ${selectedPosition.y > 65 ? "- 220px" : "- 35px"})`,
  } : null;

  function open(item) {
    onSelectItem(item);
    if (!center || item.children?.length) setCenterId(item.id);
  }

  function node(item, isCenter = false) {
    const position = positions.get(item.id);
    return <button key={item.id} type="button" className={`spatial-node ${isCenter ? "center" : ""} ${selectedItemId === item.id ? "selected" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} onClick={(event) => { event.stopPropagation(); onSelectItem(item); }} onDoubleClick={() => open(item)}>
      <i className={`kind-dot ${item.kind}`} /><span>{item.title}</span>
    </button>;
  }

  return <section className="spatial-view" onClick={(event) => { if (event.target === event.currentTarget || event.target.classList.contains("spatial-stage")) onSelectItem({ id: null }); }}>
    <div className="spatial-nav"><button onClick={() => setCenterId(entry?.parent?.id ?? null)} disabled={!center} aria-label="Назад">‹</button><button onClick={() => setCenterId(null)}>Обзор</button>{path.map((item) => <span key={item.id}>› <button onClick={() => setCenterId(item.id)}>{item.title}</button></span>)}</div>
    {!items.length ? <p className="spatial-empty">Здесь пока пусто. Создайте первую область.</p> : <div className="spatial-stage">
      {center && <svg className="spatial-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{visible.map((item) => { const target = positions.get(item.id); return <line key={item.id} x1="50" y1="18" x2={target.x} y2={target.y} />; })}</svg>}
      {center && node(center, true)}{visible.map((item) => node(item))}
      {inspector && selectedPosition && cloneElement(inspector, { style: inspectorStyle })}
    </div>}
    {center && !visible.length && <p className="spatial-empty spatial-empty--children">У объекта нет дочерних элементов.</p>}
  </section>;
}
