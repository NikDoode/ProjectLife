const THEMES = [
  ["chalkboard", "Chalkboard Green"], ["ocean", "Deep Ocean"],
  ["sand", "Warm Sand"], ["slate", "Slate Gray"], ["lilac", "Soft Lilac"],
];

export default function WorkspaceSettings({ preferences, onChange, onClose, onResetLayout }) {
  const toggle = (key) => onChange({ ...preferences, [key]: !preferences[key] });
  return <div className="workspace-settings" role="dialog" aria-label="Настройки пространства">
    <header><h2>Настройки пространства</h2><button className="icon-button" onClick={onClose} aria-label="Закрыть">×</button></header>
    <fieldset><legend>Отображение</legend>
      <label><input type="checkbox" checked={preferences.showGrid} onChange={() => toggle("showGrid")} />Показывать сетку</label>
      <label><input type="checkbox" checked={preferences.showLines} onChange={() => toggle("showLines")} />Показывать линии связей</label>
      {preferences.showLines && <>
        <label><input type="checkbox" checked={preferences.showHierarchy} onChange={() => toggle("showHierarchy")} />Каноническая иерархия</label>
        <label><input type="checkbox" checked={preferences.showAdditionalParents} onChange={() => toggle("showAdditionalParents")} />Дополнительные родители</label>
        <label><input type="checkbox" checked={preferences.showSemanticRelations} onChange={() => toggle("showSemanticRelations")} />Смысловые связи</label>
        <label><input type="checkbox" checked={preferences.showLocalRelations} onChange={() => toggle("showLocalRelations")} />Локальные связи пространства</label>
      </>}
      <label><input type="checkbox" checked={preferences.showDone} onChange={() => toggle("showDone")} />Показывать выполненные задачи</label>
      <label><input type="checkbox" checked={preferences.showArchived} onChange={() => toggle("showArchived")} />Показывать архивные объекты</label>
    </fieldset>
    <fieldset className="theme-options"><legend>Тема</legend>{THEMES.map(([value, label]) => <button key={value} type="button" className={`theme-swatch theme-swatch--${value}`} aria-label={label} title={label} aria-pressed={preferences.theme === value} onClick={() => onChange({ ...preferences, theme: value })} />)}</fieldset>
    <button className="button ghost settings-reset" onClick={onResetLayout}>Сбросить расположение</button>
  </div>;
}
