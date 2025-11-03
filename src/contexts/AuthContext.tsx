import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { getIdTokenResult, onAuthStateChanged } from "firebase/auth";

import { auth } from "@/services/firebase";
import { applyRoleTheme, type UserRole } from "@/services/authRole";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  claimsLoading: boolean;
  role: string | null;
  visualRole: UserRole;
  claimsError: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ROLE_MAP: Record<string, UserRole> = {
  admin: "direccion",
  direccion: "direccion",
  director: "direccion",
  docentes: "docentes",
  docente: "docentes",
  teacher: "docentes",
  profesor: "docentes",
  profesora: "docentes",
  prefecto: "prefectura",
  prefecta: "prefectura",
  prefect: "prefectura",
  prefectura: "prefectura",
  orientacion: "orientacion",
  orientadora: "orientacion",
  orientador: "orientacion",
  guidance: "orientacion",
  trabajo_social: "tsocial",
  socialwork: "tsocial",
  tsocial: "tsocial",
  social: "tsocial",
  medical: "enfermeria",
  medico: "enfermeria",
  medica: "enfermeria",
  enfermeria: "enfermeria",
};

const normalizeVisualRole = (value: unknown): UserRole => {
  if (typeof value !== "string") {
    return "none";
  }
  const key = value.trim().toLowerCase();
  return ROLE_MAP[key] ?? "none";
};

export function useAuthWatcher(): AuthContextValue {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState<boolean>(() => auth.currentUser === null);
  const [claimsLoading, setClaimsLoading] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null);
  const [visualRole, setVisualRole] = useState<UserRole>("none");
  const [claimsError, setClaimsError] = useState<string | null>(null);

  useEffect(() => {
    applyRoleTheme("none");
  }, []);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) {
        return;
      }

      setUser(currentUser);

      if (!currentUser) {
        setRole(null);
        setVisualRole("none");
        applyRoleTheme("none");
        setClaimsError(null);
        setLoading(false);
        setClaimsLoading(false);
        return;
      }

      setLoading(false);
      setClaimsLoading(true);

      try {
        const token = await getIdTokenResult(currentUser, true);
        const claimRole = typeof token.claims.role === "string" ? token.claims.role : null;
        const nextVisualRole = normalizeVisualRole(claimRole);

        setRole(claimRole);
        setVisualRole(nextVisualRole);
        applyRoleTheme(nextVisualRole);
        setClaimsError(null);
      } catch (error) {
        console.error("[Auth] No fue posible recuperar los claims del usuario", error);
        setRole(null);
        setVisualRole("none");
        applyRoleTheme("none");
        setClaimsError("No pudimos recuperar tus permisos. Intenta volver a iniciar sesión.");
      } finally {
        setClaimsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      applyRoleTheme("none");
    };
  }, []);

  return useMemo(
    () => ({
      user,
      loading,
      claimsLoading,
      role,
      visualRole,
      claimsError,
    }),
    [user, loading, claimsLoading, role, visualRole, claimsError],
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const state = useAuthWatcher();

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext debe usarse dentro de un AuthProvider");
  }
  return context;
};
