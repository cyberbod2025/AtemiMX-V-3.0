import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import type { GuardianReport } from "../types";
import { fetchGuardianReports } from "../../../services/guardianReportsService";

interface GuardianReportsState {
  reports: GuardianReport[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useGuardianReports = (enabled: boolean): GuardianReportsState => {
  const { user, loading: authPending } = useAuth();
  const [reports, setReports] = useState<GuardianReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !user) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGuardianReports();
      setReports(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No fue posible sincronizar el buzón.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [enabled, user]);

  useEffect(() => {
    if (!enabled) {
      setReports([]);
      setError(null);
      setLoading(false);
      return;
    }
    if (authPending) {
      setLoading(true);
      return;
    }
    if (!user) {
      setReports([]);
      setError("Inicia sesión en SASE-310 para ver tus reportes cifrados.");
      setLoading(false);
      return;
    }
    void refresh();
  }, [authPending, enabled, refresh, user]);

  return { reports, loading, error, refresh };
};
