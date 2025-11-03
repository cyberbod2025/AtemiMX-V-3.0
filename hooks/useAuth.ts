import { useMemo } from "react";

import { useAuthContext } from "@/contexts/AuthContext";

export const useAuth = () => {
  const { user, loading, claimsLoading, role, visualRole, claimsError } = useAuthContext();

  return useMemo(
    () => ({
      user,
      loading: loading || claimsLoading,
      authLoading: loading,
      claimsLoading,
      role,
      visualRole,
      claimsError,
    }),
    [user, loading, claimsLoading, role, visualRole, claimsError],
  );
};
