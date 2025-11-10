import React from "react";

import type { GradebookColumn, GradebookTab } from "./types";
import { useGradebook } from "./useGradebook";

interface GradebookPanelProps {
  teacherId?: string | null;
}

const resolveColor = (column: GradebookColumn, value: number | null) => {
  if (!column.config?.colorRules || value === null) {
    return {};
  }
  const rule = column.config.colorRules.find((r) => value >= r.min && value <= r.max);
  if (!rule) {
    return {};
  }
  return {
    backgroundColor: rule.bg,
    color: rule.fg,
  };
};

const formatValue = (column: GradebookColumn, raw: number | string | null) => {
  if (raw === null || raw === undefined || raw === "") {
    return "—";
  }
  if (column.type === "numeric" && typeof raw === "number") {
    return raw.toFixed(column.config?.max && column.config.max <= 5 ? 1 : 0);
  }
  return raw;
};

export const GradebookPanel: React.FC<GradebookPanelProps> = ({ teacherId }) => {
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    rows,
    getValue,
    getNumericValue,
    updateCell,
    getAverageForStudent,
    loading,
    saving,
    error,
  } = useGradebook({ teacherId });

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  if (!activeTab) {
    return null;
  }

  const handleCellChange = (studentId: string, columnId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    updateCell(studentId, columnId, event.target.value);
  };

  const renderCell = (studentId: string, column: GradebookColumn) => {
    const rawValue = getValue(studentId, column.id);
    const numericValue = getNumericValue(studentId, column.id);
    const style = column.type === "numeric" ? resolveColor(column, numericValue) : undefined;

    if (column.type === "numeric") {
      return (
        <input
          type="number"
          className="gradebook__cell-input"
          value={rawValue ?? ""}
          onChange={(event) => handleCellChange(studentId, column.id, event)}
          min={column.config?.min ?? 0}
          max={column.config?.max ?? 100}
          style={style}
        />
      );
    }

    if (column.type === "text") {
      return (
        <textarea
          className="gradebook__cell-text"
          value={(rawValue as string) ?? ""}
          onChange={(event) => handleCellChange(studentId, column.id, event)}
        />
      );
    }

    if (column.type === "icon") {
      const icons = column.config?.icons ?? [];
      return (
        <select
          className="gradebook__cell-select"
          value={(rawValue as string) ?? ""}
          onChange={(event) => handleCellChange(studentId, column.id, event)}
        >
          <option value="">Selecciona</option>
          {icons.map((icon) => (
            <option key={icon.value} value={icon.value}>
              {icon.value} {icon.label}
            </option>
          ))}
        </select>
      );
    }

    return <span>{formatValue(column, rawValue)}</span>;
  };

  const renderTabButton = (tab: GradebookTab) => (
    <button
      key={tab.id}
      type="button"
      className={`gradebook__tab ${tab.id === activeTabId ? "gradebook__tab--active" : ""}`}
      onClick={() => setActiveTabId(tab.id)}
    >
      {tab.label}
    </button>
  );

  if (loading) {
    return <section className="gradebook">Sincronizando cuaderno...</section>;
  }

  return (
    <section className="gradebook">
      {error ? <div className="app-shell__notice">{error}</div> : null}
      <header className="gradebook__header">
        <div className="gradebook__tabs">{tabs.map(renderTabButton)}</div>
        <div className="gradebook__metrics">
          <span className="gradebook__metric-label">Total alumnos</span>
          <strong>{rows.length}</strong>
        </div>
        {saving ? <span className="gradebook__metric-hint">Guardando cambios...</span> : null}
      </header>
      <div className="gradebook__table-wrapper">
        <table className="gradebook__table">
          <thead>
            <tr>
              <th>Alumno</th>
              {activeTab.columns.map((column) => (
                <th key={column.id}>
                  <div className="gradebook__column-header">
                    <span>{column.label}</span>
                    {column.weight ? <small>{Math.round(column.weight * 100)}%</small> : null}
                  </div>
                </th>
              ))}
              <th>Promedio</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.studentId}>
                <td className="gradebook__student">{row.displayName}</td>
                {activeTab.columns.map((column) => (
                  <td key={column.id}>{renderCell(row.studentId, column)}</td>
                ))}
                <td className="gradebook__average">{getAverageForStudent(row.studentId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activeTab.notes ? <p className="gradebook__notes">{activeTab.notes}</p> : null}
    </section>
  );
};
