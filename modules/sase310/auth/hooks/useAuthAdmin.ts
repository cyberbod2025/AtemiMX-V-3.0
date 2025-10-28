import { useCallback, useEffect, useState } from "react";

import { approveUser, getPendingUsers, type AssignableRole, type UserProfile } from "../services/userService";

interface UseAuthAdminState {
  pending: UserProfile[];
  loading: boolean;
  error: string | null;
  approve: (uid: string, rol: AssignableRole) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuthAdmin = (): UseAuthAdminState => {
  const [pending, setPending] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await getPendingUsers();
      setPending(users);
    } catch (err) {
      console.error("[Auth2.0] No fue posible cargar los usuarios pendientes:", err);
      setError(err instanceof Error ? err.message : "No se pudieron obtener los usuarios pendientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  const approve = useCallback(
    async (uid: string, rol: AssignableRole) => {
      try {
        await approveUser(uid, rol);
        await loadPending();
      } catch (err) {
        console.error("[Auth2.0] No fue posible aprobar al usuario:", err);
        setError(err instanceof Error ? err.message : "Ocurrio un error al aprobar al usuario.");
        throw err;
      }
    },
    [loadPending],
  );

  return {
    pending,
    loading,
    error,
    approve,
    refresh: loadPending,
  };
};
