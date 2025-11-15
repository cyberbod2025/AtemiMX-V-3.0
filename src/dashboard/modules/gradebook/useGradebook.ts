import { useEffect, useMemo, useRef, useState } from "react";

import { fetchGradebookModel, persistGradebookModel } from "@/dashboard/services/gradebookService";
import type { GradebookModel, GradebookTab, GradebookColumn } from "./types";
import { buildMockGradebook } from "./mockData";

export interface UseGradebookOptions {
  teacherId?: string | null;
}

export interface GradebookHook {
  tabs: GradebookTab[];
  activeTabId: string;
  setActiveTabId: (tabId: string) => void;
  rows: GradebookModel["rows"];
  getValue: (studentId: string, columnId: string) => number | string | null;
  getNumericValue: (studentId: string, columnId: string) => number | null;
  updateCell: (studentId: string, columnId: string, value: number | string | null) => void;
  getAverageForStudent: (studentId: string) => number;
  getTabAverage: (tabId: string) => number;
  model: GradebookModel;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateColumnMetadata: (tabId: string, columnId: string, metadata: Partial<Pick<GradebookColumn, "campoFormativoId" | "pdaId" | "evidenciasRequeridas">>) => void;
}

export const useGradebook = (options: UseGradebookOptions = {}): GradebookHook => {
  const { teacherId } = options;
  const initialModel = useMemo(() => buildMockGradebook(), []);
  const [model, setModel] = useState<GradebookModel>(initialModel);
  const [activeTabId, setActiveTabId] = useState(model.tabs[0]?.id ?? "unidad1");
  const [loading, setLoading] = useState<boolean>(Boolean(teacherId));
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const persistTimeout = useRef<NodeJS.Timeout | null>(null);
  const pendingModel = useRef<GradebookModel | null>(null);

  useEffect(() => {
    if (!teacherId) {
      setLoading(false);
      setModel(initialModel);
      return;
    }
    setLoading(true);
    fetchGradebookModel(teacherId)
      .then((remote) => {
        if (remote) {
          setModel(remote);
          setActiveTabId(remote.tabs[0]?.id ?? "unidad1");
        } else {
          setModel(initialModel);
        }
        setError(null);
      })
      .catch((err) => {
        console.error("[Gradebook] No se pudo cargar el cuaderno", err);
        setError("No pudimos sincronizar el cuaderno. Mostramos una versión local.");
        setModel(initialModel);
      })
      .finally(() => setLoading(false));
  }, [initialModel, teacherId]);

  useEffect(() => {
    return () => {
      if (persistTimeout.current) {
        clearTimeout(persistTimeout.current);
      }
    };
  }, []);

  const schedulePersist = (nextModel: GradebookModel) => {
    if (!teacherId) {
      return;
    }
    pendingModel.current = nextModel;
    if (persistTimeout.current) {
      clearTimeout(persistTimeout.current);
    }
    persistTimeout.current = setTimeout(async () => {
      if (!pendingModel.current) {
        return;
      }
      setSaving(true);
      try {
        await persistGradebookModel(teacherId, pendingModel.current);
        setError(null);
      } catch (err) {
        console.error("[Gradebook] No se pudo guardar el cuaderno", err);
        setError("No pudimos guardar los cambios. Revisa tu conexión.");
      } finally {
        setSaving(false);
      }
    }, 800);
  };

const updateCell = (studentId: string, columnId: string, value: number | string | null) => {
  setModel((prev) => {
    const next: GradebookModel = JSON.parse(JSON.stringify(prev));
    if (!next.cells[studentId]) {
      next.cells[studentId] = {};
    }
    next.cells[studentId][columnId] = { studentId, columnId, value };
    schedulePersist(next);
    return next;
  });
};

const updateColumnMetadata = (
  tabId: string,
  columnId: string,
  metadata: Partial<Pick<GradebookColumn, "campoFormativoId" | "pdaId" | "evidenciasRequeridas">>,
) => {
  setModel((prev) => {
    const next: GradebookModel = JSON.parse(JSON.stringify(prev));
    const tab = next.tabs.find((entry) => entry.id === tabId);
    if (tab) {
      tab.columns = tab.columns.map((column) =>
        column.id === columnId ? { ...column, ...metadata } : column,
      );
      schedulePersist(next);
      return next;
    }
    return prev;
  });
};

const getValue = (studentId: string, columnId: string) => model.cells[studentId]?.[columnId]?.value ?? null;
  const getNumericValue = (studentId: string, columnId: string): number | null => {
    const value = getValue(studentId, columnId);
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Number(value))) {
      return Number(value);
    }
    return null;
  };

  const getAverageForStudent = (studentId: string, tabId: string = activeTabId) => {
    const tab = model.tabs.find((t) => t.id === tabId);
    if (!tab) {
      return 0;
    }
    const numericColumns = tab.columns.filter((col) => col.type !== "text");
    const total = numericColumns.reduce((acc, column) => {
      const numericValue = getNumericValue(studentId, column.id);
      if (numericValue === null) {
        return acc;
      }
      const weight = column.weight ?? 1;
      return acc + numericValue * weight;
    }, 0);
    const weightSum = numericColumns.reduce((acc, column) => acc + (column.weight ?? 1), 0) || 1;
    return Number((total / weightSum).toFixed(2));
  };

  const getTabAverage = (tabId: string) => {
    if (model.rows.length === 0) {
      return 0;
    }
    const average = model.rows.reduce((acc, row) => acc + getAverageForStudent(row.studentId, tabId), 0);
    return Number((average / model.rows.length).toFixed(2));
  };

  return {
    tabs: model.tabs,
    activeTabId,
    setActiveTabId,
    rows: model.rows,
    getValue,
    getNumericValue,
    updateCell,
    getAverageForStudent,
    getTabAverage,
    model,
    loading,
    saving,
    error,
    updateColumnMetadata,
  };
};
