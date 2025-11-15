import React, { useState } from "react";

import type { GradebookColumn, GradebookTab } from "./types";
import { useGradebook } from "./useGradebook";
import { useNemCatalog } from "@/hooks/useNemCatalog";

interface GradebookPanelProps {
  teacherId?: string | null;
}

interface MetadataEditorState {
  columnId: string;
  faseId: string;
  campoId: string;
  pdaId: string;
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
  const isDemoMode = !teacherId;
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
    updateColumnMetadata,
  } = useGradebook({ teacherId });
  const {
    getFases,
    getCamposPorFase,
    getCampo,
    getPdasPorCampo,
    findPda,
  } = useNemCatalog();
  const fases = getFases();
  const [metadataEditor, setMetadataEditor] = useState<MetadataEditorState | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  if (!activeTab) {
    return null;
  }

  const handleCellChange = (studentId: string, columnId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    updateCell(studentId, columnId, event.target.value);
  };

  const openMetadataEditor = (column: GradebookColumn) => {
    const campo = column.campoFormativoId ? getCampo(column.campoFormativoId) : undefined;
    const faseId = campo?.faseId ?? fases[0]?.faseId ?? "";
    const initialCampoId =
      campo?.campoId ?? (faseId ? getCamposPorFase(faseId)[0]?.campoId ?? "" : "");
    const initialPdaId =
      column.pdaId ?? (initialCampoId ? getPdasPorCampo(initialCampoId)[0]?.pdaId ?? "" : "");
    setMetadataEditor({
      columnId: column.id,
      faseId,
      campoId: initialCampoId,
      pdaId: initialPdaId,
    });
    setMetadataError(null);
  };

  const closeMetadataEditor = () => {
    setMetadataEditor(null);
    setMetadataError(null);
  };

  const handleMetadataSave = () => {
    if (!metadataEditor) {
      return;
    }
    if (!metadataEditor.campoId || !metadataEditor.pdaId) {
      setMetadataError("Selecciona un campo formativo y un PDA antes de guardar.");
      return;
    }
    updateColumnMetadata(activeTab.id, metadataEditor.columnId, {
      campoFormativoId: metadataEditor.campoId,
      pdaId: metadataEditor.pdaId,
    });
    closeMetadataEditor();
  };

  const metadataEditorColumn = metadataEditor
    ? activeTab.columns.find((column) => column.id === metadataEditor.columnId)
    : null;

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

  const metadataEditorCampos = metadataEditor?.faseId
    ? getCamposPorFase(metadataEditor.faseId)
    : [];
  const metadataEditorPdas = metadataEditor?.campoId
    ? getPdasPorCampo(metadataEditor.campoId)
    : [];
  const metadataEditorPda = metadataEditor?.pdaId ? findPda(metadataEditor.pdaId) : undefined;

  if (loading) {
    return <section className="gradebook">Sincronizando cuaderno...</section>;
  }

  return (
    <section className="gradebook">
      {isDemoMode ? (
        <div className="app-shell__notice">
          Inicia sesión en SASE-310 para sincronizar y guardar tu cuaderno. El modo demo solo muestra datos locales.
        </div>
      ) : null}
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
              {activeTab.columns.map((column) => {
                const campo = column.campoFormativoId ? getCampo(column.campoFormativoId) : undefined;
                const columnPda = column.pdaId ? findPda(column.pdaId) : undefined;
                return (
                  <th key={column.id}>
                    <div className="gradebook__column-header">
                      <span>{column.label}</span>
                      {column.weight ? <small>{Math.round(column.weight * 100)}%</small> : null}
                    </div>
                    <div className="gradebook__column-meta">
                      <span className={`gradebook__column-meta-tag ${campo ? "" : "gradebook__column-meta--missing"}`}>
                        Campo: {campo?.nombre ?? "Sin asignar"}
                      </span>
                      <span className={`gradebook__column-meta-tag ${columnPda ? "" : "gradebook__column-meta--missing"}`}>
                        PDA: {columnPda?.nombre ?? "Sin asignar"}
                      </span>
                    </div>
                    <div className="gradebook__column-descriptor">
                      {columnPda?.descriptor ?? "Asigna un PDA para que este aprendizaje tenga trazabilidad curricular."}
                    </div>
                    {columnPda ? (
                      <div className="gradebook__column-competencias">
                        Competencias: {columnPda.competencias.join(", ")}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className="gradebook__metadata-trigger"
                      onClick={() => openMetadataEditor(column)}
                    >
                      {columnPda ? "Editar metadata" : "Asignar metadata"}
                    </button>
                  </th>
                );
              })}
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
      {metadataEditor && metadataEditorColumn ? (
        <section className="gradebook__metadata-editor">
          <header className="gradebook__metadata-editor-header">
            <div>
              <strong>Metadata curricular · {metadataEditorColumn.label}</strong>
              <p className="text-sm text-gray-400">
                Selecciona fase, campo y proceso de desarrollo de aprendizaje para vincular esta columna
                con el catálogo oficial.
              </p>
            </div>
            <button type="button" className="gradebook__metadata-editor-close" onClick={closeMetadataEditor}>
              Cerrar
            </button>
          </header>
          <div className="gradebook__metadata-editor-grid">
            <label>
              Fase
              <select
                value={metadataEditor.faseId}
                onChange={(event) => {
                  const nextFase = event.target.value;
                  const nextCampos = getCamposPorFase(nextFase);
                  const nextCampoId = nextCampos[0]?.campoId ?? "";
                  const nextPdas = nextCampoId ? getPdasPorCampo(nextCampoId) : [];
                  setMetadataEditor({
                    columnId: metadataEditor.columnId,
                    faseId: nextFase,
                    campoId: nextCampoId,
                    pdaId: nextPdas[0]?.pdaId ?? "",
                  });
                }}
              >
                {fases.map((fase) => (
                  <option key={fase.faseId} value={fase.faseId}>
                    {fase.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Campo
              <select
                value={metadataEditor.campoId}
                onChange={(event) => {
                  const nextCampoId = event.target.value;
                  const nextPdas = nextCampoId ? getPdasPorCampo(nextCampoId) : [];
                  setMetadataEditor({
                    columnId: metadataEditor.columnId,
                    faseId: metadataEditor.faseId,
                    campoId: nextCampoId,
                    pdaId: nextPdas[0]?.pdaId ?? "",
                  });
                }}
              >
                {metadataEditorCampos.map((campo) => (
                  <option key={campo.campoId} value={campo.campoId}>
                    {campo.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              PDA
              <select
                value={metadataEditor.pdaId}
                onChange={(event) =>
                  setMetadataEditor({
                    columnId: metadataEditor.columnId,
                    faseId: metadataEditor.faseId,
                    campoId: metadataEditor.campoId,
                    pdaId: event.target.value,
                  })
                }
              >
                {metadataEditorPdas.map((pda) => (
                  <option key={pda.pdaId} value={pda.pdaId}>
                    {pda.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {metadataEditorPda ? (
            <div className="gradebook__metadata-editor-description">
              <p>
                <strong>Descriptor:</strong> {metadataEditorPda.descriptor}
              </p>
              <p>
                <strong>Competencias:</strong> {metadataEditorPda.competencias.join(", ")}
              </p>
            </div>
          ) : null}
          {metadataError ? (
            <div className="app-shell__notice" style={{ marginTop: "0.75rem" }}>
              {metadataError}
            </div>
          ) : null}
          <div className="gradebook__metadata-editor-actions">
            <button type="button" className="planner__submit" onClick={handleMetadataSave}>
              Guardar metadata
            </button>
            <button type="button" className="planner__submit" style={{ background: "#1f2937" }} onClick={closeMetadataEditor}>
              Cancelar
            </button>
          </div>
        </section>
      ) : null}
      {activeTab.notes ? <p className="gradebook__notes">{activeTab.notes}</p> : null}
    </section>
  );
};

export default GradebookPanel;
