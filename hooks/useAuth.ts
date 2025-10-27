import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

import { getCurrentUser, observeAuthState } from "../services/authService";

export const useAuth = (): { user: User | null; loading: boolean } => {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [loading, setLoading] = useState(() => user === null);

  useEffect(() => {
    const unsubscribe = observeAuthState(
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { user, loading };
};
