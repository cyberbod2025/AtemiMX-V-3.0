import React, { useMemo } from "react";
import type { User as FirebaseUser } from "firebase/auth";

import DashboardApp from "@/dashboard/App";
import { UserRole, type User as DashboardUser } from "@/dashboard/types";
import { MOCK_USERS } from "@/dashboard/constants";

const mapRoleToDashboard = (role?: string | null): UserRole => {
  if (!role) {
    return UserRole.Teacher;
  }
  const normalized = role.trim().toLowerCase();
  if (["admin", "direccion", "director"].includes(normalized)) {
    return UserRole.Admin;
  }
  if (["prefect", "prefectura"].includes(normalized)) {
    return UserRole.Prefect;
  }
  if (["guidance", "orientacion", "orientador", "orientadora"].includes(normalized)) {
    return UserRole.Guidance;
  }
  return UserRole.Teacher;
};

interface AtemiDashboardProps {
  user: FirebaseUser | null;
  role: string | null;
  onLogout: () => void;
}

export const AtemiDashboard: React.FC<AtemiDashboardProps> = ({ user, role, onLogout }) => {
  const users = useMemo(() => {
    if (!user) {
      return undefined;
    }
    const mappedRole = mapRoleToDashboard(role);
    const authUser: DashboardUser = {
      id: user.uid ?? "auth-user",
      name: user.displayName ?? user.email ?? "Docente Atemi",
      email: user.email ?? undefined,
      role: mappedRole,
      tutorOfGroup: mappedRole === UserRole.Teacher ? { grade: "3", group: "A" } : null,
    };
    const others = MOCK_USERS.filter((mock) => mock.id !== authUser.id);
    return [authUser, ...others];
  }, [role, user]);

  return <DashboardApp users={users} defaultUserId={users?.[0]?.id} onLogout={onLogout} />;
};

export default AtemiDashboard;
