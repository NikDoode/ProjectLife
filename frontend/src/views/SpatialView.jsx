import { useMemo, useState } from "react";

import "./SpatialView.css";

function indexTree(items) {
  const byId = new Map();

  function visit(item, parent = null) {
    byId.set(item.id, { item, parent });
    (item.children ?? []).forEach((child) => visit(child, item));
  }

  items.forEach((item) => visit(item));
  return byId;
}

export default function SpatialView({ items, selectedItemId, onSelectItem }) {
  const [spatialCenterId, setSpatialCenterId] = useState(null);
  const itemIndex = useMemo(() => indexTree(items), [items]);

  if (items.length === 0) {
    return <p className="spatial-view__message">Объектов пока нет.</p>;
  }

  const centerEntry = itemIndex.get(spatialCenterId) ?? null;
  const center = centerEntry?.item ?? null;
  const isOverview = center === null;
  const path = [];
  let pathItem = center;

  while (pathItem) {
    path.unshift(pathItem);
    pathItem = itemIndex.get(pathItem.id)?.parent ?? null;
  }

  function handleDoubleClick(item) {
    onSelectItem(item);
    if (isOverview || (item.children ?? []).length > 0) {
      setSpatialCenterId(item.id);
    }
  }

  function card(item, isCenter = false) {
    return (
      <button
        key={item.id}
        type="button"
        className={[
          "spatial-view__card",
          isCenter ? "spatial-view__card--center" : "",
          selectedItemId === item.id ? "spatial-view__card--selected" : "",
        ].join(" ")}
        onClick={() => onSelectItem(item)}
        onDoubleClick={() => handleDoubleClick(item)}
      >
        {item.title}
      </button>
    );
  }

  return (
    <section className="spatial-view">
      <div className="spatial-view__navigation">
        <button
          type="button"
          onClick={() => setSpatialCenterId(centerEntry?.parent?.id ?? null)}
          disabled={isOverview}
        >
          Назад
        </button>
        <div className="spatial-view__breadcrumbs">
          <button type="button" onClick={() => setSpatialCenterId(null)}>
            Обзор
          </button>
          {path.map((item) => (
            <span key={item.id}>
              {" / "}
              <button type="button" onClick={() => setSpatialCenterId(item.id)}>
                {item.title}
              </button>
            </span>
          ))}
        </div>
      </div>

      {center && (
        <div className="spatial-view__center">{card(center, true)}</div>
      )}
      <div className="spatial-view__children">
        {(center ? center.children ?? [] : items).map((child) => card(child))}
      </div>
      {center && (center.children ?? []).length === 0 && (
        <p className="spatial-view__message">У объекта нет дочерних элементов.</p>
      )}
    </section>
  );
}
