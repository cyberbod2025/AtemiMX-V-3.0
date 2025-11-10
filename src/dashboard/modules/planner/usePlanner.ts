import { useEffect, useMemo, useState } from "react";

import { fetchPlannerEntries, createPlannerEntry, updatePlannerEntry, deletePlannerEntry } from "@/dashboard/services/plannerService";
import type { PlannerDraft, PlannerEntry } from "./types";

export interface UsePlannerOptions {
  teacherId?: string | null;
}

export interface UsePlannerResult {
  entries: PlannerEntry[];
  loading: boolean;
  error: string | null;
  addEntry: (draft: PlannerDraft) => Promise<void>;
  updateEntry: (entryId: string, draft: PlannerDraft) => Promise<void>;
  removeEntry: (entryId: string) => Promise<void>;
}

export const usePlanner = ({ teacherId }: UsePlannerOptions): UsePlannerResult => {
  const [entries, setEntries] = useState<PlannerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(teacherId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPlannerEntries(teacherId)
      .then((data) => {
        setEntries(data);
        setError(null);
      })
      .catch((err) => {
        console.error("[Planner] No se pudieron cargar las planeaciones", err);
        setError("No pudimos sincronizar tu planner. Mostramos la vista local.");
      })
      .finally(() => setLoading(false));
  }, [teacherId]);

  const addEntry = async (draft: PlannerDraft) => {
    if (!teacherId) {
      return;
    }
    const entry = await createPlannerEntry({ ...draft, teacherId });
    setEntries((prev) => [...prev, entry].sort((a, b) => a.dateISO.localeCompare(b.dateISO)));
  };

  const updateEntryHandler = async (entryId: string, draft: PlannerDraft) => {
    if (!teacherId) {
      return;
    }
    await updatePlannerEntry(entryId, draft);
    setEntries((prev) =>
      prev.map((entry) => (entry.id === entryId ? { ...entry, ...draft, updatedAtISO: new Date().toISOString() } : entry)),
    );
  };

  const removeEntry = async (entryId: string) => {
    if (!teacherId) {
      return;
    }
    await deletePlannerEntry(entryId);
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  return {
    entries,
    loading,
    error,
    addEntry,
    updateEntry: updateEntryHandler,
    removeEntry,
  };
};
