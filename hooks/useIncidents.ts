import { useCallback, useEffect, useMemo, useState } from "react";

import type { GuardianReport } from "../types";
import {
  deleteGuardianReport,
  fetchGuardianReports,
  saveGuardianReport,
  type GuardianReportDraft,
} from "../services/guardianReportsService";
import { useAuth } from "@/hooks/useAuth";

interface UseIncidentsResult {
  reports: GuardianReport[];
  loading: boolean;
  error: string | null;
  saveReport: (draft: GuardianReportDraft) => Promise<GuardianReport>;
  deleteReport: (reportId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useIncidents = (): UseIncidentsResult => {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<GuardianReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const syncReports = useCallback(async () => {
    if (!user) {
      setReports([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchGuardianReports();
      setReports(data);
      setError(null);
    } catch (err) {
      console.error("[AngelGuardian] No se pudieron cargar los reportes", err);
      setError(err instanceof Error ? err.message : "Error desconocido al cargar los reportes.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      void syncReports();
    }
  }, [authLoading, syncReports]);

  const handleSave = useCallback(
    async (draft: GuardianReportDraft): Promise<GuardianReport> => {
      const saved = await saveGuardianReport(draft);
      setReports((prev) => {
        const next = [saved, ...prev.filter((report) => report.id !== saved.id)];
        return next.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
      });
      return saved;
    },
    [],
  );

  const handleDelete = useCallback(async (reportId: string) => {
    await deleteGuardianReport(reportId);
    setReports((prev) => prev.filter((report) => report.id !== reportId));
  }, []);

  return useMemo(
    () => ({
      reports,
      loading: loading || authLoading,
      error,
      saveReport: handleSave,
      deleteReport: handleDelete,
      refresh: syncReports,
    }),
    [authLoading, error, handleDelete, handleSave, loading, reports, syncReports],
  );
};

export default useIncidents;
